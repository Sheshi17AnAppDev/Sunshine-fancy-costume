// Authentication check for protected pages
function checkPageAuthentication() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = currentPage.replace('.html', '').toLowerCase();

    // Pages that require authentication
    const protectedPages = ['checkout', 'profile', 'orders'];

    // Check if current page requires authentication
    if (protectedPages.includes(pageName)) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `login.html?return=${returnUrl}`;
            return false;
        }
    }
    return true;
}

// Run authentication check when page loads
document.addEventListener('DOMContentLoaded', checkPageAuthentication);

// Also check immediately in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPageAuthentication);
} else {
    checkPageAuthentication();
}
