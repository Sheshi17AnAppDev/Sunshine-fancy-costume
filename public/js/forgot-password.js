// Forgot Password Flow Management
let currentEmail = '';

document.addEventListener('DOMContentLoaded', () => {
    setupOTPInputs();
    setupForms();
});

function setupOTPInputs() {
    const inputs = document.querySelectorAll('.otp-digit');
    inputs.forEach((input, index) => {
        // Handle physical typing
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 0 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            const data = e.clipboardData.getData('text').slice(0, 6);
            if (/^\d+$/.test(data)) {
                data.split('').forEach((char, i) => {
                    if (inputs[i]) inputs[i].value = char;
                });
                inputs[Math.min(data.length, 5)].focus();
            }
            e.preventDefault();
        });
    });
}

function setupForms() {
    // Step 1 Form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;

            try {
                const submitBtn = forgotForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';

                const response = await api.post('/auth/forgot-password', { email });

                currentEmail = email;
                document.getElementById('display-email').textContent = email;

                if (response.debugOTP) {
                    console.log('DEBUG: Reset Code is', response.debugOTP);
                    showToast('Debug: Check console for code', 'info');
                }

                showToast('Reset code sent to your email', 'success');
                goToStep(2);
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                const submitBtn = forgotForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Code <i class="fa-solid fa-paper-plane" style="margin-left: 8px; font-size: 0.9em;"></i>';
            }
        };
    }

    // Step 2 Form (Verification)
    const verifyForm = document.getElementById('verify-form');
    if (verifyForm) {
        verifyForm.onsubmit = async (e) => {
            e.preventDefault();
            const otpCode = Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');

            if (otpCode.length < 6) {
                showToast('Please enter the full 6-digit code', 'warning');
                return;
            }

            // We don't have a separate verify-only endpoint for reset, 
            // so we'll just move to step 3 and verify during the final reset.
            // OR we can add a lightweight verify endpoint.
            // For now, let's assume if they entered 6 digits they want to move to password entry.
            // Actually, it's better to verify NOW so they don't fill out passwords for nothing.

            // I'll use Step 3 to collect password and then send EVERYTHING to /reset-password
            goToStep(3);
        };
    }

    // Resend Code
    const resendBtn = document.getElementById('resend-code');
    if (resendBtn) {
        resendBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                await api.post('/auth/forgot-password', { email: currentEmail });
                showToast('A new code has been sent', 'success');

                // Clear inputs
                document.querySelectorAll('.otp-digit').forEach(i => i.value = '');
                document.querySelectorAll('.otp-digit')[0].focus();
            } catch (error) {
                showToast(error.message, 'error');
            }
        };
    }

    // Step 3 Form (Reset)
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.onsubmit = async (e) => {
            e.preventDefault();
            const password = document.getElementById('new-password').value;
            const confirm = document.getElementById('confirm-password').value;
            const otpCode = Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');

            if (password !== confirm) {
                showToast('Passwords do not match', 'error');
                return;
            }

            try {
                const submitBtn = resetForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Resetting...';

                await api.post('/auth/reset-password', {
                    email: currentEmail,
                    otp: otpCode,
                    password: password
                });

                showToast('Password reset successful! Please log in.', 'success');
                setTimeout(() => {
                    window.location.href = 'login';
                }, 2000);
            } catch (error) {
                showToast(error.message, 'error');
                if (error.message.toLowerCase().includes('code')) {
                    goToStep(2); // Send back to code step if code was wrong
                }
            } finally {
                const submitBtn = resetForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Reset Password <i class="fa-solid fa-lock" style="margin-left: 8px;"></i>';
            }
        };
    }
}

function goToStep(stepNumber) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');

    if (stepNumber === 2) {
        setTimeout(() => document.querySelectorAll('.otp-digit')[0].focus(), 100);
    }
}
