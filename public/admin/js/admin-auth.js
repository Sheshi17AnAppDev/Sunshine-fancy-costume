// Admin Authentication Management
class AdminAuth {
    constructor() {
        this.token = localStorage.getItem('adminToken');
        this.user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        this.init();
    }

    init() {
        const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
        const isLoginPage = currentPage === 'login' || currentPage === 'login.html';

        // Check authentication on page load
        if (!this.isAuthenticated() && !isLoginPage) {
            window.location.href = 'login';
            return;
        }

        // Update UI with user info
        this.updateUserInterface();

        // Setup logout functionality
        this.setupLogout();

        // Setup sidebar active state
        this.setupSidebarActive();
    }

    isAuthenticated() {
        return !!(this.token && (this.user.role === 'admin' || this.user.role === 'super_admin'));
    }

    updateUserInterface() {
        const userNameElement = document.getElementById('admin-name');
        if (userNameElement && this.user.name) {
            userNameElement.textContent = this.user.name;
        }
    }

    setupLogout() {
        // Handle desktop sidebar logout (id="logout")
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Handle mobile bottom nav logout (class="mobile-logout")
        const mobileLogoutBtns = document.querySelectorAll('.mobile-logout');
        mobileLogoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    setupSidebarActive() {
        const currentPath = window.location.pathname.split('/').pop();
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');

        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index')) {
                link.classList.add('active');
            }
        });
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login';
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const headers = {
            ...(options.headers || {})
        };

        if (!headers['Authorization'] && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // If the caller didn't specify Content-Type and body is JSON string/object,
        // default to application/json.
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            this.logout();
            throw new Error('Not authorized');
        }

        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : await response.text();

        if (!response.ok) {
            const message = typeof data === 'object' && data?.message ? data.message : 'Request failed';
            throw new Error(message);
        }

        return data;
    }

    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            return await this.makeAuthenticatedRequest(`/api/admin/${endpoint}`, finalOptions);
        } catch (error) {
            console.error('API call failed:', error);
            return null;
        }
    }

    async getDashboardStats() {
        const stats = await this.apiCall('stats');
        return stats;
    }

    async getRecentOrders() {
        const orders = await this.apiCall('orders/recent');
        return orders;
    }
}

// Initialize admin auth
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuth();
});
