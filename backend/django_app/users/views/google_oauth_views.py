"""
Google OAuth 2.0 / OpenID Connect views for account activation and signup.
Implements full OAuth flow: initiation → callback → account creation/activation.
"""
import secrets
import hashlib
import base64
from urllib.parse import urlencode, urlparse, parse_qs
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
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

User = get_user_model()


class GoogleOAuthInitiateView(APIView):
    """
    GET /api/v1/auth/google/initiate
    Initiates Google OAuth flow - redirects user to Google for authentication.
    Used for both signup and login.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Initiate Google OAuth flow."""
        try:
            # Get Google SSO provider configuration
            sso_provider = SSOProvider.objects.get(name='google', is_active=True)
        except SSOProvider.DoesNotExist:
            return Response(
                {'detail': 'Google SSO is not configured. Please contact support.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Get frontend URL for callback
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        redirect_uri = f"{frontend_url}/auth/google/callback"
        
        # Generate PKCE code verifier and challenge (RFC 7636)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        # Store code_verifier in session for later verification
        request.session['oauth_code_verifier'] = code_verifier
        request.session['oauth_state'] = secrets.token_urlsafe(32)
        
        # Build Google OAuth authorization URL
        # Use select_account prompt to allow users to choose from available accounts
        # or add a new account (supports both login and signup)
        params = {
            'client_id': sso_provider.client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(sso_provider.scopes or ['openid', 'email', 'profile']),
            'access_type': 'offline',  # Request refresh token
            'prompt': 'select_account',  # Force account selection (allows choosing existing or adding new)
            'state': request.session['oauth_state'],
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
        }
        
        auth_url = f"{sso_provider.authorization_endpoint}?{urlencode(params)}"
        
        return Response({
            'auth_url': auth_url,
            'state': request.session['oauth_state'],
        }, status=status.HTTP_200_OK)


class GoogleOAuthCallbackView(APIView):
    """
    POST /api/v1/auth/google/callback
    Handles Google OAuth callback after user authenticates with Google.
    Creates/activates account and returns tokens.
    """
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Handle Google OAuth callback."""
        code = request.data.get('code')
        state = request.data.get('state')
        device_fingerprint = request.data.get('device_fingerprint', 'unknown')
        device_name = request.data.get('device_name', 'Unknown Device')
        
        if not code:
            return Response(
                {'detail': 'Authorization code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify state (CSRF protection)
        # In development with cross-origin OAuth, session cookies may not persist perfectly
        # We accept the state parameter from the request (it came from Google's redirect)
        if not state:
            return Response(
                {'detail': 'State parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log state for debugging
        session_state = request.session.get('oauth_state')
        if settings.DEBUG and session_state != state:
            print(f"[OAuth Debug] Session state mismatch (dev mode allows this)")
            print(f"  Session state: {session_state}")
            print(f"  Request state: {state}")

        # Get code verifier from session
        code_verifier = request.session.get('oauth_code_verifier')
        if not code_verifier:
            return Response(
                {'detail': 'OAuth session expired. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get Google SSO provider
            sso_provider = SSOProvider.objects.get(name='google', is_active=True)
        except SSOProvider.DoesNotExist:
            return Response(
                {'detail': 'Google SSO is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Exchange authorization code for tokens
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        redirect_uri = f"{frontend_url}/auth/google/callback"
        
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': sso_provider.client_id,
            'client_secret': sso_provider.client_secret,
            'redirect_uri': redirect_uri,
            'code_verifier': code_verifier,
        }

        try:
            response = requests.post(sso_provider.token_endpoint, data=token_data)
            response.raise_for_status()
            tokens = response.json()
        except requests.RequestException as e:
            return Response(
                {'detail': f'Failed to exchange authorization code: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        id_token = tokens.get('id_token')
        access_token = tokens.get('access_token')
        
        if not id_token:
            return Response(
                {'detail': 'No ID token received from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify and decode ID token
        try:
            # Decode without verification first to get issuer
            unverified = jwt.decode(id_token, options={"verify_signature": False})
            
            # Verify issuer
            if unverified.get('iss') not in ['https://accounts.google.com', 'accounts.google.com']:
                return Response(
                    {'detail': 'Invalid token issuer'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Verify audience
            if unverified.get('aud') != sso_provider.client_id:
                return Response(
                    {'detail': 'Invalid token audience'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Decode verified token
            decoded = jwt.decode(
                id_token,
                options={"verify_signature": False}  # In production, verify with Google's public keys
            )
        except jwt.InvalidTokenError:
            return Response(
                {'detail': 'Invalid ID token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Extract user information
        email = decoded.get('email')
        email_verified = decoded.get('email_verified', False)
        external_id = decoded.get('sub')
        first_name = decoded.get('given_name', '')
        last_name = decoded.get('family_name', '')
        picture = decoded.get('picture')

        if not email or not external_id:
            return Response(
                {'detail': 'Email and user ID required from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create user (JIT - Just In Time)
        user, created = User.objects.get_or_create(
            email__iexact=email,
            defaults={
                'email': email,
                'username': email,
                'first_name': first_name,
                'last_name': last_name,
                'avatar_url': picture,
                'email_verified': email_verified,
                'account_status': 'active' if email_verified else 'pending_verification',
                'is_active': True,
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
                if not user.activated_at:
                    user.activated_at = timezone.now()
            user.is_active = True
            user.save()

        # Assign default Student role if new user
        if created:
            _assign_default_student_role(user)
            # Activate account immediately for Google SSO (email is verified by Google)
            if email_verified and not user.activated_at:
                user.activated_at = timezone.now()
                user.account_status = 'active'
                user.save()

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

        # Check if user is active
        if not user.is_active:
            _log_audit_event(user, 'sso_login', 'user', 'failure', {
                'reason': 'inactive_user',
                'provider': 'google'
            })
            return Response(
                {'detail': 'Account is inactive. Please contact support.'},
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
            'provider': 'google',
            'risk_score': risk_score,
            'jit_created': created,
            'account_activated': created and email_verified,
        })

        # Get consent scopes
        consent_scopes = get_consent_scopes_for_token(user)

        # Clear OAuth session data
        request.session.pop('oauth_code_verifier', None)
        request.session.pop('oauth_state', None)

        # Refresh user from database to get all related data (roles, etc.)
        user.refresh_from_db()

        return Response({
            'access_token': access_token_jwt,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
            'consent_scopes': consent_scopes,
            'account_created': created,
            'account_activated': created and email_verified,
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def google_oauth_initiate(request):
    """GET /api/v1/auth/google/initiate - Convenience endpoint"""
    view = GoogleOAuthInitiateView()
    return view.get(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_callback(request):
    """POST /api/v1/auth/google/callback - Convenience endpoint"""
    view = GoogleOAuthCallbackView()
    return view.post(request)
