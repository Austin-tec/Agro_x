# AgroTech Platform - Final Setup & Testing Checklist

**Status:** ✅ All components connected and ready for testing

---

## 1. File Structure Verification ✅

### HTML/CSS/JS Connections - COMPLETE
- ✅ **sign in.html** - Fixed script path (was `../js/main.js`, now `js/main.js`)
- ✅ **register.html** - All paths correct
- ✅ **waitlist.html** - All paths correct
- ✅ **farmer-dashboard.html** - All paths correct
- ✅ **buyer-dashboard.html** - All paths correct  
- ✅ **seller-dashboard.html** - All paths correct
- ✅ **storage-dashboard.html** - All paths correct
- ✅ **logistics-dashboard.html** - All paths correct
- ✅ **marketplace.html** - All paths correct
- ✅ **marketplace s.html** - Fixed paths (changed from `/agrox/agrox/css/...` to `css/...`)
- ✅ **messages.html** - All paths correct
- ✅ **index.html** - All paths correct
- ✅ **admin/login.html** - Inline CSS
- ✅ **admin/dashboard.html** - Inline CSS

---

## 2. Backend Setup ✅

### Flask Application (app.py)

**Status:** ✅ Complete with email functionality

#### Features Implemented:
- ✅ User Authentication (JWT tokens)
- ✅ Waitlist Management System
- ✅ Priority-based Queue (Farmer > Seller/Logistics/Storage > Buyer)
- ✅ Email Notifications (Registration & Approval)
- ✅ API Endpoints (8 total)
- ✅ Database Models (SQLite)
- ✅ Error Handling & Logging

#### Setup Steps:

**Step 1: Install Python Dependencies**
```bash
pip install flask flask-jwt-extended flask-sqlalchemy werkzeug
```

**Step 2: Configure Environment Variables**

Create a `.env` file in the project root with:

```
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secure-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this

# Email Configuration (choose one service)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@agrotechplatform.com
```

**Step 3: Initialize Database**
```bash
python
>>> from app import app, db
>>> with app.app_context():
>>>     db.create_all()
>>> exit()
```

**Step 4: Start Flask Server**
```bash
python app.py
```

Server will run at: `http://localhost:5000`

---

## 3. Email Configuration ✅

### Current Setup: SMTP-Based Email

The application has been enhanced with professional email notifications:

**Emails Sent:**

1. **Registration Confirmation Email**
   - Sent immediately after user signs up
   - Shows waitlist position
   - Includes message: "We'll keep you updated before our launch!"
   - HTML template with fallback plain text

2. **Approval Notification Email**
   - Sent when admin approves user
   - Notifies user of access ready status
   - Includes login instructions

### Email Service Options:

#### Option A: Gmail (Recommended for Testing)

1. Enable 2-Step Verification on your Google Account
2. Generate App Password:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
   
3. Add to `.env`:
   ```
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-16-char-app-password
   ```

#### Option B: SendGrid

1. Get API key from SendGrid dashboard
2. Add to `.env`:
   ```
   MAIL_SERVER=smtp.sendgrid.net
   MAIL_PORT=587
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=your-sendgrid-api-key
   ```

#### Option C: Mailgun

1. Get SMTP credentials from Mailgun dashboard
2. Add to `.env`:
   ```
   MAIL_SERVER=smtp.mailgun.org
   MAIL_PORT=587
   MAIL_USERNAME=your-mailgun-username
   MAIL_PASSWORD=your-mailgun-password
   ```

#### Option D: Office 365

1. Use your Office 365 email
2. Add to `.env`:
   ```
   MAIL_SERVER=smtp.office365.com
   MAIL_PORT=587
   MAIL_USERNAME=your-office-email@company.com
   MAIL_PASSWORD=your-office-password
   ```

### Test Email Configuration:

Use the test script below to verify email is working:

```python
# test_email.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

try:
    server = smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT')))
    server.starttls()
    server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
    
    # Send test email
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Test Email - AgroTech Platform'
    msg['From'] = os.getenv('MAIL_USERNAME')
    msg['To'] = 'test@example.com'  # Change to your test email
    
    text = "Test email from AgroTech Platform"
    html = "<h2>Test Email</h2><p>Your email configuration is working!</p>"
    
    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))
    
    server.sendmail(os.getenv('MAIL_USERNAME'), 'test@example.com', msg.as_string())
    server.quit()
    
    print("✅ Test email sent successfully!")
except Exception as e:
    print(f"❌ Error sending test email: {e}")
```

