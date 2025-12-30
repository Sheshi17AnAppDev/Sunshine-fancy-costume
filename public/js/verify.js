// OTP Verification JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const verifyForm = document.getElementById('verify-form');
    const otpInputs = document.querySelectorAll('.otp-input');
    const resendBtn = document.getElementById('resend-btn');
    const timerDisplay = document.getElementById('timer');
    const userEmailDisplay = document.getElementById('user-email');
    
    let countdown;
    let timeLeft = 600; // 10 minutes in seconds
    let userEmail = '';
    let isResending = false;

    // Get email from URL parameter or localStorage
    function getEmailFromParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        if (!email) {
            const storedEmail = localStorage.getItem('pendingVerificationEmail');
            return storedEmail;
        }
        return email;
    }

    // Initialize
    function init() {
        userEmail = getEmailFromParams();
        if (!userEmail) {
            window.location.href = 'signup';
            return;
        }
        
        userEmailDisplay.textContent = userEmail;
        localStorage.setItem('pendingVerificationEmail', userEmail);
        startTimer();
        setupOTPInputs();
    }

    // Setup OTP input fields
    function setupOTPInputs() {
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                const value = e.target.value;
                
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Move to next input
                if (value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                
                // Add filled class
                e.target.classList.toggle('filled', value.length === 1);
            });

            input.addEventListener('keydown', function(e) {
                // Handle backspace
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    otpInputs[index - 1].focus();
                }
                
                // Handle paste
                if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    navigator.clipboard.readText().then(text => {
                        const digits = text.replace(/\D/g, '').slice(0, 6);
                        digits.split('').forEach((digit, i) => {
                            if (otpInputs[i]) {
                                otpInputs[i].value = digit;
                                otpInputs[i].classList.add('filled');
                            }
                        });
                        if (digits.length === 6) {
                            otpInputs[5].focus();
                        }
                    });
                }
            });

            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                const digits = pastedData.replace(/\D/g, '').slice(0, 6);
                digits.split('').forEach((digit, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = digit;
                        otpInputs[i].classList.add('filled');
                    }
                });
                if (digits.length === 6) {
                    otpInputs[5].focus();
                }
            });
        });
    }

    // Get OTP from inputs
    function getOTP() {
        return Array.from(otpInputs).map(input => input.value).join('');
    }

    // Clear all inputs
    function clearInputs() {
        otpInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        otpInputs[0].focus();
    }

    // Show error state
    function showError(message) {
        otpInputs.forEach(input => input.classList.add('error'));
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            color: #e74c3c;
            text-align: center;
            margin-top: 1rem;
            font-size: 0.9rem;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        
        verifyForm.appendChild(errorDiv);
        
        // Remove error after 3 seconds
        setTimeout(() => {
            errorDiv.remove();
            otpInputs.forEach(input => input.classList.remove('error'));
        }, 3000);
        
        clearInputs();
    }

    // Start countdown timer
    function startTimer() {
        updateTimerDisplay();
        countdown = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(countdown);
                handleTimeout();
            }
        }, 1000);
    }

    // Update timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Add warning when less than 2 minutes
        if (timeLeft < 120) {
            timerDisplay.style.color = '#e74c3c';
        }
    }

    // Handle timeout
    function handleTimeout() {
        clearInterval(countdown);
        timerDisplay.textContent = '00:00';
        timerDisplay.style.color = '#e74c3c';
        
        // Show timeout message
        const timeoutDiv = document.createElement('div');
        timeoutDiv.className = 'timeout-message';
        timeoutDiv.style.cssText = `
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.3);
            color: #e74c3c;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin-top: 1rem;
            font-size: 0.9rem;
        `;
        timeoutDiv.innerHTML = `
            <i class="fa-solid fa-clock"></i> Verification code expired. Please request a new one.
        `;
        
        verifyForm.appendChild(timeoutDiv);
        
        // Disable form
        verifyForm.style.opacity = '0.5';
        verifyForm.style.pointerEvents = 'none';
        
        // Clear pending email
        localStorage.removeItem('pendingVerificationEmail');
    }

    // Handle form submission
    verifyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const otp = getOTP();
        if (otp.length !== 6) {
            showError('Please enter all 6 digits');
            return;
        }
        
        // Show loading state
        verifyForm.classList.add('verification-loading');
        const submitBtn = verifyForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userEmail,
                    otp: otp
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success
                clearInterval(countdown);
                verifyForm.classList.add('verification-success');
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Verified!';
                submitBtn.style.background = '#27ae60';
                
                // Store user data
                localStorage.setItem('user', JSON.stringify(data));
                localStorage.removeItem('pendingVerificationEmail');
                
                // Redirect after delay
                setTimeout(() => {
                    const returnUrl = new URLSearchParams(window.location.search).get('return');
                    window.location.href = returnUrl || 'index';
                }, 1500);
            } else {
                throw new Error(data.message || 'Verification failed');
            }
        } catch (error) {
            showError(error.message || 'Invalid verification code');
        } finally {
            // Reset loading state
            verifyForm.classList.remove('verification-loading');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Handle resend OTP
    resendBtn.addEventListener('click', async function() {
        if (isResending) return;
        
        isResending = true;
        const originalText = resendBtn.innerHTML;
        resendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        resendBtn.disabled = true;
        
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userEmail
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Reset timer
                clearInterval(countdown);
                timeLeft = 600;
                timerDisplay.style.color = 'var(--primary-orange)';
                startTimer();
                
                // Clear inputs and focus
                clearInputs();
                
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'resend-success';
                successDiv.style.cssText = `
                    background: rgba(39, 174, 96, 0.1);
                    border: 1px solid rgba(39, 174, 96, 0.3);
                    color: #27ae60;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                `;
                successDiv.innerHTML = `<i class="fa-solid fa-check"></i> New code sent to your email`;
                
                verifyForm.appendChild(successDiv);
                
                // Remove message after 3 seconds
                setTimeout(() => successDiv.remove(), 3000);
            } else {
                throw new Error(data.message || 'Failed to resend code');
            }
        } catch (error) {
            showError(error.message || 'Failed to resend verification code');
        } finally {
            isResending = false;
            resendBtn.innerHTML = originalText;
            resendBtn.disabled = false;
        }
    });

    // Handle page unload - clear pending verification
    window.addEventListener('beforeunload', function() {
        // If user leaves without completing verification, the backend will clean up
        // But we can also clear localStorage
        if (!document.hidden) {
            localStorage.removeItem('pendingVerificationEmail');
        }
    });

    // Initialize the page
    init();
});
