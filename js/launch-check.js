/**
 * Launch Status Checker - Prevents access until app is launched
 * Ensures users must join waitlist if not yet launched
 */

const API_BASE_URL = window.location.origin; // Use same origin as frontend
let launchStatus = null;

/**
 * Check current launch status from backend
 */
async function checkLaunchStatus() {
    // Return cached status if already checked
    if (launchStatus !== null) {
        return launchStatus;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/launch-settings`);
        if (!response.ok) {
            console.warn('Could not fetch launch status');
            launchStatus = { is_launched: false, allow_registration: true };
            return launchStatus;
        }
        
        launchStatus = await response.json();
        localStorage.setItem('launchStatus', JSON.stringify(launchStatus));
        return launchStatus;
    } catch (error) {
        console.error('Error checking launch status:', error);
        // Default to not launched if can't reach server
        launchStatus = { is_launched: false, allow_registration: true };
        return launchStatus;
    }
}

/**
 * Block access to protected pages if not launched
 * Call this on pages that should only be accessible after launch
 */
async function blockIfNotLaunched() {
    const status = await checkLaunchStatus();
    
    if (!status.is_launched) {
        // Redirect to waitlist page
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        message.innerHTML = `
            <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <h1 style="color: #667eea; margin-bottom: 20px;">🚀 Coming Soon</h1>
                <p style="font-size: 18px; color: #333; margin-bottom: 30px;">
                    AgroX is preparing for launch! Join our waitlist to get early access.
                </p>
                <a href="waitlist.html" style="
                    display: inline-block;
                    background-color: #667eea;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: 600;
                    margin: 10px;
                    transition: background 0.3s;
                " onmouseover="this.style.backgroundColor='#764ba2'" onmouseout="this.style.backgroundColor='#667eea'">
                    Join Waitlist
                </a>
                <a href="index.html" style="
                    display: inline-block;
                    background-color: #ddd;
                    color: #333;
                    padding: 12px 30px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: 600;
                    margin: 10px;
                    transition: background 0.3s;
                " onmouseover="this.style.backgroundColor='#ccc'" onmouseout="this.style.backgroundColor='#ddd'">
                    Go Home
                </a>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.style.margin = '0';
        document.body.appendChild(message);
        
        return false;
    }
    
    return true;
}

/**
 * Show banner for pages that can be accessed pre-launch
 */
async function showWaitlistBannerIfNeeded() {
    const status = await checkLaunchStatus();
    
    if (!status.is_launched) {
        const banner = document.createElement('div');
        banner.style.cssText = `
            background: linear-gradient(90deg, #ff6b6b 0%, #ee5a6f 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        banner.innerHTML = `
            📋 <strong>Limited Preview</strong> - Join our waitlist for exclusive early access!
            <a href="waitlist.html" style="margin-left: 15px; color: white; text-decoration: underline; cursor: pointer;">
                Join Now →
            </a>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
    }
}

/**
 * Require authentication AND launched status
 */
async function requireAuthAndLaunch() {
    const isLaunched = await blockIfNotLaunched();
    if (!isLaunched) return false;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'signin.html';
        return false;
    }
    
    return true;
}

/**
 * Update launch status (for admin)
 */
async function updateLaunchStatus(isLaunched, sendAnnouncement = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/launch-settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                is_launched: isLaunched,
                allow_registration: isLaunched,
                send_announcement: sendAnnouncement,
                launch_date: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            launchStatus = null; // Clear cache to force refresh
            localStorage.removeItem('launchStatus');
            return data;
        } else {
            throw new Error('Failed to update launch status');
        }
    } catch (error) {
        console.error('Error updating launch status:', error);
        throw error;
    }
}

/**
 * Get launch stats for admin dashboard
 */
async function getLaunchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/waitlist/stats`);
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to get launch stats');
        }
    } catch (error) {
        console.error('Error getting launch stats:', error);
        return null;
    }
}

// Expose globally
window.checkLaunchStatus = checkLaunchStatus;
window.blockIfNotLaunched = blockIfNotLaunched;
window.showWaitlistBannerIfNeeded = showWaitlistBannerIfNeeded;
window.requireAuthAndLaunch = requireAuthAndLaunch;
window.updateLaunchStatus = updateLaunchStatus;
window.getLaunchStats = getLaunchStats;
