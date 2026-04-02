# 🚀 QUICK START - AgroTech Platform

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
pip install flask flask-jwt-extended flask-sqlalchemy werkzeug python-dotenv
```

### 2. Configure Email (Copy & Paste)
Create a file named `.env` in the `agrox` folder with:

**For Gmail (Recommended):**
```
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-this
JWT_SECRET_KEY=dev-jwt-secret-key-change-this

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_DEFAULT_SENDER=noreply@agrotechplatform.com
```

**To get Gmail App Password:**
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Login with your Gmail account
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password
5. Paste it in `.env` as `MAIL_PASSWORD`

### 3. Start Server
```bash
python app.py
```
Server runs at: `http://localhost:5000`

### 4. Test Registration
1. Open browser: `http://localhost/agrox/Template/register.html`
2. Fill form with test data
3. Click Register
4. 📧 Check your email for confirmation!

---

## 🎯 What's New

### ✅ Email Functionality
- ✉️ Confirmation email after signup
- 📍 Shows user's waitlist position
- 📢 Message: "We'll keep you updated before our launch!"
- 🎯 Professional HTML template

### ✅ All HTML/CSS/JS Connected
- Fixed: `sign in.html` script path
- Fixed: `marketplace s.html` CSS paths
- Verified: All 13 template files
- Status: 100% ready to use

### ✅ Complete Documentation
- `README.md` - Full guide
- `FINAL_SETUP_CHECKLIST.md` - Testing procedures
- `EMAIL_SETUP.md` - Email configuration options
- `.env.example` - Configuration template

---

## 📧 Email Example

**What user receives after signup:**

```
Subject: 🌾 Welcome to AgroTech Platform - Your Waitlist Position

Dear John Farmer,

Thank you for joining AgroTech Platform!

Your Waitlist Position: #42
You're in the queue. We'll notify you as we get closer to launch!

✅ Stay Updated: Regular updates about our progress
✅ Early Access: Get access when we launch
✅ Priority Support: Special benefits for early members

We're building something amazing for agriculture!
- The AgroTech Team
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `app.py` | Backend server (Flask) |
| `register.html` | Registration form |
| `sign in.html` | Login page |
| `waitlist.html` | Position tracker |
| `.env` | Your email configuration |
| `README.md` | Full documentation |

---

## 🧪 Quick Tests

### Test 1: Registration (1 min)
```
1. Go to register.html
2. Sign up with test email
3. See success message with position
4. Check email inbox
✅ Should have confirmation email
```

### Test 2: Login (1 min)
```
1. Go to sign in.html
2. Use your test email and password
3. Should redirect to waitlist.html
✅ Should show your position
```

### Test 3: Email Config (2 min)
```
1. Is .env file created?
2. Does it have email credentials?
3. Can Flask server start without errors?
✅ Try registering - check if email arrives
```

---

## ❌ Troubleshooting

### "Email not sending"
- Check `.env` file exists
- Verify email credentials in `.env`
- For Gmail: Did you use App Password (not your Gmail password)?
- Check spam folder
- Look at Flask console for error messages

### "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "ModuleNotFoundError: No module named 'flask'"
```bash
pip install flask flask-jwt-extended flask-sqlalchemy werkzeug python-dotenv
```

### "CSS/JavaScript not loading"
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console (F12) for 404 errors
- Verify files exist in folders
- ✅ We've already fixed all path issues!

---

## 📱 File Structure

```
agrox/
├── app.py                     # Backend server
├── .env                       # Your email config (add this)
├── .env.example              # Template (copy this)
├── README.md                 # Full guide
├── FINAL_SETUP_CHECKLIST.md  # Testing
│
├── Template/                 # Frontend
│   ├── register.html        # ✅ Connected
│   ├── sign in.html         # ✅ Fixed
│   ├── waitlist.html        # ✅ Connected
│   ├── farmer-dashboard.html # ✅ Connected
│   └── ...
│
└── css/              # Stylesheets ✅
    └── style.css    # ✅ All connected

└── js/               # JavaScript ✅
    └── main.js      # ✅ All connected
```

---

## 🎯 User Registration Flow

```
User Visits register.html
         ↓
Fills Form (Name, Email, Password, User Type)
         ↓
Clicks Register
         ↓
Backend Creates User in Database
         ↓
Adds to Waitlist with Position
         ↓
Sends Confirmation Email
         ↓
Shows Success Alert with Position
         ↓
Redirects to waitlist.html
         ↓
✅ User can check email and see position!
```

---

## 🔗 API Endpoints

### Register New User
```bash
POST http://localhost:5000/api/auth/register
{
  "first_name": "John",
  "last_name": "Farmer",
  "email": "john@example.com",
  "password": "Test123!",
  "user_type": "farmer"
}
```

### Check Position
```bash
POST http://localhost:5000/api/waitlist/check
{
  "email": "john@example.com"
}
```

### Login
```bash
POST http://localhost:5000/api/auth/login
{
  "email": "john@example.com",
  "password": "Test123!"
}
```

---

## ⚙️ Email Options

**Option 1: Gmail** (Recommended for testing) ⭐
- Required: Gmail account with 2-step verification
- App Password from myaccount.google.com/apppasswords
- Time: 5 minutes to setup

**Option 2: SendGrid** (For production)
- Sign up at sendgrid.com
- Get SMTP credentials
- Time: 10 minutes

**Option 3: Mailgun**
- Sign up at mailgun.com
- Get SMTP credentials
- Time: 10 minutes

**Option 4: Office 365**
- Use your Office 365 email
- No special password needed
- Time: 5 minutes

---

## ✅ Verification

You're ready to go if you have:

- [ ] `.env` file created with email config
- [ ] All dependencies installed
- [ ] Flask server starts without errors
- [ ] Can navigate to register.html
- [ ] Can register and see success message
- [ ] Can check email for confirmation

---

## 🎉 Success Indicators

✅ **It's working when you see:**

1. Registration form loads and looks good
2. Can submit registration without errors
3. Get success message with waitlist position
4. Email arrives with position and message
5. Can login with registered email
6. Waitlist page shows your position
7. Position matches the email

---

## 📞 Quick Links

- **Main Documentation:** Open `README.md`
- **Setup Checklist:** Open `FINAL_SETUP_CHECKLIST.md`
- **Email Guide:** Open `EMAIL_SETUP.md`
- **Configuration Template:** Use `.env.example`

---

## 🚀 You're Ready!

Everything is connected and ready to use. Just:

1. Add `.env` file with email config ↓
2. Run `python app.py` ↓
3. Visit `register.html` ↓
4. Test registration ↓
5. Check your email ✅

**That's it! Your platform is live.**

---

**Need help?** Check the documentation files - they have complete guides and troubleshooting!

Happy farming! 🌾
