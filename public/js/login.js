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


// Real-time validation
document.addEventListener('DOMContentLoaded', () => {
    const fields = [
        { id: 'email', type: 'email' },
        { id: 'password', type: 'password' }
    ];

    fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (el) {
            el.addEventListener('blur', () => Validator.validateField(el, f.type));
            el.addEventListener('input', () => {
                el.style.borderColor = '';
                const parent = el.closest('.input-group') || el.parentNode;
                const error = parent.querySelector('.input-error');
                if (error) error.style.display = 'none';
            });
        }
    });
});

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // --- Validation ---
    const isEmailValid = Validator.validateField(document.getElementById('email'), 'email');
    const isPasswordValid = Validator.validateField(document.getElementById('password'), 'password');

    if (!isEmailValid || !isPasswordValid) return;
    // --- End Validation ---

    try {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('user', JSON.stringify(res));

        // legacy key cleanup
        localStorage.removeItem('token');

        // Check for stored redirect page or URL parameter
        const redirectPage = localStorage.getItem('redirectAfterLogin');
        const urlRedirect = new URLSearchParams(window.location.search).get('redirect');

        // Clear stored redirect
        localStorage.removeItem('redirectAfterLogin');

        // Redirect to stored page, URL parameter, or index
        window.location.href = redirectPage ? `/${redirectPage}` : (urlRedirect || '/');
    } catch (err) {
        showToast(err.message || 'Login failed', 'error');
    }
};
