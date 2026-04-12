// Verify OTP page script
const API_BASE_URL = window.location.origin;

function showPopup(type, message, duration = 4200) {
    const existing = document.querySelector('.toast-message');
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('hide'), duration - 300);
    setTimeout(() => toast.remove(), duration);
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('verify-email');
    const verificationCodeInput = document.getElementById('verification-code');
    const verifyForm = document.getElementById('verify-otp-form');

    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    const paramEmail = getQueryParam('email');
    const email = (paramEmail || pendingEmail || '').trim().toLowerCase();

    if (!email) {
        showPopup('error', 'No verification email found. Please register again.');
        setTimeout(() => window.location.href = 'register.html', 1200);
        return;
    }

    if (localStorage.getItem('isLoggedIn') === 'true') {
        showPopup('info', 'You are already signed in. Redirecting to your account.');
        setTimeout(() => window.location.href = 'waitlist.html', 900);
        return;
    }

    if (emailInput) {
        emailInput.value = email;
    }

    if (verifyForm) {
        verifyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const code = verificationCodeInput.value.trim();

            if (!code || code.length < 4) {
                showPopup('error', 'Please enter the verification code sent to your email.');
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        code: code
                    })
                });

                const result = await response.json();

                if (response.status === 200) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.removeItem('pendingVerificationEmail');
                    localStorage.removeItem('pendingVerificationName');

                    showPopup('success', 'Verification successful! Redirecting to waitlist...');
                    setTimeout(() => window.location.href = 'waitlist.html', 900);
                    return;
                }

                showPopup('error', result.error || 'Verification failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } catch (error) {
                console.error('Verification error:', error);
                showPopup('error', 'Cannot connect to server. Please try again later.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});
