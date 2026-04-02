"""
Email service for sending notifications
"""
from flask_mail import Mail, Message
from typing import List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, app=None):
        self.mail = Mail()
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize mail with Flask app"""
        self.mail.init_app(app)
    
    def send_waitlist_confirmation(self, recipient_email: str, first_name: str, position: int) -> bool:
        """Send waitlist confirmation email to new registrant"""
        try:
            msg = Message(
                subject='Welcome to AgroX Waitlist! 🎉',
                recipients=[recipient_email],
                html=f"""
                <h2>Welcome to AgroX, {first_name}!</h2>
                <p>Thank you for joining our waitlist. We're excited to have you on board!</p>
                
                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Your Waitlist Position: #{position}</strong></p>
                    <p>We're organizing our platform and will be rolling out access soon. You're {position} in line!</p>
                </div>
                
                <p><strong>What to expect:</strong></p>
                <ul>
                    <li>Early access to the AgroX platform</li>
                    <li>Exclusive updates about our launch</li>
                    <li>Special early-adopter benefits</li>
                    <li>Direct feedback channel with our team</li>
                </ul>
                
                <p>We'll keep you updated with regular progress emails. In the meantime, watch your inbox for exciting announcements!</p>
                
                <p><strong>Questions?</strong> Reply to this email or visit our website for more information.</p>
                
                <p>Best regards,<br>The AgroX Team</p>
                """
            )
            self.mail.send(msg)
            logger.info(f"Waitlist confirmation sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending waitlist confirmation to {recipient_email}: {str(e)}")
            return False

    def send_registration_confirmation(self, recipient_email: str, first_name: str) -> bool:
        """Send account registration confirmation email"""
        try:
            msg = Message(
                subject='Welcome to AgroX! Your account is ready',
                recipients=[recipient_email],
                html=f"""
                <h2>Hello {first_name},</h2>
                <p>Welcome to AgroX! Your account has been successfully created.</p>
                <p>Here are your next steps:</p>
                <ul>
                    <li>Log in at <a href=\"http://localhost:8000/signin.html\">https://your-domain.com/signin</a></li>
                    <li>Create your first marketplace listing</li>
                    <li>Start connecting with buyers and sellers</li>
                </ul>
                <p>Thank you for joining AgroX.</p>
                <p>Best regards,<br/>The AgroX Team</p>
                """
            )
            self.mail.send(msg)
            logger.info(f"Registration confirmation sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending registration confirmation to {recipient_email}: {str(e)}")
            return False
    
    def send_new_user_notification(self, existing_waitlist: List[dict], new_user_name: str, new_user_email: str) -> int:
        """Send notification to existing waitlist users about new registration"""
        sent_count = 0
        try:
            for user in existing_waitlist:
                # Skip if they don't have newsletter enabled or if they're the new user
                if not user.get('newsletter') or user.get('email') == new_user_email:
                    continue
                
                try:
                    msg = Message(
                        subject=f'New AgroX Member Joined - {new_user_name} is Here! 👋',
                        recipients=[user.get('email')],
                        html=f"""
                        <h2>Community Update</h2>
                        <p>Hello {user.get('first_name', 'Friend')}!</p>
                        
                        <p>Great news! <strong>{new_user_name}</strong> just joined the AgroX waitlist!</p>
                        
                        <p>Our community is growing! The more farmers and agro-businesses join, the stronger our platform becomes.</p>
                        
                        <p>We're preparing something special. Stay tuned!</p>
                        
                        <p>The AgroX Team</p>
                        """
                    )
                    self.mail.send(msg)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send notification to {user.get('email')}: {str(e)}")
                    continue
            
            logger.info(f"Sent new user notifications to {sent_count} users")
            return sent_count
        except Exception as e:
            logger.error(f"Error in send_new_user_notification: {str(e)}")
            return 0
    
    def send_launch_announcement(self, recipient_emails: List[str]) -> int:
        """Send launch announcement to all waitlist users"""
        sent_count = 0
        try:
            for email in recipient_emails:
                try:
                    msg = Message(
                        subject='🚀 AgroX Has Launched! Your Access Awaits',
                        recipients=[email],
                        html="""
                        <h1 style="color: #4caf50;">🚀 We're Live!</h1>
                        <p>Dear Waitlist Member,</p>
                        
                        <p>We're thrilled to announce that <strong>AgroX is officially launched!</strong></p>
                        
                        <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
                            <p><strong>Your access is ready. Click below to log in:</strong></p>
                            <a href="http://localhost:5000/login" style="display: inline-block; background-color: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                                Access AgroX Now
                            </a>
                        </div>
                        
                        <p><strong>What's included:</strong></p>
                        <ul>
                            <li>Full marketplace access</li>
                            <li>Direct messaging with buyers/sellers</li>
                            <li>Analytics dashboard</li>
                            <li>Early access to premium features</li>
                        </ul>
                        
                        <p>Thank you for being part of our journey from the beginning!</p>
                        
                        <p>The AgroX Team</p>
                        """
                    )
                    self.mail.send(msg)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send launch announcement to {email}: {str(e)}")
                    continue
            
            logger.info(f"Sent launch announcements to {sent_count} users")
            return sent_count
        except Exception as e:
            logger.error(f"Error in send_launch_announcement: {str(e)}")
            return 0

# Initialize email service
email_service = EmailService()
