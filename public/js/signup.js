// Password toggle function
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(inputId + '-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.remove('fa-regular', 'fa-eye');
        passwordIcon.classList.add('fa-regular', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.remove('fa-regular', 'fa-eye-slash');
        passwordIcon.classList.add('fa-regular', 'fa-eye');
    }
}

document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const countryCode = document.getElementById('country-code').value;
    const phoneNumberInput = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    // --- Start Validation ---
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/; // Exactly 10 digits
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/; // Min 8 chars, 1 letter, 1 number

    if (!nameRegex.test(name)) {
        showError('Please enter a valid full name (letters and spaces only, 2-50 characters).');
        return;
    }

    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
    }

    // Strip non-digits for phone validation
    const cleanPhone = phoneNumberInput.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        showError('Please enter a valid phone number (exactly 10 digits).');
        return;
    }

    if (!passwordRegex.test(password)) {
        showError('Password must be at least 8 characters long and include at least one letter and one number.');
        return;
    }
    // --- End Validation ---

    const fullPhoneNumber = `${countryCode} ${phoneNumberInput}`;

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;

    try {
        // Initiate registration with OTP
        const res = await fetch('/api/auth/register-init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, phoneNumber: fullPhoneNumber })
        });

        const data = await res.json();

        if (res.ok) {
            // Store email for verification page
            localStorage.setItem('pendingVerificationEmail', email);

            // Redirect to verification page
            window.location.href = `verify?email=${encodeURIComponent(email)}`;
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (err) {
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.3);
            color: #e74c3c;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            font-size: 0.9rem;
            text-align: center;
        `;
        errorDiv.innerHTML = `<i class="fa-solid fa-exclamation-circle"></i> ${err.message || 'Registration failed'}`;

        // Remove any existing error message
        const existingError = e.target.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        e.target.appendChild(errorDiv);

        // Remove error after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
    }
};

function showError(message) {
    const form = document.getElementById('signup-form');

    // Remove existing
    const existingError = form.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: rgba(231, 76, 60, 0.1);
        border: 1px solid rgba(231, 76, 60, 0.3);
        color: #e74c3c;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        font-size: 0.9rem;
        text-align: center;
    `;
    errorDiv.innerHTML = `<i class="fa-solid fa-exclamation-circle"></i> ${message}`;

    // Insert before the submit button's parent or just append to form
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        form.insertBefore(errorDiv, submitBtn);
    } else {
        form.appendChild(errorDiv);
    }

    // Auto remove
    setTimeout(() => errorDiv.remove(), 5000);
}
