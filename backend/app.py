"""
Flask backend for AgroX application
Main application with waitlist and user management
"""
import os
import sys
from flask import Flask, request, jsonify, render_template, abort, redirect, send_from_directory, url_for, session
from authlib.integrations.requests_client import OAuth2Session
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from email_validator import validate_email, EmailNotValidError
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from datetime import datetime, timedelta
import logging
import json
import secrets

# Ensure backend package imports work when running this file directly
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.config import config
from backend.models import db, Waitlist, User, EmailOTP, LaunchSettings, Listing, Order, OrderItem, Cart, CartItem, Review
from backend.email_service import email_service
from backend.supabase_client import init_supabase, get_supabase_client
from jinja2 import TemplateNotFound

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_sqlite_uri(uri: str) -> bool:
    return bool(uri and uri.strip().startswith('sqlite:'))


def build_engine_options(db_uri: str):
    if is_sqlite_uri(db_uri):
        return {
            'pool_pre_ping': True,
            'connect_args': {
                'check_same_thread': False
            }
        }

    return {
        'pool_pre_ping': True,
        'pool_size': int(os.getenv('DB_POOL_SIZE', 5)),
        'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 10)),
        'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', 30)),
        'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 1800)),
        'connect_args': {
            'sslmode': os.getenv('DB_SSLMODE', 'require')
        }
    }


def database_is_available(db_uri: str) -> bool:
    if is_sqlite_uri(db_uri):
        return True

    try:
        engine = create_engine(db_uri, pool_pre_ping=True, connect_args={'sslmode': os.getenv('DB_SSLMODE', 'require')})
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        engine.dispose()
        return True
    except Exception as e:
        logger.warning(f"Remote DB unavailable during startup: {e}")
        return False


def configure_database(app):
    requested_uri = os.getenv('DATABASE_URL', app.config.get('SQLALCHEMY_DATABASE_URI'))
    fallback_uri = os.getenv('LOCAL_SQLITE_DATABASE_URI', 'sqlite:///agrox.db')

    if requested_uri and not is_sqlite_uri(requested_uri):
        if database_is_available(requested_uri):
            app.config['SQLALCHEMY_DATABASE_URI'] = requested_uri
            app.config['DB_FALLBACK_ACTIVE'] = False
        else:
            app.logger.warning('Remote database unreachable, falling back to local SQLite DB: %s', fallback_uri)
            app.config['SQLALCHEMY_DATABASE_URI'] = fallback_uri
            app.config['DB_FALLBACK_ACTIVE'] = True
            app.config['DB_FALLBACK_REASON'] = 'remote_db_unavailable'
    else:
        app.config['DB_FALLBACK_ACTIVE'] = False

    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = build_engine_options(app.config['SQLALCHEMY_DATABASE_URI'])


