"""
Authentication views for signup, login, MFA, SSO, etc.
"""
import os
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from users.models import User, UserRole
from users.audit_models import AuditLog
from users.serializers import (
    UserSerializer,
    SignupSerializer,
    LoginSerializer,
    MagicLinkRequestSerializer,
    MFAEnrollSerializer,
    MFAVerifySerializer,
    RefreshTokenSerializer,
    ConsentUpdateSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from users.utils.auth_utils import (
    create_mfa_code,
    verify_mfa_code,
    create_user_session,
    verify_refresh_token,
    rotate_refresh_token,
    revoke_session,
    check_device_trust,
    trust_device,
)
from users.utils.risk_utils import calculate_risk_score, requires_mfa
from users.utils.consent_utils import (
    get_user_consent_scopes,
    grant_consent,
    revoke_consent,
    get_consent_scopes_for_token,
)
from users.auth_models import MFAMethod, UserSession
from services.email_service import email_service


def _get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _assign_default_student_role(user):
    """
    Assign default 'Student' role to new user during onboarding.
    """
    from users.models import Role, UserRole
    
    try:
        student_role = Role.objects.get(name='student')
    except Role.DoesNotExist:
        # Create student role if it doesn't exist
        student_role = Role.objects.create(
            name='student',
            display_name='Student',
            description='Primary user role for students in the OCH ecosystem',
            is_system_role=True
        )
    
    # Assign role with global scope
    UserRole.objects.get_or_create(
        user=user,
        role=student_role,
        scope='global',
        defaults={'is_active': True}
    )


def _log_audit_event(user, action, resource_type, result='success', metadata=None):
    """Log audit event."""
    AuditLog.objects.create(
        user=user,
        actor_type='user',
        actor_identifier=user.email if user else 'anonymous',
        action=action,
        resource_type=resource_type,
        result=result,
        metadata=metadata or {},
        timestamp=timezone.now(),
    )


class SignupView(APIView):
    """
    POST /api/v1/auth/signup
    Create account (email + password or passwordless).
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Check if user already exists
        if User.objects.filter(email=data['email']).exists():
            return Response(
                {'detail': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        if data.get('passwordless'):
            # Passwordless signup - create user without password
            user = User.objects.create_user(
                email=data['email'],
                username=data['email'],  # Use email as username
                first_name=data['first_name'],
                last_name=data['last_name'],
                country=data.get('country'),
                timezone=data.get('timezone', 'UTC'),
                language=data.get('language', 'en'),
                cohort_id=data.get('cohort_id'),
                track_key=data.get('track_key'),
                password=None,  # No password for passwordless
                # Student onboarding fields
                preferred_learning_style=data.get('preferred_learning_style'),
                career_goals=data.get('career_goals'),
                cyber_exposure_level=data.get('cyber_exposure_level'),
            )
            user.set_unusable_password()
            user.account_status = 'pending_verification'
            user.save()
            
            # Assign default "Student" role
            _assign_default_student_role(user)
            
            # Send magic link
            code, mfa_code = create_mfa_code(user, method='magic_link', expires_minutes=10)
            from users.utils.email_utils import send_magic_link_email
            from django.conf import settings
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            magic_link_url = f"{frontend_url}/auth/verify?code={code}&email={user.email}"
            send_magic_link_email(user, code, magic_link_url)
            
            _log_audit_event(user, 'create', 'user', 'success', {'method': 'passwordless'})
            
            return Response(
                {
                    'detail': 'Account created. Please check your email for verification link.',
                    'user_id': user.id,
                },
                status=status.HTTP_201_CREATED
            )
        else:
            # Email + password signup
            user = User.objects.create_user(
                email=data['email'],
                username=data['email'],
                password=data['password'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                country=data.get('country'),
                timezone=data.get('timezone', 'UTC'),
                language=data.get('language', 'en'),
                cohort_id=data.get('cohort_id'),
                track_key=data.get('track_key'),
                # Student onboarding fields
                preferred_learning_style=data.get('preferred_learning_style'),
                career_goals=data.get('career_goals'),
                cyber_exposure_level=data.get('cyber_exposure_level'),
            )
            
            # Assign default "Student" role
            _assign_default_student_role(user)
            
            # If invited (has cohort_id/track_key), activate immediately
            if data.get('cohort_id') or data.get('track_key'):
                user.activate()
            else:
                # Send verification email with OTP (non-blocking)
                try:
                    code, mfa_code = create_mfa_code(user, method='email', expires_minutes=60)
                    from users.utils.email_utils import send_verification_email
                    from django.conf import settings
                    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                    verification_url = f"{frontend_url}/auth/verify-email?code={code}&email={user.email}"
                    send_verification_email(user, verification_url)
                except Exception as e:
                    # Log email failure but don't block signup
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Failed to send verification email to {user.email}: {str(e)}")
            
            _log_audit_event(user, 'create', 'user', 'success', {'method': 'email_password'})
            
            # Get frontend URL with fallback
            frontend_url = getattr(settings, 'FRONTEND_URL', None)
            if not frontend_url:
                # Hardcoded fallback if settings.FRONTEND_URL is not available
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

            return Response(
                {
                    'detail': 'Account created successfully! Please complete your AI profiling to get matched with the right OCH track.',
                    'user_id': user.id,
                    'redirect_url': f"{frontend_url}/onboarding/ai-profiler",
                    'requires_profiling': True,
                },
                status=status.HTTP_201_CREATED
            )


class SimpleLoginView(APIView):
    """
    POST /api/v1/auth/login/simple
    Simplified login for development/testing.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email']
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check account status
        if user.account_status != 'active':
            return Response(
                {'detail': f'Account is {user.account_status}'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {'detail': 'Account is inactive'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Simple password check
        if password and user.check_password(password):
            # Create JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response({
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'account_status': user.account_status,
                },
                'access_token': access_token,
                'refresh_token': refresh_token,
                'message': 'Login successful'
            })
        else:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LoginView(APIView):
    """
    POST /api/v1/auth/login
    Login with email+password or passwordless code.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        email = data['email']
        password = data.get('password')
        code = data.get('code')
        device_fingerprint = data.get('device_fingerprint', 'unknown')
        device_name = data.get('device_name', 'Unknown Device')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            _log_audit_event(None, 'login', 'user', 'failure', {'email': email})
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check account status and active status
        if user.account_status != 'active':
            return Response(
                {'detail': f'Account is {user.account_status}. Please verify your email.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is active (Django's is_active flag)
        if not user.is_active:
            _log_audit_event(user, 'login', 'user', 'failure', {'reason': 'inactive_user'})
            return Response(
                {'detail': 'Account is inactive. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Authenticate
        if code:
            # Passwordless login
            if not verify_mfa_code(user, code, method='magic_link'):
                _log_audit_event(user, 'login', 'user', 'failure', {'method': 'passwordless'})
                return Response(
                    {'detail': 'Invalid or expired code'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        elif password:
            # Password login
            if not user.check_password(password):
                _log_audit_event(user, 'login', 'user', 'failure', {'method': 'password'})
                return Response(
                    {'detail': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        else:
            return Response(
                {'detail': 'Password or code required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate risk score
        ip_address = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        risk_score = calculate_risk_score(user, ip_address, device_fingerprint, user_agent)
        
        # Check if device is trusted
        device_trusted = check_device_trust(user, device_fingerprint)
        
        # In development, auto-trust device for test users
        from django.conf import settings
        if settings.DEBUG and user.email.endswith('@test.com') and not device_trusted:
            from users.utils.auth_utils import _detect_device_type
            device_type = _detect_device_type(user_agent)
            trust_device(user, device_fingerprint, device_name, device_type, ip_address, user_agent, expires_days=365)
            device_trusted = True
        
        # Check MFA requirement
        user_roles = UserRole.objects.filter(user=user, is_active=True)
        user_role_names = [ur.role.name for ur in user_roles]
        primary_role = user_role_names[0] if user_role_names else None
        
        mfa_required = requires_mfa(risk_score, primary_role) or user.mfa_enabled
        
        # If MFA required and not verified, return MFA challenge
        if mfa_required and not device_trusted:
            # Create temporary session for MFA verification
            session = create_user_session(
                user=user,
                device_fingerprint=device_fingerprint,
                device_name=device_name,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            return Response(
                {
                    'detail': 'MFA required',
                    'mfa_required': True,
                    'session_id': str(session[2].id),
                },
                status=status.HTTP_200_OK
            )
        
        # Create session and issue tokens
        access_token, refresh_token, session = create_user_session(
            user=user,
            device_fingerprint=device_fingerprint,
            device_name=device_name,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Trust device if requested and MFA verified
        if device_trusted or not mfa_required:
            trust_device(user, device_fingerprint, device_name, session.device_type, ip_address, user_agent)
        
        # Get consent scopes for token
        consent_scopes = get_consent_scopes_for_token(user)
        
        # Update user last login
        user.last_login = timezone.now()
        user.last_login_ip = ip_address
        user.save()
        
        # Check if profiling is required (mandatory Tier 0 gateway for students/mentees)
        profiling_required = False
        user_roles = UserRole.objects.filter(user=user, is_active=True)
        user_role_names = [ur.role.name for ur in user_roles]
        
        # Profiling is mandatory for students and mentees
        if 'student' in user_role_names or 'mentee' in user_role_names:
            if not user.profiling_complete:
                profiling_required = True
        
        _log_audit_event(user, 'login', 'user', 'success', {
            'method': 'passwordless' if code else 'password',
            'risk_score': risk_score,
            'mfa_required': mfa_required,
            'profiling_required': profiling_required,
        })
        
        response = Response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
            'consent_scopes': consent_scopes,
            'profiling_required': profiling_required,
        }, status=status.HTTP_200_OK)
        
        # Set refresh token as httpOnly cookie
        response.set_cookie(
            'refresh_token',
            refresh_token,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            secure=not settings.DEBUG,  # Secure in production
            samesite='Lax',
        )
        
        return response


class MagicLinkView(APIView):
    """
    POST /api/v1/auth/login/magic-link
    Request magic link for passwordless login.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = MagicLinkRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response(
                {'detail': 'If an account exists, a magic link has been sent.'},
                status=status.HTTP_200_OK
            )
        
        # Generate magic link code
        code, mfa_code = create_mfa_code(user, method='magic_link', expires_minutes=10)
        
        # Send email with magic link
        from users.utils.email_utils import send_magic_link_email
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        magic_link_url = f"{frontend_url}/auth/verify?code={code}&email={email}"
        send_magic_link_email(user, code, magic_link_url)
        
        _log_audit_event(user, 'mfa_challenge', 'user', 'success', {'method': 'magic_link'})
        
        return Response(
            {'detail': 'Magic link sent to your email'},
            status=status.HTTP_200_OK
        )


class MFAEnrollView(APIView):
    """
    POST /api/v1/auth/mfa/enroll
    Enroll in MFA (TOTP setup).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MFAEnrollSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        method = serializer.validated_data['method']
        user = request.user
        
        # TODO: Implement TOTP secret generation
        # For TOTP, generate secret and QR code
        if method == 'totp':
            import pyotp
            secret = pyotp.random_base32()
            
            mfa_method = MFAMethod.objects.create(
                user=user,
                method_type='totp',
                secret_encrypted=secret,  # TODO: Encrypt this
                enabled=False,  # Not enabled until verified
            )
            
            # Generate QR code URI
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user.email,
                issuer_name='Ongoza CyberHub'
            )
            
            _log_audit_event(user, 'mfa_enroll', 'mfa', 'success', {'method': 'totp'})
            
            return Response({
                'mfa_method_id': str(mfa_method.id),
                'secret': secret,  # Only shown once
                'qr_code_uri': totp_uri,
            }, status=status.HTTP_201_CREATED)
        
        return Response(
            {'detail': f'MFA method {method} enrollment not yet implemented'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class MFAVerifyView(APIView):
    """
    POST /api/v1/auth/mfa/verify
    Verify MFA code.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        code = serializer.validated_data['code']
        method = serializer.validated_data['method']
        user = request.user
        
        # Verify code
        if method == 'totp':
            import pyotp
            from users.utils.auth_utils import generate_totp_backup_codes, verify_totp_backup_code
            
            # Check if this is enrollment verification (pending TOTP)
            mfa_method = MFAMethod.objects.filter(
                user=user,
                method_type='totp',
                enabled=False
            ).first()
            
            if mfa_method:
                # Enrollment verification
                totp = pyotp.TOTP(mfa_method.secret_encrypted)
                if totp.verify(code, valid_window=1):
                    # Generate backup codes
                    backup_codes, hashed_backup_codes = generate_totp_backup_codes(count=10)
                    mfa_method.totp_backup_codes = hashed_backup_codes
                    mfa_method.enabled = True
                    mfa_method.is_verified = True
                    mfa_method.verified_at = timezone.now()
                    mfa_method.is_primary = True
                    mfa_method.save()
                    
                    user.mfa_enabled = True
                    user.mfa_method = 'totp'
                    user.save()
                    
                    _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': 'totp'})
                    
                    return Response({
                        'detail': 'MFA enabled successfully',
                        'backup_codes': backup_codes,  # Show only once
                    }, status=status.HTTP_200_OK)
                else:
                    _log_audit_event(user, 'mfa_failure', 'mfa', 'failure', {'method': 'totp'})
                    return Response(
                        {'detail': 'Invalid TOTP code'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Regular TOTP verification (already enrolled)
                mfa_method = MFAMethod.objects.filter(
                    user=user,
                    method_type='totp',
                    enabled=True
                ).first()
                
                if not mfa_method:
                    return Response(
                        {'detail': 'TOTP not enabled for this account'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Try TOTP code first
                totp = pyotp.TOTP(mfa_method.secret_encrypted)
                if totp.verify(code, valid_window=1):
                    mfa_method.last_used_at = timezone.now()
                    mfa_method.save()
                    _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': 'totp'})
                    return Response({'detail': 'MFA verified'}, status=status.HTTP_200_OK)
                
                # Try backup code
                if verify_totp_backup_code(user, code):
                    _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': 'backup_code'})
                    return Response({'detail': 'MFA verified with backup code'}, status=status.HTTP_200_OK)
                
                _log_audit_event(user, 'mfa_failure', 'mfa', 'failure', {'method': 'totp'})
                return Response(
                    {'detail': 'Invalid TOTP code or backup code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verify other methods
        if verify_mfa_code(user, code, method):
            _log_audit_event(user, 'mfa_success', 'mfa', 'success', {'method': method})
            return Response({
                'detail': 'MFA verified successfully',
            }, status=status.HTTP_200_OK)
        else:
            _log_audit_event(user, 'mfa_failure', 'mfa', 'failure', {'method': method})
            return Response(
                {'detail': 'Invalid or expired code'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MFADisableView(APIView):
    """
    POST /api/v1/auth/mfa/disable
    Disable MFA for user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if not user.mfa_enabled:
            return Response(
                {'detail': 'MFA is not enabled for this account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Disable all MFA methods
        from users.auth_models import MFAMethod
        MFAMethod.objects.filter(user=user, enabled=True).update(
            enabled=False,
            is_primary=False
        )
        
        user.mfa_enabled = False
        user.mfa_method = None
        user.save()
        
        _log_audit_event(user, 'mfa_disable', 'mfa', 'success')
        
        return Response({
            'detail': 'MFA disabled successfully'
        }, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """
    POST /api/v1/auth/token/refresh
    Refresh access token with refresh token.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        refresh_token = serializer.validated_data.get('refresh_token') or request.COOKIES.get('refresh_token')
        device_fingerprint = serializer.validated_data.get('device_fingerprint', 'unknown')
        
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rotate refresh token
        new_access_token, new_refresh_token, session = rotate_refresh_token(
            refresh_token,
            device_fingerprint
        )
        
        if not session:
            return Response(
                {'detail': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        response = Response({
            'access_token': new_access_token,
            'refresh_token': new_refresh_token,
        }, status=status.HTTP_200_OK)
        
        # Update refresh token cookie
        response.set_cookie(
            'refresh_token',
            new_refresh_token,
            max_age=30 * 24 * 60 * 60,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
        )
        
        return response


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout
    Logout and revoke session.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        refresh_token = request.data.get('refresh_token') or request.COOKIES.get('refresh_token')
        
        if refresh_token:
            revoke_session(refresh_token=refresh_token)
        else:
            # Revoke all sessions for user
            revoke_session(user=request.user)
        
        _log_audit_event(request.user, 'logout', 'user', 'success')
        
        response = Response(
            {'detail': 'Logged out successfully'},
            status=status.HTTP_200_OK
        )
        
        # Clear refresh token cookie
        response.delete_cookie('refresh_token')
        
        return response


class MeView(APIView):
    """
    GET /api/v1/auth/me
    Get current user profile with roles and consents.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Check if user is active
        if not user.is_active:
            return Response(
                {'detail': 'Account is inactive. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check account status
        if user.account_status != 'active':
            return Response(
                {'detail': f'Account is {user.account_status}. Please verify your email.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(user)
        
        # Get roles with scope details
        roles = []
        for user_role in user.user_roles.filter(is_active=True).select_related('role'):
            roles.append({
                'role': user_role.role.name,
                'role_display_name': user_role.role.display_name,
                'scope': user_role.scope,
                'scope_ref': str(user_role.scope_ref) if user_role.scope_ref else None,
            })
        
        # Get consent scopes
        consent_scopes = get_user_consent_scopes(user)
        
        # Get entitlements
        entitlements = list(
            user.entitlements.filter(granted=True, expires_at__isnull=True)
            .values_list('feature', flat=True)
        )
        
        # Format response to match spec
        # Example: { "user": {"id":"UUID","email":"martin@och.africa","name":"Martin"}, ... }
        user_data = serializer.data
        user_response = {
            'id': str(user_data.get('id', '')),
            'email': user_data.get('email', ''),
            'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
        }
        
        # Format consent scopes as list of strings (e.g., ["share_with_mentor","public_portfolio:false"])
        formatted_consents = []
        for scope in consent_scopes:
            formatted_consents.append(scope)
        
        return Response({
            'user': user_response,
            'roles': roles,
            'consent_scopes': formatted_consents,
            'entitlements': entitlements,
        }, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """
    GET /api/v1/profile
    PATCH /api/v1/profile
    Get or update current user profile with role-specific data.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Check if user is active
        if not user.is_active:
            return Response(
                {'detail': 'Account is inactive. Please contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check account status
        if user.account_status != 'active':
            return Response(
                {'detail': f'Account is {user.account_status}. Please verify your email.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(user)
        user_data = serializer.data
        
        # Get roles with scope details
        roles = []
        primary_role = None
        for user_role in user.user_roles.filter(is_active=True).select_related('role'):
            role_data = {
                'role': user_role.role.name,
                'role_display_name': user_role.role.display_name,
                'scope': user_role.scope,
                'scope_ref': str(user_role.scope_ref) if user_role.scope_ref else None,
            }
            roles.append(role_data)
            # Set primary role (first active role, or mentor/student if exists)
            if not primary_role:
                primary_role = role_data
            elif user_role.role.name in ['mentor', 'student', 'mentee']:
                primary_role = role_data
        
        # Get consent scopes
        consent_scopes = get_user_consent_scopes(user)
        
        # Get entitlements
        entitlements = list(
            user.entitlements.filter(granted=True, expires_at__isnull=True)
            .values_list('feature', flat=True)
        )
        
        # Get role-specific data
        role_specific_data = {}
        
        # Mentor-specific data
        if user.is_mentor:
            from mentorship_coordination.models import MenteeMentorAssignment
            active_assignments = MenteeMentorAssignment.objects.filter(
                mentor=user,
                status='active'
            )
            role_specific_data['mentor'] = {
                'active_mentees': active_assignments.count(),
                'total_sessions': 0,  # TODO: Calculate from MentorSession
                'pending_work_items': 0,  # TODO: Calculate from flags/work items
                'capacity_weekly': user.mentor_capacity_weekly or 0,
                'specialties': user.mentor_specialties or [],
                'availability': user.mentor_availability or {},
            }
        
        # Student/Mentee-specific data
        student_roles = user.user_roles.filter(
            role__name__in=['student', 'mentee'],
            is_active=True
        )
        if student_roles.exists():
            from programs.models import Enrollment
            enrollment = Enrollment.objects.filter(
                user=user,
                status='active'
            ).select_related('cohort', 'cohort__track').first()
            
            role_specific_data['student'] = {
                'track_name': enrollment.cohort.track.name if enrollment and enrollment.cohort and enrollment.cohort.track else None,
                'cohort_name': enrollment.cohort.name if enrollment and enrollment.cohort else None,
                'enrollment_status': enrollment.status if enrollment else None,
                'enrollment_type': enrollment.enrollment_type if enrollment else None,
                'seat_type': enrollment.seat_type if enrollment else None,
                'payment_status': enrollment.payment_status if enrollment else None,
            }
        
        # Director-specific data
        director_roles = user.user_roles.filter(
            role__name='program_director',
            is_active=True
        )
        if director_roles.exists():
            from programs.models import Cohort, Track
            from programs.services.director_service import DirectorService
            programs = DirectorService.get_director_programs(user)
            cohorts_managed = Cohort.objects.filter(track__program__in=programs).count()
            tracks_managed = Track.objects.filter(program__in=programs).count()
            
            role_specific_data['director'] = {
                'cohorts_managed': cohorts_managed,
                'tracks_managed': tracks_managed,
            }
        
        # Admin-specific data
        if user.is_staff:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            
            role_specific_data['admin'] = {
                'total_users': total_users,
                'active_users': active_users,
            }
        
        # Return comprehensive profile data
        return Response({
            **user_data,
            'roles': roles,
            'primary_role': primary_role,
            'consent_scopes': consent_scopes,
            'entitlements': entitlements,
            'role_specific_data': role_specific_data,
        }, status=status.HTTP_200_OK)
    
    def patch(self, request):
        """Update user profile."""
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConsentView(APIView):
    """
    POST /api/v1/auth/consents
    Update consent scopes.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ConsentUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        scope_type = serializer.validated_data['scope_type']
        granted = serializer.validated_data['granted']
        expires_at = serializer.validated_data.get('expires_at')
        
        if granted:
            consent = grant_consent(request.user, scope_type, expires_at)
            _log_audit_event(request.user, 'consent_granted', 'consent', 'success', {'scope': scope_type})
        else:
            consent = revoke_consent(request.user, scope_type)
            _log_audit_event(request.user, 'consent_revoked', 'consent', 'success', {'scope': scope_type})
        
        return Response({
            'detail': f'Consent {scope_type} {"granted" if granted else "revoked"}',
            'consent': {
                'scope_type': scope_type,
                'granted': granted,
            }
        }, status=status.HTTP_200_OK)


# Account activation and password reset views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register new user with email verification"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')

        # Validate required fields
        if not all([email, password]):
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user (inactive until email verified)
        with transaction.atomic():
            user = User.objects.create_user(
                username=email,  # Use email as username
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=False  # User inactive until email verified
            )

            # Generate verification token and get raw token
            raw_token = user.generate_verification_token()

            # Send activation email with raw token
            if email_service.send_activation_email(user, raw_token=raw_token):
                return Response({
                    'message': 'Registration successful. Please check your email to activate your account.',
                    'user_id': user.id
                }, status=status.HTTP_201_CREATED)
            else:
                # If email fails, rollback/delete user and return error
                user.delete()
                return Response(
                    {'error': 'Failed to send activation email. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {'error': 'Registration failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Verify user email with token or code (OTP)"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        token = request.data.get('token')
        code = request.data.get('code')
        email = request.data.get('email')

        # Handle code-based verification (OTP flow from SignupView)
        if code and email:
            try:
                # Case-insensitive email lookup
                user = User.objects.filter(email__iexact=email).first()
                if not user:
                    logger.warning(f"Verification attempt with non-existent email: {email}")
                    return Response(
                        {'error': 'Invalid verification code or email'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                logger.error(f"Error looking up user for email {email}: {str(e)}")
                return Response(
                    {'error': 'Invalid verification code or email'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verify the OTP code (strip whitespace and ensure string)
            code = str(code).strip()
            
            # Check if user is already active
            if user.is_active and user.email_verified:
                return Response({
                    'message': 'Your email is already verified. You can log in.',
                    'user_id': user.id
                }, status=status.HTTP_200_OK)
            
            # Verify the OTP code
            try:
                code_valid = verify_mfa_code(user, code, method='email')
            except Exception as e:
                logger.error(f"Error verifying MFA code for user {user.email}: {str(e)}")
                return Response(
                    {'error': 'Error verifying code. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if code_valid:
                # Activate the user account
                user.is_active = True
                user.account_status = 'active'
                user.email_verified = True
                if not user.activated_at:
                    user.activated_at = timezone.now()
                user.email_verified_at = timezone.now()
                user.save()

                # Send welcome email
                try:
                    email_service.send_welcome_email(user)
                except Exception as e:
                    logger.warning(f"Failed to send welcome email to {user.email}: {str(e)}")
                    # Don't fail verification if welcome email fails

                logger.info(f"Email verified successfully for user {user.email} via OTP code")
                return Response({
                    'message': 'Email verified successfully. You can now log in.',
                    'user_id': user.id
                }, status=status.HTTP_200_OK)
            else:
                logger.warning(f"Invalid or expired verification code for user {user.email}")
                return Response(
                    {'error': 'Invalid or expired verification code. Please request a new one.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Handle token-based verification (hashed token system)
        elif token:
            # Architecture: Hash incoming token and search database for matching hash
            import hashlib
            
            # Validate token format (should be URL-safe base64, ~43 characters)
            if not token or len(token) < 32:
                logger.warning(f"Invalid token format received: {token[:10]}...")
                return Response(
                    {'error': 'Invalid verification token format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Hash the incoming raw token using SHA-256
            try:
                token_hash = hashlib.sha256(str(token).encode('utf-8')).hexdigest()
            except Exception as e:
                logger.error(f"Error hashing token: {str(e)}")
                return Response(
                    {'error': 'Error processing verification token'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Find user with matching hash that hasn't expired (primary method)
            user = User.objects.filter(
                verification_hash=token_hash,
                token_expires_at__gt=timezone.now(),
                is_active=False
            ).first()

            # If user found with hashed token system
            if user:
                logger.info(f"Found user with hashed token: {user.email}")
                # Verify token using hashed system (this will activate user, set email_verified, and clear hash)
                if user.verify_email_token(token):
                    # Refresh user object to get updated fields
                    user.refresh_from_db()

                    # Send welcome email
                    try:
                        email_service.send_welcome_email(user)
                    except Exception as e:
                        logger.warning(f"Failed to send welcome email to {user.email}: {str(e)}")
                        # Don't fail verification if welcome email fails

                    logger.info(f"Email verified successfully for user {user.email} via hashed token")
                    return Response({
                        'message': 'Email verified successfully. You can now log in.',
                        'user_id': user.id
                    }, status=status.HTTP_200_OK)
                else:
                    logger.warning(f"Token verification failed for user {user.email}")
                    return Response(
                        {'error': 'Invalid or expired verification token'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Try legacy token system for backward compatibility
            user = User.objects.filter(
                email_verification_token=token,
                is_active=False
            ).first()
            
            if user:
                logger.info(f"Found user with legacy token: {user.email}")
                # Use legacy verification
                if user.verify_email_token(token):
                    user.is_active = True
                    user.account_status = 'active'
                    if not user.activated_at:
                        user.activated_at = timezone.now()
                    user.save()
                    
                    try:
                        email_service.send_welcome_email(user)
                    except Exception as e:
                        logger.warning(f"Failed to send welcome email to {user.email}: {str(e)}")
                    
                    logger.info(f"Email verified successfully for user {user.email} via legacy token")
                    return Response({
                        'message': 'Email verified successfully. You can now log in.',
                        'user_id': user.id
                    }, status=status.HTTP_200_OK)
            
            # Token not found in either system
            logger.warning(f"Verification token not found: {token_hash[:16]}...")
            return Response(
                {'error': 'Invalid or expired verification token. Please request a new activation link.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            return Response(
                {'error': 'Either token or code+email is required for verification'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return Response(
            {'error': 'Verification failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request password reset email"""
    try:
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(email=email, is_active=True).first()

        if user:
            # Generate reset token (email service will also generate, but we generate here first to ensure it's set)
            user.generate_password_reset_token()

            # Send reset email
            email_sent = email_service.send_password_reset_email(user)
            
            # Log the result for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Password reset email send attempt for {email}: {'SUCCESS' if email_sent else 'FAILED'}")
            
            if email_sent:
                return Response({
                    'message': 'Password reset email sent. Please check your email.'
                }, status=status.HTTP_200_OK)
            else:
                # Log more details but don't expose to user
                logger.error(f"Failed to send password reset email for {email}. Check email service configuration.")
                return Response(
                    {'error': 'Failed to send password reset email. Please check your email service configuration or try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Don't reveal if email exists or not for security
            return Response({
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password reset request error: {str(e)}")
        return Response(
            {'error': 'Password reset request failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with token"""
    try:
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([token, new_password, confirm_password]):
            return Response(
                {'error': 'Token, new password, and confirmation are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find user with this token
        user = User.objects.filter(
            password_reset_token=token,
            is_active=True
        ).first()

        if not user:
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify token and update password
        if user.verify_password_reset_token(token):
            user.set_password(new_password)
            user.password_reset_token = None
            user.password_reset_token_created = None
            user.save()

            return Response({
                'message': 'Password reset successfully. You can now log in with your new password.'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Password reset error: {str(e)}")
        return Response(
            {'error': 'Password reset failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class SessionsView(APIView):
    """
    GET /api/v1/auth/sessions
    List all active sessions for the current user.
    DELETE /api/v1/auth/sessions/{session_id}
    Revoke a specific session.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get all active sessions for the current user"""
        user = request.user
        
        # Get all active (non-revoked) sessions that haven't expired
        sessions = UserSession.objects.filter(
            user=user,
            revoked_at__isnull=True,
            expires_at__gt=timezone.now()
        ).order_by('-last_activity')
        
        # Get current session ID from refresh token if available
        current_session_id = None
        try:
            # Try to get current session from request metadata
            # This is a simplified approach - in production, you'd extract from the JWT
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            # For now, we'll mark the most recent session as current
            if sessions.exists():
                current_session_id = str(sessions.first().id)
        except:
            pass
        
        sessions_data = []
        for session in sessions:
            sessions_data.append({
                'id': str(session.id),
                'device_name': session.device_name or 'Unknown Device',
                'device_type': session.device_type or 'unknown',
                'device_info': session.device_name or 'Unknown Device',
                'ip_address': str(session.ip_address) if session.ip_address else None,
                'location': None,  # Could be derived from IP using a geolocation service
                'last_active': session.last_activity.isoformat() if session.last_activity else session.created_at.isoformat(),
                'last_activity': session.last_activity.isoformat() if session.last_activity else None,
                'created_at': session.created_at.isoformat(),
                'current': str(session.id) == current_session_id,
                'is_trusted': session.is_trusted,
                'mfa_verified': session.mfa_verified,
                'ua': session.ua,
            })
        
        return Response(sessions_data, status=status.HTTP_200_OK)
    
    def delete(self, request, session_id=None):
        """Revoke a specific session"""
        user = request.user
        
        try:
            if session_id:
                # Revoke specific session
                session = UserSession.objects.get(id=session_id, user=user)
                session.revoked_at = timezone.now()
                session.save()
                return Response({'message': 'Session revoked successfully'}, status=status.HTTP_200_OK)
            else:
                # Revoke all other sessions (keep current)
                # Get current session from refresh token
                # For now, revoke all except the most recent
                sessions = UserSession.objects.filter(
                    user=user,
                    revoked_at__isnull=True,
                    expires_at__gt=timezone.now()
                ).order_by('-last_activity')
                
                if sessions.exists():
                    # Keep the most recent session
                    current_session = sessions.first()
                    other_sessions = sessions.exclude(id=current_session.id)
                    other_sessions.update(revoked_at=timezone.now())
                    return Response({
                        'message': f'{other_sessions.count()} session(s) revoked successfully'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({'message': 'No sessions to revoke'}, status=status.HTTP_200_OK)
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error revoking session: {str(e)}")
            return Response(
                {'error': 'Failed to revoke session'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

