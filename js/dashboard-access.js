// js/dashboard-access.js
// This file should be included in all dashboard HTML files

document.addEventListener('DOMContentLoaded', function() {
    checkDashboardAccess();
});

function checkDashboardAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (!currentUser) {
        // Not logged in - redirect to signin
        window.location.href = 'signin.html';
        return;
    }
    
    // Check if user is on waitlist
    const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
    const isOnWaitlist = waitlist.some(w => w.email === currentUser.email);
    
    if (!isOnWaitlist) {
        // User registered but not on waitlist (shouldn't happen, but just in case)
        showWaitlistRequired();
        return;
    }
    
    // User is on waitlist - show dashboard but with launch message
    showLaunchMessage();
}

function showWaitlistRequired() {
    // Hide all dashboard content
    document.querySelectorAll('.marketplace-content, .listings-grid, .dashboard-content').forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Show waitlist required message
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `
            <div class="container">
                <div class="waitlist-required-card">
                    <div class="icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h2>Early Access Required</h2>
                    <p>You need to join our waitlist to access the full platform.</p>
                    <a href="register.html" class="btn primary">Join Waitlist Now</a>
                    <p class="small">Already joined? <a href="signin.html">Sign in</a></p>
                </div>
            </div>
        `;
    }
    
    // Add styles
    addWaitlistStyles();
}

function showLaunchMessage() {
    // Add launch banner to top of dashboard
    const header = document.querySelector('.marketplace-header');
    if (header) {
        const banner = document.createElement('div');
        banner.className = 'launch-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <i class="fas fa-rocket"></i>
                <span>🎉 You're on the waitlist! Full access coming Q2 2026. We'll notify you at launch.</span>
                <button class="close-banner"><i class="fas fa-times"></i></button>
            </div>
        `;
        header.parentNode.insertBefore(banner, header);
        
        // Add close handler
        banner.querySelector('.close-banner').addEventListener('click', () => {
            banner.remove();
        });
    }
    
    // Disable all interactive features
    disableInteractiveFeatures();
}

function disableInteractiveFeatures() {
    // Disable all buttons that create/edit data
    const actionButtons = document.querySelectorAll('button:not(.disabled):not(.close-banner)');
    actionButtons.forEach(btn => {
        if (btn.id.includes('add') || btn.id.includes('create') || btn.id.includes('submit') || 
            btn.classList.contains('primary') && !btn.classList.contains('disabled')) {
            btn.disabled = true;
            btn.classList.add('disabled');
            btn.title = 'Available after launch';
            
            // Add click handler to show message
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showComingSoonMessage();
            });
        }
    });
    
    // Disable form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showComingSoonMessage();
        });
    });
    
    // Disable links to add/edit pages
    const links = document.querySelectorAll('a[href*="add"], a[href*="edit"], a[href*="create"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showComingSoonMessage();
        });
    });
}

function showComingSoonMessage() {
    // Create and show a toast notification
    const toast = document.createElement('div');
    toast.className = 'coming-soon-toast';
    toast.innerHTML = `
        <i class="fas fa-clock"></i>
        <span>This feature will be available at launch (Q2 2026)</span>
    `;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function addWaitlistStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .waitlist-required-card {
            max-width: 500px;
            margin: 100px auto;
            background: linear-gradient(135deg, #1a2f1a, #0a1a0a);
            border: 2px solid var(--green);
            border-radius: 30px;
            padding: 50px 40px;
            text-align: center;
            box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        
        .waitlist-required-card .icon {
            font-size: 5rem;
            color: var(--green);
            margin-bottom: 20px;
            animation: float 3s ease-in-out infinite;
        }
        
        .waitlist-required-card h2 {
            font-size: 2rem;
            margin-bottom: 15px;
            color: var(--white);
        }
        
        .waitlist-required-card p {
            color: rgba(255,255,255,0.7);
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .waitlist-required-card .small {
            margin-top: 20px;
            font-size: 0.9rem;
        }
        
        .waitlist-required-card .small a {
            color: var(--green);
            text-decoration: none;
        }
        
        .launch-banner {
            background: linear-gradient(135deg, var(--green), #8aff6e);
            color: #000;
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            animation: slideDown 0.5s ease;
        }
        
        .launch-banner .banner-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .launch-banner i {
            font-size: 1.2rem;
            margin-right: 10px;
        }
        
        .close-banner {
            background: none;
            border: none;
            color: #000;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px 10px;
            border-radius: 50%;
            transition: background 0.3s ease;
        }
        
        .close-banner:hover {
            background: rgba(0,0,0,0.1);
        }
        
        .coming-soon-toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #000;
            border: 2px solid var(--green);
            border-radius: 100px;
            padding: 15px 30px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--white);
            box-shadow: 0 10px 30px rgba(60,255,0,0.3);
            z-index: 9999;
            animation: slideUp 0.5s ease;
        }
        
        .coming-soon-toast i {
            color: var(--green);
            font-size: 1.2rem;
        }
        
        .coming-soon-toast.fade-out {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
            transition: all 0.5s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}