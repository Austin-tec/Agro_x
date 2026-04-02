// js/logistics-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication - allow all authenticated users to view
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email) {
        window.location.href = 'signin.html';
        return;
    }
    
    // Check if user can manage logistics (has logistics role) or just view
    const canManage = currentUser.role === 'logistics';
    
    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || 'Logistics';
    }
    
    // Initialize data
    let services = JSON.parse(localStorage.getItem('services') || '[]');
    let inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
    let notifications = JSON.parse(localStorage.getItem('notifications_' + currentUser.email) || '[]');
    
    // Filter user's services and inquiries
    const userServices = services.filter(s => s.owner === currentUser.email);
    const userInquiries = inquiries.filter(i => i.provider === currentUser.email);
    
    // DOM elements
    const servicesContainer = document.getElementById('services-container');
    const inquiriesContainer = document.getElementById('inquiries-container');
    const addServiceBtn = document.getElementById('add-service-btn');
    const addServiceModal = document.getElementById('add-service-modal');
    const closeServiceModalBtn = document.getElementById('close-service-modal');
    const serviceForm = document.getElementById('service-form');
    const cancelServiceBtn = document.getElementById('cancel-service-btn');
    const inquiryModal = document.getElementById('inquiry-modal');
    const closeInquiryModalBtn = document.getElementById('close-inquiry-modal');
    const respondInquiryBtn = document.getElementById('respond-inquiry-btn');
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
    
    // Hide management features for non-logistics users
    if (!canManage) {
        if (addServiceBtn) addServiceBtn.style.display = 'none';
        // Update title to indicate view-only mode
        const titleEl = document.querySelector('.marketplace-title h1');
        if (titleEl) titleEl.textContent = 'Logistics Services';
        const subtitleEl = document.querySelector('.marketplace-title p');
        if (subtitleEl) subtitleEl.textContent = 'Browse available transportation services';
    }
    
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || !href.startsWith('#')) {
                return; // allow normal navigation (e.g. messages page)
            }
            e.preventDefault();
            const target = href.substring(1);
            
            // Update active tab
            quickActions.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content and reload if needed
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target + '-tab') {
                    content.classList.add('active');
                    if (target === 'services') loadServices();
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
    
    // Load services
    function loadServices() {
        const userServices = services.filter(s => s.owner === currentUser.email);
        servicesContainer.innerHTML = '';
        
        if (userServices.length === 0) {
            servicesContainer.innerHTML = '<p class="empty-state">No services listed. Add your first transport service!</p>';
            return;
        }
        
        userServices.forEach(service => {
            const serviceEl = createServiceElement(service);
            servicesContainer.appendChild(serviceEl);
        });
    }
    
    // Load inquiries
    function loadInquiries() {
        const userInquiries = inquiries.filter(i => i.provider === currentUser.email);
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
    
    // Create service element
    function createServiceElement(service) {
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-image">
                <i class="fas fa-truck"></i>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">${service.title}</h3>
                    <span class="listing-category">${service.type}</span>
                </div>
                <div class="listing-price">$${service.price}/trip</div>
                <div class="listing-details">
                    <span>From: ${service.from}</span>
                    <span>To: ${service.to}</span>
                    ${service.capacity ? `<span>Capacity: ${service.capacity} tons</span>` : ''}
                </div>
                ${canManage ? `
                <div class="listing-actions">
                    <button class="listing-button secondary edit-service-btn" data-id="${service.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="listing-button secondary delete-service-btn" data-id="${service.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add event listeners only if user can manage
        if (canManage) {
            div.querySelector('.edit-service-btn').addEventListener('click', () => editService(service.id));
            div.querySelector('.delete-service-btn').addEventListener('click', () => deleteService(service.id));
        }
        
        return div;
    }
    
    // Create inquiry element
    function createInquiryElement(inquiry) {
        const service = services.find(s => s.id === inquiry.serviceId);
        const customer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === inquiry.customer);
        
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">Inquiry for: ${service ? service.title : 'Unknown Service'}</h3>
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
    function openServiceModal() {
        addServiceModal.classList.remove('hidden');
    }
    
    function closeServiceModal() {
        addServiceModal.classList.add('hidden');
        serviceForm.reset();
        document.getElementById('service-modal-title').textContent = 'Add Transport Service';
    }
    
    function openInquiryModal() {
        inquiryModal.classList.remove('hidden');
    }
    
    function closeInquiryModal() {
        inquiryModal.classList.add('hidden');
    }
    
    // Service functions
    function editService(id) {
        const service = services.find(s => s.id === id);
        if (!service) return;
        
        // Populate form
        document.getElementById('service-title').value = service.title;
        document.getElementById('service-type').value = service.type;
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-capacity').value = service.capacity || '';
        document.getElementById('service-from').value = service.from;
        document.getElementById('service-to').value = service.to;
        document.getElementById('service-description').value = service.description || '';
        
        document.getElementById('service-modal-title').textContent = 'Edit Service';
        serviceForm.dataset.editing = id;
        openServiceModal();
    }
    
    function deleteService(id) {
        if (confirm('Are you sure you want to delete this service?')) {
            services = services.filter(s => s.id !== id);
            localStorage.setItem('services', JSON.stringify(services));
            loadServices();
        }
    }
    
    // Inquiry functions
    function viewInquiry(id) {
        const inquiry = inquiries.find(i => i.id === id);
        if (!inquiry) return;
        
        const service = services.find(s => s.id === inquiry.serviceId);
        const customer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === inquiry.customer);
        
        document.getElementById('inquiry-details').innerHTML = `
            <div class="inquiry-info">
                <h3>Inquiry Details</h3>
                <p><strong>Service:</strong> ${service ? service.title : 'Unknown'}</p>
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
    addServiceBtn.addEventListener('click', openServiceModal);
    closeServiceModalBtn.addEventListener('click', closeServiceModal);
    cancelServiceBtn.addEventListener('click', closeServiceModal);
    closeInquiryModalBtn.addEventListener('click', closeInquiryModal);
    
    serviceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const serviceData = {
            id: this.dataset.editing || Date.now().toString(),
            title: formData.get('service-title'),
            type: formData.get('service-type'),
            price: parseFloat(formData.get('service-price')),
            capacity: formData.get('service-capacity') ? parseFloat(formData.get('service-capacity')) : null,
            from: formData.get('service-from'),
            to: formData.get('service-to'),
            description: formData.get('service-description'),
            owner: currentUser.email,
            createdAt: new Date().toISOString()
        };
        
        if (this.dataset.editing) {
            // Update existing
            const index = services.findIndex(s => s.id === this.dataset.editing);
            if (index !== -1) {
                services[index] = serviceData;
            }
        } else {
            // Add new
            services.push(serviceData);
        }
        
        localStorage.setItem('services', JSON.stringify(services));
        loadServices();
        closeServiceModal();
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
    loadServices();
    loadInquiries();
    updateNotificationUI();
});