Run: `python test_email.py`

---

## 4. Integration Testing Checklist ✅

### Frontend Setup

All HTML files are now properly connected to CSS and JavaScript files.

**Test Each Page Loads Correctly:**

- [ ] Navigate to `http://localhost/agrox/Template/index.html` - Home page
- [ ] CSS loads (check styling)
- [ ] Navbar is visible and styled
- [ ] All images load properly

### User Registration Flow

1. [ ] Click "Register" on home page
2. [ ] Fill registration form:
   - First Name: `John`
   - Last Name: `Farmer`
   - Email: `john@example.com`
   - Password: `Test123!@`
   - User Type: `Farmer`
3. [ ] Click "Register"
4. [ ] See success alert: `"✅ Registration successful! Position #1. 📧 Check your email for a confirmation message. We'll keep you updated before our launch!"`
5. [ ] Check email inbox for confirmation email
6. [ ] Verify email contains:
   - Waitlist position
   - "We'll keep you updated before our launch!" message
   - Professional formatting

### User Login Flow

1. [ ] System redirects to `waitlist.html` after registration
2. [ ] Click "Sign In" link
3. [ ] Enter credentials:
   - Email: `john@example.com`
   - Password: `Test123!@`
4. [ ] Click "Sign In"
5. [ ] See success alert with JWT token stored
6. [ ] Redirected to `waitlist.html`
7. [ ] Waitlist position displays correctly

### Waitlist Status Verification

1. [ ] After login, waitlist.html shows:
   - Position number
   - User name
   - Registration time
   - "Check your email" message
2. [ ] Real-time API call to `/api/waitlist/check` returns position
3. [ ] Database shows user in correct priority order

### Dashboard Access (After Approval)

1. [ ] Admin logs in at `/agrox/Template/admin/`
2. [ ] Admin approves user
3. [ ] User receives "Access Approved" email
4. [ ] User can login and access dashboard:
   - Farmer: `farmer-dashboard.html`
   - Buyer: `buyer-dashboard.html`
   - Seller: `seller-dashboard.html`
   - Logistics: `logistics-dashboard.html`
   - Storage: `storage-dashboard.html`

---

## 5. API Endpoints Documentation ✅

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "first_name": "John",
  "last_name": "Farmer",
  "email": "john@example.com",
  "password": "Test123!@",
  "user_type": "farmer"
}
```

**Response:**
```json
{
  "message": "Registration successful. Added to waitlist. Check your email for confirmation!",
  "user_id": 1,
  "token": "jwt-token-here",
  "waitlist_position": 1
}
```

**Email Sent:** ✅ Registration confirmation with position

---

#### POST /api/auth/login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "Test123!@"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "first_name": "John",
    "email": "john@example.com",
    "user_type": "farmer"
  }
}
```

---

