// demo-conditionals.js - Interactive demo of conditional logic

document.addEventListener('DOMContentLoaded', function() {
    // Interactive validation demos
    document.getElementById('test-basic').addEventListener('click', testBasicValidation);
    document.getElementById('test-pricing').addEventListener('click', testPricingValidation);
    document.getElementById('test-details').addEventListener('click', testDetailsValidation);

    // Real form demo
    document.getElementById('open-real-form').addEventListener('click', openRealForm);
    document.getElementById('close-real-modal').addEventListener('click', closeRealForm);
});

function testBasicValidation() {
    const title = document.getElementById('demo-title').value.trim();
    const quantity = parseFloat(document.getElementById('demo-quantity').value);

    let isValid = true;
    const errors = [];

    // Demonstrate IF/ELSE logic
    console.log('=== BASIC VALIDATION LOGIC ===');

    // IF title is empty
    if (!title) {
        console.log('❌ IF (!title): Title is empty - adding error');
        errors.push('Product title is required');
        isValid = false;
    } else {
        console.log('✅ ELSE: Title is provided:', title);
    }

    // IF quantity is invalid
    if (!quantity || quantity <= 0) {
        console.log('❌ IF (!quantity || quantity <= 0): Invalid quantity -', quantity);
        errors.push('Valid quantity is required (must be greater than 0)');
        isValid = false;
    } else {
        console.log('✅ ELSE: Valid quantity:', quantity);
    }

    // IF validation failed
    if (!isValid) {
        console.log('❌ IF (!isValid): Validation failed, showing errors');
        showValidationResult('Basic Validation Failed', errors, 'error');
    } else {
        console.log('✅ ELSE: Validation passed');
        showValidationResult('Basic Validation Passed', ['All basic information is valid!'], 'success');
    }
}

function testPricingValidation() {
    const price = parseFloat(document.getElementById('demo-price').value);
    const priceUnit = document.getElementById('demo-price-unit').value;

    let isValid = true;
    const errors = [];

    console.log('=== PRICING VALIDATION LOGIC ===');

    // IF price is invalid
    if (!price || price <= 0) {
        console.log('❌ IF (!price || price <= 0): Invalid price -', price);
        errors.push('Valid price is required (must be greater than 0)');
        isValid = false;
    } else {
        console.log('✅ ELSE: Valid price:', price);
    }

    // IF price unit not selected
    if (!priceUnit) {
        console.log('❌ IF (!priceUnit): Price unit not selected');
        errors.push('Price unit is required');
        isValid = false;
    } else {
        console.log('✅ ELSE: Price unit selected:', priceUnit);
    }

    if (!isValid) {
        showValidationResult('Pricing Validation Failed', errors, 'error');
    } else {
        showValidationResult('Pricing Validation Passed', ['Pricing information is valid!'], 'success');
    }
}

function testDetailsValidation() {
    const location = document.getElementById('demo-location').value.trim();
    const description = document.getElementById('demo-description').value.trim();

    let isValid = true;
    const errors = [];

    console.log('=== DETAILS VALIDATION LOGIC ===');

    // IF location is empty
    if (!location) {
        console.log('❌ IF (!location): Location is empty');
        errors.push('Location is required');
        isValid = false;
    } else {
        console.log('✅ ELSE: Location provided:', location);
    }

    // IF description is empty
    if (!description) {
        console.log('❌ IF (!description): Description is empty');
        errors.push('Product description is required');
        isValid = false;
    } else {
        console.log('✅ ELSE: Description provided');
    }

    if (!isValid) {
        showValidationResult('Details Validation Failed', errors, 'error');
    } else {
        showValidationResult('Details Validation Passed', ['All details are valid!'], 'success');
    }
}

function showValidationResult(title, messages, type) {
    const resultDiv = document.getElementById('validation-result');
    resultDiv.innerHTML = `
        <div class="demo-result result-${type}">
            <strong>${title}</strong>
            <ul>
                ${messages.map(msg => `<li>${msg}</li>`).join('')}
            </ul>
        </div>
    `;
}

function openRealForm() {
    const container = document.getElementById('real-form-container');
    container.style.display = 'block';

    // Scroll to form
    container.scrollIntoView({ behavior: 'smooth' });

    // Initialize the real form
    initRealForm();
}

function closeRealForm() {
    document.getElementById('real-form-container').style.display = 'none';
}

