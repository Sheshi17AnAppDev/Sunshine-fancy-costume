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

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
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