def create_app(config_name='development'):
    """Application factory"""
    app = Flask(__name__, 
        template_folder=os.path.join(os.path.dirname(__file__), '..', 'agrox', 'Template'),
        static_folder=None,
        static_url_path=None
    )
    
    # Static asset directories for frontend
    css_dir = os.path.join(os.path.dirname(__file__), '..', 'css')
    js_dir = os.path.join(os.path.dirname(__file__), '..', 'js')

    @app.route('/css/<path:filename>')
    def get_css(filename):
        return send_from_directory(css_dir, filename)

    @app.route('/js/<path:filename>')
    def get_js(filename):
        return send_from_directory(js_dir, filename)

    # Load configuration
    app.config.from_object(config[config_name])
    configure_database(app)

    # Initialize Supabase when enabled
    if app.config.get('USE_SUPABASE'):
        init_supabase()
    
    # Initialize extensions
    db.init_app(app)
    email_service.init_app(app)
    jwt = JWTManager(app)
    CORS(app, origins="*", supports_credentials=True)

    def is_google_oauth_configured():
        return bool(os.getenv('GOOGLE_CLIENT_ID') and os.getenv('GOOGLE_CLIENT_SECRET'))

    def get_google_oauth_session(redirect_uri=None, state=None):
        return OAuth2Session(
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            scope='openid email profile',
            redirect_uri=redirect_uri,
            state=state
        )

    def generate_otp_code(length=6):
        return ''.join(secrets.choice('0123456789') for _ in range(length))

    def create_otp_record(email: str, code: str):
        expires_at = datetime.utcnow() + timedelta(minutes=15)
        otp = EmailOTP(email=email, code=code, expires_at=expires_at)
        db.session.add(otp)
        db.session.commit()
        return otp

    def get_optional_jwt_identity():
        try:
            verify_jwt_in_request(optional=True)
            return get_jwt_identity()
        except Exception:
            return None
    
    # Create tables and initialize launch settings when the DB is available.
    with app.app_context():
        try:
            db.create_all()
            env_allow_registration = os.getenv('ALLOW_REGISTRATION')
            allow_registration = env_allow_registration.lower() in ('1', 'true', 'yes', 'y') if env_allow_registration is not None else True

            # Initialize launch settings if not exists
            if LaunchSettings.query.first() is None:
                # Use environment variable to control registration on first deploy.
                # By default, allow registration so Render deployments do not stay locked in waitlist-only mode.
                launch_settings = LaunchSettings(
                    is_launched=False,
                    allow_registration=allow_registration
                )
                db.session.add(launch_settings)
                db.session.commit()
            else:
                # If an explicit env var is provided, use it to update the current setting.
                if env_allow_registration is not None:
                    launch_settings = LaunchSettings.query.first()
                    launch_settings.allow_registration = allow_registration
                    db.session.commit()
        except OperationalError as e:
            logger.error(f"Database unavailable during startup: {str(e)}")
            try:
                db.session.rollback()
            except Exception:
                pass
            try:
                db.session.remove()
            except Exception:
                pass
            try:
                db.engine.dispose()
            except Exception:
                pass
            logger.error("Continuing startup with database unavailable. API routes will return 503 until Neon recovers.")
    
    @app.route('/api/auth/google/login')
    def google_login():
        if not is_google_oauth_configured():
            return jsonify({'error': 'Google OAuth is not configured.'}), 503

        redirect_uri = url_for('google_auth_callback', _external=True)
        oauth2 = get_google_oauth_session(redirect_uri=redirect_uri)
        authorization_url, state = oauth2.create_authorization_url(
            'https://accounts.google.com/o/oauth2/v2/auth',
            access_type='offline',
            prompt='select_account'
        )
        session['google_oauth_state'] = state
        return redirect(authorization_url)

    @app.route('/api/auth/google/callback')
    def google_auth_callback():
        if not is_google_oauth_configured():
            return jsonify({'error': 'Google OAuth is not configured.'}), 503

        try:
            redirect_uri = url_for('google_auth_callback', _external=True)
            oauth2 = get_google_oauth_session(redirect_uri=redirect_uri, state=session.get('google_oauth_state'))
            token = oauth2.fetch_token(
                'https://oauth2.googleapis.com/token',
                authorization_response=request.url,
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
            )
            user_info = oauth2.get('https://openidconnect.googleapis.com/v1/userinfo').json()

            if not user_info or not user_info.get('email'):
                return jsonify({'error': 'Unable to retrieve Google account email.'}), 400

            email = user_info.get('email', '').strip().lower()
            if not email:
                return jsonify({'error': 'Invalid Google account email.'}), 400

            profile_name = (user_info.get('name') or '').strip()
            split_name = profile_name.split() if profile_name else []
            first_name = user_info.get('given_name') or (split_name[0] if split_name else 'User')
            last_name = user_info.get('family_name') or (' '.join(split_name[1:]) if len(split_name) > 1 else '')

            waitlist_entry = Waitlist.query.filter_by(email=email).first()
            user = User.query.filter_by(email=email).first()
            launch_settings = LaunchSettings.query.first()
            allow_reg = launch_settings.allow_registration if launch_settings else True

            if not user and not allow_reg:
                if waitlist_entry is None:
                    last_waitlist = Waitlist.query.order_by(Waitlist.position.desc()).first()
                    next_position = (last_waitlist.position + 1) if last_waitlist else 1
                    waitlist_entry = Waitlist(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        phone=user_info.get('phone') or '',
                        user_type='buyer',
                        location='',
                        business_name='',
                        farm_size='',
                        newsletter=True,
                        position=next_position,
                        status='pending'
                    )
                    db.session.add(waitlist_entry)
                    db.session.commit()

                    email_service.send_waitlist_confirmation(
                        email,
                        first_name or 'Friend',
                        next_position
                    )

                user_payload = {
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'waitlist_status': 'pending',
                    'waitlist_position': waitlist_entry.position
                }

                return render_template(
                    'oauth-callback.html',
                    status='waitlist',
                    redirect_url='/waitlist.html',
                    token='',
                    user=user_payload,
                    message=f'Your account is on the waitlist at position {waitlist_entry.position}.'
                )

            if not user:
                user = User(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    user_type='buyer',
                    location='',
                    business_name='',
                    farm_size='',
                    newsletter=True,
                    is_active=True
                )
                user.set_password(secrets.token_urlsafe(24))
                db.session.add(user)
                db.session.commit()

                if waitlist_entry:
                    waitlist_entry.status = 'registered'
                    db.session.commit()

                email_service.send_registration_confirmation(
                    email,
                    first_name or email
                )

            if not user.is_active:
                user.is_active = True
                db.session.commit()

            access_token = create_access_token(identity=user.id)
            return render_template(
                'oauth-callback.html',
                status='authenticated',
                redirect_url='/waitlist.html',
                token=access_token,
                user=user.to_dict(),
                message='Google sign-in successful. Redirecting to your dashboard.'
            )
        except Exception as e:
            logger.error(f"Google OAuth callback error: {str(e)}")
            return jsonify({'error': 'Google authentication failed.'}), 500

    # ==================== WAITLIST ROUTES ====================
    
    @app.route('/api/waitlist/register', methods=['POST'])
    def register_waitlist():
        """Register a user to the waitlist"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            email = data.get('email', '').strip().lower()
            
            # Validate email
            if not email:
                return jsonify({'error': 'Email is required'}), 400
            
            try:
                validate_email(email)
            except EmailNotValidError as e:
                return jsonify({'error': f'Invalid email: {str(e)}'}), 400
            
            # Check if already in waitlist
            existing_waitlist = Waitlist.query.filter_by(email=email).first()
            if existing_waitlist:
                return jsonify({
                    'error': 'Email already in waitlist',
                    'position': existing_waitlist.position,
                    'status': existing_waitlist.status
                }), 409
            
            # Note: We allow registered users to also join the waitlist
            # existing_user = User.query.filter_by(email=email).first()
            # if existing_user:
            #     return jsonify({'error': 'Email already registered'}), 409
            
            # Get next position in waitlist
            last_waitlist = Waitlist.query.order_by(Waitlist.position.desc()).first()
            next_position = (last_waitlist.position + 1) if last_waitlist else 1
            
            # Create waitlist entry
            waitlist_entry = Waitlist(
                email=email,
                first_name=data.get('first_name', data.get('name', '')).split()[0] if data.get('first_name') or data.get('name') else '',
                last_name=data.get('last_name', ' '.join(data.get('name', '').split()[1:]) if data.get('name') else ''),
                phone=data.get('phone', ''),
                user_type=data.get('user_type', 'buyer'),
                location=data.get('location', ''),
                business_name=data.get('business_name', ''),
                farm_size=data.get('farm_size', ''),
                newsletter=data.get('newsletter', True),
                position=next_position,
                status='pending'
            )
            
            db.session.add(waitlist_entry)
            db.session.commit()
            
            # Send confirmation email
            email_service.send_waitlist_confirmation(
                email,
                waitlist_entry.first_name or 'Friend',
                next_position
            )
            
            # Notify existing waitlist members (optional - only if newsletter enabled)
            existing_waitlist_users = Waitlist.query.filter(
                Waitlist.id != waitlist_entry.id,
                Waitlist.newsletter == True
            ).all()
            
            if existing_waitlist_users:
                email_service.send_new_user_notification(
                    [u.to_dict() for u in existing_waitlist_users],
                    waitlist_entry.first_name or email,
                    email
                )
            
            return jsonify({
                'message': 'Successfully added to waitlist',
                'position': next_position,
                'status': 'pending',
                'email': email
            }), 201
        except Exception as e:
            logger.error(f"Error in register_waitlist: {str(e)}")
            return jsonify({'error': 'Server error: ' + str(e)}), 500

    @app.route('/api/waitlist/send-confirmation', methods=['POST'])
    def send_waitlist_confirmation_email():
        """Send a waitlist confirmation email on demand"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            email = data.get('email', '').strip().lower()
            if not email:
                return jsonify({'error': 'Email is required'}), 400

            try:
                validate_email(email)
            except EmailNotValidError as e:
                return jsonify({'error': f'Invalid email: {str(e)}'}), 400

            waitlist_entry = Waitlist.query.filter_by(email=email).first()
            if not waitlist_entry:
                return jsonify({'error': 'Waitlist entry not found'}), 404

            first_name = data.get('first_name') or waitlist_entry.first_name or email.split('@')[0]
            if email_service.send_waitlist_confirmation(email, first_name, waitlist_entry.position):
                return jsonify({'message': 'Confirmation email sent'}), 200

            return jsonify({'error': 'Failed to send confirmation email'}), 500
        except Exception as e:
            logger.error(f"Error in send_waitlist_confirmation_email: {str(e)}")
            return jsonify({'error': 'Server error'}), 500

    @app.route('/api/waitlist/check/<email>', methods=['GET'])
    def check_waitlist_status(email):
        """Check if email is in waitlist and get position"""
        try:
            email = email.strip().lower()
            
            waitlist_entry = Waitlist.query.filter_by(email=email).first()
            
            if not waitlist_entry:
                return jsonify({'in_waitlist': False}), 404
            
            return jsonify({
                'in_waitlist': True,
                'position': waitlist_entry.position,
                'status': waitlist_entry.status,
                'total_ahead': Waitlist.query.filter(Waitlist.position < waitlist_entry.position).count(),
                'total_in_waitlist': Waitlist.query.count(),
                'created_at': waitlist_entry.created_at.isoformat()
            }), 200
            
        except OperationalError as e:
            logger.error(f"Database operational error checking waitlist: {str(e)}")
            try:
                db.session.rollback()
            except Exception:
                pass
            try:
                db.session.remove()
            except Exception:
                pass
            try:
                db.engine.dispose()
            except Exception:
                pass
            return jsonify({'error': 'Database unavailable. Please try again shortly.'}), 503
        except Exception as e:
            logger.error(f"Error checking waitlist: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/waitlist/stats', methods=['GET'])
    def get_waitlist_stats():
        """Get overall waitlist statistics"""
        try:
            total_waitlist = Waitlist.query.count()
            pending = Waitlist.query.filter_by(status='pending').count()
            approved = Waitlist.query.filter_by(status='approved').count()
            registered = Waitlist.query.filter_by(status='registered').count()
            
            user_type_breakdown = db.session.query(
                Waitlist.user_type,
                db.func.count(Waitlist.id)
            ).group_by(Waitlist.user_type).all()
            
            return jsonify({
                'total_waitlist': total_waitlist,
                'pending': pending,
                'approved': approved,
                'registered': registered,
                'user_type_breakdown': {
                    user_type: count for user_type, count in user_type_breakdown
                }
            }), 200
            
        except OperationalError as e:
            logger.error(f"Database operational error getting waitlist stats: {str(e)}")
            try:
                db.session.rollback()
            except Exception:
                pass
            try:
                db.session.remove()
            except Exception:
                pass
            try:
                db.engine.dispose()
            except Exception:
                pass
            return jsonify({'error': 'Database unavailable. Please try again shortly.'}), 503
        except Exception as e:
            logger.error(f"Error getting waitlist stats: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    # ==================== AUTHENTICATION ROUTES ====================
    
    @app.route('/api/auth/register', methods=['POST'])
    def register_user():
        """Register a user. If registration is gated, add to waitlist."""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Prevent registration while already authenticated
            current_user_id = get_optional_jwt_identity()
            if current_user_id:
                return jsonify({'error': 'Already logged in. Please log out before registering a new account.'}), 403

            # Validate required fields
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            user_type = data.get('user_type', 'buyer')
            
            if not all([email, password, first_name, last_name]):
                return jsonify({'error': 'Missing required fields'}), 400

            # Ensure no duplicate active user
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.is_active:
                return jsonify({'error': 'Email already registered'}), 409

            # Waitlist registration if not allowed
            launch_settings = LaunchSettings.query.first()
            allow_reg = launch_settings.allow_registration if launch_settings else True

            if not allow_reg:
                existing_waitlist = Waitlist.query.filter_by(email=email).first()
                if existing_waitlist:
                    return jsonify({'error': 'Email already on waitlist', 'position': existing_waitlist.position, 'status': existing_waitlist.status}), 409

                last_waitlist = Waitlist.query.order_by(Waitlist.position.desc()).first()
                next_position = (last_waitlist.position + 1) if last_waitlist else 1

                waitlist_entry = Waitlist(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=data.get('phone', ''),
                    user_type=user_type,
                    location=data.get('location', ''),
                    business_name=data.get('business_name', ''),
                    farm_size=data.get('farm_size', ''),
                    newsletter=data.get('newsletter', True),
                    position=next_position,
                    status='pending'
                )
                db.session.add(waitlist_entry)
                db.session.commit()

                email_service.send_waitlist_confirmation(
                    email,
                    first_name or 'Friend',
                    next_position
                )

                return jsonify({
                    'message': 'Registration is currently on waitlist',
                    'position': next_position,
                    'status': 'pending'
                }), 202
            
            # Validate email
            try:
                validate_email(email)
            except EmailNotValidError as e:
                return jsonify({'error': f'Invalid email: {str(e)}'}), 400
            
            # Continue normal registration when allowed
            # Check password strength
            if len(password) < 8:
                return jsonify({'error': 'Password must be at least 8 characters'}), 400
            
            if not any(c.isupper() for c in password):
                return jsonify({'error': 'Password must contain at least one uppercase letter'}), 400
            
            if not any(c.isdigit() for c in password):
                return jsonify({'error': 'Password must contain at least one digit'}), 400
            
            # Use Supabase auth if configured
            if app.config.get('USE_SUPABASE'):
                supabase_client = get_supabase_client()

                user_metadata = {
                    'first_name': first_name,
                    'last_name': last_name,
                    'user_type': user_type,
                    'phone': data.get('phone', ''),
                    'location': data.get('location', ''),
                    'business_name': data.get('business_name', ''),
                    'farm_size': data.get('farm_size', ''),
                    'newsletter': data.get('newsletter', True)
                }

                create_response = None
                if os.getenv('SUPABASE_SERVICE_ROLE_KEY'):
                    create_response = supabase_client.auth.admin.create_user({
                        'email': email,
                        'password': password,
                        'email_confirm': True,
                        'user_metadata': user_metadata
                    })
                else:
                    create_response = supabase_client.auth.sign_up({
                        'email': email,
                        'password': password,
                        'options': {
                            'data': user_metadata
                        }
                    })

                if getattr(create_response, 'error', None):
                    return jsonify({'error': str(create_response.error)}), 400

                login_response = supabase_client.auth.sign_in_with_password({
                    'email': email,
                    'password': password
                })

                if getattr(login_response, 'error', None):
                    return jsonify({'error': str(login_response.error)}), 400

                login_data = getattr(login_response, 'data', {}) or {}
                session_data = login_data.get('session') or {}
                user_data = login_data.get('user') or {}
                access_token = session_data.get('access_token') or login_data.get('access_token')

                email_service.send_registration_confirmation(
                    email,
                    first_name or email
                )

                return jsonify({
                    'message': 'Registration successful',
                    'token': access_token,
                    'user': user_data,
                    'waitlist_position': None
                }), 201

            # Local registration when Supabase is not enabled
            if existing_user and not existing_user.is_active:
                existing_user.first_name = first_name
                existing_user.last_name = last_name
                existing_user.phone = data.get('phone', '')
                existing_user.user_type = user_type
                existing_user.location = data.get('location', '')
                existing_user.business_name = data.get('business_name', '')
                existing_user.farm_size = data.get('farm_size', '')
                existing_user.newsletter = data.get('newsletter', True)
                existing_user.set_password(password)
                db.session.commit()

                code = generate_otp_code()
                create_otp_record(email, code)
                email_service.send_otp_code(
                    email,
                    first_name or email,
                    code
                )

                return jsonify({
                    'message': 'Verification code sent. Please check your email to complete registration.',
                    'requires_verification': True,
                    'email': email
                }), 202

            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=data.get('phone', ''),
                user_type=user_type,
                location=data.get('location', ''),
                business_name=data.get('business_name', ''),
                farm_size=data.get('farm_size', ''),
                newsletter=data.get('newsletter', True),
                is_active=False
            )
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()

            code = generate_otp_code()
            create_otp_record(email, code)
            email_service.send_otp_code(
                email,
                first_name or email,
                code
            )

            return jsonify({
                'message': 'Verification code sent. Please check your email to complete registration.',
                'requires_verification': True,
                'email': email
            }), 202
            
        except Exception as e:
            logger.error(f"Error in register_user: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error: ' + str(e)}), 500
    
    @app.route('/api/auth/verify-otp', methods=['POST'])
    def verify_otp():
        """Verify user registration OTP code"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            email = data.get('email', '').strip().lower()
            code = data.get('code', '').strip()

            if not email or not code:
                return jsonify({'error': 'Email and verification code are required'}), 400

            otp_record = EmailOTP.query.filter_by(email=email, code=code, used=False).order_by(EmailOTP.created_at.desc()).first()
            if not otp_record:
                return jsonify({'error': 'Invalid or expired verification code'}), 400

            if otp_record.expires_at < datetime.utcnow():
                return jsonify({'error': 'Verification code expired'}), 400

            user = User.query.filter_by(email=email).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404

            if user.is_active:
                return jsonify({'error': 'Account already verified'}), 400

            user.is_active = True
            otp_record.used = True

            waitlist_entry = Waitlist.query.filter_by(email=email).first()
            if waitlist_entry:
                waitlist_entry.status = 'registered'

            db.session.commit()

            access_token = create_access_token(identity=user.id)
            return jsonify({
                'message': 'Verification successful',
                'token': access_token,
                'user': user.to_dict()
            }), 200
        except Exception as e:
            logger.error(f"Error in verify_otp: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Login user"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            
            # Use Supabase auth when enabled
            if app.config.get('USE_SUPABASE'):
                supabase_client = get_supabase_client()

                login_response = supabase_client.auth.sign_in_with_password({
                    'email': email,
                    'password': password
                })

                # Debug: print response structure
                logger.info(f"Supabase login response: {login_response}")
                logger.info(f"Response type: {type(login_response)}")
                if hasattr(login_response, '__dict__'):
                    logger.info(f"Response dict: {login_response.__dict__}")

                if getattr(login_response, 'error', None):
                    return jsonify({'error': str(login_response.error)}), 401

                login_data = getattr(login_response, 'data', {}) or {}
                session_data = login_data.get('session') or {}
                user_data = login_data.get('user') or {}
                access_token = session_data.get('access_token') or login_data.get('access_token')

                return jsonify({
                    'message': 'Login successful',
                    'token': access_token,
                    'user': user_data
                }), 200

            # Find user
            user = User.query.filter_by(email=email).first()
            
            if not user:
                waitlist_entry = Waitlist.query.filter_by(email=email).first()
                if waitlist_entry:
                    if waitlist_entry.status == 'approved':
                        return jsonify({'error': 'Your waitlist is approved. Please complete registration.', 'status': 'approved'}), 403
                    return jsonify({'error': 'Still on waitlist', 'position': waitlist_entry.position, 'status': 'pending'}), 403
                return jsonify({'error': 'Invalid email or password'}), 401
            
            if not user.check_password(password):
                return jsonify({'error': 'Invalid email or password'}), 401
            
            if not user.is_active:
                return jsonify({'error': 'Account is inactive'}), 403
            
            # Create JWT token
            access_token = create_access_token(identity=user.id)
            
            return jsonify({
                'message': 'Login successful',
                'token': access_token,
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error in login: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/auth/me', methods=['GET'])
    @jwt_required()
    def get_current_user():
        """Get current logged-in user"""
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify(user.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    # ==================== ADMIN ROUTES ====================
    
    @app.route('/api/admin/launch-settings', methods=['GET'])
    def get_launch_settings():
        """Get current launch settings"""
        try:
            settings = LaunchSettings.query.first()
            if not settings:
                return jsonify({'error': 'Settings not found'}), 404
            
            return jsonify(settings.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error getting launch settings: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/admin/launch-settings', methods=['PUT'])
    def update_launch_settings():
        """Update launch settings (set is_launched to True and allow registrations)"""
        try:
            # In production, add authentication check here
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            settings = LaunchSettings.query.first()
            if not settings:
                return jsonify({'error': 'Settings not found'}), 404
            
            # Update settings
            if 'is_launched' in data:
                settings.is_launched = data['is_launched']
            
            if 'allow_registration' in data:
                settings.allow_registration = data['allow_registration']
            
            if 'launch_date' in data:
                settings.launch_date = datetime.fromisoformat(data['launch_date'])
            
            db.session.commit()
            
            # If launching, send announcement emails
            if settings.is_launched and data.get('send_announcement', False):
                waitlist_emails = [w.email for w in Waitlist.query.all()]
                email_service.send_launch_announcement(waitlist_emails)
            
            return jsonify({
                'message': 'Launch settings updated',
                'settings': settings.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error updating launch settings: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/admin/waitlist', methods=['GET'])
    def get_all_waitlist():
        """Get all waitlist entries (admin only)"""
        try:
            # In production, add authentication and authorization check here
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            
            waitlist = Waitlist.query.order_by(Waitlist.position).paginate(
                page=page,
                per_page=per_page
            )
            
            return jsonify({
                'total': waitlist.total,
                'pages': waitlist.pages,
                'current_page': page,
                'data': [entry.to_dict() for entry in waitlist.items]
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting all waitlist: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/admin/waitlist/<int:waitlist_id>/approve', methods=['PUT'])
    def approve_waitlist_user(waitlist_id):
        """Approve a waitlist user for early access"""
        try:
            # In production, add authentication check here
            waitlist_entry = Waitlist.query.get(waitlist_id)
            
            if not waitlist_entry:
                return jsonify({'error': 'Waitlist entry not found'}), 404
            
            waitlist_entry.status = 'approved'
            db.session.commit()
            
            # Optionally send approval email
            return jsonify({
                'message': 'User approved for early access',
                'waitlist_entry': waitlist_entry.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error approving waitlist user: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/admin/send-launch-announcement', methods=['POST'])
    def send_launch_announcement_route():
        """Send launch announcement to all waitlist users"""
        try:
            # In production, add authentication check here
            waitlist_users = Waitlist.query.filter_by(newsletter=True).all()
            emails = [user.email for user in waitlist_users]
            
            sent_count = email_service.send_launch_announcement(emails)
            
            return jsonify({
                'message': f'Launch announcement sent to {sent_count} users',
                'sent_count': sent_count
            }), 200
            
        except Exception as e:
            logger.error(f"Error sending launch announcement: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    # ==================== MARKETPLACE ROUTES ====================
    
    @app.route('/api/listings', methods=['GET'])
    def get_listings():
        """Get all active listings with optional filters"""
        try:
            # Get query parameters
            category = request.args.get('category')
            location = request.args.get('location')
            min_price = request.args.get('min_price', type=float)
            max_price = request.args.get('max_price', type=float)
            search = request.args.get('search')
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            
            # Build query
            query = Listing.query.filter_by(is_active=True)
            
            if category:
                query = query.filter_by(category=category)
            if location:
                query = query.filter(Listing.location.ilike(f'%{location}%'))
            if min_price is not None:
                query = query.filter(Listing.price >= min_price)
            if max_price is not None:
                query = query.filter(Listing.price <= max_price)
            if search:
                query = query.filter(
                    db.or_(
                        Listing.title.ilike(f'%{search}%'),
                        Listing.description.ilike(f'%{search}%')
                    )
                )
            
            # Paginate
            listings = query.order_by(Listing.created_at.desc()).paginate(
                page=page, per_page=per_page
            )
            
            return jsonify({
                'listings': [listing.to_dict() for listing in listings.items],
                'total': listings.total,
                'pages': listings.pages,
                'current_page': page
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting listings: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/listings/<int:listing_id>', methods=['GET'])
    def get_listing(listing_id):
        """Get a specific listing"""
        try:
            listing = Listing.query.filter_by(id=listing_id, is_active=True).first()
            
            if not listing:
                return jsonify({'error': 'Listing not found'}), 404
            
            return jsonify(listing.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error getting listing {listing_id}: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/listings', methods=['POST'])
    @jwt_required()
    def create_listing():
        """Create a new listing"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Validate required fields
            required_fields = ['title', 'description', 'price', 'price_unit', 'quantity', 'unit', 'category', 'location', 'availability']
            if not all(field in data for field in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            
            # Create listing
            listing = Listing(
                title=data['title'],
                description=data['description'],
                price=data['price'],
                price_unit=data['price_unit'],
                quantity=data['quantity'],
                unit=data['unit'],
                category=data['category'],
                location=data['location'],
                availability=data['availability'],
                seller_id=user_id
            )
            
            if 'harvest_date' in data and data['harvest_date']:
                listing.harvest_date = datetime.fromisoformat(data['harvest_date'])
            
            if 'certifications' in data:
                listing.certifications = json.dumps(data['certifications'])
            
            db.session.add(listing)
            db.session.commit()
            
            return jsonify({
                'message': 'Listing created successfully',
                'listing': listing.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating listing: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/listings/<int:listing_id>', methods=['PUT'])
    @jwt_required()
    def update_listing(listing_id):
        """Update a listing (only by seller)"""
        try:
            user_id = get_jwt_identity()
            listing = Listing.query.filter_by(id=listing_id, seller_id=user_id).first()
            
            if not listing:
                return jsonify({'error': 'Listing not found or not authorized'}), 404
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Update fields
            for field in ['title', 'description', 'price', 'price_unit', 'quantity', 'unit', 'category', 'location', 'availability']:
                if field in data:
                    setattr(listing, field, data[field])
            
            if 'harvest_date' in data:
                if data['harvest_date']:
                    listing.harvest_date = datetime.fromisoformat(data['harvest_date'])
                else:
                    listing.harvest_date = None
            
            if 'certifications' in data:
                listing.certifications = json.dumps(data['certifications']) if data['certifications'] else None
            
            if 'is_active' in data:
                listing.is_active = data['is_active']
            
            db.session.commit()
            
            return jsonify({
                'message': 'Listing updated successfully',
                'listing': listing.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error updating listing {listing_id}: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/listings/<int:listing_id>', methods=['DELETE'])
    @jwt_required()
    def delete_listing(listing_id):
        """Delete a listing (only by seller)"""
        try:
            user_id = get_jwt_identity()
            listing = Listing.query.filter_by(id=listing_id, seller_id=user_id).first()
            
            if not listing:
                return jsonify({'error': 'Listing not found or not authorized'}), 404
            
            listing.is_active = False  # Soft delete
            db.session.commit()
            
            return jsonify({'message': 'Listing deleted successfully'}), 200
            
        except Exception as e:
            logger.error(f"Error deleting listing {listing_id}: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/cart', methods=['GET'])
    @jwt_required()
    def get_cart():
        """Get user's cart"""
        try:
            user_id = get_jwt_identity()
            cart = Cart.query.filter_by(user_id=user_id).first()
            
            if not cart:
                # Create empty cart if doesn't exist
                cart = Cart(user_id=user_id)
                db.session.add(cart)
                db.session.commit()
            
            return jsonify(cart.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error getting cart: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/cart', methods=['POST'])
    @jwt_required()
    def add_to_cart():
        """Add item to cart"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            if not data or 'listing_id' not in data or 'quantity' not in data:
                return jsonify({'error': 'Missing listing_id or quantity'}), 400
            
            # Get or create cart
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart:
                cart = Cart(user_id=user_id)
                db.session.add(cart)
                db.session.commit()
            
            # Check if item already in cart
            cart_item = CartItem.query.filter_by(cart_id=cart.id, listing_id=data['listing_id']).first()
            
            if cart_item:
                cart_item.quantity += data['quantity']
            else:
                cart_item = CartItem(
                    cart_id=cart.id,
                    listing_id=data['listing_id'],
                    quantity=data['quantity']
                )
                db.session.add(cart_item)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Item added to cart',
                'cart': cart.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error adding to cart: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/cart/<int:item_id>', methods=['DELETE'])
    @jwt_required()
    def remove_from_cart(item_id):
        """Remove item from cart"""
        try:
            user_id = get_jwt_identity()
            cart = Cart.query.filter_by(user_id=user_id).first()
            
            if not cart:
                return jsonify({'error': 'Cart not found'}), 404
            
            cart_item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
            
            if not cart_item:
                return jsonify({'error': 'Item not found in cart'}), 404
            
            db.session.delete(cart_item)
            db.session.commit()
            
            return jsonify({
                'message': 'Item removed from cart',
                'cart': cart.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error removing from cart: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/orders', methods=['POST'])
    @jwt_required()
    def create_order():
        """Create order from cart"""
        try:
            user_id = get_jwt_identity()
            cart = Cart.query.filter_by(user_id=user_id).first()
            
            if not cart or not cart.items:
                return jsonify({'error': 'Cart is empty'}), 400
            
            # Calculate total
            total_amount = 0
            order_items = []
            
            for cart_item in cart.items:
                if not cart_item.listing or not cart_item.listing.is_active:
                    continue
                
                item_total = cart_item.quantity * cart_item.listing.price
                total_amount += item_total
                
                order_items.append({
                    'listing_id': cart_item.listing_id,
                    'quantity': cart_item.quantity,
                    'price': cart_item.listing.price
                })
            
            if total_amount == 0:
                return jsonify({'error': 'No valid items in cart'}), 400
            
            # Create order
            order = Order(
                buyer_id=user_id,
                total_amount=total_amount
            )
            db.session.add(order)
            db.session.flush()  # Get order ID
            
            # Create order items
            for item_data in order_items:
                order_item = OrderItem(
                    order_id=order.id,
                    listing_id=item_data['listing_id'],
                    quantity=item_data['quantity'],
                    price=item_data['price']
                )
                db.session.add(order_item)
            
            # Clear cart
            for cart_item in cart.items:
                db.session.delete(cart_item)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Order created successfully',
                'order': order.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/orders', methods=['GET'])
    @jwt_required()
    def get_orders():
        """Get user's orders"""
        try:
            user_id = get_jwt_identity()
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            
            orders = Order.query.filter_by(buyer_id=user_id).order_by(Order.created_at.desc()).paginate(
                page=page, per_page=per_page
            )
            
            return jsonify({
                'orders': [order.to_dict() for order in orders.items],
                'total': orders.total,
                'pages': orders.pages,
                'current_page': page
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting orders: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/reviews', methods=['POST'])
    @jwt_required()
    def create_review():
        """Create a review for a listing"""
        try:
            user_id = get_jwt_identity()
            data = request.get_json()
            
            if not data or 'listing_id' not in data or 'rating' not in data:
                return jsonify({'error': 'Missing listing_id or rating'}), 400
            
            # Check if user has purchased this listing
            has_purchased = db.session.query(OrderItem).join(Order).filter(
                Order.buyer_id == user_id,
                OrderItem.listing_id == data['listing_id']
            ).first() is not None
            
            if not has_purchased:
                return jsonify({'error': 'You can only review products you have purchased'}), 403
            
            # Check if review already exists
            existing_review = Review.query.filter_by(
                listing_id=data['listing_id'],
                reviewer_id=user_id
            ).first()
            
            if existing_review:
                return jsonify({'error': 'You have already reviewed this product'}), 409
            
            # Create review
            review = Review(
                listing_id=data['listing_id'],
                reviewer_id=user_id,
                rating=data['rating'],
                comment=data.get('comment', '')
            )
            
            db.session.add(review)
            db.session.commit()
            
            return jsonify({
                'message': 'Review created successfully',
                'review': review.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating review: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Server error'}), 500
    
    
    @app.route('/api/listings/<int:listing_id>/reviews', methods=['GET'])
    def get_listing_reviews(listing_id):
        """Get reviews for a listing"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            
            reviews = Review.query.filter_by(listing_id=listing_id).order_by(Review.created_at.desc()).paginate(
                page=page, per_page=per_page
            )
            
            return jsonify({
                'reviews': [review.to_dict() for review in reviews.items],
                'total': reviews.total,
                'pages': reviews.pages,
                'current_page': page
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting reviews for listing {listing_id}: {str(e)}")
            return jsonify({'error': 'Server error'}), 500
    
    
    # ==================== HEALTH CHECK ====================
    
    @app.route('/api', methods=['GET'])
    def api_root():
        """API root endpoint"""
        return jsonify({
            'message': 'AgroX backend is running. Access the frontend at http://127.0.0.1:5000/ or call /api/* endpoints.',
            'frontend': 'http://127.0.0.1:5000',
            'health': '/api/health'
        }), 200

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    
    # ==================== TEMPLATE ROUTES ====================
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/marketplace')
    def marketplace():
        return render_template('marketplace.html')
    
    @app.route('/register')
    def register():
        return render_template('register.html')
    
    @app.route('/signin')
    def signin():
        return render_template('signin.html')
    
    @app.route('/add-listing')
    def add_listing():
        return render_template('add-listing.html')
    
    @app.route('/my-listings')
    def my_listings():
        return render_template('my-listings.html')
    
    @app.route('/messages')
    def messages():
        return render_template('messages.html')
    
    @app.route('/buyer-dashboard')
    def buyer_dashboard():
        return render_template('buyer-dashboard.html')
    
    @app.route('/farmer-dashboard')
    def farmer_dashboard():
        return render_template('farmer-dashboard.html')
    
    @app.route('/seller-dashboard')
    def seller_dashboard():
        return render_template('seller-dashboard.html')
    
    @app.route('/logistics-dashboard')
    def logistics_dashboard():
        return render_template('logistics-dashboard.html')
    
    @app.route('/storage-dashboard')
    def storage_dashboard():
        return render_template('storage-dashboard.html')

    @app.route('/waitlist')
    @app.route('/waitlist.html')
    def waitlist_page():
        return render_template('waitlist.html')
    
    @app.route('/admin/dashboard')
    def admin_dashboard():
        return render_template('admin/dashboard.html')
    
    @app.route('/admin/login')
    def admin_login():
        return render_template('admin/login.html')
    
    @app.route('/<path:page>.html')
    def html_page(page):
        try:
            # render register.html, signin.html, marketplace.html, etc.
            return render_template(f"{page}.html")
        except TemplateNotFound:
            abort(404)
    
    # ==================== ERROR HANDLERS ====================
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
    
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {str(error)}")
        return jsonify({'error': 'Internal server error'}), 500
    
    
    return app


# Create app instance based on environment
config_name = os.getenv('FLASK_ENV', 'production')
app = create_app(config_name)

if __name__ == '__main__':
    app = create_app('production')
    app.run(debug=True, host='127.0.0.1', port=5000)