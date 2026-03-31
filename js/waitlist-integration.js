// js/waitlist-integration.js
class WaitlistIntegration {
    constructor() {
        this.apiUrl = window.location.origin; // Use same origin as frontend
        this.currentUser = this.getCurrentUser();
        this.init();
    }
    
    init() {
        this.loadWaitlistCount();
        this.setupEventListeners();
        this.checkWaitlistStatus();
        this.setupPeriodicUpdates();
    }
    
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('currentUser')) || null;
        } catch {
            return null;
        }
    }
    
    async loadWaitlistCount() {
        try {
            const response = await fetch(`${this.apiUrl}/api/waitlist/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const stats = await response.json();
            this.updateWaitlistCounts(stats.total_waitlist || 0);
        } catch (error) {
            console.error('Error loading waitlist count:', error);
            // Fallback to local count
            this.incrementLocalCount();
        }
    }
    
    incrementLocalCount() {
        let count = parseInt(localStorage.getItem('waitlistCount') || '0');
        if (count === 0) {
            count = 523; // Base count
        }
        localStorage.setItem('waitlistCount', count.toString());
        this.updateWaitlistCounts(count);
    }
    
    updateWaitlistCounts(count) {
        // Update all instances of waitlist count on the page
        const elements = [
            document.getElementById('stat-waitlist'),
            document.getElementById('footer-waitlist-count'),
            document.getElementById('popup-waitlist-count')
        ];
        
        elements.forEach(el => {
            if (el) {
                el.textContent = count.toLocaleString();
            }
        });
        
        // Update progress bar (target 1000 for launch)
        const progress = Math.min(100, Math.round((count / 1000) * 100));
        const progressFill = document.getElementById('progress-fill');
        const launchProgress = document.getElementById('launch-progress');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        if (launchProgress) {
            launchProgress.textContent = `${progress}%`;
        }
    }
    
    setupEventListeners() {
        // Disable all action buttons for non-waitlist users
        this.disableActionButtons();
        
        // Setup newsletter form
        const newsletterForm = document.getElementById('footer-newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = newsletterForm.querySelector('input[type="email"]').value;
                this.quickJoinWaitlist(email);
            });
        }
        
        // Check if we need to show popup
        setTimeout(() => {
            this.showWaitlistPopup();
        }, 5000); // Show after 5 seconds
    }
    
    disableActionButtons() {
        // Disable all interactive buttons for non-waitlist users
        const actionButtons = document.querySelectorAll('.listing-button:not(.bookmark-btn)');
        const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
        
        actionButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
            btn.innerHTML = '<i class="fas fa-lock"></i> Join Waitlist';
            
            // Add click handler to redirect to register
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'register.html';
            });
        });
        
        bookmarkButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
            btn.title = 'Sign up to bookmark';
        });
    }
    
    showWaitlistPopup() {
        // Only show if user is not logged in
        if (this.currentUser) return;
        
        const hasSeenPopup = localStorage.getItem('waitlistPopupSeen');
        if (hasSeenPopup) return;
        
        const popup = document.getElementById('waitlist-popup');
        if (popup) {
            popup.style.display = 'block';
            
            // Setup close handlers
            const closeBtn = document.getElementById('close-waitlist-popup');
            const maybeLater = document.getElementById('maybe-later');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    popup.style.display = 'none';
                    localStorage.setItem('waitlistPopupSeen', 'true');
                });
            }
            
            if (maybeLater) {
                maybeLater.addEventListener('click', () => {
                    popup.style.display = 'none';
                    localStorage.setItem('waitlistPopupSeen', 'true');
                });
            }
        }
    }
    
    async quickJoinWaitlist(email) {
        if (!email || !this.validateEmail(email)) {
            this.showToast('Please enter a valid email address.', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/api/waitlist/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, user_type: 'buyer', source: 'footer-newsletter' })
            });

            const result = await response.json();

            if (response.status === 201) {
                this.showToast(`You're on the waitlist at position ${result.position}!`, 'success');
                const formInput = document.querySelector('#footer-newsletter-form input');
                if (formInput) formInput.value = '';
                this.loadWaitlistCount();
            } else if (response.status === 409) {
                this.showToast("You're already on our waitlist!", 'info');
            } else {
                this.showToast(result.error || 'Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error joining waitlist:', error);
            this.showToast('Cannot connect to server. Please verify the backend is reachable.', 'error');
        }
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showToast(message, type = 'info') {
        const existing = document.querySelector('.agrox-toast');
        if (existing) {
            existing.remove();
        }

        const toast = document.createElement('div');
        toast.className = `agrox-toast agrox-toast--${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✔️' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
    
    setupPeriodicUpdates() {
        // Update waitlist count every 30 seconds
        setInterval(() => {
            this.loadWaitlistCount();
        }, 30000);
    }
    
    checkWaitlistStatus() {
        // Check if current user is on waitlist
        if (this.currentUser) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
            
            const isOnWaitlist = waitlist.some(w => w.email === this.currentUser.email);
            
            if (isOnWaitlist) {
                this.showLaunchCountdown();
            }
        }
    }
    
    showLaunchCountdown() {
        // Add a small badge showing launch countdown
        const navCta = document.querySelector('.nav-cta');
        if (navCta) {
            const badge = document.createElement('div');
            badge.className = 'launch-countdown-badge';
            badge.innerHTML = `
                <i class="fas fa-rocket"></i>
                <span>Launching Q2 2026</span>
            `;
            navCta.appendChild(badge);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.waitlistIntegration = new WaitlistIntegration();
});