// js/waitlist.js - Complete waitlist functionality

// ================= CONFIGURATION =================
// Flask Backend API Configuration
const API_BASE_URL = window.location.origin; // Use same origin as frontend

// ================= MODAL MANAGEMENT =================
function openWaitlistModal() {
    const modal = document.getElementById('waitlist-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        // If modal doesn't exist, create it dynamically
        createWaitlistModal();
        setTimeout(openWaitlistModal, 100);
    }
}

function closeWaitlistModal() {
    const modal = document.getElementById('waitlist-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// ================= CREATE MODAL DYNAMICALLY =================
function createWaitlistModal() {
    if (document.getElementById('waitlist-modal')) return;
    
    const modalHTML = `
        <div id="waitlist-modal" class="modal-overlay hidden">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="fas fa-clock"></i> Join the Waitlist</h2>
                    <button class="modal-close" onclick="closeWaitlistModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="waitlist-message" class="message" style="display: none;"></div>
                    <form id="waitlist-form" onsubmit="submitWaitlist(event)">
                        <div class="form-group">
                            <label for="waitlist-email">Email Address *</label>
                            <input type="email" id="waitlist-email" name="email" required placeholder="your@email.com">
                        </div>
                        <div class="form-group">
                            <label for="waitlist-name">Full Name</label>
                            <input type="text" id="waitlist-name" name="name" placeholder="John Doe">
                        </div>
                        <div class="form-group">
                            <label for="waitlist-user-type">I am a:</label>
                            <select id="waitlist-user-type" name="user_type">
                                <option value="">Select...</option>
                                <option value="farmer">Farmer / Producer</option>
                                <option value="buyer">Buyer / Processor</option>
                                <option value="seller">Seller / Trader</option>
                                <option value="logistics">Logistics Provider</option>
                                <option value="storage">Storage Provider</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="waitlist-location">Location</label>
                            <input type="text" id="waitlist-location" name="location" placeholder="City, Country">
                        </div>
                        <div class="form-group">
                            <label for="waitlist-business">Business Name</label>
                            <input type="text" id="waitlist-business" name="business_name" placeholder="Your Farm/Business">
                        </div>
                        <div class="form-group">
                            <label for="waitlist-phone">Phone Number</label>
                            <input type="tel" id="waitlist-phone" name="phone" placeholder="+1234567890">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn secondary" onclick="closeWaitlistModal()">Cancel</button>
                            <button type="submit" class="btn primary">Join Waitlist</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ================= MAIN WAITLIST SUBMISSION =================
async function submitWaitlist(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = document.getElementById('waitlist-email')?.value.trim();
    if (!email) {
        showMessage('Please enter your email', 'error');
        return;
    }
    
    const data = {
        email: email,
        name: document.getElementById('waitlist-name')?.value.trim() || '',
        user_type: document.getElementById('waitlist-user-type')?.value || '',
        location: document.getElementById('waitlist-location')?.value.trim() || '',
        business_name: document.getElementById('waitlist-business')?.value.trim() || '',
        phone: document.getElementById('waitlist-phone')?.value.trim() || '',
        source: detectSource()
    };
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/waitlist/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.status === 201) {
            showMessage('✅ Thanks! You\'ve been added to our waitlist at position ' + (result.position || result.data?.position) + '. Check your email for confirmation.', 'success');
            form.reset();
            setTimeout(closeWaitlistModal, 2000);
            // Track with Google Analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'waitlist_signup', { 'user_type': data.user_type });
            }
        } else if (response.status === 200 && result.status === 'exists') {
            showMessage('📧 This email is already on our waitlist at position ' + (result.data?.position || '?') + '!', 'info');
        } else {
            showMessage('❌ Error: ' + (result.error || 'Something went wrong'), 'error');
        }
    } catch (error) {
        console.error('Waitlist error:', error);
        showMessage('❌ Cannot connect to server. Flask backend might not be running.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ================= SIMPLE FORM (for footer or hero) =================
async function submitSimpleWaitlist(event) {
    event.preventDefault();
    const emailInput = document.getElementById('simple-email');
    const email = emailInput?.value.trim();
    if (!email) return;
    
    const messageDiv = document.getElementById('simple-waitlist-message');
    const submitBtn = event.target.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/waitlist/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, user_type: 'buyer', source: 'simple-form' })
        });
        const result = await response.json();
        if (response.status === 201) {
            messageDiv.innerHTML = '✅ Thanks for joining! Position: ' + result.position;
            messageDiv.className = 'message success';
            emailInput.value = '';
        } else if (response.status === 200 && result.status === 'exists') {
            messageDiv.innerHTML = '📧 You\'re already on our list!';
            messageDiv.className = 'message info';
        } else {
            messageDiv.innerHTML = '❌ Error. Please try again.';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.innerHTML = '❌ Connection error.';
        messageDiv.className = 'message error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ================= CHECK WAITLIST STATUS =================
async function checkWaitlist(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/waitlist/check/${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    } catch (error) {
        console.error('Error checking waitlist:', error);
        return { error: 'Cannot connect to server' };
    }
}

// ================= AUTHENTICATION HELPERS =================
function requireAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'signin.html';
        return false;
    }
    return true;
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null') || null;
    } catch (e) {
        return null;
    }
}

// ================= HELPER FUNCTIONS =================
function showMessage(text, type) {
    const messageDiv = document.getElementById('waitlist-message');
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
    } else {
        alert(text);
    }
}

function detectSource() {
    const path = window.location.pathname;
    if (path.includes('index') || path === '/') return 'homepage';
    if (path.includes('register')) return 'register-page';
    if (path.includes('signin')) return 'signin-page';
    if (path.includes('marketplace')) return 'marketplace';
    return 'website';
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function() {
    // Create modal if it doesn't exist
    if (!document.getElementById('waitlist-modal')) {
        createWaitlistModal();
    }
    
    // Attach listeners to any element with data-waitlist attribute
    document.querySelectorAll('[data-waitlist]').forEach(btn => {
        btn.addEventListener('click', openWaitlistModal);
    });
    
    // Optional: show waitlist prompt after 3 visits
    const visitCount = parseInt(localStorage.getItem('visitCount') || '0');
    localStorage.setItem('visitCount', (visitCount + 1).toString());
    if (visitCount >= 2 && !sessionStorage.getItem('waitlistPrompted')) {
        setTimeout(() => {
            openWaitlistModal();
            sessionStorage.setItem('waitlistPrompted', 'true');
        }, 3000);
    }
});

// ================= EXPOSE GLOBALLY =================
window.openWaitlistModal = openWaitlistModal;
window.closeWaitlistModal = closeWaitlistModal;
window.submitWaitlist = submitWaitlist;
window.submitSimpleWaitlist = submitSimpleWaitlist;
window.checkWaitlist = checkWaitlist;
window.requireAuth = requireAuth;
window.getCurrentUser = getCurrentUser;