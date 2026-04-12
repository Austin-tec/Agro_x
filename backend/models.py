"""
Database models for AgroX application
"""
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class Waitlist(db.Model):
    """Waitlist model for tracking user registrations"""
    __tablename__ = 'waitlist'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    user_type = db.Column(db.String(50), nullable=False)  # farmer, buyer, seller, logistics
    location = db.Column(db.String(255), nullable=True)
    business_name = db.Column(db.String(255), nullable=True)
    farm_size = db.Column(db.String(100), nullable=True)
    newsletter = db.Column(db.Boolean, default=True)
    position = db.Column(db.Integer, nullable=False)  # Position in waitlist
    status = db.Column(db.String(50), default='pending')  # pending, approved, registered
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'position': self.position,
            'status': self.status,
            'user_type': self.user_type,
            'newsletter': self.newsletter,
            'location': self.location,
            'business_name': self.business_name,
            'created_at': self.created_at.isoformat()
        }


class User(db.Model):
    """User model for registered users"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    user_type = db.Column(db.String(50), nullable=False)  # farmer, buyer, seller, logistics
    location = db.Column(db.String(255), nullable=True)
    business_name = db.Column(db.String(255), nullable=True)
    farm_size = db.Column(db.String(100), nullable=True)
    newsletter = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'user_type': self.user_type,
            'phone': self.phone,
            'location': self.location,
            'business_name': self.business_name,
            'newsletter': self.newsletter,
            'created_at': self.created_at.isoformat()
        }


class EmailOTP(db.Model):
    """One-time password (OTP) records for email verification"""
    __tablename__ = 'email_otps'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    code = db.Column(db.String(10), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'code': self.code,
            'expires_at': self.expires_at.isoformat(),
            'used': self.used,
            'created_at': self.created_at.isoformat()
        }


class LaunchSettings(db.Model):
    """Global settings for application launch"""
    __tablename__ = 'launch_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    is_launched = db.Column(db.Boolean, default=False)
    launch_date = db.Column(db.DateTime, nullable=True)
    allow_registration = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'is_launched': self.is_launched,
            'allow_registration': self.allow_registration,
            'launch_date': self.launch_date.isoformat() if self.launch_date else None
        }


class Listing(db.Model):
    """Product listing model"""
    __tablename__ = 'listings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    price_unit = db.Column(db.String(50), nullable=False)  # per kg, per unit, etc.
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)  # kg, tons, units, etc.
    category = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    harvest_date = db.Column(db.Date, nullable=True)
    availability = db.Column(db.String(100), nullable=False)  # limited, seasonal, year-round
    certifications = db.Column(db.Text, nullable=True)  # JSON string of certifications
    
    # Foreign keys
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = db.relationship('User', backref='listings')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'price': self.price,
            'price_unit': self.price_unit,
            'quantity': self.quantity,
            'unit': self.unit,
            'category': self.category,
            'location': self.location,
            'harvest_date': self.harvest_date.isoformat() if self.harvest_date else None,
            'availability': self.availability,
            'certifications': self.certifications,
            'seller_id': self.seller_id,
            'seller': self.seller.to_dict() if self.seller else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Order(db.Model):
    """Order model"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, shipped, delivered, cancelled
    
    # Foreign keys
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    buyer = db.relationship('User', backref='orders')
    items = db.relationship('OrderItem', backref='order', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'total_amount': self.total_amount,
            'status': self.status,
            'buyer_id': self.buyer_id,
            'buyer': self.buyer.to_dict() if self.buyer else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class OrderItem(db.Model):
    """Order item model"""
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)  # Price at time of order
    
    # Foreign keys
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    
    # Relationships
    listing = db.relationship('Listing')
    
    def to_dict(self):
        return {
            'id': self.id,
            'quantity': self.quantity,
            'price': self.price,
            'order_id': self.order_id,
            'listing_id': self.listing_id,
            'listing': self.listing.to_dict() if self.listing else None
        }


class Cart(db.Model):
    """Shopping cart model"""
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='cart')
    items = db.relationship('CartItem', backref='cart', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat()
        }


class CartItem(db.Model):
    """Cart item model"""
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Float, nullable=False)
    
    # Foreign keys
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    
    # Relationships
    listing = db.relationship('Listing')
    
    def to_dict(self):
        return {
            'id': self.id,
            'quantity': self.quantity,
            'cart_id': self.cart_id,
            'listing_id': self.listing_id,
            'listing': self.listing.to_dict() if self.listing else None
        }


class Review(db.Model):
    """Product review model"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text, nullable=True)
    
    # Foreign keys
    listing_id = db.Column(db.Integer, db.ForeignKey('listings.id'), nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    listing = db.relationship('Listing', backref='reviews')
    reviewer = db.relationship('User', backref='reviews')
    
    def to_dict(self):
        return {
            'id': self.id,
            'rating': self.rating,
            'comment': self.comment,
            'listing_id': self.listing_id,
            'reviewer_id': self.reviewer_id,
            'reviewer': self.reviewer.to_dict() if self.reviewer else None,
            'created_at': self.created_at.isoformat()
        }
