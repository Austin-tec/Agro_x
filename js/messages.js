// js/messages.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.email) {
        window.location.href = 'signin.html';
        return;
    }

    // Update user name
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || 'User';
    }

    // Initialize data
    let listings = JSON.parse(localStorage.getItem('listings') || '[]');
    let requests = JSON.parse(localStorage.getItem('requests') || '[]');
    let messages = JSON.parse(localStorage.getItem('messages') || '[]');

    // Create demo users if they don't exist
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
        users = [
            { email: 'farmer@example.com', name: 'John Farmer', role: 'farmer', password: '123456', userType: 'farmer' },
            { email: 'farmer2@example.com', name: 'Sarah Plants', role: 'farmer', password: '123456', userType: 'farmer' },
            { email: 'farmer3@example.com', name: 'Mike Dairy', role: 'farmer', password: '123456', userType: 'farmer' },
            { email: 'buyer@example.com', name: 'Alex Trader', role: 'buyer', password: '123456', userType: 'buyer' },
            { email: 'buyer2@example.com', name: 'Emma Retailer', role: 'buyer', password: '123456', userType: 'buyer' },
            { email: 'buyer3@example.com', name: 'David Distributor', role: 'buyer', password: '123456', userType: 'buyer' },
            { email: 'seller@example.com', name: 'Tom Seller', role: 'seller', password: '123456', userType: 'seller' },
            { email: 'logistics@example.com', name: 'FastFlow Transport', role: 'logistics', password: '123456', userType: 'logistics' },
            { email: 'storage@example.com', name: 'SecureStore Facility', role: 'storage', password: '123456', userType: 'storage' },
            { email: 'storage2@example.com', name: 'CoolChain Storage', role: 'storage', password: '123456', userType: 'storage' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Generate demo messages if none exist
    if (messages.length === 0) {
        initializeDemoMessages();
        // Reload the requests after demo initialization
        requests = JSON.parse(localStorage.getItem('requests') || '[]');
    }

    // Initialize demo conversations and messages
    function initializeDemoMessages() {
        const now = Date.now();
        const demoMessages = [
            // ===== CONVERSATION 1: Farmer -> Buyer (Organic Tomatoes) - OPENED/READ =====
            {
                id: '1001',
                sender: 'farmer@example.com',
                recipient: 'buyer@example.com',
                content: 'Hi there! I noticed you were browsing our organic tomatoes. We just harvested a fresh batch today!',
                timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '1002',
                sender: 'buyer@example.com',
                recipient: 'farmer@example.com',
                content: 'That\'s great! How much quantity do you have available? And what\'s the pricing?',
                timestamp: new Date(now - 3.5 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '1003',
                sender: 'farmer@example.com',
                recipient: 'buyer@example.com',
                content: 'We have 500kg available. Standard price is $2.50/kg, but we offer 10% discount for orders above 100kg. All certified organic!',
                timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '1004',
                sender: 'buyer@example.com',
                recipient: 'farmer@example.com',
                content: 'Excellent! I\'ll take 150kg. What\'s the delivery timeline? Do you have cold transport?',
                timestamp: new Date(now - 2.5 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '1005',
                sender: 'farmer@example.com',
                recipient: 'buyer@example.com',
                content: 'Perfect! We can deliver within 24 hours with refrigerated transport. That comes to $337.50 for 150kg with discount. Shall I arrange the delivery?',
                timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '1006',
                sender: 'buyer@example.com',
                recipient: 'farmer@example.com',
                content: 'Yes, please! Send me the delivery details and payment information.',
                timestamp: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(),
                read: true
            },

            // ===== CONVERSATION 2: Farmer2 -> Logistics (Wheat Transport) - CLOSED/UNREAD =====
            {
                id: '2001',
                sender: 'logistics@example.com',
                recipient: 'farmer2@example.com',
                content: 'Hi! I see you uploaded a new wheat listing. We can help with transport! What quantity are you looking to move?',
                timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '2002',
                sender: 'farmer2@example.com',
                recipient: 'logistics@example.com',
                content: 'Great to hear! I have approximately 80 tons of premium wheat ready for shipment to the central distribution hub.',
                timestamp: new Date(now - 4.5 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '2003',
                sender: 'logistics@example.com',
                recipient: 'farmer2@example.com',
                content: '80 tons is substantial! We have multiple high-capacity trucks available. Distance and destination?',
                timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '2004',
                sender: 'farmer2@example.com',
                recipient: 'logistics@example.com',
                content: 'Distance is about 250km. Destination is Regional Hub in Central Valley. When can you arrange pickup?',
                timestamp: new Date(now - 3.5 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '2005',
                sender: 'logistics@example.com',
                recipient: 'farmer2@example.com',
                content: 'We can arrange pickup tomorrow morning at 8 AM. Cost will be $1,200 for the full load. Does that work?',
                timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
                read: false
            },

            // ===== CONVERSATION 3: Seller -> Storage (Maize Storage) - PARTIALLY READ =====
            {
                id: '3001',
                sender: 'seller@example.com',
                recipient: 'storage@example.com',
                content: 'Hi, I\'m looking for seasonal storage for maize. Do you have capacity available?',
                timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '3002',
                sender: 'storage@example.com',
                recipient: 'seller@example.com',
                content: 'Yes! We have excellent capacity. We offer both climate-controlled warehouse and traditional silo storage. How much are you looking to store?',
                timestamp: new Date(now - 5.5 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '3003',
                sender: 'seller@example.com',
                recipient: 'storage@example.com',
                content: 'Around 2000 bags (approximately 100 tons). Climate control would be better. What\'s your monthly rate?',
                timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '3004',
                sender: 'storage@example.com',
                recipient: 'seller@example.com',
                content: 'For 100 tons in climate-controlled facility: $0.75/bag/month = $1,500/month. We offer 3 & 6-month contracts with 10-15% discount!',
                timestamp: new Date(now - 4.5 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '3005',
                sender: 'seller@example.com',
                recipient: 'storage@example.com',
                content: 'I need to store for 4 months. What\'s the discount for that period? Do you include insurance?',
                timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '3006',
                sender: 'storage@example.com',
                recipient: 'seller@example.com',
                content: 'For 4 months, we can offer 12% discount = $1,320/month (total $5,280). Insurance available at additional 2% of storage value.',
                timestamp: new Date(now - 20 * 60 * 1000).toISOString(),
                read: false
            },

            // ===== CONVERSATION 4: Buyer -> Farmer3 (Dairy Products) - NEWEST/UNREAD =====
            {
                id: '4001',
                sender: 'buyer2@example.com',
                recipient: 'farmer3@example.com',
                content: 'Hello! Your fresh milk and dairy products look amazing. Are you currently taking bulk orders?',
                timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '4002',
                sender: 'farmer3@example.com',
                recipient: 'buyer2@example.com',
                content: 'Thanks! Yes, we take bulk orders. We supply fresh milk (2L containers), yogurt, and cheese. What are you interested in?',
                timestamp: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '4003',
                sender: 'buyer2@example.com',
                recipient: 'farmer3@example.com',
                content: 'Interested in 100L of fresh milk per week and 50kg of cheese monthly. What\'s your availability and pricing?',
                timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '4004',
                sender: 'farmer3@example.com',
                recipient: 'buyer2@example.com',
                content: 'Perfect order size! Fresh milk: $2.50/L, cheese: $18/kg. We can deliver twice weekly. Would you like to schedule a call to discuss logistics?',
                timestamp: new Date(now - 10 * 60 * 1000).toISOString(),
                read: false
            },

            // ===== CONVERSATION 5: Storage -> Buyer (Storage Inquiry) - VERY RECENT/UNREAD =====
            {
                id: '5001',
                sender: 'buyer3@example.com',
                recipient: 'storage2@example.com',
                content: 'Hi! Do you have cold storage available for vegetables? I need it for seasonal peak times.',
                timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '5002',
                sender: 'storage2@example.com',
                recipient: 'buyer3@example.com',
                content: 'We sure do! Specialized cold storage with temperature control 2-4°C. Perfect for vegetables. How much space do you need?',
                timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
                read: false
            }
        ];

        // Create demo requests
        const demoRequests = [
            {
                id: 'req001',
                buyer: 'buyer@example.com',
                provider: 'farmer@example.com',
                listingId: '1',
                quantity: 150,
                message: 'I would like to place an order for 150kg of organic tomatoes. Please confirm availability and best delivery date.',
                status: 'Approved',
                createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                messages: []
            },
            {
                id: 'req002',
                buyer: 'farmer2@example.com',
                provider: 'logistics@example.com',
                listingId: '2',
                quantity: 80,
                message: 'Requesting transport service for 80 tons of wheat. Looking for pickup tomorrow if possible.',
                status: 'Approved',
                createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
                messages: []
            },
            {
                id: 'req003',
                buyer: 'seller@example.com',
                provider: 'storage@example.com',
                listingId: '3',
                quantity: 2000,
                message: 'Requesting storage for 2000 bags of maize in climate-controlled facility for 4 months.',
                status: 'Approved',
                createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
                messages: []
            },
            {
                id: 'req004',
                buyer: 'buyer2@example.com',
                provider: 'farmer3@example.com',
                listingId: '4',
                quantity: 100,
                message: 'Interested in bulk dairy order: 100L fresh milk weekly and 50kg cheese monthly. Ongoing contract.',
                status: 'Pending',
                createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                messages: []
            }
        ];

        messages = demoMessages;
        requests = demoRequests;
        localStorage.setItem('messages', JSON.stringify(messages));
        localStorage.setItem('requests', JSON.stringify(requests));
    }

    // Generate demo messages if none exist
    if (messages.length === 0) {
        initializeDemoMessages();
    }

    // DOM elements
    const conversationsList = document.getElementById('conversations-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const messageForm = document.getElementById('message-form');
    const newMessageBtn = document.querySelector('.new-message-btn');
    const newMessageModal = document.getElementById('new-message-modal');
    const newMessageForm = document.getElementById('new-message-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Current conversation
    let currentConversationId = null;

    // Load conversations
    loadConversations();

    // Event listeners
    newMessageBtn.addEventListener('click', openNewMessageModal);
    document.getElementById('close-new-message').addEventListener('click', closeNewMessageModal);
    document.getElementById('cancel-new-message').addEventListener('click', closeNewMessageModal);

    newMessageForm.addEventListener('submit', handleNewMessage);
    messageForm.addEventListener('submit', handleSendMessage);
    logoutBtn.addEventListener('click', handleLogout);

    function loadConversations() {
        conversationsList.innerHTML = '';

        // Get all conversations for current user
        const userConversations = getUserConversations();

        if (userConversations.length === 0) {
            conversationsList.innerHTML = `
                <div class="empty-conversations">
                    <i class="fas fa-comments"></i>
                    <h4>No conversations yet</h4>
                    <p>Start a conversation by clicking "New Message"</p>
                </div>
            `;
            return;
        }

        userConversations.forEach(conversation => {
            const conversationEl = createConversationElement(conversation);
            conversationsList.appendChild(conversationEl);
        });
    }

    function getUserConversations() {
        const conversations = new Map();

        // Get conversations from approved requests
        requests.forEach(request => {
            if ((request.provider === currentUser.email || request.buyer === currentUser.email) && request.status === 'Approved') {
                const otherUser = request.provider === currentUser.email ? request.buyer : request.provider;
                const listing = listings.find(l => l.id === request.listingId);

                const conversationId = [currentUser.email, otherUser].sort().join('_');

                if (!conversations.has(conversationId)) {
                    conversations.set(conversationId, {
                        id: conversationId,
                        otherUser: otherUser,
                        listing: listing,
                        lastMessage: getLastMessage(conversationId),
                        unreadCount: getUnreadCount(conversationId)
                    });
                }
            }
        });

        // Get conversations from direct messages
        messages.forEach(message => {
            if (message.sender === currentUser.email || message.recipient === currentUser.email) {
                const otherUser = message.sender === currentUser.email ? message.recipient : message.sender;
                const conversationId = [currentUser.email, otherUser].sort().join('_');

                if (!conversations.has(conversationId)) {
                    conversations.set(conversationId, {
                        id: conversationId,
                        otherUser: otherUser,
                        listing: null,
                        lastMessage: getLastMessage(conversationId),
                        unreadCount: getUnreadCount(conversationId)
                    });
                }
            }
        });

        return Array.from(conversations.values());
    }

    function getLastMessage(conversationId) {
        const conversationMessages = messages.filter(m =>
            [currentUser.email, getOtherUserFromConversation(conversationId)].sort().join('_') === conversationId
        );

        if (conversationMessages.length === 0) return null;

        return conversationMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    }

    function getUnreadCount(conversationId) {
        const otherUser = getOtherUserFromConversation(conversationId);
        return messages.filter(m =>
            m.recipient === currentUser.email &&
            m.sender === otherUser &&
            !m.read
        ).length;
    }

    function getOtherUserFromConversation(conversationId) {
        const users = conversationId.split('_');
        return users.find(u => u !== currentUser.email);
    }

    function createConversationElement(conversation) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const otherUser = users.find(u => u.email === conversation.otherUser);

        const div = document.createElement('div');
        div.className = `conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`;
        div.innerHTML = `
            <div class="conversation-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${otherUser ? otherUser.name : conversation.otherUser}</div>
                <div class="conversation-preview">
                    ${conversation.listing ? `Regarding: ${conversation.listing.title}` : 'Direct message'}
                </div>
                <div class="conversation-time">
                    ${conversation.lastMessage ? formatTimeAgo(conversation.lastMessage.timestamp) : 'No messages yet'}
                </div>
            </div>
            ${conversation.unreadCount > 0 ? `<div class="unread-badge">${conversation.unreadCount}</div>` : ''}
        `;

        div.addEventListener('click', () => openConversation(conversation.id));
        return div;
    }

    function openConversation(conversationId) {
        currentConversationId = conversationId;
        loadConversations(); // Refresh to show active state

        const otherUser = getOtherUserFromConversation(conversationId);
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const otherUserData = users.find(u => u.email === otherUser);

        // Update chat header
        document.getElementById('chat-info').innerHTML = `
            <div class="chat-user-info">
                <div class="chat-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <h3>${otherUserData ? otherUserData.name : otherUser}</h3>
                    <p>Conversation</p>
                </div>
            </div>
        `;

        // Load messages
        loadMessages(conversationId);

        // Show chat input
        chatInput.style.display = 'block';
    }

    function loadMessages(conversationId) {
        const otherUser = getOtherUserFromConversation(conversationId);
        const conversationMessages = messages.filter(m =>
            (m.sender === currentUser.email && m.recipient === otherUser) ||
            (m.sender === otherUser && m.recipient === currentUser.email)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        chatMessages.innerHTML = '';

        if (conversationMessages.length === 0) {
            chatMessages.innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-comments"></i>
                    <h3>No messages yet</h3>
                    <p>Send the first message to start the conversation</p>
                </div>
            `;
            return;
        }

        conversationMessages.forEach(message => {
            const messageEl = createMessageElement(message);
            chatMessages.appendChild(messageEl);
        });

        // Mark messages as read
        markMessagesAsRead(conversationId);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createMessageElement(message) {
        const isOwnMessage = message.sender === currentUser.email;
        const div = document.createElement('div');
        div.className = `message ${isOwnMessage ? 'own' : 'other'}`;

        div.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        `;

        return div;
    }

    function markMessagesAsRead(conversationId) {
        const otherUser = getOtherUserFromConversation(conversationId);
        messages.forEach(message => {
            if (message.recipient === currentUser.email && message.sender === otherUser && !message.read) {
                message.read = true;
            }
        });
        localStorage.setItem('messages', JSON.stringify(messages));
        loadConversations(); // Refresh unread counts
    }

    function handleSendMessage(e) {
        e.preventDefault();

        if (!currentConversationId) return;

        const messageText = document.getElementById('message-text').value.trim();
        if (!messageText) return;

        const otherUser = getOtherUserFromConversation(currentConversationId);

        const newMessage = {
            id: Date.now().toString(),
            sender: currentUser.email,
            recipient: otherUser,
            content: messageText,
            timestamp: new Date().toISOString(),
            read: false
        };

        messages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(messages));

        // Clear input
        document.getElementById('message-text').value = '';

        // Reload messages
        loadMessages(currentConversationId);
        loadConversations();
    }

    function openNewMessageModal() {
        // Load potential recipients (users who have interacted with listings)
        const recipientSelect = document.getElementById('recipient-select');
        recipientSelect.innerHTML = '<option value="">Choose a user...</option>';

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const potentialRecipients = new Set();

        // Add users from approved requests
        requests.forEach(request => {
            if (request.status === 'Approved') {
                if (request.provider === currentUser.email) {
                    potentialRecipients.add(request.buyer);
                } else if (request.buyer === currentUser.email) {
                    potentialRecipients.add(request.provider);
                }
            }
        });

        // Add all users (for demo purposes)
        users.forEach(user => {
            if (user.email !== currentUser.email) {
                potentialRecipients.add(user.email);
            }
        });

        potentialRecipients.forEach(email => {
            const user = users.find(u => u.email === email);
            const option = document.createElement('option');
            option.value = email;
            option.textContent = user ? user.name : email;
            recipientSelect.appendChild(option);
        });

        newMessageModal.classList.remove('hidden');
    }

    function closeNewMessageModal() {
        newMessageModal.classList.add('hidden');
        newMessageForm.reset();
    }

    function handleNewMessage(e) {
        e.preventDefault();

        const recipient = document.getElementById('recipient-select').value;
        const messageText = document.getElementById('initial-message').value.trim();

        if (!recipient || !messageText) return;

        const newMessage = {
            id: Date.now().toString(),
            sender: currentUser.email,
            recipient: recipient,
            content: messageText,
            timestamp: new Date().toISOString(),
            read: false
        };

        messages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(messages));

        closeNewMessageModal();
        loadConversations();

        // Open the new conversation
        const conversationId = [currentUser.email, recipient].sort().join('_');
        openConversation(conversationId);
    }

    function handleLogout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

    // Back to dashboard function
    window.goBackToDashboard = function() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userType = currentUser.userType || 'farmer';

        switch (userType) {
            case 'farmer':
                window.location.href = 'farmer-dashboard.html';
                break;
            case 'seller':
                window.location.href = 'seller-dashboard.html';
                break;
            case 'buyer':
                window.location.href = 'buyer-dashboard.html';
                break;
            case 'logistics':
                window.location.href = 'logistics-dashboard.html';
                break;
            case 'storage':
                window.location.href = 'storage-dashboard.html';
                break;
            default:
                window.location.href = 'farmer-dashboard.html';
        }
    };
});