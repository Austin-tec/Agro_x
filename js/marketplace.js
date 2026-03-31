// js/marketplace.js

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication - but allow guests to view marketplace with limited features
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isLoggedIn = !!localStorage.getItem('authToken');
    
    // If not logged in, show demo message but allow browsing
    if (!isLoggedIn) {
        console.log('User is browsing marketplace as guest');
    }

    async function checkUserWaitlistStatus() {
        if (!currentUser?.email) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/waitlist/check/${encodeURIComponent(currentUser.email)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.in_waitlist && data.status === 'pending') {
                    alert(`⏳ You are currently #${data.position} on the waitlist. Please wait until approval.`);
                    window.location.href = 'waitlist.html';
                    return true;
                }
            }
        } catch (err) {
            console.error('Error checking waitlist status', err);
        }
        return false;
    }

    // Initialize data from API
    let listings = [];
    let requests = [];
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks_' + currentUser.email) || '[]');

    // API base URL
    const API_BASE_URL = window.location.origin; // Use same origin as frontend

    checkUserWaitlistStatus().then(blocked => {
        if (!blocked) {
            initMarketplace();
        }
    });

    // Load listings from API
    async function loadListings() {
        try {
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/listings`, {
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                listings = data.listings || data || [];
            } else {
                console.error('Failed to load listings from API');
                // Fallback to sample data if API fails
                listings = getSampleListings();
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            listings = getSampleListings();
        }
    }

    // Sample listings for fallback
    function getSampleListings() {
        return [
            {
                id: "1",
                title: "Fresh Organic Tomatoes",
                category: "vegetables",
                price: 2.5,
                unit: "kg",
                quantity: 500,
                location: "Northern Region",
                harvest_date: "2026-02-28",
                description: "Freshly harvested organic tomatoes, grown without pesticides. Perfect for retail or direct consumption.",
                farmer_id: 1,
                created_at: new Date().toISOString(),
                status: "active"
            },
            {
                id: "2",
                title: "Premium Wheat",
                category: "grains",
                price: 245,
                unit: "ton",
                quantity: 50,
                location: "Western Region",
                harvest_date: "2026-02-15",
                description: "High-quality wheat suitable for flour production. Certified quality with excellent protein content.",
                farmer_id: 2,
                created_at: new Date().toISOString(),
                status: "active"
            },
            {
                id: "3",
                title: "Climate-Controlled Warehouse Storage",
                category: "storage",
                price: 0.75,
                unit: "bag/month",
                quantity: 10000,
                location: "Central Valley",
                description: "Professional storage facility with temperature and humidity control. Suitable for maize, grains, and produce.",
                farmer_id: 3,
                created_at: new Date().toISOString(),
                status: "active"
            },
            {
                id: "4",
                title: "Fresh Dairy Products",
                category: "dairy",
                price: 2.5,
                unit: "L (Milk)",
                quantity: 500,
                location: "Southern Farm District",
                description: "Fresh milk, yogurt, and cheese from our certified dairy farm. Daily production with cold chain delivery available.",
                farmer_id: 4,
                created_at: new Date().toISOString(),
                status: "active"
            },
            {
                id: "5",
                title: "Express Logistics - Refrigerated Transport",
                category: "logistics",
                price: 1200,
                unit: "trip",
                quantity: 15,
                location: "Central Hub",
                description: "Refrigerated truck transport service. Perfect for perishables. Daily routes available throughout the region.",
                farmer_id: 5,
                created_at: new Date().toISOString(),
                status: "active"
            }
        ];
    }

    // Initialize demo requests if none exist
    if (requests.length === 0) {
        const now = Date.now();
        requests = [
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
                listingId: '5',
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
        localStorage.setItem('requests', JSON.stringify(requests));
    }
    
    // DOM elements
    const listingsContainer = document.getElementById('listings-container');
    const categoryFilter = document.getElementById('category-filter');
    const categoryItems = document.querySelectorAll('.category-list li');
    const viewOptions = document.querySelectorAll('.view-option');
    const addListingBtn = document.getElementById('add-listing-btn');
    const addListingModal = document.getElementById('add-listing-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const advancedFilterToggle = document.getElementById('advanced-filter-toggle');
    const advancedFilters = document.getElementById('advanced-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelector('.search-bar input');
    
    // Current filter state
    let currentFilters = {
        category: 'all',
        location: 'all',
        sort: 'newest',
        priceMin: null,
        priceMax: null,
        quantity: null,
        certifications: []
    };
    
    // Initialize marketplace
    async function initMarketplace() {
        await loadListings();
        renderListings(listings);
        setupEventListeners();
    }
    
    // Render listings to the DOM
    function renderListings(listings) {
        if (!listingsContainer) return;
        
        listingsContainer.innerHTML = '';
        
        if (listings.length === 0) {
            listingsContainer.innerHTML = `
                <div class="no-listings">
                    <i class="fas fa-search"></i>
                    <h3>No listings found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
            return;
        }
        
        listings.forEach(listing => {
            const listingElement = createListingElement(listing);
            listingsContainer.appendChild(listingElement);
        });
    }
    
    // Create listing HTML element
    function createListingElement(listing) {
        const isGridView = listingsContainer.classList.contains('grid-view');
        
        // Determine icon based on category
        let icon = 'fas fa-seedling';
        if (listing.category === 'vegetables') icon = 'fas fa-carrot';
        if (listing.category === 'fruits') icon = 'fas fa-apple-alt';
        if (listing.category === 'storage') icon = 'fas fa-warehouse';
        if (listing.category === 'logistics') icon = 'fas fa-truck';
        if (listing.category === 'inputs') icon = 'fas fa-tractor';
        if (listing.category === 'dairy') icon = 'fas fa-cheese';
        
        // Format price
        const priceFormatted = listing.unit === 'ton' || listing.unit === 'trip' 
            ? `$${listing.price}/${listing.unit}` 
            : `$${listing.price}/${listing.unit}`;
        
        // Create certifications badges
        let certificationsHTML = '';
        if (listing.certifications && listing.certifications.length > 0) {
            certificationsHTML = listing.certifications.map(cert => 
                `<span class="cert-badge">${cert}</span>`
            ).join('');
        }
        
        if (isGridView) {
            return createGridViewListing(listing, icon, priceFormatted, certificationsHTML);
        } else {
            return createListViewListing(listing, icon, priceFormatted, certificationsHTML);
        }
    }
    
    function createGridViewListing(listing, icon, priceFormatted, certificationsHTML) {
        const isBookmarked = bookmarks.includes(listing.id);
        const element = document.createElement('div');
        element.className = 'listing-card';
        element.innerHTML = `
            <div class="listing-image">
                <i class="${icon}"></i>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <div>
                        <h3 class="listing-title">${listing.title}</h3>
                        <div class="listing-category">${formatCategory(listing.category)}</div>
                    </div>
                    <div class="listing-price">${priceFormatted}</div>
                </div>
                <div class="listing-details">
                    <p>${listing.description ? listing.description.substring(0, 80) + '...' : 'No description'}</p>
                </div>
                <div class="listing-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${listing.location}</span>
                    <span><i class="fas fa-boxes"></i> ${listing.quantity} ${listing.unit}</span>
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
        element.querySelector('.request-btn').addEventListener('click', () => openRequestModal(listing.id));
        element.querySelector('.bookmark-btn').addEventListener('click', () => toggleBookmark(listing.id));
        
        return element;
    }
    
    function createListViewListing(listing, icon, priceFormatted, certificationsHTML) {
        const isBookmarked = bookmarks.includes(listing.id);
        const element = document.createElement('div');
        element.className = 'listing-card';
        element.innerHTML = `
            <div class="listing-image">
                <i class="${icon}"></i>
            </div>
            <div class="listing-content">
                <div class="listing-header">
                    <div>
                        <h3 class="listing-title">${listing.title}</h3>
                        <div class="listing-category">${formatCategory(listing.category)}</div>
                    </div>
                    <div class="listing-price">${priceFormatted}</div>
                </div>
                <div class="listing-details">
                    <p>${listing.description ? listing.description : 'No description'}</p>
                    <div class="listing-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${listing.location}</span>
                        <span><i class="fas fa-boxes"></i> ${listing.quantity} ${listing.unit}</span>
                        ${listing.harvest_date ? `<span><i class="fas fa-calendar-alt"></i> ${listing.harvest_date}</span>` : ''}
                    </div>
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
        element.querySelector('.request-btn').addEventListener('click', () => openRequestModal(listing.id));
        element.querySelector('.bookmark-btn').addEventListener('click', () => toggleBookmark(listing.id));
        
        return element;
    }
    
    // Format category for display
    function formatCategory(category) {
        const categories = {
            'grains': 'Grains & Cereals',
            'vegetables': 'Vegetables',
            'fruits': 'Fruits',
            'dairy': 'Dairy & Livestock',
            'storage': 'Storage Facilities',
            'logistics': 'Logistics Services',
            'inputs': 'Farming Inputs',
            'all': 'All Categories'
        };
        return categories[category] || category;
    }
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Filter listings based on current filters
    function filterListings() {
        let filtered = [...listings];
        
        // Filter by category
        if (currentFilters.category !== 'all') {
            filtered = filtered.filter(listing => listing.category === currentFilters.category);
        }
        
        // Filter by location
        if (currentFilters.location !== 'all') {
            filtered = filtered.filter(listing => 
                listing.location.toLowerCase().includes(currentFilters.location)
            );
        }
        
        // Filter by price range
        if (currentFilters.priceMin !== null) {
            filtered = filtered.filter(listing => listing.price >= currentFilters.priceMin);
        }
        
        if (currentFilters.priceMax !== null) {
            filtered = filtered.filter(listing => listing.price <= currentFilters.priceMax);
        }
        
        // Filter by minimum quantity
        if (currentFilters.quantity !== null) {
            filtered = filtered.filter(listing => listing.quantity >= currentFilters.quantity);
        }
        
        // Filter by certifications
        if (currentFilters.certifications.length > 0) {
            filtered = filtered.filter(listing => 
                currentFilters.certifications.every(cert => 
                    (listing.certifications || []).includes(cert)
                )
            );
        }
        
        // Sort listings
        filtered.sort((a, b) => {
            switch (currentFilters.sort) {
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'newest':
                default:
                    // Sort by created_at or id - prefer created_at if available
                    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return bDate - aDate;
            }
        });
        
        return filtered;
    }
    
    // Apply filters and update listings
    function applyFilters() {
        // Get filter values from UI
        currentFilters.category = categoryFilter ? categoryFilter.value : 'all';
        currentFilters.location = document.getElementById('location-filter') ? document.getElementById('location-filter').value : 'all';
        currentFilters.sort = document.getElementById('sort-filter') ? document.getElementById('sort-filter').value : 'newest';
        
        // Get advanced filter values
        const priceMin = document.getElementById('price-min-slider');
        const priceMax = document.getElementById('price-max-slider');
        const quantityFilter = document.getElementById('quantity-filter');
        
        currentFilters.priceMin = priceMin && priceMin.value ? parseFloat(priceMin.value) : null;
        currentFilters.priceMax = priceMax && priceMax.value ? parseFloat(priceMax.value) : null;
        currentFilters.quantity = quantityFilter && quantityFilter.value ? parseFloat(quantityFilter.value) : null;
        
        // Get certification checkboxes
        currentFilters.certifications = [];
        document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(checkbox => {
            currentFilters.certifications.push(checkbox.value);
        });
        
        // Apply search term if any
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            const searchFiltered = filterListings().filter(listing => {
                const sellerOrOwner = (listing.seller || listing.owner || '').toString().toLowerCase();
                const description = (listing.description || '').toString().toLowerCase();
                return listing.title.toLowerCase().includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    sellerOrOwner.includes(searchTerm);
            });
            renderListings(searchFiltered);
        } else {
            const filteredListings = filterListings();
            renderListings(filteredListings);
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Category filter change
        if (categoryFilter) {
            categoryFilter.addEventListener('change', applyFilters);
        }
        
        // Category sidebar items
        categoryItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                categoryItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Update category filter
                const category = this.getAttribute('data-category');
                if (categoryFilter) {
                    categoryFilter.value = category;
                    applyFilters();
                }
            });
        });
        
        // View toggle
        viewOptions.forEach(option => {
            option.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                
                // Update active button
                viewOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Update listings container class
                listingsContainer.className = 'listings-container ' + view + '-view';
                
                // Re-render listings with new view
                applyFilters();
            });
        });
        
        // Add listing button
        if (addListingBtn) {
            addListingBtn.addEventListener('click', function() {
                addListingModal.classList.remove('hidden');
            });
        }
        
        // Close modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                addListingModal.classList.add('hidden');
            });
        }
        
        // Close modal when clicking outside
        if (addListingModal) {
            addListingModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.add('hidden');
                }
            });
        }
        
        // Advanced filter toggle
        if (advancedFilterToggle && advancedFilters) {
            advancedFilterToggle.addEventListener('click', function() {
                advancedFilters.classList.toggle('hidden');
                this.querySelector('i').classList.toggle('fa-filter');
                this.querySelector('i').classList.toggle('fa-times');
            });
        }
        
        // Reset filters
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                // Reset all filter inputs
                if (categoryFilter) categoryFilter.value = 'all';
                if (document.getElementById('location-filter')) document.getElementById('location-filter').value = 'all';
                if (document.getElementById('sort-filter')) document.getElementById('sort-filter').value = 'newest';
                
                const priceMin = document.getElementById('price-min-slider');
                const priceMax = document.getElementById('price-max-slider');
                const quantityFilter = document.getElementById('quantity-filter');
                
                if (priceMin) priceMin.value = '';
                if (priceMax) priceMax.value = '';
                if (quantityFilter) quantityFilter.value = '';
                if (document.getElementById('harvest-date-filter')) document.getElementById('harvest-date-filter').value = '';
                
                // Uncheck all certification checkboxes
                document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                
                // Reset category sidebar
                categoryItems.forEach(item => item.classList.remove('active'));
                if (categoryItems.length > 0) categoryItems[0].classList.add('active');
                
                // Clear search
                if (searchInput) searchInput.value = '';
                
                // Apply filters
                applyFilters();
            });
        }
        
        // Apply filters button
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', applyFilters);
        }
        
        // Search button
        if (searchButton) {
            searchButton.addEventListener('click', applyFilters);
        }
        
        // Search on Enter key
        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }
        
        // Multi-step form in modal
        const nextStepButtons = document.querySelectorAll('.next-step');
        const prevStepButtons = document.querySelectorAll('.prev-step');
        const formSteps = document.querySelectorAll('.form-step');
        
        nextStepButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStep = this.closest('.form-step');
                const nextStepId = this.getAttribute('data-next');
                const nextStep = document.getElementById(`step-${nextStepId}`);
                
                if (currentStep && nextStep) {
                    currentStep.classList.remove('active');
                    currentStep.classList.add('hidden');
                    nextStep.classList.remove('hidden');
                    nextStep.classList.add('active');
                }
            });
        });
        
        prevStepButtons.forEach(button => {
            button.addEventListener('click', function() {
                const currentStep = this.closest('.form-step');
                const prevStepId = this.getAttribute('data-prev');
                const prevStep = document.getElementById(`step-${prevStepId}`);
                
                if (currentStep && prevStep) {
                    currentStep.classList.remove('active');
                    currentStep.classList.add('hidden');
                    prevStep.classList.remove('hidden');
                    prevStep.classList.add('active');
                }
            });
        });
        
        // Listing form submission
        const listingForm = document.getElementById('listing-form');
        if (listingForm) {
            listingForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                // In a real app, you would send this to a server
                console.log('New listing data:', data);
                
                // Show success message
                alert('Listing submitted successfully! It will be visible after review.');
                
                // Close modal
                addListingModal.classList.add('hidden');
                
                // Reset form
                this.reset();
                
                // Reset form steps
                formSteps.forEach(step => {
                    step.classList.remove('active', 'hidden');
                });
                document.getElementById('step-1').classList.add('active');
                document.getElementById('step-2').classList.add('hidden');
                document.getElementById('step-3').classList.add('hidden');
            });
        }
        
        // Delegate events for dynamically created listing buttons
        document.addEventListener('click', function(e) {
            // Save button (now bookmark)
            if (e.target.closest('.bookmark-btn')) {
                const button = e.target.closest('.bookmark-btn');
                const listingId = button.getAttribute('data-id');
                toggleBookmark(listingId);
            }
            
            // Request button
            if (e.target.closest('.request-btn')) {
                const button = e.target.closest('.request-btn');
                const listingId = button.getAttribute('data-id');
                openRequestModal(listingId);
            }
        });
    }
    
    // Request modal functions
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
    
    // Toggle bookmark
    function toggleBookmark(listingId) {
        const index = bookmarks.indexOf(listingId);
        if (index === -1) {
            bookmarks.push(listingId);
        } else {
            bookmarks.splice(index, 1);
        }
        localStorage.setItem('bookmarks_' + currentUser.email, JSON.stringify(bookmarks));
        // Refresh listings to update bookmark buttons
        renderListings(listings);
    }
    
    // Send request
    function sendRequest(listingId, quantity, message) {
        const submitBtn = sendRequestForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            const listing = listings.find(l => l.id === listingId);
            if (!listing) {
                throw new Error('Listing not found');
            }
            
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
            
            // Add notification for provider
            const providerNotifications = JSON.parse(localStorage.getItem('notifications_' + listing.owner) || '[]');
            providerNotifications.unshift({
                id: Date.now().toString(),
                type: 'new_request',
                title: 'New Purchase Request',
                message: `${currentUser.name} sent a request for ${quantity} ${listing.unit} of ${listing.title}`,
                relatedId: request.id,
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('notifications_' + listing.owner, JSON.stringify(providerNotifications));
            
            // Success feedback
            alert('Request sent successfully!');
            closeRequestModal();
            
        } catch (error) {
            console.error('Error sending request:', error);
            alert('Failed to send request. Please try again.');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    // DOM elements for request modal
    const requestModal = document.getElementById('request-modal');
    const closeRequestModalBtn = document.getElementById('close-request-modal');
    const sendRequestForm = document.getElementById('send-request-form');
    const cancelRequestBtn = document.getElementById('cancel-request-btn');
    
    // Event listeners for request modal
    if (closeRequestModalBtn) closeRequestModalBtn.addEventListener('click', closeRequestModal);
    if (cancelRequestBtn) cancelRequestBtn.addEventListener('click', closeRequestModal);
    if (sendRequestForm) {
        sendRequestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const listingId = requestModal.dataset.listingId;
            const quantity = document.getElementById('request-quantity').value;
            const message = document.getElementById('request-message').value;
            
            if (listingId && quantity) {
                sendRequest(listingId, quantity, message);
            }
        });
    }
    
    // Initialize the marketplace
    initMarketplace().catch(console.error);
});