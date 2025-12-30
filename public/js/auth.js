// Authentication utilities for page-level protection

// Check if user is authenticated
function isAuthenticated() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.token;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        // Store the current page to redirect back after login
        const currentPage = window.location.pathname.split('/').pop() || 'index';
        localStorage.setItem('redirectAfterLogin', currentPage);
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Check authentication on page load
function checkPageAuth() {
    const currentPage = window.location.pathname.split('/').pop() || 'index';
    const pageName = currentPage.replace('.html', '').toLowerCase();

    // Pages that don't require authentication
    const publicPages = ['index', 'login', 'signup', 'verify', 'legal', 'shop', 'product', 'about', 'contact', 'blog', 'faq'];

    // Check if current page requires authentication
    if (!publicPages.includes(pageName)) {
        requireAuth();
    }
}

// Redirect back to original page after login
function redirectAfterLogin() {
    const redirectPage = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');

    if (redirectPage && redirectPage !== 'login') {
        window.location.href = `/${redirectPage}`;
    } else {
        window.location.href = '/';
    }
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', checkPageAuth);
