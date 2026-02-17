"""
Admin views for student management - onboarding emails and tracking.
"""
import logging
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdminOrDirector
from services.email_service import EmailService

logger = logging.getLogger(__name__)
User = get_user_model()


class SendOnboardingEmailView(APIView):
    """
    Send onboarding email to a student.
    POST /api/v1/admin/students/send-onboarding-email/
    Body: { "user_id": "123" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrDirector]

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate tracking token
        import secrets
        tracking_token = secrets.token_urlsafe(32)
        
        # Store tracking token in user metadata (or create a separate model if preferred)
        if not user.metadata:
            user.metadata = {}
        user.metadata['onboarding_email_token'] = tracking_token
        user.save()

        # Create tracking URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        tracking_url = f"{frontend_url}/api/track-onboarding-email?token={tracking_token}&user_id={user_id}"

        # Create onboarding email content with tracking pixel
        email_service = EmailService()
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-weight: 800; font-size: 24px; color: #1E3A8A; letter-spacing: -0.5px;">ONGOZA <span style="color: #F97316;">CYBERHUB</span></span>
                </div>

                <div style="background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #1E3A8A;">
                    <h2 style="margin-top: 0; color: #1E3A8A; font-size: 20px; font-weight: 700;">Welcome to Ongoza CyberHub!</h2>
                    <div style="color: #334155; line-height: 1.6; font-size: 16px;">
                        <p>Hi {user.first_name or 'Explorer'},</p>
                        <p>Welcome to Ongoza CyberHub! We're excited to have you join our community of cybersecurity professionals.</p>
                        
                        <p>To get started, please click the button below to access your dashboard:</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="{frontend_url}/dashboard" style="background-color: #1E3A8A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                                Access Your Dashboard
                            </a>
                        </div>
                        
                        <p style="margin-top: 24px;">If you have any questions, feel free to reach out to our support team.</p>
                        
                        <p style="background: #F8FAFC; padding: 12px; border-radius: 6px; font-size: 14px; color: #475569; margin-top: 24px;">
                            <strong>Next Steps:</strong><br>
                            1. Complete your profile<br>
                            2. Take the TalentScope assessment<br>
                            3. Explore available tracks and cohorts
                        </p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 24px;">
                    <p style="color: #64748B; font-size: 13px;">
                        © {getattr(settings, 'CURRENT_YEAR', '2026')} Ongoza CyberHub | Mission-Driven Education<br>
                        Bank Row, Cloud Park, OT Valley Districts
                    </p>
                </div>
            </div>
            
            <!-- Tracking pixel -->
            <img src="{tracking_url}" width="1" height="1" style="display:none;" alt="" />
        </body>
        </html>
        """

        # Send email
        success = email_service._execute_send(
            user.email,
            "Welcome to Ongoza CyberHub - Get Started Today!",
            html_content,
            "onboarding"
        )

        if success:
            # Update onboarded_email_status to 'sent'
            user.onboarded_email_status = 'sent'
            user.save(update_fields=['onboarded_email_status'])

            return Response({
                'success': True,
                'message': f'Onboarding email sent to {user.email}',
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send email',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrackOnboardingEmailView(APIView):
    """
    Track when onboarding email is opened.
    GET /api/track-onboarding-email?token=xxx&user_id=xxx
    Returns a 1x1 transparent pixel image.
    """
    permission_classes = []  # Public endpoint for email tracking

    def get(self, request):
        token = request.query_params.get('token')
        user_id = request.query_params.get('user_id')

        if not token or not user_id:
            # Return transparent pixel even if params are missing
            from django.http import HttpResponse
            pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
            return HttpResponse(pixel, content_type='image/png')

        try:
            user = User.objects.get(id=user_id)
            
            # Verify token matches
            if user.metadata and user.metadata.get('onboarding_email_token') == token:
                # Update status to 'sent_and_seen'
                if user.onboarded_email_status == 'sent':
                    user.onboarded_email_status = 'sent_and_seen'
                    user.save(update_fields=['onboarded_email_status'])
                    logger.info(f"Onboarding email opened for user {user_id}")

        except User.DoesNotExist:
            pass
        except Exception as e:
            logger.error(f"Error tracking onboarding email: {str(e)}")

        # Return transparent 1x1 pixel
        from django.http import HttpResponse
        pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        return HttpResponse(pixel, content_type='image/png')
