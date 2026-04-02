// js/storage-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication - allow all authenticated users to view
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email) {
        window.location.href = 'signin.html';
        return;
    }

    // Check if user can manage storage (has storage role) or just view
    const canManage = currentUser.role === 'storage';

    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || 'Storage';
    }
    
    // Initialize data
    let facilities = JSON.parse(localStorage.getItem('facilities') || '[]');
    let storageInquiries = JSON.parse(localStorage.getItem('storageInquiries') || '[]');
    let notifications = JSON.parse(localStorage.getItem('notifications_' + currentUser.email) || '[]');
    
    // Filter user's facilities and inquiries
    const userFacilities = facilities.filter(f => f.owner === currentUser.email);
    const userInquiries = storageInquiries.filter(i => i.provider === currentUser.email);
    
    // DOM elements
    const facilitiesContainer = document.getElementById('facilities-container');
    const inquiriesContainer = document.getElementById('storage-inquiries-container');
    const addFacilityBtn = document.getElementById('add-facility-btn');
    const addFacilityModal = document.getElementById('add-facility-modal');
    const closeFacilityModalBtn = document.getElementById('close-facility-modal');
    const facilityForm = document.getElementById('facility-form');
    const cancelFacilityBtn = document.getElementById('cancel-facility-btn');
    const inquiryModal = document.getElementById('storage-inquiry-modal');
    const closeInquiryModalBtn = document.getElementById('close-storage-inquiry-modal');
    const respondInquiryBtn = document.getElementById('respond-storage-inquiry-btn');
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
    
    // Hide management features for non-storage users
    if (!canManage) {
        if (addFacilityBtn) addFacilityBtn.style.display = 'none';
        // Update title to indicate view-only mode
        const titleEl = document.querySelector('.marketplace-title h1');
        if (titleEl) titleEl.textContent = 'Storage Facilities';
        const subtitleEl = document.querySelector('.marketplace-title p');
        if (subtitleEl) subtitleEl.textContent = 'Browse available storage facilities';
    }
    
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return; // allow external links like messages
            }
            e.preventDefault();
            const target = href.substring(1);
            
            // Update active tab
            quickActions.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content and reload if necessary
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target + '-tab') {
                    content.classList.add('active');
                    if (target === 'facilities') loadFacilities();
                    if (target === 'inquiries') loadInquiries();
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
    
    // Load facilities
    function loadFacilities() {
        const userFacilities = facilities.filter(f => f.owner === currentUser.email);
        facilitiesContainer.innerHTML = '';
        
        if (userFacilities.length === 0) {
            facilitiesContainer.innerHTML = '<p class="empty-state">No facilities listed. Add your first storage facility!</p>';
            return;
        }
        
        userFacilities.forEach(facility => {
            const facilityEl = createFacilityElement(facility);
            facilitiesContainer.appendChild(facilityEl);
        });
    }
    
    // Load inquiries
    function loadInquiries() {
        const userInquiries = storageInquiries.filter(i => i.provider === currentUser.email);
        inquiriesContainer.innerHTML = '';
        
        if (userInquiries.length === 0) {
            inquiriesContainer.innerHTML = '<p class="empty-state">No inquiries yet.</p>';
            return;
        }
        
        userInquiries.forEach(inquiry => {
            const inquiryEl = createInquiryElement(inquiry);
            inquiriesContainer.appendChild(inquiryEl);
        });
    }
    
    // Create facility element
    function createFacilityElement(facility) {
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-image">
                <i class="fas fa-warehouse"></i>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">${facility.name}</h3>
                    <span class="listing-category">${facility.type}</span>
                </div>
                <div class="listing-price">$${facility.price}/day</div>
                <div class="listing-details">
                    <span>Location: ${facility.location}</span>
                    ${facility.capacity ? `<span>Capacity: ${facility.capacity} tons</span>` : ''}
                    ${facility.temperature ? `<span>Temp: ${facility.temperature}</span>` : ''}
                </div>
                ${canManage ? `
                <div class="listing-actions">
                    <button class="listing-button secondary edit-facility-btn" data-id="${facility.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="listing-button secondary delete-facility-btn" data-id="${facility.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add event listeners only if user can manage
        if (canManage) {
            div.querySelector('.edit-facility-btn').addEventListener('click', () => editFacility(facility.id));
            div.querySelector('.delete-facility-btn').addEventListener('click', () => deleteFacility(facility.id));
        }
        
        return div;
    }
    
    // Create inquiry element
    function createInquiryElement(inquiry) {
        const facility = facilities.find(f => f.id === inquiry.facilityId);
        const customer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === inquiry.customer);
        
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">Inquiry for: ${facility ? facility.name : 'Unknown Facility'}</h3>
                    <span class="listing-category">New Inquiry</span>
                </div>
                <div class="listing-details">
                    <span>From: ${customer ? customer.name : inquiry.customer}</span>
                    <span>Message: ${inquiry.message || 'No message'}</span>
                    <span>Date: ${new Date(inquiry.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="listing-actions">
                    <button class="listing-button primary view-inquiry-btn" data-id="${inquiry.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="listing-button primary respond-inquiry-btn" data-id="${inquiry.id}">
                        <i class="fas fa-comments"></i> Start Chat
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        div.querySelector('.view-inquiry-btn').addEventListener('click', () => viewInquiry(inquiry.id));
        div.querySelector('.respond-inquiry-btn').addEventListener('click', () => respondToInquiry(inquiry.id));
        
        return div;
    }
    
    // Modal functions
    function openFacilityModal() {
        addFacilityModal.classList.remove('hidden');
    }
    
    function closeFacilityModal() {
        addFacilityModal.classList.add('hidden');
        facilityForm.reset();
        document.getElementById('facility-modal-title').textContent = 'Add Storage Facility';
    }
    
    function openInquiryModal() {
        inquiryModal.classList.remove('hidden');
    }
    
    function closeInquiryModal() {
        inquiryModal.classList.add('hidden');
    }
    
    // Facility functions
    function editFacility(id) {
        const facility = facilities.find(f => f.id === id);
        if (!facility) return;
        
        // Populate form
        document.getElementById('facility-name').value = facility.name;
        document.getElementById('facility-type').value = facility.type;
        document.getElementById('facility-price').value = facility.price;
        document.getElementById('facility-capacity').value = facility.capacity || '';
        document.getElementById('facility-location').value = facility.location;
        document.getElementById('facility-temperature').value = facility.temperature || '';
        document.getElementById('facility-description').value = facility.description || '';
        
        document.getElementById('facility-modal-title').textContent = 'Edit Facility';
        facilityForm.dataset.editing = id;
        openFacilityModal();
    }
    
    function deleteFacility(id) {
        if (confirm('Are you sure you want to delete this facility?')) {
            facilities = facilities.filter(f => f.id !== id);
            localStorage.setItem('facilities', JSON.stringify(facilities));
            loadFacilities();
        }
    }
    
    // Inquiry functions
    function viewInquiry(id) {
        const inquiry = storageInquiries.find(i => i.id === id);
        if (!inquiry) return;
        
        const facility = facilities.find(f => f.id === inquiry.facilityId);
        const customer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === inquiry.customer);
        
        document.getElementById('storage-inquiry-details').innerHTML = `
            <div class="inquiry-info">
                <h3>Inquiry Details</h3>
                <p><strong>Facility:</strong> ${facility ? facility.name : 'Unknown'}</p>
                <p><strong>Customer:</strong> ${customer ? customer.name : inquiry.customer}</p>
                <p><strong>Email:</strong> ${inquiry.customer}</p>
                <p><strong>Message:</strong> ${inquiry.message || 'No message'}</p>
                <p><strong>Inquired on:</strong> ${new Date(inquiry.createdAt).toLocaleString()}</p>
            </div>
        `;
        
        inquiryModal.dataset.inquiryId = id;
        openInquiryModal();
    }
    
    function respondToInquiry(id) {
        window.location.href = `chat.html?requestId=${id}`;
    }
    
    // Event listeners
    addFacilityBtn.addEventListener('click', openFacilityModal);
    closeFacilityModalBtn.addEventListener('click', closeFacilityModal);
    cancelFacilityBtn.addEventListener('click', closeFacilityModal);
    closeInquiryModalBtn.addEventListener('click', closeInquiryModal);
    
    facilityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const facilityData = {
            id: this.dataset.editing || Date.now().toString(),
            name: formData.get('facility-name'),
            type: formData.get('facility-type'),
            price: parseFloat(formData.get('facility-price')),
            capacity: formData.get('facility-capacity') ? parseFloat(formData.get('facility-capacity')) : null,
            location: formData.get('facility-location'),
            temperature: formData.get('facility-temperature'),
            description: formData.get('facility-description'),
            owner: currentUser.email,
            createdAt: new Date().toISOString()
        };
        
        if (this.dataset.editing) {
            // Update existing
            const index = facilities.findIndex(f => f.id === this.dataset.editing);
            if (index !== -1) {
                facilities[index] = facilityData;
            }
        } else {
            // Add new
            facilities.push(facilityData);
        }
        
        localStorage.setItem('facilities', JSON.stringify(facilities));
        loadFacilities();
        closeFacilityModal();
    });
    
    respondInquiryBtn.addEventListener('click', function() {
        const inquiryId = inquiryModal.dataset.inquiryId;
        if (inquiryId) {
            respondToInquiry(inquiryId);
            closeInquiryModal();
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
    loadFacilities();
    loadInquiries();
    updateNotificationUI();
});