// js/add-listing.js

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

    // Initialize data - no need to load listings for add-listing page

    // Check if editing existing listing
    const editListingId = localStorage.getItem('editListingId');
    let editingListing = null;

    if (editListingId) {
        editingListing = listings.find(l => l.id === editListingId);
        if (editingListing) {
            document.querySelector('h2').innerHTML = '<i class="fas fa-edit"></i> Edit Listing';
            document.querySelector('.page-header p').textContent = 'Update your product listing information';
            populateFormForEditing(editingListing);
        }
        localStorage.removeItem('editListingId');
    }

    // DOM elements
    const logoutBtn = document.getElementById('logout-btn');

    // Initialize multi-step form
    initMultiStepForm();

    // Load any previously saved form state
    loadFormState();

    // Show first step
    showFormStep(1);

    // Event listeners
    logoutBtn.addEventListener('click', handleLogout);

    // Initialize data storage for form steps
    let formData = {
        step1: {},
        step2: {},
        step3: {},
        step4: {}
    };

    function initMultiStepForm() {
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
            input.addEventListener('input', function() {
                updateFormData();
                updatePreview();
            });
            
            input.addEventListener('change', function() {
                updateFormData();
                updatePreview();
            });
        });

        // Initialize preview
        updatePreview();
    }

    function updateFormData() {
        const currentStep = getCurrentStep();
        
        switch(currentStep) {
            case 1:
                formData.step1 = {
                    title: document.getElementById('listing-title').value,
                    category: document.getElementById('listing-category').value,
                    quantity: document.getElementById('listing-quantity').value,
                    unit: document.getElementById('listing-unit').value
                };
                break;
            case 2:
                formData.step2 = {
                    price: document.getElementById('listing-price').value,
                    priceUnit: document.getElementById('price-unit').value,
                    minOrder: document.getElementById('listing-min-order').value
                };
                break;
            case 3:
                formData.step3 = {
                    location: document.getElementById('listing-location').value,
                    description: document.getElementById('listing-description').value,
                    certifications: Array.from(document.querySelectorAll('input[name="certifications"]:checked')).map(cb => cb.value)
                };
                break;
        }
    }

    function populateFormForEditing(listing) {
        // Populate form fields with existing listing data
        document.getElementById('listing-title').value = listing.title || '';
        document.getElementById('listing-category').value = listing.category || '';
        document.getElementById('listing-quantity').value = listing.quantity || '';
        document.getElementById('listing-unit').value = listing.unit || '';
        document.getElementById('listing-price').value = listing.price || '';
        document.getElementById('price-unit').value = listing.priceUnit || '';
        document.getElementById('listing-min-order').value = listing.minOrder || '';
        document.getElementById('listing-location').value = listing.location || '';
        document.getElementById('listing-description').value = listing.description || '';

        // Populate certifications
        if (listing.certifications && listing.certifications.length > 0) {
            listing.certifications.forEach(cert => {
                const checkbox = document.querySelector(`input[name="certifications"][value="${cert}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.closest('.certification-item').classList.add('selected');
                }
            });
        }

        // Update preview
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

        // Scroll to top of form
        const formContainer = document.querySelector('.multi-step-form');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function nextStep() {
        const currentStep = getCurrentStep();
        if (currentStep < 4) {
            // Update form data before moving
            updateFormData();
            
            // Validate current step
            if (validateStep(currentStep)) {
                showFormStep(currentStep + 1);
                // Save form state to session
                saveFormState();
            }
        }
    }

    function prevStep() {
        const currentStep = getCurrentStep();
        if (currentStep > 1) {
            // Save current step data before going back
            updateFormData();
            saveFormState();
            showFormStep(currentStep - 1);
        }
    }

    function saveFormState() {
        // Save form state to sessionStorage for persistence during this session
        sessionStorage.setItem('listingFormData', JSON.stringify(formData));
    }

    function loadFormState() {
        // Load form state from sessionStorage if available
        const saved = sessionStorage.getItem('listingFormData');
        if (saved) {
            try {
                formData = JSON.parse(saved);
            } catch(e) {
                console.log('Could not load saved form state');
            }
        }
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
                <div style="color: #ff6b6b; background: rgba(255, 107, 107, 0.15); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff6b6b;">
                    <strong style="display: block; margin-bottom: 10px;">⚠️ Please fix the following errors:</strong>
                    <ul style="margin: 0; padding-left: 20px; list-style: none;">
                        ${errors.map(error => `<li style="padding: 5px 0;">✗ ${error}</li>`).join('')}
                    </ul>
                </div>
            `;
            const stepContent = currentStep.querySelector('.step-content');
            if (stepContent) {
                stepContent.insertBefore(errorDiv, stepContent.firstChild);
            }
            
            // Auto-scroll to error
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function hideValidationErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => el.remove(), 300);
        });
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
        // Update preview content
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

        // Update preview elements
        document.getElementById('preview-title').textContent = title;
        document.getElementById('preview-category').textContent = category;
        document.getElementById('preview-quantity').textContent = `${quantity} ${unit}`;
        document.getElementById('preview-price').textContent = priceUnit ? `$${price} ${priceUnit.replace('$ per ', 'per ')}` : `$${price}`;
        document.getElementById('preview-location').textContent = location;
        document.getElementById('preview-description').textContent = description.length > 50 ? description.substring(0, 50) + '...' : description;

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

    // Form submission
    document.getElementById('listing-form').addEventListener('submit', function(e) {
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
            title: document.getElementById('listing-title').value,
            category: document.getElementById('listing-category').value,
            price: parseFloat(document.getElementById('listing-price').value),
            unit: document.getElementById('listing-unit').value,
            quantity: parseInt(document.getElementById('listing-quantity').value),
            location: document.getElementById('listing-location').value,
            description: document.getElementById('listing-description').value,
            harvest_date: document.getElementById('listing-harvest-date').value || null,
            certifications: certifications
        };

        // Basic validation
        if (!listingData.title || !listingData.category || !listingData.price || !listingData.unit || !listingData.quantity || !listingData.location || !listingData.description) {
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

        // Submit to API
        const url = editingListing ? `${API_BASE_URL}/api/listings/${editingListing.id}` : `${API_BASE_URL}/api/listings`;
        const method = editingListing ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(listingData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save listing');
            }
            return response.json();
        })
        .then(data => {
            // Clear form state
            sessionStorage.removeItem('listingFormData');

            // Success message and redirect
            const action = editingListing ? 'updated' : 'created';
            const message = editingListing
                ? 'Listing updated successfully! Redirecting to your listings...'
                : 'Listing created successfully! Redirecting to your listings...';

            alert(message);

            // Redirect to my listings page
            setTimeout(() => {
                window.location.href = 'my-listings.html';
            }, 1500);
        })
        .catch(error => {
            console.error('Error saving listing:', error);
            alert('Failed to save listing. Please try again.');
        });
    });

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

const API_BASE_URL = window.location.origin; // Use same origin as frontend