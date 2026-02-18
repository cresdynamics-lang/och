"""
Google OAuth 2.0 / OpenID Connect views for account activation and signup.
Implements full OAuth flow: initiation → callback → account creation/activation.
"""
import os
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
        # Get Google OAuth credentials from environment
        client_id = os.getenv('GOOGLE_CLIENT_ID') or os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        
        if not client_id or not client_secret:
            return Response(
                {'detail': 'Google SSO is not configured. Please contact support.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Get frontend URL for callback
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        # Ensure frontend URL doesn't have trailing slash for redirect_uri
        frontend_url = frontend_url.rstrip('/')
        redirect_uri = f"{frontend_url}/auth/google/callback"
        
        # Generate PKCE code verifier and challenge (RFC 7636)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')

        # Store code_verifier and intended role in session for later verification
        request.session['oauth_code_verifier'] = code_verifier
        request.session['oauth_state'] = secrets.token_urlsafe(32)

        # Store intended role for signup (if provided)
        intended_role = request.GET.get('role')
        if intended_role:
            request.session['oauth_intended_role'] = intended_role
            print(f"[OAuth] Stored intended role for signup: {intended_role}")
        
        # Build Google OAuth authorization URL
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'offline',
            'prompt': 'select_account',
            'state': request.session['oauth_state'],
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
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

        # Get Google OAuth credentials from environment
        client_id = os.getenv('GOOGLE_CLIENT_ID') or os.getenv('GOOGLE_OAUTH_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        
        if not client_id or not client_secret:
            return Response(
                {'detail': 'Google SSO is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Verify state (CSRF protection)
        if not state:
            return Response(
                {'detail': 'State parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session_state = request.session.get('oauth_state')
        if settings.DEBUG and session_state != state:
            print(f"[OAuth Debug] Session state mismatch (dev mode allows this)")
        elif not settings.DEBUG and session_state != state:
            return Response(
                {'detail': 'Invalid state parameter. Possible CSRF attack.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get code verifier from session
        code_verifier = request.session.get('oauth_code_verifier')
        if not code_verifier and settings.DEBUG:
            code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

        # Exchange authorization code for tokens
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        redirect_uri = f"{frontend_url}/auth/google/callback"
        
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'code_verifier': code_verifier,
        }

        try:
            response = requests.post('https://oauth2.googleapis.com/token', data=token_data)
            response.raise_for_status()
            tokens = response.json()
        except requests.RequestException as e:
            return Response(
                {'detail': f'Failed to exchange authorization code: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        id_token = tokens.get('id_token')
        
        if not id_token:
            return Response(
                {'detail': 'No ID token received from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify and decode ID token
        try:
            unverified = jwt.decode(id_token, options={"verify_signature": False})
            
            if unverified.get('iss') not in ['https://accounts.google.com', 'accounts.google.com']:
                return Response(
                    {'detail': 'Invalid token issuer'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if unverified.get('aud') != client_id:
                return Response(
                    {'detail': 'Invalid token audience'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            decoded = jwt.decode(id_token, options={"verify_signature": False})
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

        # Get or create user
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

        # Assign role
        if created:
            from users.views.auth_views import _assign_user_role
            intended_role = request.session.get('oauth_intended_role', 'student')
            _assign_user_role(user, intended_role)
            request.session.pop('oauth_intended_role', None)
            if email_verified and not user.activated_at:
                user.activated_at = timezone.now()
                user.account_status = 'active'
                user.save()

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

        user.last_login = timezone.now()
        user.last_login_ip = ip_address
        user.save()

        _log_audit_event(user, 'sso_login', 'user', 'success', {
            'provider': 'google',
            'risk_score': risk_score,
            'jit_created': created,
        })

        consent_scopes = get_consent_scopes_for_token(user)
        request.session.pop('oauth_code_verifier', None)
        request.session.pop('oauth_state', None)
        user.refresh_from_db()

        return Response({
            'access_token': access_token_jwt,
            'refresh_token': refresh_token,
            'user': UserSerializer(user).data,
            'consent_scopes': consent_scopes,
            'account_created': created,
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
