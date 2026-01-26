"""
Email utilities for sending magic links, OTP codes, and verification emails.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_magic_link_email(user, code, magic_link_url):
    """
    Send magic link email to user.
    
    Args:
        user: User instance
        code: Magic link code
        magic_link_url: Full URL with code (e.g., https://app.example.com/auth/verify?code=xxx)
    """
    subject = 'Sign in to Ongoza CyberHub'
    
    html_message = render_to_string('emails/magic_link.html', {
        'user': user,
        'magic_link_url': magic_link_url,
        'code': code,
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_otp_email(user, code):
    """
    Send OTP code via email.
    
    Args:
        user: User instance
        code: OTP code (6-digit)
    """
    subject = 'Your Ongoza CyberHub verification code'
    
    html_message = render_to_string('emails/otp_code.html', {
        'user': user,
        'code': code,
    })
    
    plain_message = f'Your verification code is: {code}\n\nThis code will expire in 10 minutes.'
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_verification_email(user, verification_url):
    """
    Send email verification link using Resend.
    
    Args:
        user: User instance
        verification_url: Full verification URL with code and email
    """
    try:
        from services.email_service import email_service
        
        # Extract code from URL if present
        import urllib.parse
        parsed_url = urllib.parse.urlparse(verification_url)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        code = query_params.get('code', [None])[0]
        
        # Create HTML content for verification email
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media (prefers-color-scheme: dark) {{
                    .body-wrapper {{ background-color: #0F172A !important; }}
                    .card {{ background-color: #1E293B !important; color: #F1F5F9 !important; }}
                }}
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-weight: 800; font-size: 24px; color: #1E3A8A; letter-spacing: -0.5px;">ONGOZA <span style="color: #F97316;">CYBERHUB</span></span>
                </div>

                <div style="background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #1E3A8A;">
                    <h2 style="margin-top: 0; color: #1E3A8A; font-size: 20px; font-weight: 700;">Verify Your Email</h2>
                    <div style="color: #334155; line-height: 1.6; font-size: 16px;">
                        <p>Hi {user.first_name or 'Explorer'},</p>
                        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="{verification_url}" style="background-color: #1E3A8A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p style="background: #F8FAFC; padding: 12px; border-radius: 6px; font-size: 14px; color: #475569; margin-top: 24px;">
                            <strong>Security Note:</strong> This verification link will expire in 60 minutes. If you didn't create an account, please ignore this email.
                        </p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 24px;">
                    <p style="color: #64748B; font-size: 13px;">
                        © {getattr(settings, 'CURRENT_YEAR', '2024')} Ongoza CyberHub | Mission-Driven Education<br>
                        Bank Row, Cloud Park, OT Valley Districts
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Use ResendService to send the email
        return email_service._execute_send(
            user.email,
            "Verify your Ongoza CyberHub email",
            html_content,
            "verification"
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send verification email via Resend: {str(e)}")
        # Fallback to Django's send_mail
        subject = 'Verify your Ongoza CyberHub email'
        html_message = render_to_string('emails/verify_email.html', {
            'user': user,
            'verification_url': verification_url,
        })
        plain_message = strip_tags(html_message)
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )


def send_password_reset_email(user, reset_url):
    """
    Send password reset link.
    
    Args:
        user: User instance
        reset_url: Full password reset URL with token
    """
    subject = 'Reset your Ongoza CyberHub password'
    
    html_message = render_to_string('emails/password_reset.html', {
        'user': user,
        'reset_url': reset_url,
    })
    
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_mfa_enrollment_email(user, method):
    """
    Send MFA enrollment confirmation email.
    
    Args:
        user: User instance
        method: MFA method ('totp', 'sms', 'email')
    """
    subject = 'MFA enabled on your Ongoza CyberHub account'
    
    html_message = render_to_string('emails/mfa_enabled.html', {
        'user': user,
        'method': method,
    })
    
    plain_message = f'MFA has been enabled on your account using {method}.'
    
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

