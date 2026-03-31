// js/my-listings.js

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

    // API base URL
    const API_BASE_URL = window.location.origin; // Use same origin as frontend

    // Initialize data
    let listings = [];
    let requests = [];

    // DOM elements
    const listingsContainer = document.getElementById('listings-container');
    const emptyState = document.getElementById('empty-state');
    const addNewListingBtn = document.getElementById('add-new-listing');
    const addFirstListingBtn = document.getElementById('add-first-listing');
    const statusFilter = document.getElementById('status-filter');
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-listings');
    const listingModal = document.getElementById('listing-modal');
    const logoutBtn = document.getElementById('logout-btn');

    // Load initial data
    loadListingsFromAPI();
    updateStats();

    // Event listeners
    addNewListingBtn.addEventListener('click', () => window.location.href = 'add-listing.html');
    addFirstListingBtn.addEventListener('click', () => window.location.href = 'add-listing.html');
    statusFilter.addEventListener('change', filterListings);
    categoryFilter.addEventListener('change', filterListings);
    searchInput.addEventListener('input', filterListings);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    logoutBtn.addEventListener('click', handleLogout);

    async function loadListingsFromAPI() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/listings/my-listings`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });

            if (response.ok) {
                listings = await response.json();
            } else {
                console.error('Failed to load listings from API');
                listings = [];
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            listings = [];
        }

        loadListings();
    }

    // Event listeners
    addNewListingBtn.addEventListener('click', () => window.location.href = 'add-listing.html');
    addFirstListingBtn.addEventListener('click', () => window.location.href = 'add-listing.html');
    statusFilter.addEventListener('change', filterListings);
    categoryFilter.addEventListener('change', filterListings);
    searchInput.addEventListener('input', filterListings);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    logoutBtn.addEventListener('click', handleLogout);

    function loadListings() {
        const userListings = listings; // Already filtered by API

        if (userListings.length === 0) {
            listingsContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        listingsContainer.innerHTML = '';

        userListings.forEach(listing => {
            const listingEl = createListingElement(listing);
            listingsContainer.appendChild(listingEl);
        });
    }

    function createListingElement(listing) {
        const listingRequests = requests.filter(r => r.listingId === listing.id);
        const approvedRequests = listingRequests.filter(r => r.status === 'Approved');
        const pendingRequests = listingRequests.filter(r => r.status === 'Pending');

        const div = document.createElement('div');
        div.className = 'listing-card';
        div.innerHTML = `
            <div class="listing-image">
                <i class="fas fa-image"></i>
            </div>
            <div class="listing-info">
                <h3 class="listing-title">${listing.title}</h3>
                <p class="listing-category">${listing.category || 'Uncategorized'}</p>
                <div class="listing-details">
                    <span class="detail-item">
                        <i class="fas fa-dollar-sign"></i>
                        $${listing.price || 0} ${listing.priceUnit || 'per unit'}
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-weight"></i>
                        ${listing.quantity || 0} ${listing.unit || 'units'}
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        ${listing.location || 'Not specified'}
                    </span>
                </div>
                <div class="listing-stats">
                    <span class="stat approved">
                        <i class="fas fa-check-circle"></i>
                        ${approvedRequests.length} Approved
                    </span>
                    <span class="stat pending">
                        <i class="fas fa-clock"></i>
                        ${pendingRequests.length} Pending
                    </span>
                </div>
            </div>
            <div class="listing-actions">
                <button class="btn secondary view-btn" data-id="${listing.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn primary edit-btn" data-id="${listing.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn danger delete-btn" data-id="${listing.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        // Add event listeners
        div.querySelector('.view-btn').addEventListener('click', () => viewListing(listing.id));
        div.querySelector('.edit-btn').addEventListener('click', () => editListing(listing.id));
        div.querySelector('.delete-btn').addEventListener('click', () => deleteListing(listing.id));

        return div;
    }

    function filterListings() {
        const statusFilterValue = statusFilter.value;
        const categoryFilterValue = categoryFilter.value;
        const searchValue = searchInput.value.toLowerCase();

        const userListings = listings.filter(l => l.owner === currentUser.email);
        let filteredListings = userListings;

        // Apply status filter
        if (statusFilterValue !== 'all') {
            filteredListings = filteredListings.filter(l =>
                statusFilterValue === 'active' ? l.status !== 'inactive' : l.status === 'inactive'
            );
        }

        // Apply category filter
        if (categoryFilterValue !== 'all') {
            filteredListings = filteredListings.filter(l => l.category === categoryFilterValue);
        }

        // Apply search filter
        if (searchValue) {
            filteredListings = filteredListings.filter(l =>
                l.title.toLowerCase().includes(searchValue) ||
                l.description.toLowerCase().includes(searchValue) ||
                l.category.toLowerCase().includes(searchValue)
            );
        }

        // Update display
        if (filteredListings.length === 0) {
            listingsContainer.innerHTML = '';
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = 'No listings match your filters';
            emptyState.querySelector('p').textContent = 'Try adjusting your search criteria.';
            document.getElementById('add-first-listing').style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            listingsContainer.innerHTML = '';
            filteredListings.forEach(listing => {
                const listingEl = createListingElement(listing);
                listingsContainer.appendChild(listingEl);
            });
        }
    }

    function updateStats() {
        const userListings = listings.filter(l => l.owner === currentUser.email);
        const userRequests = requests.filter(r => {
            const listing = listings.find(l => l.id === r.listingId);
            return listing && listing.owner === currentUser.email;
        });

        const approvedRequests = userRequests.filter(r => r.status === 'Approved');
        const totalEarnings = approvedRequests.reduce((sum, request) => {
            const listing = listings.find(l => l.id === request.listingId);
            return sum + (listing ? listing.price * request.quantity : 0);
        }, 0);

        document.getElementById('total-listings').textContent = userListings.length;
        document.getElementById('active-requests').textContent = userRequests.length;
        document.getElementById('approved-requests').textContent = approvedRequests.length;
        document.getElementById('total-earnings').textContent = `$${totalEarnings.toFixed(2)}`;
    }

    function viewListing(listingId) {
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return;

        const listingRequests = requests.filter(r => r.listingId === listing.id);
        const approvedRequests = listingRequests.filter(r => r.status === 'Approved');
        const pendingRequests = listingRequests.filter(r => r.status === 'Pending');

        document.getElementById('modal-title').textContent = listing.title;
        document.getElementById('modal-body').innerHTML = `
            <div class="listing-details-modal">
                <div class="listing-header">
                    <div class="listing-image-large">
                        <i class="fas fa-image"></i>
                    </div>
                    <div class="listing-info-large">
                        <h3>${listing.title}</h3>
                        <p class="category">${listing.category || 'Uncategorized'}</p>
                        <div class="price-large">
                            <span class="price">$${listing.price || 0}</span>
                            <span class="unit">${listing.priceUnit || 'per unit'}</span>
                        </div>
                    </div>
                </div>

                <div class="listing-content">
                    <div class="detail-section">
                        <h4>Product Details</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Available Quantity:</label>
                                <span>${listing.quantity || 0} ${listing.unit || 'units'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Location:</label>
                                <span>${listing.location || 'Not specified'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Description:</label>
                                <span>${listing.description || 'No description provided'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Certifications:</label>
                                <span>${listing.certifications && listing.certifications.length > 0 ?
                                    listing.certifications.join(', ') : 'None'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="requests-section">
                        <h4>Requests & Activity</h4>
                        <div class="requests-stats">
                            <div class="stat-item">
                                <span class="stat-number">${approvedRequests.length}</span>
                                <span class="stat-label">Approved</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${pendingRequests.length}</span>
                                <span class="stat-label">Pending</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${listingRequests.filter(r => r.status === 'Declined').length}</span>
                                <span class="stat-label">Declined</span>
                            </div>
                        </div>

                        ${approvedRequests.length > 0 ? `
                            <div class="approved-requests">
                                <h5>Approved Requests</h5>
                                ${approvedRequests.map(request => {
                                    const buyer = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.email === request.buyer);
                                    return `
                                        <div class="request-item">
                                            <div class="request-info">
                                                <span class="buyer-name">${buyer ? buyer.name : request.buyer}</span>
                                                <span class="request-quantity">${request.quantity} ${listing.unit || 'units'}</span>
                                            </div>
                                            <div class="request-status approved">
                                                <i class="fas fa-check-circle"></i> Approved
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn secondary" onclick="closeModal()">Close</button>
                    <button class="btn primary edit-btn" data-id="${listing.id}">
                        <i class="fas fa-edit"></i> Edit Listing
                    </button>
                </div>
            </div>
        `;

        // Add edit button listener
        const editBtn = document.querySelector('.edit-btn[data-id="' + listing.id + '"]');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                closeModal();
                editListing(listing.id);
            });
        }

        listingModal.classList.remove('hidden');
    }

    function editListing(listingId) {
        // Store the listing ID to edit and redirect to add listing page
        localStorage.setItem('editListingId', listingId);
        window.location.href = 'add-listing.html';
    }

    function deleteListing(listingId) {
        if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            fetch(`${API_BASE_URL}/api/listings/${listingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete listing');
                }
                // Remove from local array
                listings = listings.filter(l => l.id !== listingId);
                loadListings();
                updateStats();
            })
            .catch(error => {
                console.error('Error deleting listing:', error);
                alert('Failed to delete listing. Please try again.');
            });
        }
    }

    function closeModal() {
        listingModal.classList.add('hidden');
    }

    function handleLogout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
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