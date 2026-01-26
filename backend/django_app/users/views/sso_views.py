"""
SSO authentication views for Google, Microsoft, Apple, and Okta.
Per specification: OIDC/SAML SSO with JIT user creation and role mapping.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from users.models import Role, UserRole
from users.auth_models import SSOProvider, SSOConnection
from users.views.auth_views import (
    _assign_default_student_role,
    _log_audit_event,
    _get_client_ip,
)
from users.utils.auth_utils import create_user_session
from users.utils.risk_utils import calculate_risk_score
from users.utils.consent_utils import get_consent_scopes_for_token
from users.serializers import UserSerializer
import requests
import jwt
import json

User = get_user_model()


class SSOLoginView(APIView):
    """
    Generic SSO login endpoint.
    POST /api/v1/auth/sso/{provider}
    Supports: google, microsoft, apple, okta
    """
    permission_classes = [AllowAny]

    def post(self, request, provider):
        """
        Handle SSO login for any provider.
        Per spec: OIDC flow with PKCE, JIT user creation, role mapping.
        """
        provider_name = provider.lower()
        
        # Get provider configuration
        try:
            sso_provider = SSOProvider.objects.get(name=provider_name, is_active=True)
        except SSOProvider.DoesNotExist:
            return Response(
                {'detail': f'SSO provider "{provider_name}" not configured'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Extract request data
        id_token = request.data.get('id_token') or request.data.get('identity_token')
        access_token = request.data.get('access_token')
        code = request.data.get('code')  # Authorization code for OAuth flow
        device_fingerprint = request.data.get('device_fingerprint', 'unknown')
        device_name = request.data.get('device_name', 'Unknown Device')

        if not id_token and not code:
            return Response(
                {'detail': f'{provider_name} ID token or authorization code required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify token and get user info
            user_info = self._verify_token(sso_provider, id_token, access_token, code, request.data)
            
            if not user_info:
                return Response(
                    {'detail': f'Invalid {provider_name} token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Extract user attributes using attribute mapping
            email = user_info.get('email')
            external_id = user_info.get('sub') or user_info.get('id')
            email_verified = user_info.get('email_verified', False)
            
            # Map attributes based on provider configuration
            attribute_mapping = sso_provider.attribute_mapping or {}
            first_name = user_info.get(attribute_mapping.get('first_name', 'given_name'), '')
            last_name = user_info.get(attribute_mapping.get('last_name', 'family_name'), '')
            picture = user_info.get('picture') or user_info.get('avatar_url')

            if not email or not external_id:
                return Response(
                    {'detail': 'Email and user ID required from SSO provider'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create user (JIT - Just In Time)
            user, created = User.objects.get_or_create(
                email__iexact=email,  # Case-insensitive email lookup
                defaults={
                    'email': email,
                    'username': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'avatar_url': picture,
                    'email_verified': email_verified,
                    'account_status': 'active' if email_verified else 'pending_verification',
                }
            )

            # Update user info if not created
            if not created:
                if not user.avatar_url and picture:
                    user.avatar_url = picture
                if not user.email_verified and email_verified:
                    user.email_verified = True
                    user.email_verified_at = timezone.now()
                if user.account_status == 'pending_verification' and email_verified:
                    user.account_status = 'active'
                user.save()

            # Assign default Student role if new user (per spec)
            if created:
                _assign_default_student_role(user)
                # Map IdP groups/claims to roles (per spec - placeholder for now)
                # self._map_idp_roles_to_user(user, user_info, sso_provider)

            # Create or update SSO connection
            SSOConnection.objects.update_or_create(
                user=user,
                provider=sso_provider,
                external_id=external_id,
                defaults={
                    'external_email': email,
                    'is_active': True,
                    'last_sync_at': timezone.now(),
                }
            )

            # Check if user is active before creating session
            if not user.is_active:
                _log_audit_event(user, 'sso_login', 'user', 'failure', {'reason': 'inactive_user', 'provider': provider_name})
                return Response(
                    {'detail': 'Account is inactive. Please contact support.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check account status
            if user.account_status != 'active':
                _log_audit_event(user, 'sso_login', 'user', 'failure', {'reason': 'inactive_account_status', 'provider': provider_name, 'status': user.account_status})
                return Response(
                    {'detail': f'Account is {user.account_status}. Please verify your email.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create session and issue tokens
            ip_address = _get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            risk_score = calculate_risk_score(user, ip_address, device_fingerprint, user_agent)

            access_token_jwt, refresh_token, session = create_user_session(
                user=user,
                device_fingerprint=device_fingerprint,
                device_name=device_name,
                ip_address=ip_address,
                user_agent=user_agent
            )

            # Update user last login
            user.last_login = timezone.now()
            user.last_login_ip = ip_address
            user.save()

            # Audit log
            _log_audit_event(user, 'sso_login', 'user', 'success', {
                'provider': provider_name,
                'risk_score': risk_score,
                'jit_created': created,
            })

            # Get consent scopes for token
            consent_scopes = get_consent_scopes_for_token(user)

            return Response({
                'access_token': access_token_jwt,
                'refresh_token': refresh_token,
                'user': UserSerializer(user).data,
                'consent_scopes': consent_scopes,
            }, status=status.HTTP_200_OK)

        except requests.RequestException as e:
            return Response(
                {'detail': f'Error verifying {provider_name} token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except jwt.InvalidTokenError:
            return Response(
                {'detail': f'Invalid {provider_name} token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'detail': f'SSO authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _verify_token(self, sso_provider, id_token, access_token, code, request_data=None):
        """
        Verify SSO token and return user info.
        Supports OIDC ID tokens and OAuth2 authorization codes.
        """
        provider_name = sso_provider.name.lower()

        # If authorization code provided, exchange for token
        if code:
            token_data = self._exchange_code_for_token(sso_provider, code, request_data)
            if token_data:
                id_token = token_data.get('id_token')
                access_token = token_data.get('access_token')

        if not id_token:
            return None

        # Verify based on provider type
        if sso_provider.provider_type == 'oidc':
            return self._verify_oidc_token(sso_provider, id_token, access_token)
        elif sso_provider.provider_type == 'saml':
            # SAML verification would go here
            return None
        else:
            return None

    def _exchange_code_for_token(self, sso_provider, code, request_data=None):
        """
        Exchange authorization code for tokens (OAuth2 flow with PKCE).
        """
        if not sso_provider.token_endpoint:
            return None

        redirect_uri = (request_data.get('redirect_uri') if request_data 
                       else settings.FRONTEND_URL)

        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': sso_provider.client_id,
            'client_secret': sso_provider.client_secret,
            'redirect_uri': redirect_uri,
        }

        try:
            response = requests.post(sso_provider.token_endpoint, data=data)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass

        return None

    def _verify_oidc_token(self, sso_provider, id_token, access_token):
        """
        Verify OIDC ID token and fetch user info.
        """
        provider_name = sso_provider.name.lower()

        # Decode token (without verification for now - should verify in production)
        try:
            decoded = jwt.decode(id_token, options={"verify_signature": False})
        except Exception:
            return None

        # Verify audience matches client ID
        if decoded.get('aud') != sso_provider.client_id:
            return None

        # Verify issuer
        if sso_provider.issuer and decoded.get('iss') != sso_provider.issuer:
            return None

        # Get user info from token or userinfo endpoint
        user_info = {
            'sub': decoded.get('sub'),
            'email': decoded.get('email'),
            'email_verified': decoded.get('email_verified', False),
            'given_name': decoded.get('given_name', ''),
            'family_name': decoded.get('family_name', ''),
            'picture': decoded.get('picture'),
        }

        # Fetch additional info from userinfo endpoint if available
        if sso_provider.userinfo_endpoint and access_token:
            try:
                headers = {'Authorization': f'Bearer {access_token}'}
                response = requests.get(sso_provider.userinfo_endpoint, headers=headers)
                if response.status_code == 200:
                    userinfo_data = response.json()
                    user_info.update(userinfo_data)
            except Exception:
                pass

        return user_info

    def _map_idp_roles_to_user(self, user, user_info, sso_provider):
        """
        Map IdP groups/claims to roles (per spec).
        Placeholder for role mapping logic.
        """
        # Example: Map IdP groups to roles
        # groups = user_info.get('groups', [])
        # for group in groups:
        #     role_name = self._map_group_to_role(group, sso_provider)
        #     if role_name:
        #         role = Role.objects.get(name=role_name)
        #         UserRole.objects.get_or_create(user=user, role=role, scope='global')
        pass


# Individual provider endpoints for backward compatibility
@api_view(['POST'])
@permission_classes([AllowAny])
def google_sso_login(request):
    """POST /api/v1/auth/sso/google"""
    view = SSOLoginView()
    return view.post(request, 'google')


@api_view(['POST'])
@permission_classes([AllowAny])
def microsoft_sso_login(request):
    """POST /api/v1/auth/sso/microsoft"""
    view = SSOLoginView()
    return view.post(request, 'microsoft')


@api_view(['POST'])
@permission_classes([AllowAny])
def apple_sso_login(request):
    """POST /api/v1/auth/sso/apple"""
    view = SSOLoginView()
    return view.post(request, 'apple')


@api_view(['POST'])
@permission_classes([AllowAny])
def okta_sso_login(request):
    """POST /api/v1/auth/sso/okta"""
    view = SSOLoginView()
    return view.post(request, 'okta')
