// demo-multi-step.js - Demo scenarios for multi-step form

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the demo
    initDemo();

    // Demo control buttons
    document.getElementById('demo-valid').addEventListener('click', runValidDemo);
    document.getElementById('demo-invalid').addEventListener('click', runInvalidDemo);
    document.getElementById('demo-partial').addEventListener('click', runPartialDemo);
});

function initDemo() {
    // Show the modal
    const modal = document.getElementById('add-listing-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Initialize multi-step form
    initMultiStepForm();

    // Reset to first step
    showFormStep(1);

    // Hide demo results initially
    document.getElementById('demo-results').style.display = 'none';
}

function runValidDemo() {
    console.log('Running Valid Demo...');

    // Fill form with valid data
    fillValidData();

    // Navigate through all steps
    setTimeout(() => showFormStep(2), 500);
    setTimeout(() => showFormStep(3), 1000);
    setTimeout(() => showFormStep(4), 1500);

    // Show success result
    setTimeout(() => {
        showDemoResult('✅ Valid Form Demo Complete', `
            <p><strong>Scenario:</strong> All required fields filled correctly</p>
            <p><strong>Result:</strong> Form progresses through all steps successfully</p>
            <p><strong>Validation:</strong> No errors displayed</p>
            <p><strong>Preview:</strong> Complete listing preview shown</p>
            <p><strong>Submit:</strong> Form ready for submission</p>
        `, 'success');
    }, 2000);
}

function runInvalidDemo() {
    console.log('Running Invalid Demo...');

    // Fill form with invalid data
    fillInvalidData();

    // Try to navigate to next step (should fail)
    setTimeout(() => {
        const nextBtn = document.querySelector('.nav-btn.next');
        if (nextBtn) nextBtn.click();
    }, 500);

    // Show error result
    setTimeout(() => {
        showDemoResult('❌ Invalid Form Demo Complete', `
            <p><strong>Scenario:</strong> Required fields left empty or invalid</p>
            <p><strong>Result:</strong> Form validation prevents progression</p>
            <p><strong>Errors:</strong> Red error messages displayed</p>
            <p><strong>Behavior:</strong> User cannot proceed to next step</p>
            <p><strong>UX:</strong> Clear feedback on what needs to be fixed</p>
        `, 'error');
    }, 1000);
}

function runPartialDemo() {
    console.log('Running Partial Demo...');

    // Fill only some fields
    fillPartialData();

    // Navigate to step 2
    setTimeout(() => showFormStep(2), 500);

    // Try to proceed without completing step 2
    setTimeout(() => {
        const nextBtn = document.querySelector('.nav-btn.next');
        if (nextBtn) nextBtn.click();
    }, 1000);

    // Show partial result
    setTimeout(() => {
        showDemoResult('⚠️ Partial Completion Demo Complete', `
            <p><strong>Scenario:</strong> Some fields completed, others missing</p>
            <p><strong>Result:</strong> Step-by-step validation catches incomplete data</p>
            <p><strong>Preview:</strong> Shows partial information in real-time</p>
            <p><strong>Navigation:</strong> Can move back/forward but validation blocks submission</p>
            <p><strong>UX:</strong> Progressive disclosure with immediate feedback</p>
        `, 'warning');
    }, 1500);
}

function fillValidData() {
    // Step 1
    document.getElementById('listing-title').value = 'Premium Organic Tomatoes';
    document.getElementById('listing-category').value = 'vegetables';
    document.getElementById('listing-quantity').value = '500';
    document.getElementById('listing-unit').value = 'kg';

    // Step 2
    document.getElementById('listing-price').value = '3.50';
    document.getElementById('price-unit').value = 'kg';
    document.getElementById('listing-min-order').value = '25';

    // Step 3
    document.getElementById('listing-location').value = 'Green Valley Farm, California';
    document.getElementById('listing-description').value = 'Fresh, vine-ripened organic tomatoes grown using sustainable farming practices. These tomatoes are hand-picked at peak ripeness and packed within hours of harvest to ensure maximum freshness and flavor.';

    // Select some certifications
    document.querySelector('input[value="organic"]').checked = true;
    document.querySelector('input[value="sustainable"]').checked = true;
    document.querySelector('input[value="local"]').checked = true;

    // Update preview
    updatePreview();
}

function fillInvalidData() {
    // Step 1 - Leave required fields empty
    document.getElementById('listing-title').value = '';
    document.getElementById('listing-category').value = '';
    document.getElementById('listing-quantity').value = '';
    document.getElementById('listing-unit').value = '';

    // Step 2 - Invalid price
    document.getElementById('listing-price').value = '-5';
    document.getElementById('price-unit').value = '';

    // Step 3 - Empty required fields
    document.getElementById('listing-location').value = '';
    document.getElementById('listing-description').value = '';

    // Update preview
    updatePreview();
}

function fillPartialData() {
    // Step 1 - Complete
    document.getElementById('listing-title').value = 'Fresh Apples';
    document.getElementById('listing-category').value = 'fruits';
    document.getElementById('listing-quantity').value = '200';
    document.getElementById('listing-unit').value = 'kg';

    // Step 2 - Partial (missing price unit)
    document.getElementById('listing-price').value = '2.25';
    document.getElementById('price-unit').value = ''; // Intentionally left empty
    document.getElementById('listing-min-order').value = '10';

    // Step 3 - Partial (missing description)
    document.getElementById('listing-location').value = 'Orchard Hills Farm';
    document.getElementById('listing-description').value = ''; // Intentionally left empty

    // Update preview
    updatePreview();
}

function showDemoResult(title, content, type) {
    const resultsDiv = document.getElementById('demo-results');
    const resultsContent = document.getElementById('results-content');

    resultsDiv.style.display = 'block';
    resultsContent.innerHTML = content;

    // Style based on type
    resultsDiv.style.borderLeft = type === 'success' ? '4px solid #27ae60' :
                                 type === 'error' ? '4px solid #e74c3c' :
                                 '4px solid #f39c12';

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Multi-step form functions (copied from farmer-dashboard.js)
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
            <div style="color: #e74c3c; background: #ffeaea; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
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

// Modal close functionality
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('add-listing-modal').classList.add('hidden');
    document.body.style.overflow = '';
});

// Form submission (demo only)
document.getElementById('listing-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Demo: Form would be submitted here!\n\nIn the real application, this would save the listing to localStorage and update the UI.');
});