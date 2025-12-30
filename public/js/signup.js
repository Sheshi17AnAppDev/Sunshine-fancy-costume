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
    const phoneNumber = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    const phone = `${countryCode} ${phoneNumber}`;

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
            body: JSON.stringify({ name, email, password })
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
        submitBtn.disabled = false;
    }
};