function initRealForm() {
    // Initialize multi-step form for real demo
    initRealMultiStepForm();

    // Reset to first step
    showRealFormStep(1);

    // Update status indicators
    updateValidationStatus();
}

function initRealMultiStepForm() {
    // Add event listeners for navigation buttons
    document.querySelectorAll('#real-listing-form .nav-btn.next').forEach(btn => {
        btn.addEventListener('click', () => nextRealStep());
    });

    document.querySelectorAll('#real-listing-form .nav-btn.prev').forEach(btn => {
        btn.addEventListener('click', () => prevRealStep());
    });

    // Add input listeners to update validation status
    document.querySelectorAll('#real-listing-form input, #real-listing-form select, #real-listing-form textarea').forEach(input => {
        input.addEventListener('input', updateValidationStatus);
    });
}

function showRealFormStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('#real-listing-form .form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById('real-step-' + stepNumber);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress indicators
    updateRealProgressIndicators(stepNumber);

    // Update navigation buttons
    updateRealNavigationButtons(stepNumber);

    // Update validation status
    updateValidationStatus();
}

function nextRealStep() {
    const currentStep = getRealCurrentStep();
    if (validateRealStep(currentStep)) {
        showRealFormStep(currentStep + 1);
    }
}

function prevRealStep() {
    const currentStep = getRealCurrentStep();
    showRealFormStep(currentStep - 1);
}

function getRealCurrentStep() {
    const activeStep = document.querySelector('#real-listing-form .form-step.active');
    if (activeStep) {
        return parseInt(activeStep.id.replace('real-step-', ''));
    }
    return 1;
}

function validateRealStep(stepNumber) {
    let isValid = true;
    const errors = [];

    console.log(`=== VALIDATING REAL STEP ${stepNumber} ===`);

    switch (stepNumber) {
        case 1: // Basic Info
            const title = document.getElementById('real-listing-title').value.trim();
            const category = document.getElementById('real-listing-category').value;
            const quantity = document.getElementById('real-listing-quantity').value;
            const unit = document.getElementById('real-listing-unit').value;

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
            const price = document.getElementById('real-listing-price').value;
            const priceUnit = document.getElementById('real-price-unit').value;

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
            const description = document.getElementById('real-listing-description').value.trim();
            const location = document.getElementById('real-listing-location').value.trim();

            if (!description) {
                errors.push('Product description is required');
                isValid = false;
            }
            if (!location) {
                errors.push('Location is required');
                isValid = false;
            }
            break;
    }

    // Show errors if any
    if (!isValid) {
        showRealValidationErrors(errors);
    } else {
        hideRealValidationErrors();
    }

    return isValid;
}

function showRealValidationErrors(errors) {
    // Remove existing error messages
    document.querySelectorAll('#real-listing-form .error-message').forEach(el => el.remove());

    // Add error messages to the current step
    const currentStep = document.querySelector('#real-listing-form .form-step.active');
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

function hideRealValidationErrors() {
    document.querySelectorAll('#real-listing-form .error-message').forEach(el => el.remove());
}

function updateRealProgressIndicators(currentStep) {
    document.querySelectorAll('#real-listing-form .progress-step').forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

function updateRealNavigationButtons(currentStep) {
    const prevBtn = document.querySelector('#real-listing-form .nav-btn.prev');
    const nextBtn = document.querySelector('#real-listing-form .nav-btn.next');
    const submitBtn = document.getElementById('real-submit-listing-btn');

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

function updateValidationStatus() {
    const step1Valid = validateRealStep(1);
    const step2Valid = validateRealStep(2);
    const step3Valid = validateRealStep(3);

    // Update status displays
    document.getElementById('step1-status').textContent = step1Valid ? '✅ Valid' : '❌ Invalid';
    document.getElementById('step2-status').textContent = step2Valid ? '✅ Valid' : '❌ Invalid';
    document.getElementById('step3-status').textContent = step3Valid ? '✅ Valid' : '❌ Invalid';

    const allValid = step1Valid && step2Valid && step3Valid;
    document.getElementById('overall-status').textContent = allValid ? '✅ All Valid' : '❌ Issues Found';

    // Style the status
    document.getElementById('overall-status').style.color = allValid ? '#27ae60' : '#e74c3c';
}

// Form submission handler
document.getElementById('real-listing-form').addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateRealStep(4)) {
        alert('🎉 Demo Complete!\n\nConditional logic successfully validated all form steps!\n\nCheck the browser console for detailed IF/ELSE execution logs.');
    }
});