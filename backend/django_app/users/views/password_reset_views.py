"""
Password reset views.
"""
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from users.utils.auth_utils import create_mfa_code
from users.audit_models import AuditLog
from users.auth_models import MFACode

User = get_user_model()


class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/password/reset/request
    Request password reset.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response(
                {'detail': 'If an account exists, a password reset link has been sent.'},
                status=status.HTTP_200_OK
            )
        
        # Generate reset code
        code, mfa_code = create_mfa_code(user, method='email', expires_minutes=60)
        
        # Send password reset email
        from users.utils.email_utils import send_password_reset_email
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/auth/reset-password?token={code}&email={email}"
        send_password_reset_email(user, reset_url)
        
        AuditLog.objects.create(
            user=user,
            actor_type='user',
            actor_identifier=user.email,
            action='password_reset_request',
            resource_type='user',
            result='success',
            timestamp=timezone.now(),
        )
        
        return Response(
            {'detail': 'Password reset link sent to your email'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/password/reset/confirm
    Confirm password reset with token.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        # Find user by reset code
        try:
            mfa_code = MFACode.objects.get(
                code=token,
                method='email',
                used=False,
                expires_at__gt=timezone.now()
            )
            user = mfa_code.user
        except MFACode.DoesNotExist:
            return Response(
                {'detail': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.password_changed_at = timezone.now()
        user.save()
        
        # Mark code as used
        mfa_code.used = True
        mfa_code.used_at = timezone.now()
        mfa_code.save()
        
        AuditLog.objects.create(
            user=user,
            actor_type='user',
            actor_identifier=user.email,
            action='password_change',
            resource_type='user',
            result='success',
            timestamp=timezone.now(),
        )
        
        return Response(
            {'detail': 'Password reset successfully'},
            status=status.HTTP_200_OK
        )