#### POST /api/waitlist/check
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "position": 1,
  "user_name": "John Farmer",
  "user_type": "farmer",
  "estimated_days": 5,
  "status": "pending"
}
```

---

#### GET /api/stats/waitlist
**Response:**
```json
{
  "total_waitlist": 15,
  "total_users": 15,
  "by_priority": {
    "farmers": 3,
    "sellers": 5,
    "buyers": 7
  }
}
```

---

#### POST /api/waitlist/:id/approve
**Request:**
```json
{
  "admin_key": "admin-secret-key"
}
```

**Response:**
```json
{
  "message": "User approved and notification sent",
  "position": 1,
  "user_email": "john@example.com"
}
```

**Email Sent:** ✅ Approval notification email

---

#### GET /api/health
Check server status

**Response:**
```json
{
  "status": "healthy",
  "flask_version": "2.3.3"
}
```

---

## 6. Database Structure ✅

### Users Table
```
- id (Primary Key)
- first_name
- last_name
- email (Unique)
- password (Hashed)
- user_type (farmer/buyer/seller/logistics/storage)
- created_at
- is_approved
- verified_at
```

### Waitlist Table
```
- id (Primary Key)
- user_id (Foreign Key)
- position
- priority (1=high, 2=medium, 3=standard)
- status (pending/approved/active)
- created_at
- approved_at
```

---

## 7. Security Configuration ✅

### JWT Token Settings
- **Expiration:** 2 hours
- **Algorithm:** HS256
- **Payload Includes:** User ID, Email, User Type

### Password Security
- **Hashing:** Werkzeug's secure hash
- **Minimum Requirements:** At least one uppercase, one number, one special character

### Environment Variables
- Never commit `.env` file to version control
- File is in `.gitignore` by default
- Change `SECRET_KEY` and `JWT_SECRET_KEY` for production

---

## 8. Production Deployment Checklist

- [ ] Change `FLASK_DEBUG=False`
- [ ] Change `FLASK_ENV=production`
- [ ] Update `SECRET_KEY` to random 32+ character string
- [ ] Update `JWT_SECRET_KEY` to random 32+ character string
- [ ] Use production email service (Gmail, SendGrid, etc.)
- [ ] Enable HTTPS/SSL
- [ ] Set database to production PostgreSQL or MySQL
- [ ] Configure CORS for frontend domain
- [ ] Set up rate limiting on API endpoints
- [ ] Enable database backups
- [ ] Set up monitoring and logging

---

## 9. Troubleshooting Guide

### Email Not Sending

**Issue:** Registration completes but no email received

**Solutions:**
1. Check Flask console for error messages
2. Verify `.env` email configuration
3. Confirm email credentials are correct
4. Check spam/junk folder
5. Try test script: `python test_email.py`
6. For Gmail: Verify App Password was generated correctly
7. Check firewall/network blocking SMTP port 587

### Database Errors

**Issue:** "Table already exists" error

**Solution:**
```bash
# Delete database and recreate
rm instance/agrotechdb.sqlite
python app.py  # Will recreate on first run
```

### Login Not Working

**Issue:** "Invalid credentials" even with correct password

**Solutions:**
1. Verify user was created (check database)
2. Confirm password matches (passwords are case-sensitive)
3. Ensure email is correct
4. Try resetting database and registering again

### CSS/JS Not Loading

**Issue:** Page looks unstyled or doesn't function

**Solutions:**
1. Check browser console for 404 errors
2. Verify file paths in HTML (should use `css/` and `js/` relative paths)
3. Ensure CSS and JS files exist in correct folders
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check that no absolute paths like `/agrox/agrox/css/` are used

---

## 10. Next Steps

### Immediate Actions (Before Launch):
1. [ ] Set up email service (Gmail recommended for testing)
2. [ ] Configure `.env` file
3. [ ] Initialize database
4. [ ] Start Flask server
5. [ ] Test complete registration flow
6. [ ] Verify emails are sending
7. [ ] Test login and waitlist position display

### Before Production Release:
1. [ ] Update SECRET_KEY and JWT_SECRET_KEY
2. [ ] Switch to production email service
3. [ ] Switch database to PostgreSQL
4. [ ] Enable HTTPS
5. [ ] Set up monitoring
6. [ ] Create user documentation
7. [ ] Deploy to production server

### If You Need Help:
- Review `EMAIL_SETUP.md` for detailed email configuration
- Check `app.py` for API endpoint implementation
- Check `register.js` and `waitlist.js` for frontend integration
- Review HTML files for CSS/JS paths

---

## 11. File Path Summary

All files are now properly connected:

```
agrox/
├── Template/
│   ├── index.html ✅
│   ├── register.html ✅
│   ├── sign in.html ✅ (FIXED)
│   ├── waitlist.html ✅
│   ├── farmer-dashboard.html ✅
│   ├── buyer-dashboard.html ✅
│   ├── seller-dashboard.html ✅
│   ├── storage-dashboard.html ✅
│   ├── logistics-dashboard.html ✅
│   ├── marketplace.html ✅
│   ├── marketplace s.html ✅ (FIXED)
│   ├── messages.html ✅
│   ├── admin/
│   │   ├── login.html ✅
│   │   └── dashboard.html ✅
│   └── css/ 
│       ├── style.css
│       ├── register.css
│       ├── signin.css
│       ├── marketplace.css
│       └── marketplace-enhanced.css
├── js/
│   ├── main.js
│   ├── register.js ✅ (UPDATED)
│   ├── waitlist.js ✅ (UPDATED)
│   ├── buyer-dashboard.js
│   ├── farmer-dashboard.js
│   ├── seller-dashboard.js
│   ├── storage-dashboard.js
│   ├── logistics-dashboard.js
│   └── marketplace.js
├── app.py ✅ (EMAIL ADDED)
└── requirements.txt ✅
```

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Ready for Testing
