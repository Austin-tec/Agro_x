// js/farmer-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email || currentUser.role !== 'farmer') {
        window.location.href = 'signin.html';
        return;
    }
    
    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || 'Farmer';
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
    
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return; // allow normal link navigation
            }
            e.preventDefault();
            const target = href.substring(1);
            
            // Special case for add-listing - open modal instead of tab
            if (target === 'add-listing') {
                openModal();
                return;
            }
            
            // Update active tab
            quickActions.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target + '-tab') {
                    content.classList.add('active');
                    
                    // Load content for specific tabs
                    if (target === 'analytics') {
                        loadAnalytics();
                    } else if (target === 'messages') {
                        loadMessages();
                    } else if (target === 'requests') {
                        loadRequests();
                    } else if (target === 'listings') {
                        loadListings();
                    }
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
    
    // Load messages/chats
    function loadMessages() {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        // Get all approved requests that have chats
        const activeChats = requests.filter(r => 
            r.provider === currentUser.email && 
            r.status === 'Approved'
        );
        
        messagesContainer.innerHTML = '';
        
        if (activeChats.length === 0) {
            messagesContainer.innerHTML = '<p class="empty-state">No active chats. Approve some requests to start chatting with buyers.</p>';
            return;
        }
        
        activeChats.forEach(request => {
            const listing = listings.find(l => l.id === request.listingId);
            const buyer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === request.buyer);
            
            const chatEl = document.createElement('div');
            chatEl.className = 'chat-item';
            chatEl.innerHTML = `
                <div class="chat-header">
                    <div class="chat-info">
                        <h4>${buyer ? buyer.name : request.buyer}</h4>
                        <p>Regarding: ${listing ? listing.title : 'Product'}</p>
                    </div>
                    <div class="chat-status">
                        <span class="status-active">Active</span>
                    </div>
                </div>
                <div class="chat-preview">
                    <p>Last message: ${request.message || 'No messages yet'}</p>
                    <small>${formatTimeAgo(request.createdAt)}</small>
                </div>
                <div class="chat-actions">
                    <button class="btn primary chat-btn" data-request-id="${request.id}">
                        <i class="fas fa-comments"></i> Open Chat
                    </button>
                </div>
            `;
            
            chatEl.querySelector('.chat-btn').addEventListener('click', () => {
                openChat(request.id);
            });
            
            messagesContainer.appendChild(chatEl);
        });
    }
    
    // Load analytics
    function loadAnalytics() {
        const userListings = listings.filter(l => l.owner === currentUser.email);
        const userRequests = requests.filter(r => r.provider === currentUser.email);
        
        // Update summary cards
        document.getElementById('total-listings').textContent = userListings.length;
        document.getElementById('total-requests').textContent = userRequests.length;
        document.getElementById('approved-requests').textContent = userRequests.filter(r => r.status === 'Approved').length;
        document.getElementById('active-chats').textContent = userRequests.filter(r => r.status === 'Approved').length;
        
        // Update status breakdown
        const pendingCount = userRequests.filter(r => r.status === 'Pending').length;
        const approvedCount = userRequests.filter(r => r.status === 'Approved').length;
        const declinedCount = userRequests.filter(r => r.status === 'Declined').length;
        const totalRequests = userRequests.length;
        
        document.getElementById('pending-count').textContent = pendingCount;
        document.getElementById('approved-count').textContent = approvedCount;
        document.getElementById('declined-count').textContent = declinedCount;
        
        // Calculate percentages
        const pendingPercent = totalRequests > 0 ? (pendingCount / totalRequests) * 100 : 0;
        const approvedPercent = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;
        const declinedPercent = totalRequests > 0 ? (declinedCount / totalRequests) * 100 : 0;
        
        document.getElementById('pending-bar').style.width = pendingPercent + '%';
        document.getElementById('approved-bar').style.width = approvedPercent + '%';
        document.getElementById('declined-bar').style.width = declinedPercent + '%';
        
        // Load activity feed
        loadActivityFeed();
    }
    
    // Load activity feed
    function loadActivityFeed() {
        const activityFeed = document.getElementById('activity-feed');
        const userRequests = requests.filter(r => r.provider === currentUser.email);
        
        // Sort by most recent
        const recentActivities = userRequests
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
        
        activityFeed.innerHTML = '';
        
        if (recentActivities.length === 0) {
            activityFeed.innerHTML = '<div class="no-activity">No recent activity</div>';
            return;
        }
        
        recentActivities.forEach(request => {
            const listing = listings.find(l => l.id === request.listingId);
            const buyer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === request.buyer);
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            let icon = 'fas fa-envelope';
            let title = 'New request';
            let description = `Request for ${listing ? listing.title : 'product'} from ${buyer ? buyer.name : request.buyer}`;
            
            if (request.status === 'Approved') {
                icon = 'fas fa-check-circle';
                title = 'Request approved';
                description = `Approved request for ${listing ? listing.title : 'product'}`;
            } else if (request.status === 'Declined') {
                icon = 'fas fa-times-circle';
                title = 'Request declined';
                description = `Declined request for ${listing ? listing.title : 'product'}`;
            }
            
            activityItem.innerHTML = `
                <div class="activity-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${title}</h4>
                    <p>${description}</p>
                    <div class="activity-time">${formatTimeAgo(request.createdAt)}</div>
                </div>
            `;
            
            activityFeed.appendChild(activityItem);
        });
    }
    
    // Create listing element
    function createListingElement(listing) {
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-image">
                <i class="fas fa-seedling"></i>
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
        document.body.style.overflow = 'hidden';
        
        // Initialize multi-step form
        initMultiStepForm();
        
        // Reset to first step
        showFormStep(1);
    }
    
    function closeModal() {
        addListingModal.classList.add('hidden');
        document.body.style.overflow = '';
        listingForm.reset();
        
        // Reset certifications checkboxes
        document.querySelectorAll('input[name="certifications"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset form state
        delete listingForm.dataset.editing;
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
        document.getElementById('listing-title').value = listing.title || '';
        document.getElementById('listing-category').value = listing.category || '';
        document.getElementById('listing-price').value = listing.price || '';
        document.getElementById('listing-unit').value = listing.unit || '';
        document.getElementById('listing-quantity').value = listing.quantity || '';
        document.getElementById('listing-min-order').value = listing.minOrder || '';
        document.getElementById('listing-location').value = listing.location || '';
        document.getElementById('listing-delivery').value = listing.delivery || '';
        document.getElementById('listing-description').value = listing.description || '';
        document.getElementById('listing-harvest-date').value = listing.harvestDate || '';
        document.getElementById('listing-expiry-date').value = listing.expiryDate || '';
        
        // Populate certifications
        document.querySelectorAll('input[name="certifications"]').forEach(checkbox => {
            checkbox.checked = listing.certifications && listing.certifications.includes(checkbox.value);
        });
        
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
        
        // Initialize multi-step form
        initMultiStepForm();
        
        // Reset to first step
        showFormStep(1);
    }
    
    function closeModal() {
        addListingModal.classList.add('hidden');
        document.body.style.overflow = '';
        listingForm.reset();
        
        // Reset certifications checkboxes
        document.querySelectorAll('input[name="certifications"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset form state
        delete listingForm.dataset.editing;
        document.getElementById('modal-title').textContent = 'Add New Listing';
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
                <p><strong>Requested Quantity:</strong> ${request.quantity} ${listing ? listing.unit : ''}</p>
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
        if (!request) return;
        
        // Update status
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
    
    function declineRequest(id) {
        const request = requests.find(r => r.id === id);
        if (!request) return;
        
        // Update status
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
    
    function openChat(requestId) {
        window.location.href = `chat.html?requestId=${requestId}`;
    }
    
    // Event listeners
    addListingBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    closeRequestModalBtn.addEventListener('click', closeRequestModal);
    
    listingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate final step before submission
        if (!validateStep(4)) {
            return;
        }
        
        // Get certifications
        const certifications = [];
        document.querySelectorAll('input[name="certifications"]:checked').forEach(checkbox => {
            certifications.push(checkbox.value);
        });
        
        const listingData = {
            id: this.dataset.editing || Date.now().toString(),
            title: document.getElementById('listing-title').value,
            category: document.getElementById('listing-category').value,
            price: parseFloat(document.getElementById('listing-price').value),
            priceUnit: document.getElementById('price-unit').value,
            unit: document.getElementById('listing-unit').value,
            quantity: parseInt(document.getElementById('listing-quantity').value),
            location: document.getElementById('listing-location').value,
            description: document.getElementById('listing-description').value,
            certifications: certifications,
            owner: currentUser.email,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        // Basic validation
        if (!listingData.title || !listingData.category || !listingData.price || !listingData.priceUnit || !listingData.unit || !listingData.quantity || !listingData.location || !listingData.description) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (listingData.price <= 0) {
            alert('Price must be greater than 0');
            return;
        }
        
        if (listingData.quantity <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }
        
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
        
        // Show success message
        alert('Listing saved successfully!');
        
        // Add notification
        addNotification('success', 'Listing Created', `Your listing "${listingData.title}" has been created successfully.`);
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
    
    // Multi-step form functions
    function initMultiStepForm() {
        const currentStep = 1;
        const totalSteps = 4;
        
        // Update progress indicators
        updateProgressIndicators(currentStep);
        
        // Add event listeners for navigation buttons
        document.querySelectorAll('.nav-btn.next').forEach(btn => {
            btn.addEventListener('click', nextStep);
        });
        
        document.querySelectorAll('.nav-btn.prev').forEach(btn => {
            btn.addEventListener('click', prevStep);
        });
        
        // Add event listeners for certification selection
        document.querySelectorAll('.certification-item').forEach(item => {
            item.addEventListener('click', function() {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                this.classList.toggle('selected', checkbox.checked);
                updatePreview();
            });
        });
        
        // Add input event listeners for real-time preview updates
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', updatePreview);
        });
        
        // Initialize preview
        updatePreview();
    }
    
    function showFormStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show target step
        const targetStep = document.getElementById('step-' + stepNumber);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // Update progress indicators
        updateProgressIndicators(stepNumber);
        
        // Update navigation buttons
        updateNavigationButtons(stepNumber);
        
        // Scroll to top of modal
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    }
    
    function nextStep() {
        const currentStep = getCurrentStep();
        if (validateStep(currentStep)) {
            showFormStep(currentStep + 1);
        }
    }
    
    function prevStep() {
        const currentStep = getCurrentStep();
        showFormStep(currentStep - 1);
    }
    
    function getCurrentStep() {
        const activeStep = document.querySelector('.form-step.active');
        if (activeStep) {
            return parseInt(activeStep.id.replace('step-', ''));
        }
        return 1;
    }
    
    function validateStep(stepNumber) {
        let isValid = true;
        const errors = [];
        
        switch (stepNumber) {
            case 1: // Basic Info
                const title = document.getElementById('listing-title').value.trim();
                const category = document.getElementById('listing-category').value;
                const quantity = document.getElementById('listing-quantity').value;
                const unit = document.getElementById('listing-unit').value;
                
                if (!title) {
                    errors.push('Product title is required');
                    isValid = false;
                }
                if (!category) {
                    errors.push('Category is required');
                    isValid = false;
                }
                if (!quantity || quantity <= 0) {
                    errors.push('Valid quantity is required');
                    isValid = false;
                }
                if (!unit) {
                    errors.push('Unit is required');
                    isValid = false;
                }
                break;
                
            case 2: // Pricing
                const price = document.getElementById('listing-price').value;
                const priceUnit = document.getElementById('price-unit').value;
                
                if (!price || price <= 0) {
                    errors.push('Valid price is required');
                    isValid = false;
                }
                if (!priceUnit) {
                    errors.push('Price unit is required');
                    isValid = false;
                }
                break;
                
            case 3: // Details
                const description = document.getElementById('listing-description').value.trim();
                const location = document.getElementById('listing-location').value.trim();
                
                if (!description) {
                    errors.push('Product description is required');
                    isValid = false;
                }
                if (!location) {
                    errors.push('Location is required');
                    isValid = false;
                }
                break;
                
            case 4: // Review
                // Review step validation can be added here if needed
                break;
        }
        
        // Show errors if any
        if (!isValid) {
            showValidationErrors(errors);
        } else {
            hideValidationErrors();
        }
        
        return isValid;
    }
    
    function showValidationErrors(errors) {
        // Remove existing error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Add error messages to the current step
        const currentStep = document.querySelector('.form-step.active');
        if (currentStep) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <div style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                    <strong>Please fix the following errors:</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        ${errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            `;
            currentStep.querySelector('.step-content').insertBefore(errorDiv, currentStep.querySelector('.step-content').firstChild);
        }
    }
    
    function hideValidationErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }
    
    function updateProgressIndicators(currentStep) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber === currentStep) {
                step.classList.add('active');
            } else if (stepNumber < currentStep) {
                step.classList.add('completed');
            }
        });
    }
    
    function updateNavigationButtons(currentStep) {
        const prevBtn = document.querySelector('.nav-btn.prev');
        const nextBtn = document.querySelector('.nav-btn.next');
        const submitBtn = document.getElementById('submit-listing-btn');
        
        if (prevBtn) {
            prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.style.display = currentStep < 4 ? 'block' : 'none';
        }
        
        if (submitBtn) {
            submitBtn.style.display = currentStep === 4 ? 'block' : 'none';
        }
    }
    
    function updatePreview() {
        const previewSection = document.querySelector('.listing-preview');
        if (!previewSection) return;
        
        // Get form values
        const title = document.getElementById('listing-title').value.trim() || 'Product Title';
        const category = document.getElementById('listing-category').value || 'Not specified';
        const quantity = document.getElementById('listing-quantity').value || '0';
        const unit = document.getElementById('listing-unit').value || '';
        const price = document.getElementById('listing-price').value || '0';
        const priceUnit = document.getElementById('price-unit').value || '';
        const description = document.getElementById('listing-description').value.trim() || 'No description provided';
        const location = document.getElementById('listing-location').value.trim() || 'Not specified';
        
        // Get selected certifications
        const selectedCerts = Array.from(document.querySelectorAll('input[name="certifications"]:checked'))
            .map(cb => cb.value);
        
        // Update preview content
        const previewContent = previewSection.querySelector('.preview-content');
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="preview-section">
                    <h4>Basic Information</h4>
                    <div class="preview-item">
                        <span class="preview-label">Title:</span>
                        <span class="preview-value">${title}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Category:</span>
                        <span class="preview-value">${category}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Quantity:</span>
                        <span class="preview-value">${quantity} ${unit}</span>
                    </div>
                </div>
                <div class="preview-section">
                    <h4>Pricing & Location</h4>
                    <div class="preview-item">
                        <span class="preview-label">Price:</span>
                        <span class="preview-value">$${price} per ${priceUnit}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Location:</span>
                        <span class="preview-value">${location}</span>
                    </div>
                    <div class="preview-item">
                        <span class="preview-label">Description:</span>
                        <span class="preview-value">${description.length > 50 ? description.substring(0, 50) + '...' : description}</span>
                    </div>
                </div>
            `;
        }
        
        // Update certifications preview
        const certsPreview = document.getElementById('preview-certifications');
        if (certsPreview) {
            if (selectedCerts.length > 0) {
                certsPreview.innerHTML = selectedCerts.map(cert => 
                    `<span class="cert-badge">${cert}</span>`
                ).join('');
            } else {
                certsPreview.innerHTML = '<em>No certifications selected</em>';
            }
        }
    }
    
    // Initialize
    loadListings();
    loadRequests();
    updateNotificationUI();
});