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

// Custom message system
function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    messageEl.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
        <button class="message-close">&times;</button>
    `;
    
    container.appendChild(messageEl);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.classList.add('message-fade-out');
            setTimeout(() => messageEl.remove(), 300);
        }
    }, 5000);
    
    // Manual close
    messageEl.querySelector('.message-close').addEventListener('click', () => {
        messageEl.classList.add('message-fade-out');
        setTimeout(() => messageEl.remove(), 300);
    });
}

// Setup super admin from environment variables (internal setup)
async function setupSuperAdminFromEnv() {
    try {
        const response = await fetch('/api/admin/auth/setup-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Super admin setup from environment:', data.message);
        } else {
            console.error('Super admin setup failed:', data.message);
        }
    } catch (error) {
        console.error('Error setting up super admin:', error);
    }
}

// Login form handler
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const btn = document.querySelector('.btn-admin-login');
    const originalText = btn.innerText;
    btn.innerText = 'Authenticating...';
    btn.style.opacity = '0.8';

    try {
        const response = await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                permissions: data.permissions || {}
            }));
            
            showMessage(`Welcome back, ${data.name}! Redirecting to dashboard...`, 'success');
            setTimeout(() => {
                window.location.href = 'index';
            }, 1500);
        } else {
            showMessage(data.message || 'Invalid credentials. Please check your email and password.', 'error');
            btn.innerText = originalText;
            btn.style.opacity = '1';
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
        btn.innerText = originalText;
        btn.style.opacity = '1';
    }
});

// Setup super admin from environment on page load
document.addEventListener('DOMContentLoaded', setupSuperAdminFromEnv);
