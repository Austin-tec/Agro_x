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
                subject='Welcome to the Waitlist: Transforming Agriculture with Agro X 🌾',
                recipients=[recipient_email],
                html=f"""
                <h2>Dear {first_name},</h2>
                <p>Thank you for registering for the Agro X waitlist. We are pleased to confirm that your spot is secured.</p>

                <p>At Agro X, our mission is to redefine the agricultural supply chain in Nigeria by connecting farmers directly to the marketplace. By removing unnecessary middlemen, we are working to ensure fairer prices for producers and more affordable food costs for consumers.</p>

                <p><strong>What this means for you:</strong></p>
                <ul>
                    <li><strong>Priority Access:</strong> Be the first to use the platform when we go live in your region.</li>
                    <li><strong>Progress Updates:</strong> Receive behind-the-scenes insights as we scale our logistics and infrastructure.</li>
                    <li><strong>Early-Bird Incentives:</strong> Access to special rates and features reserved only for our initial supporters.</li>
                </ul>

                <p>We are currently in the process of scaling our operations to ensure a seamless experience at launch. We will notify you as soon as we are ready to onboard the next phase of users.</p>

                <p>In the meantime, you can follow our journey and see our latest updates on <a href="https://twitter.com">Twitter/X</a> or <a href="https://instagram.com">Instagram</a>.</p>

                <p>Thank you for being a part of this mission to build a more sustainable food ecosystem.</p>

                <p>Best regards,<br>Austin Ifeanyi<br>Founder, Agro X</p>
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

    def send_otp_code(self, recipient_email: str, first_name: str, code: str) -> bool:
        """Send OTP code to new registrants for email verification"""
        try:
            msg = Message(
                subject='Your Agro X Verification Code',
                recipients=[recipient_email],
                html=f"""
                <h2>Welcome to the waitlist, {first_name}!</h2>
                <p>Thank you for registering with Agro X. To complete your account verification, please use the one-time code below:</p>
                <div style=\"background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin: 18px 0; font-size: 1.2rem; letter-spacing: 1px;\">
                    <strong>{code}</strong>
                </div>
                <p>This code will expire in 15 minutes. Once verified, you will be redirected to the waitlist page.</p>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Best regards,<br/>Founder, Agro X</p>
                """
            )
            self.mail.send(msg)
            logger.info(f"OTP email sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending OTP email to {recipient_email}: {str(e)}")
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
