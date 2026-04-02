// js/main.js

// Toggle password visibility
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });
}

// Form validation
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

// Smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Header background on scroll
function setupHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.98)';
            header.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = 'none';
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
    setupSmoothScrolling();
    setupHeaderScroll();
    
    // Set current year in footer
    const yearElements = document.querySelectorAll('.current-year');
    if (yearElements.length > 0) {
        const currentYear = new Date().getFullYear();
        yearElements.forEach(el => {
            el.textContent = currentYear;
        });
    }
    // Ensure navigation and role-based UI are consistent across pages
    if (typeof updateNavForUser === 'function') {
        try { updateNavForUser(); } catch (e) { console.error('updateNavForUser error', e); }
    }
});

// Utility to read current user from localStorage
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser') || 'null') || null;
    } catch (e) {
        return null;
    }
}

// Update navigation CTAs and enforce simple role-based visibility rules
function updateNavForUser() {
    const currentUser = getCurrentUser();
    const navCta = document.getElementById('nav-cta') || document.querySelector('.nav-cta');
    const navLinks = document.querySelectorAll('nav.nav-links a');

    // Default: show Register / Sign In
    if (navCta) {
        if (currentUser && currentUser.email) {
            const role = (currentUser.role || '').toLowerCase();
            const dashboardMap = {
                logistics: 'logistics-dashboard.html',
                farmer: 'farmer-dashboard.html',
                seller: 'seller-dashboard.html',
                buyer: 'buyer-dashboard.html',
                storage: 'storage-dashboard.html'
            };

            const dashboardHref = dashboardMap[role] || 'farmer-dashboard.html';

            navCta.innerHTML = `
                <div class="user-menu">
                    <button class="user-button">
                        <i class="fas fa-user-circle"></i>
                        <span>${currentUser.name || currentUser.email.split('@')[0]}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown">
                        <a href="${dashboardHref}"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                        <a href="messages.html"><i class="fas fa-comments"></i> Messages</a>
                        <hr>
                        <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
                    </div>
                </div>
            `;

            // Attach logout using event delegation
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('isLoggedIn');
                    window.location.href = 'index.html';
                });
            }
        } else {
            navCta.innerHTML = `
                <a href="register.html" class="btn primary">Register</a>
                <a href="signin.html" class="btn ghost">Sign In</a>
            `;
        }
    }

    // Role-based nav/content visibility
    const role = (currentUser && (currentUser.role || '') || '').toLowerCase();

    // If logistics user: hide Marketplace link; otherwise hide Logistics link
    navLinks.forEach(a => {
        try {
            const href = a.getAttribute('href') || '';
            if (role === 'logistics') {
                if (href.includes('marketplace.html')) a.style.display = 'none';
                if (href.includes('logistics-dashboard.html')) a.style.display = '';
            } else {
                if (href.includes('logistics-dashboard.html')) a.style.display = 'none';
                if (href.includes('marketplace.html')) a.style.display = '';
            }
        } catch (e) {
            // ignore
        }
    });

    // Hide page main sections that are explicitly tagged with data-module attributes
    // e.g., <main data-module="marketplace"> or <main data-module="logistics">
    document.querySelectorAll('main[data-module]').forEach(main => {
        const module = (main.getAttribute('data-module') || '').toLowerCase();
        if (!module) return;

        // If current role is logistics, only show logistics module or neutral "common" modules
        if (role === 'logistics') {
            if (module !== 'logistics' && module !== 'common' && module !== 'messages') {
                main.style.display = 'none';
            } else {
                main.style.display = '';
            }
        } else {
            // Non-logistics should not see logistics module
            if (module === 'logistics') {
                main.style.display = 'none';
            } else {
                main.style.display = '';
            }
        }
    });
}

window.updateNavForUser = updateNavForUser;
window.updateNavForUser = updateNavForUser;// routing / toggling helpers
function showSection(id) {
    document.querySelectorAll('.main-content section').forEach(sec => {
        sec.classList.toggle('hidden', sec.id !== id);
    });
    document.querySelectorAll('[data-route]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-route') === id);
    });
}

function setupRouting() {
    document.querySelectorAll('[data-route]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route) {
                showSection(route);
                history.pushState({route}, '', '#' + route);
            }
        });
    });
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.route) {
            showSection(e.state.route);
        } else {
            handleInitialRoute();
        }
    });
}

function handleInitialRoute() {
    const hash = window.location.hash.replace('#','');
    if (hash) {
        showSection(hash);
    } else {
        showSection('home');
    }
}
