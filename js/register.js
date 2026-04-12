// js/register.js
// Flask Backend Configuration
const API_BASE_URL = window.location.origin; // Use same origin as frontend

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

// Registration is open by default; no launch/waitlist gating
async function checkLaunchStatus() {
    return true;
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check launch status first
    const canRegister = await checkLaunchStatus();
    if (!canRegister) return;
    // User type selection
    const typeOptions = document.querySelectorAll('.type-option');
    const userTypeInput = document.getElementById('user-type');
    
    typeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            typeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Update hidden input value
            const type = this.getAttribute('data-type');
            userTypeInput.value = type;
            
            // Show/hide relevant fields
            toggleFormFields(type);
        });
    });
    
    // Toggle form fields based on user type
    function toggleFormFields(type) {
        const businessFields = document.querySelectorAll('.business-field');
        const farmerFields = document.querySelectorAll('.farmer-field');
        
        if (type === 'farmer') {
            businessFields.forEach(field => field.classList.add('hidden'));
            farmerFields.forEach(field => field.classList.remove('hidden'));
        } else {
            businessFields.forEach(field => field.classList.remove('hidden'));
            farmerFields.forEach(field => field.classList.add('hidden'));
        }
    }
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            let color = '';
            let text = '';
            
            // Check password length
            if (password.length >= 8) strength += 25;
            
            // Check for lowercase letters
            if (/[a-z]/.test(password)) strength += 25;
            
            // Check for uppercase letters
            if (/[A-Z]/.test(password)) strength += 25;
            
            // Check for numbers
            if (/[0-9]/.test(password)) strength += 25;
            
            // Update strength bar and text
            strengthBar.style.width = strength + '%';
            
            if (strength < 50) {
                color = 'var(--error)';
                text = 'Weak';
            } else if (strength < 75) {
                color = 'var(--warning)';
                text = 'Fair';
            } else {
                color = 'var(--primary-green)';
                text = 'Strong';
            }
            
            strengthBar.style.backgroundColor = color;
            strengthText.textContent = text;
            strengthText.style.color = color;
        });
    }
    
    // Password toggle buttons
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = document.getElementById('password');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = document.getElementById('confirm-password');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
    
    // Form submission with Flask backend
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            showPopup('info', 'You are already signed in. Log out before creating a new account.');
            setTimeout(() => window.location.href = 'waitlist.html', 900);
            return;
        }

        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateForm(this)) {
                showPopup('error', 'Please fill in all required fields');
                return;
            }

            // Check if passwords match
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                showPopup('error', 'Passwords do not match');
                return;
            }
            
            // Check if terms are accepted
            const termsAccepted = document.querySelector('input[name="terms"]').checked;
            if (!termsAccepted) {
                showPopup('error', 'Please accept the Terms of Service and Privacy Policy');
                return;
            }
            
            // Get form data
            const formData = new FormData(this);
            const registrationData = {
                email: formData.get('email'),
                password: formData.get('password'),
                first_name: formData.get('first-name'),
                last_name: formData.get('last-name'),
                phone: formData.get('phone') || '',
                user_type: formData.get('user-type'),
                location: formData.get('location') || '',
                business_name: formData.get('business-name') || '',
                farm_size: formData.get('farm-size') || '',
                newsletter: formData.get('newsletter') === 'on',
                source: 'web'
            };
            
            // Disable submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
            
            try {
                // Send registration to Flask backend
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registrationData)
                });
                
                const result = await response.json();
                
                if (response.status === 201) {
                    // Success - store token and user info
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // Show success message and redirect
                    showPopup('success', 'Registration successful! You are now on the waitlist.');
                    setTimeout(() => window.location.href = 'waitlist.html', 900);
                } else if (response.status === 202 && result.requires_verification) {
                    // OTP verification required
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    localStorage.setItem('isLoggedIn', 'false');
                    localStorage.setItem('pendingVerificationEmail', registrationData.email);
                    localStorage.setItem('pendingVerificationName', registrationData.first_name || registrationData.email);

                    showPopup('success', `A verification code was sent to ${registrationData.email}. Please enter it to complete registration.`);
                    setTimeout(() => window.location.href = `verify-otp.html?email=${encodeURIComponent(registrationData.email)}` , 900);
                } else if (response.status === 202) {
                    // Waitlist pending: keep the user on the site and preserve the email/session state
                    localStorage.removeItem('authToken');
                    localStorage.setItem('currentUser', JSON.stringify({
                        email: registrationData.email,
                        first_name: registrationData.first_name,
                        last_name: registrationData.last_name,
                        user_type: registrationData.user_type,
                        waitlist_status: 'pending',
                        waitlist_position: result.position || null
                    }));
                    localStorage.setItem('isLoggedIn', 'false');
                    localStorage.setItem('waitlistStatusMessage', `A confirmation email has been sent to ${registrationData.email}.`);
                    localStorage.setItem('waitlistStatusType', 'success');

                    showPopup('info', `You are on the waitlist at position ${result.position || 'unknown'}. You will receive an email once approved.`);
                    setTimeout(() => window.location.href = 'waitlist.html', 900);
                } else {
                    // Error response
                    showPopup('error', 'Registration failed: ' + (result.error || 'Unknown error'));
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            } catch (error) {
                console.error('Registration error:', error);
                showPopup('error', 'Cannot connect to server. Please check if Flask backend is running.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        const googleAuthBtn = document.getElementById('google-auth-button');
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', function() {
                window.location.href = `${API_BASE_URL}/api/auth/google/login`;
            });
        }
    }
    
    // Helper function from main.js
    function validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'var(--error)';
            } else {
                input.style.borderColor = '';
            }
        });
        
        return isValid;
    }
});