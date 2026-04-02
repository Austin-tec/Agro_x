// js/seller-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email || currentUser.role !== 'seller') {
        window.location.href = 'signin.html';
        return;
    }
    
    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || 'Seller';
    }
    
    // Initialize data
    let listings = JSON.parse(localStorage.getItem('listings') || '[]');
    let requests = JSON.parse(localStorage.getItem('requests') || '[]');
    let notifications = JSON.parse(localStorage.getItem('notifications_' + currentUser.email) || '[]');
    
    // Filter user's listings and requests
    const userListings = listings.filter(l => l.owner === currentUser.email);
    const userRequests = requests.filter(r => r.provider === currentUser.email);
    
    // DOM elements
    const listingsContainer = document.getElementById('my-listings-container');
    const requestsContainer = document.getElementById('requests-container');
    const addListingBtn = document.getElementById('add-listing-btn');
    const addListingModal = document.getElementById('add-listing-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const listingForm = document.getElementById('listing-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const requestModal = document.getElementById('request-modal');
    const closeRequestModalBtn = document.getElementById('close-request-modal');
    const approveRequestBtn = document.getElementById('approve-request-btn');
    const declineRequestBtn = document.getElementById('decline-request-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Notification elements
    const notificationBtn = document.getElementById('notification-btn');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationList = document.getElementById('notification-list');
    const markAllReadBtn = document.getElementById('mark-all-read');
    
    // Tab switching
    const quickActions = document.querySelectorAll('.quick-action');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Chart instances
    let categoryChart = null;
    let statusChart = null;
    
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return; // allow normal link navigation (e.g. messages.html)
            }
            e.preventDefault();
            const target = href.substring(1);
            
            // Update active tab
            quickActions.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content and load data for it
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target + '-tab') {
                    content.classList.add('active');
                    if (target === 'listings') loadListings();
                    if (target === 'requests') loadRequests();
                    if (target === 'analytics') loadAnalytics();
                }
            });
        });
    });
    
    // Notification functions
    function addNotification(type, title, message, relatedId = null) {
        const notification = {
            id: Date.now().toString(),
            type: type,
            title: title,
            message: message,
            relatedId: relatedId,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        notifications.unshift(notification);
        localStorage.setItem('notifications_' + currentUser.email, JSON.stringify(notifications));
        updateNotificationUI();
    }
    
    function updateNotificationUI() {
        const unreadCount = notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
        
        renderNotifications();
    }
    
    function renderNotifications() {
        notificationList.innerHTML = '';
        
        if (notifications.length === 0) {
            notificationList.innerHTML = '<div class="no-notifications">No notifications yet</div>';
            return;
        }
        
        notifications.slice(0, 10).forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${!notification.read ? 'unread' : ''}`;
            item.innerHTML = `
                <div class="notification-content">${notification.message}</div>
                <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
            `;
            item.addEventListener('click', () => markAsRead(notification.id));
            notificationList.appendChild(item);
        });
    }
    
    function markAsRead(notificationId) {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem('notifications_' + currentUser.email, JSON.stringify(notifications));
            updateNotificationUI();
        }
    }
    
    function markAllAsRead() {
        notifications.forEach(n => n.read = true);
        localStorage.setItem('notifications_' + currentUser.email, JSON.stringify(notifications));
        updateNotificationUI();
    }
    
    function formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
    
    // Load listings
    function loadListings() {
        const userListings = listings.filter(l => l.owner === currentUser.email);
        listingsContainer.innerHTML = '';
        
        if (userListings.length === 0) {
            listingsContainer.innerHTML = '<p class="empty-state">No listings yet. Add your first product listing!</p>';
            return;
        }
        
        userListings.forEach(listing => {
            const listingEl = createListingElement(listing);
            listingsContainer.appendChild(listingEl);
        });
    }
    
    // Load requests
    function loadRequests() {
        const userRequests = requests.filter(r => r.provider === currentUser.email);
        requestsContainer.innerHTML = '';
        
        if (userRequests.length === 0) {
            requestsContainer.innerHTML = '<p class="empty-state">No requests yet.</p>';
            return;
        }
        
        userRequests.forEach(request => {
            const requestEl = createRequestElement(request);
            requestsContainer.appendChild(requestEl);
        });
    }
    
    // Create listing element
    function createListingElement(listing) {
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-image">
                <i class="fas fa-box"></i>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">${listing.title}</h3>
                    <span class="listing-category">${listing.category}</span>
                </div>
                <div class="listing-price">$${listing.price}/${listing.unit}</div>
                <div class="listing-details">
                    <span>Qty: ${listing.quantity}</span>
                    <span>Location: ${listing.location}</span>
                </div>
                <div class="listing-actions">
                    <button class="listing-button secondary edit-btn" data-id="${listing.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="listing-button secondary delete-btn" data-id="${listing.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        div.querySelector('.edit-btn').addEventListener('click', () => editListing(listing.id));
        div.querySelector('.delete-btn').addEventListener('click', () => deleteListing(listing.id));
        
        return div;
    }
    
    // Create request element
    function createRequestElement(request) {
        const listing = listings.find(l => l.id === request.listingId);
        const buyer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === request.buyer);
        
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">Request for: ${listing ? listing.title : 'Unknown Product'}</h3>
                    <span class="listing-category status-${request.status.toLowerCase()}">${request.status}</span>
                </div>
                <div class="listing-details">
                    <span>From: ${buyer ? buyer.name : request.buyer}</span>
                    <span>Quantity: ${request.quantity}</span>
                    <span>Date: ${new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="listing-actions">
                    <button class="listing-button primary view-request-btn" data-id="${request.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${request.status === 'Pending' ? `
                        <button class="listing-button secondary approve-btn" data-id="${request.id}">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="listing-button secondary decline-btn" data-id="${request.id}">
                            <i class="fas fa-times"></i> Decline
                        </button>
                    ` : request.status === 'Approved' ? `
                        <button class="listing-button primary chat-btn" data-id="${request.id}">
                            <i class="fas fa-comments"></i> Chat
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add event listeners
        div.querySelector('.view-request-btn').addEventListener('click', () => viewRequest(request.id));
        if (request.status === 'Pending') {
            div.querySelector('.approve-btn').addEventListener('click', () => approveRequest(request.id));
            div.querySelector('.decline-btn').addEventListener('click', () => declineRequest(request.id));
        } else if (request.status === 'Approved') {
            div.querySelector('.chat-btn').addEventListener('click', () => openChat(request.id));
        }
        
        return div;
    }
    
    // Modal functions
    function openModal() {
        addListingModal.classList.remove('hidden');
    }
    
    function closeModal() {
        addListingModal.classList.add('hidden');
        listingForm.reset();
        document.getElementById('modal-title').textContent = 'Add New Listing';
    }
    
    function openRequestModal() {
        requestModal.classList.remove('hidden');
    }
    
    function closeRequestModal() {
        requestModal.classList.add('hidden');
    }
    
    // Listing functions
    function editListing(id) {
        const listing = listings.find(l => l.id === id);
        if (!listing) return;
        
        // Populate form
        document.getElementById('listing-title').value = listing.title;
        document.getElementById('listing-category').value = listing.category;
        document.getElementById('listing-price').value = listing.price;
        document.getElementById('listing-unit').value = listing.unit;
        document.getElementById('listing-quantity').value = listing.quantity;
        document.getElementById('listing-location').value = listing.location;
        document.getElementById('listing-description').value = listing.description || '';
        
        document.getElementById('modal-title').textContent = 'Edit Listing';
        listingForm.dataset.editing = id;
        openModal();
    }
    
    function deleteListing(id) {
        if (confirm('Are you sure you want to delete this listing?')) {
            listings = listings.filter(l => l.id !== id);
            localStorage.setItem('listings', JSON.stringify(listings));
            loadListings();
        }
    }
    
    // Modal functions
    function openModal() {
        addListingModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        addListingModal.classList.add('hidden');
        document.body.style.overflow = '';
        listingForm.reset();
        listingForm.dataset.editing = '';
        // Reset certifications
        document.querySelectorAll('input[name="certifications"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    function openRequestModal() {
        requestModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function closeRequestModal() {
        requestModal.classList.add('hidden');
        document.body.style.overflow = '';
        requestModal.dataset.requestId = '';
    }
    
    // Request functions
    function viewRequest(id) {
        const request = requests.find(r => r.id === id);
        if (!request) return;
        
        const listing = listings.find(l => l.id === request.listingId);
        const buyer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === request.buyer);
        
        document.getElementById('request-details').innerHTML = `
            <div class="request-info">
                <h3>Request Details</h3>
                <p><strong>Product:</strong> ${listing ? listing.title : 'Unknown'}</p>
                <p><strong>Buyer:</strong> ${buyer ? buyer.name : request.buyer}</p>
                <p><strong>Email:</strong> ${request.buyer}</p>
                <p><strong>Requested Quantity:</strong> ${request.quantity}</p>
                <p><strong>Message:</strong> ${request.message || 'No message'}</p>
                <p><strong>Status:</strong> <span class="status-${request.status.toLowerCase()}">${request.status}</span></p>
                <p><strong>Requested on:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
            </div>
        `;
        
        requestModal.dataset.requestId = id;
        openRequestModal();
    }
    
    function approveRequest(id) {
        const request = requests.find(r => r.id === id);
        if (request) {
            request.status = 'Approved';
            localStorage.setItem('requests', JSON.stringify(requests));
            loadRequests();
            
            // Add notification for buyer
            const buyerNotifications = JSON.parse(localStorage.getItem('notifications_' + request.buyer) || '[]');
            buyerNotifications.unshift({
                id: Date.now().toString(),
                type: 'request_approved',
                title: 'Request Approved',
                message: `Your request for ${listings.find(l => l.id === request.listingId)?.title || 'product'} has been approved. You can now chat with the seller.`,
                relatedId: request.id,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('notifications_' + request.buyer, JSON.stringify(buyerNotifications));
            
            alert('Request approved! Chat is now available.');
        }
    }
    
    function declineRequest(id) {
        const request = requests.find(r => r.id === id);
        if (request) {
            request.status = 'Declined';
            localStorage.setItem('requests', JSON.stringify(requests));
            loadRequests();
            
            // Add notification for buyer
            const buyerNotifications = JSON.parse(localStorage.getItem('notifications_' + request.buyer) || '[]');
            buyerNotifications.unshift({
                id: Date.now().toString(),
                type: 'request_declined',
                title: 'Request Declined',
                message: `Your request for ${listings.find(l => l.id === request.listingId)?.title || 'product'} has been declined.`,
                relatedId: request.id,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('notifications_' + request.buyer, JSON.stringify(buyerNotifications));
        }
    }
    
    function openChat(requestId) {
        window.location.href = `chat.html?requestId=${requestId}`;
    }
    
    // Analytics functions
    function loadAnalytics() {
        const userListings = listings.filter(l => l.owner === currentUser.email);
        const userRequests = requests.filter(r => r.provider === currentUser.email);
        
        // Update stats
        const pendingCount = userRequests.filter(r => r.status === 'Pending').length;
        const approvedCount = userRequests.filter(r => r.status === 'Approved').length;
        const totalValue = userListings.reduce((sum, listing) => sum + (listing.price * listing.quantity), 0);
        
        document.getElementById('stat-listings').textContent = userListings.length;
        document.getElementById('stat-pending').textContent = pendingCount;
        document.getElementById('stat-approved').textContent = approvedCount;
        document.getElementById('stat-value').textContent = '$' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        // Render charts
        renderCategoryChart(userListings);
        renderStatusChart(userRequests);
    }
    
    function renderCategoryChart(userListings) {
        const categories = {};
        userListings.forEach(listing => {
            categories[listing.category] = (categories[listing.category] || 0) + 1;
        });
        
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        'rgba(60, 150, 60, 0.8)',
                        'rgba(100, 180, 100, 0.8)',
                        'rgba(140, 200, 140, 0.8)',
                        'rgba(60, 200, 200, 0.8)',
                        'rgba(100, 200, 250, 0.8)',
                        'rgba(200, 150, 100, 0.8)'
                    ],
                    borderColor: 'var(--dark-gray)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--light-gray)',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }
    
    function renderStatusChart(userRequests) {
        const statuses = {
            'Pending': userRequests.filter(r => r.status === 'Pending').length,
            'Approved': userRequests.filter(r => r.status === 'Approved').length,
            'Declined': userRequests.filter(r => r.status === 'Declined').length
        };
        
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;
        
        if (statusChart) {
            statusChart.destroy();
        }
        
        statusChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(statuses),
                datasets: [{
                    label: 'Requests',
                    data: Object.values(statuses),
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(60, 150, 60, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 193, 7, 1)',
                        'rgba(60, 150, 60, 1)',
                        'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'var(--light-gray)' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: 'var(--light-gray)' }
                    }
                }
            }
        });
    }
    
    // Event listeners
    addListingBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    closeRequestModalBtn.addEventListener('click', closeRequestModal);
    
    listingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const listingData = {
            id: this.dataset.editing || Date.now().toString(),
            title: formData.get('listing-title'),
            category: formData.get('listing-category'),
            price: parseFloat(formData.get('listing-price')),
            unit: formData.get('listing-unit'),
            quantity: parseInt(formData.get('listing-quantity')),
            location: formData.get('listing-location'),
            description: formData.get('listing-description'),
            owner: currentUser.email,
            createdAt: new Date().toISOString()
        };
        
        if (this.dataset.editing) {
            // Update existing
            const index = listings.findIndex(l => l.id === this.dataset.editing);
            if (index !== -1) {
                listings[index] = listingData;
            }
        } else {
            // Add new
            listings.push(listingData);
        }
        
        localStorage.setItem('listings', JSON.stringify(listings));
        loadListings();
        closeModal();
    });
    
    approveRequestBtn.addEventListener('click', function() {
        const requestId = requestModal.dataset.requestId;
        if (requestId) {
            approveRequest(requestId);
            closeRequestModal();
        }
    });
    
    declineRequestBtn.addEventListener('click', function() {
        const requestId = requestModal.dataset.requestId;
        if (requestId) {
            declineRequest(requestId);
            closeRequestModal();
        }
    });
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    });
    
    // Notification event listeners
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
        });
    }
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
            notificationDropdown.classList.remove('show');
        }
    });
    
    // Initialize
    loadListings();
    loadRequests();
    updateNotificationUI();
});