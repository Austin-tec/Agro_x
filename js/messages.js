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

    // Do not initialize demo users or demo conversations.
    // The messages system should rely on real application data.

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