"""
Email service using Resend API for sending transactional emails.
"""
import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

try:
    from resend import Resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("Resend package not installed. Email service will use Django's send_mail as fallback.")


class EmailService:
    """
    Email service for sending transactional emails via Resend API.
    Falls back to Django's send_mail if Resend is not available.
    """
    
    def __init__(self):
        self.resend_api_key = getattr(settings, 'RESEND_API_KEY', None)
        self.from_email = getattr(settings, 'RESEND_FROM_EMAIL', 'onboarding@resend.dev')
        self.from_name = getattr(settings, 'RESEND_FROM_NAME', 'Ongoza CyberHub')
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        if RESEND_AVAILABLE and self.resend_api_key:
            try:
                self.resend = Resend(api_key=self.resend_api_key)
                self.use_resend = True
            except Exception as e:
                logger.warning(f"Failed to initialize Resend client: {str(e)}")
                self.use_resend = False
        else:
            self.use_resend = False
            if not RESEND_AVAILABLE:
                logger.warning("Resend package not available. Using Django send_mail fallback.")
            elif not self.resend_api_key:
                logger.warning("RESEND_API_KEY not configured. Using Django send_mail fallback.")
    
    def _execute_send(self, to_email: str, subject: str, html_content: str, email_type: str = "transactional") -> bool:
        """
        Internal method to send email via Resend or fallback to Django.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            email_type: Type of email (for logging)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            if self.use_resend:
                # Send via Resend API
                params = {
                    "from": f"{self.from_name} <{self.from_email}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                }
                
                logger.info(f"Attempting to send email via Resend to {to_email} (type: {email_type})")
                result = self.resend.emails.send(params)
                
                if result and hasattr(result, 'id'):
                    logger.info(f"Email sent successfully via Resend (type: {email_type}, id: {result.id}, to: {to_email})")
                    return True
                elif result and hasattr(result, 'error'):
                    logger.error(f"Resend API error: {result.error} (type: {email_type}, to: {to_email})")
                    return False
                else:
                    logger.error(f"Resend API returned unexpected response: {result} (type: {email_type}, to: {to_email})")
                    return False
            else:
                # Fallback to Django's send_mail
                from django.core.mail import send_mail
                plain_message = strip_tags(html_content)
                
                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', self.from_email),
                    recipient_list=[to_email],
                    html_message=html_content,
                    fail_silently=False,
                )
                logger.info(f"Email sent successfully via Django send_mail (type: {email_type})")
                return True
                
        except Exception as e:
            import traceback
            logger.error(f"Failed to send email (type: {email_type}, to: {to_email}): {str(e)}")
            logger.error(f"Error traceback: {traceback.format_exc()}")
            return False
    
    def send_activation_email(self, user, raw_token: str = None) -> bool:
        """
        Send account activation email to user.
        
        Args:
            user: User instance
            raw_token: Raw activation token (optional, will be generated if not provided)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Generate activation URL
            if raw_token:
                activation_url = f"{self.frontend_url}/auth/verify-email?token={raw_token}"
            else:
                # Generate token if not provided
                raw_token = user.generate_verification_token()
                activation_url = f"{self.frontend_url}/auth/verify-email?token={raw_token}"
            
            # Create HTML content
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
                        <h2 style="margin-top: 0; color: #1E3A8A; font-size: 20px; font-weight: 700;">Activate Your Account</h2>
                        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
                            <p>Hi {user.first_name or user.email},</p>
                            <p>Welcome to Ongoza CyberHub! Please activate your account by clicking the button below:</p>
                            
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{activation_url}" style="background-color: #1E3A8A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                                    Activate Account
                                </a>
                            </div>
                            
                            <p style="background: #F8FAFC; padding: 12px; border-radius: 6px; font-size: 14px; color: #475569; margin-top: 24px;">
                                <strong>Security Note:</strong> This activation link will expire in 24 hours. If you didn't create an account, please ignore this email.
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <p style="color: #64748B; font-size: 13px;">
                            © 2024 Ongoza CyberHub | Mission-Driven Education<br>
                            Bank Row, Cloud Park, OT Valley Districts
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return self._execute_send(
                user.email,
                "Activate your Ongoza CyberHub account",
                html_content,
                "activation"
            )
            
        except Exception as e:
            logger.error(f"Failed to send activation email to {user.email}: {str(e)}")
            return False
    
    def send_welcome_email(self, user) -> bool:
        """
        Send welcome email to newly activated user.
        
        Args:
            user: User instance
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
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
                            <p>Hi {user.first_name or user.email},</p>
                            <p>Your account has been successfully activated! You're now ready to begin your cybersecurity journey.</p>
                            
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{self.frontend_url}/dashboard/student" style="background-color: #1E3A8A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                                    Go to Dashboard
                                </a>
                            </div>
                            
                            <p style="margin-top: 24px; color: #475569;">
                                Get started by completing your AI profiling to get matched with the perfect OCH track for your career goals.
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <p style="color: #64748B; font-size: 13px;">
                            © 2024 Ongoza CyberHub | Mission-Driven Education<br>
                            Bank Row, Cloud Park, OT Valley Districts
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return self._execute_send(
                user.email,
                "Welcome to Ongoza CyberHub!",
                html_content,
                "welcome"
            )
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return False
    
    def send_password_reset_email(self, user) -> bool:
        """
        Send password reset email to user.
        
        Args:
            user: User instance (should already have password_reset_token generated)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Use existing reset token (should be generated by the view)
            # If not set, generate one
            if not user.password_reset_token:
                user.generate_password_reset_token()
            
            reset_token = user.password_reset_token
            if not reset_token:
                logger.error(f"No password reset token available for user {user.email}")
                return False
                
            reset_url = f"{self.frontend_url}/reset-password/{reset_token}"
            logger.info(f"Generating password reset email for {user.email} with URL: {reset_url[:50]}...")
            
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
                        <h2 style="margin-top: 0; color: #1E3A8A; font-size: 20px; font-weight: 700;">Reset Your Password</h2>
                        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
                            <p>Hi {user.first_name or user.email},</p>
                            <p>We received a request to reset your password. Click the button below to create a new password:</p>
                            
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{reset_url}" style="background-color: #1E3A8A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                                    Reset Password
                                </a>
                            </div>
                            
                            <p style="background: #F8FAFC; padding: 12px; border-radius: 6px; font-size: 14px; color: #475569; margin-top: 24px;">
                                <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <p style="color: #64748B; font-size: 13px;">
                            © 2024 Ongoza CyberHub | Mission-Driven Education<br>
                            Bank Row, Cloud Park, OT Valley Districts
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return self._execute_send(
                user.email,
                "Reset your Ongoza CyberHub password",
                html_content,
                "password_reset"
            )
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_application_status_update_notification(student, job, application, old_status: str, new_status: str) -> bool:
        """
        Send notification to student when their application status is updated.
        
        Args:
            student: User object (applicant)
            job: JobPosting object
            application: JobApplication object
            old_status: Previous status
            new_status: New status
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            service = EmailService()
            student_name = student.get_full_name() or student.email
            job_title = job.title
            employer_name = job.employer.company_name if job.employer else 'Employer'
            
            status_labels = {
                'pending': 'Pending Review',
                'reviewing': 'Under Review',
                'shortlisted': 'Shortlisted',
                'interview': 'Interview Scheduled',
                'accepted': 'Accepted',
                'rejected': 'Rejected',
                'withdrawn': 'Withdrawn',
            }
            
            subject = f"Application Status Update: {job_title}"
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #F5A623;">Application Status Update</h2>
                <p>Hello {student_name},</p>
                <p>Your application status for <strong>{job_title}</strong> at <strong>{employer_name}</strong> has been updated.</p>
                <div style="background-color: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Previous Status:</strong> {status_labels.get(old_status, old_status)}</p>
                    <p><strong>New Status:</strong> {status_labels.get(new_status, new_status)}</p>
                </div>
                <p>You can view your application details in your marketplace dashboard.</p>
                <a href="{service.frontend_url}/dashboard/student/marketplace" style="display: inline-block; background-color: #F5A623; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
                    View Application
                </a>
            </div>
            """
            
            return service._execute_send(
                to_email=student.email,
                subject=subject,
                html_content=html_content,
                email_type="transactional"
            )
        except Exception as e:
            logger.error(f"Failed to send application status update notification: {e}")
            return False

    def send_contact_request_notification(self, to_email: str, student_name: str, employer_name: str, profile_url: str) -> bool:
        """
        Send notification email when an employer contacts a student.
        
        Args:
            to_email: Student's email address
            student_name: Student's name
            employer_name: Employer's company name
            profile_url: URL to view contact requests
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
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

                    <div style="background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid #10B981;">
                        <h2 style="margin-top: 0; color: #1E3A8A; font-size: 20px; font-weight: 700;">🎉 New Contact Request!</h2>
                        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
                            <p>Hi {student_name},</p>
                            <p><strong>{employer_name}</strong> has expressed interest in connecting with you through the Marketplace!</p>
                            
                            <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 24px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #065F46; font-weight: 600;">This is a great opportunity to explore potential career opportunities.</p>
                            </div>
                            
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{profile_url}" style="background-color: #10B981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                                    View Contact Request
                                </a>
                            </div>
                            
                            <p style="margin-top: 24px; color: #475569; font-size: 14px;">
                                You can view and manage all contact requests in your Marketplace dashboard.
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                        <p style="color: #64748B; font-size: 13px;">
                            © 2024 Ongoza CyberHub | Mission-Driven Education<br>
                            Bank Row, Cloud Park, OT Valley Districts
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            return self._execute_send(
                to_email,
                f"New contact request from {employer_name}",
                html_content,
                "contact_request"
            )
            
        except Exception as e:
            logger.error(f"Failed to send contact request notification to {to_email}: {str(e)}")
            return False


# Create singleton instance
email_service = EmailService()
