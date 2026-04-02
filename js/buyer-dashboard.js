// js/buyer-dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email || currentUser.role !== 'buyer') {
        window.location.href = 'signin.html';
        return;
    }
    
    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || 'Buyer';
    }
    
    // Initialize data
    let listings = JSON.parse(localStorage.getItem('listings') || '[]');
    let requests = JSON.parse(localStorage.getItem('requests') || '[]');
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks_' + currentUser.email) || '[]');
    let notifications = JSON.parse(localStorage.getItem('notifications_' + currentUser.email) || '[]');
    
    // DOM elements
    const marketplaceContainer = document.getElementById('marketplace-container');
    const myRequestsContainer = document.getElementById('my-requests-container');
    const bookmarksContainer = document.getElementById('bookmarks-container');
    const chatsContainer = document.getElementById('chats-container');
    const requestModal = document.getElementById('request-modal');
    const chatModal = document.getElementById('chat-modal');
    const closeRequestModalBtn = document.getElementById('close-request-modal');
    const closeChatModalBtn = document.getElementById('close-chat-modal');
    const sendRequestForm = document.getElementById('send-request-form');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const cancelRequestBtn = document.getElementById('cancel-request-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Notification elements
    const notificationBtn = document.getElementById('notification-btn');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationList = document.getElementById('notification-list');
    const markAllReadBtn = document.getElementById('mark-all-read');
    const payNowBtn = document.getElementById('pay-now-btn');
    
    // Tab switching
    const quickActions = document.querySelectorAll('.quick-action');
    const tabContents = document.querySelectorAll('.tab-content');
    
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // only intercept in-page tabs (hash links)
            if (!href || !href.startsWith('#')) {
                return; // allow normal navigation
            }
            e.preventDefault();
            const target = href.substring(1);
            
            // Update active tab
            quickActions.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target + '-tab') {
                    content.classList.add('active');
                }
            });
            
            // Load content for the tab
            switch(target) {
                case 'marketplace':
                    loadMarketplace();
                    break;
                case 'requests':
                    loadMyRequests();
                    break;
                case 'bookmarks':
                    loadBookmarks();
                    break;
    
            }
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
    
    // Load marketplace listings
    function loadMarketplace() {
        marketplaceContainer.innerHTML = '';
        
        if (listings.length === 0) {
            marketplaceContainer.innerHTML = '<p class="empty-state">No products available at the moment.</p>';
            return;
        }
        
        listings.forEach(listing => {
            const listingEl = createMarketplaceListingElement(listing);
            marketplaceContainer.appendChild(listingEl);
        });
    }
    
    // Load user's requests
    function loadMyRequests() {
        const userRequests = requests.filter(r => r.buyer === currentUser.email);
        myRequestsContainer.innerHTML = '';
        
        if (userRequests.length === 0) {
            myRequestsContainer.innerHTML = '<p class="empty-state">No requests yet. Browse the marketplace to send requests!</p>';
            return;
        }
        
        userRequests.forEach(request => {
            const requestEl = createRequestElement(request);
            myRequestsContainer.appendChild(requestEl);
        });
    }
    
    // Load bookmarks
    function loadBookmarks() {
        bookmarksContainer.innerHTML = '';
        
        if (bookmarks.length === 0) {
            bookmarksContainer.innerHTML = '<p class="empty-state">No bookmarks yet. Browse products and click the bookmark icon!</p>';
            return;
        }
        
        bookmarks.forEach(listingId => {
            const listing = listings.find(l => l.id === listingId);
            if (listing) {
                const listingEl = createMarketplaceListingElement(listing);
                bookmarksContainer.appendChild(listingEl);
            }
        });
    }
    
    // Load active chats
    
    // Create marketplace listing element
    function createMarketplaceListingElement(listing) {
        const isBookmarked = bookmarks.includes(listing.id);
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
                    <button class="listing-button primary request-btn" data-id="${listing.id}">
                        <i class="fas fa-envelope"></i> Send Request
                    </button>
                    <button class="listing-button secondary bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-id="${listing.id}">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        div.querySelector('.request-btn').addEventListener('click', () => openRequestModal(listing.id));
        div.querySelector('.bookmark-btn').addEventListener('click', () => toggleBookmark(listing.id));
        
        return div;
    }
    
    // Create request element for my requests
    function createRequestElement(request) {
        const listing = listings.find(l => l.id === request.listingId);
        const provider = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === request.provider);
        
        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-content">
                <div class="listing-header">
                    <h3 class="listing-title">Request for: ${listing ? listing.title : 'Unknown Product'}</h3>
                    <span class="listing-category status-${request.status.toLowerCase()}">${request.status}</span>
                </div>
                <div class="listing-details">
                    <span>To: ${provider ? provider.name : request.provider}</span>
                    <span>Quantity: ${request.quantity}</span>
                    <span>Date: ${new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="listing-actions">
                    ${request.status === 'Approved' ? `
                        <button class="listing-button primary chat-btn" data-id="${request.id}">
                            <i class="fas fa-comments"></i> Chat
                        </button>
                    ` : request.status === 'Pending' ? `
                        <button class="listing-button secondary">Waiting for Response</button>
                    ` : `
                        <button class="listing-button secondary">Request ${request.status}</button>
                    `}
                </div>
            </div>
        `;
        
        // Add event listeners
        if (request.status === 'Approved') {
            div.querySelector('.chat-btn').addEventListener('click', () => openChatModal(request.id));
        }
        
        return div;
    }
    
    
    // Modal functions
    function openRequestModal(listingId) {
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return;
        
        document.getElementById('request-product-info').innerHTML = `
            <div class="product-info">
                <h3>${listing.title}</h3>
                <p><strong>Price:</strong> $${listing.price}/${listing.unit}</p>
                <p><strong>Available:</strong> ${listing.quantity} ${listing.unit}</p>
                <p><strong>Location:</strong> ${listing.location}</p>
                ${listing.description ? `<p><strong>Description:</strong> ${listing.description}</p>` : ''}
            </div>
        `;
        
        requestModal.dataset.listingId = listingId;
        requestModal.classList.remove('hidden');
    }
    
    function closeRequestModal() {
        requestModal.classList.add('hidden');
        sendRequestForm.reset();
    }
    
    function openChatModal(requestId) {
        window.location.href = `chat.html?requestId=${requestId}`;
    }
    
    function closeChatModal() {
        chatModal.classList.add('hidden');
        chatInput.value = '';
    }
    
    // Load chat messages
    function loadChatMessages(requestId) {
        const request = requests.find(r => r.id === requestId);
        const messages = request.messages || [];
        const chatMessages = document.getElementById('chat-messages');
        
        // Clear existing messages except system message
        const systemMessage = chatMessages.querySelector('.system-message');
        chatMessages.innerHTML = '';
        if (systemMessage) {
            chatMessages.appendChild(systemMessage);
        }
        
        messages.forEach(message => {
            const messageEl = document.createElement('div');
            messageEl.className = `chat-message ${message.sender === currentUser.email ? 'sent' : 'received'}`;
            messageEl.innerHTML = `
                <div class="message-content">${message.text}</div>
                <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
            `;
            chatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Toggle bookmark
    function toggleBookmark(listingId) {
        const index = bookmarks.indexOf(listingId);
        if (index === -1) {
            bookmarks.push(listingId);
        } else {
            bookmarks.splice(index, 1);
        }
        localStorage.setItem('bookmarks_' + currentUser.email, JSON.stringify(bookmarks));
        loadBookmarks();
        loadMarketplace(); // Refresh to update bookmark buttons
    }
    
    // Send request
    function sendRequest(listingId, quantity, message) {
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return;
        
        const request = {
            id: Date.now().toString(),
            buyer: currentUser.email,
            provider: listing.owner,
            listingId: listingId,
            quantity: parseInt(quantity),
            message: message,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            messages: []
        };
        
        requests.push(request);
        localStorage.setItem('requests', JSON.stringify(requests));
        alert('Request sent successfully!');
        closeRequestModal();
        loadMyRequests();
    }
    
    // Send message
    function sendMessage(requestId, text) {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;
        
        const message = {
            sender: currentUser.email,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        if (!request.messages) request.messages = [];
        request.messages.push(message);
        request.lastMessageAt = new Date().toISOString();
        
        localStorage.setItem('requests', JSON.stringify(requests));
        loadChatMessages(requestId);
        chatInput.value = '';
    }
    
    // Event listeners
    closeRequestModalBtn.addEventListener('click', closeRequestModal);
    closeChatModalBtn.addEventListener('click', closeChatModal);
    cancelRequestBtn.addEventListener('click', closeRequestModal);
    
    sendRequestForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const listingId = requestModal.dataset.listingId;
        const quantity = document.getElementById('request-quantity').value;
        const message = document.getElementById('request-message').value;
        
        if (listingId && quantity) {
            sendRequest(listingId, quantity, message);
        }
    });
    
    sendMessageBtn.addEventListener('click', function() {
        const requestId = chatModal.dataset.requestId;
        const text = chatInput.value.trim();
        if (requestId && text) {
            sendMessage(requestId, text);
        }
    });
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
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
    
    // Payment placeholder
    if (payNowBtn) {
        payNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Payments will be available soon.\nAgro-X currently supports direct communication only.');
        });
    }
    
    // Initialize
    loadMarketplace();
    updateNotificationUI();
});