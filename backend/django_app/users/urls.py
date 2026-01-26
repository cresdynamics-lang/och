"""
URL configuration for users app - Authentication endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, register_user, verify_email, request_password_reset, reset_password
from .views.auth_views import (
    SignupView,
    LoginView,
    SimpleLoginView,
    MagicLinkView,
    MFAEnrollView,
    MFAVerifyView,
    MFADisableView,
    RefreshTokenView,
    LogoutView,
    MeView,
    ProfileView,
    ConsentView,
    SessionsView,
)
from .views.password_reset_views import (
    PasswordResetRequestView,
    PasswordResetConfirmView,
)
from .views.sso_views import (
    SSOLoginView,
    google_sso_login,
    microsoft_sso_login,
    apple_sso_login,
    okta_sso_login,
)
from .views.google_oauth_views import (
    GoogleOAuthInitiateView,
    GoogleOAuthCallbackView,
    google_oauth_initiate,
    google_oauth_callback,
)
from .views.settings_views import user_settings

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication endpoints (support both with and without trailing slash)
    path('auth/signup', SignupView.as_view(), name='signup'),
    path('auth/signup/', SignupView.as_view(), name='signup-slash'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/login/', LoginView.as_view(), name='login-slash'),
    path('auth/login/simple', SimpleLoginView.as_view(), name='simple-login'),
    path('auth/login/magic-link', MagicLinkView.as_view(), name='magic-link'),
    path('auth/login/magic-link/', MagicLinkView.as_view(), name='magic-link-slash'),
    path('auth/mfa/enroll', MFAEnrollView.as_view(), name='mfa-enroll'),
    path('auth/mfa/enroll/', MFAEnrollView.as_view(), name='mfa-enroll-slash'),
    path('auth/mfa/verify', MFAVerifyView.as_view(), name='mfa-verify'),
    path('auth/mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify-slash'),
    path('auth/mfa/disable', MFADisableView.as_view(), name='mfa-disable'),
    path('auth/mfa/disable/', MFADisableView.as_view(), name='mfa-disable-slash'),
    path('auth/token/refresh', RefreshTokenView.as_view(), name='token-refresh'),
    path('auth/token/refresh/', RefreshTokenView.as_view(), name='token-refresh-slash'),
    path('auth/logout', LogoutView.as_view(), name='logout'),
    path('auth/logout/', LogoutView.as_view(), name='logout-slash'),
    path('auth/me', MeView.as_view(), name='me'),
    path('auth/me/', MeView.as_view(), name='me-slash'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('profile/', ProfileView.as_view(), name='profile-slash'),
    path('settings', user_settings, name='user-settings'),
    path('settings/', user_settings, name='user-settings-slash'),
    path('auth/consents', ConsentView.as_view(), name='consents'),
    path('auth/consents/', ConsentView.as_view(), name='consents-slash'),
    path('auth/sessions', SessionsView.as_view(), name='sessions'),
    path('auth/sessions/', SessionsView.as_view(), name='sessions-slash'),
    path('auth/sessions/<uuid:session_id>', SessionsView.as_view(), name='session-detail'),
    path('auth/sessions/<uuid:session_id>/', SessionsView.as_view(), name='session-detail-slash'),
    path('auth/password/reset/request', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request-slash'),
    path('auth/password/reset/confirm', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm-slash'),

    # Account activation endpoints
    path('auth/register/', register_user, name='register'),
    path('auth/register', register_user, name='register-no-slash'),
    path('auth/verify-email/', verify_email, name='verify_email'),
    path('auth/verify-email', verify_email, name='verify_email-no-slash'),
    path('auth/request-password-reset/', request_password_reset, name='request_password_reset'),
    path('auth/request-password-reset', request_password_reset, name='request_password_reset-no-slash'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('auth/reset-password', reset_password, name='reset_password-no-slash'),

    # SSO endpoints (generic and specific)
    path('auth/sso/<str:provider>', SSOLoginView.as_view(), name='sso-generic'),
    path('auth/sso/google', google_sso_login, name='sso-google'),
    path('auth/sso/microsoft', microsoft_sso_login, name='sso-microsoft'),
    path('auth/sso/apple', apple_sso_login, name='sso-apple'),
    path('auth/sso/okta', okta_sso_login, name='sso-okta'),
    
    # Google OAuth 2.0 flow (for account activation/signup)
    path('auth/google/initiate', google_oauth_initiate, name='google-oauth-initiate'),
    path('auth/google/initiate/', google_oauth_initiate, name='google-oauth-initiate-slash'),
    path('auth/google/callback', google_oauth_callback, name='google-oauth-callback'),
    path('auth/google/callback/', google_oauth_callback, name='google-oauth-callback-slash'),

    # User management endpoints
    path('', include(router.urls)),
]

    # User management endpoints