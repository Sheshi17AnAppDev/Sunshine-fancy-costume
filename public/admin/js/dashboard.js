// Enhanced Dashboard functionality
class Dashboard {
    constructor() {
        this.salesChart = null;
        this.init();
    }

    async init() {
        await this.loadDashboardData();
        this.setupAnimations();
        this.setupInteractions();
        this.setupCharts();
        this.loadTopProducts();

        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
            this.loadTopProducts();
            // Optional: update charts if needed, but might be too jarring
            // this.updateSalesChart(document.getElementById('sales-period')?.value || 7);
        }, 30000);
    }

    async loadDashboardData() {
        try {
            // Load stats using admin auth
            const stats = await adminAuth.getDashboardStats();
            if (stats) {
                this.updateStats(stats);
                this.updateRecentOrders(stats.recentOrders);
            } else {
                // Fallback to original method if admin auth fails
                await this.loadFallbackData();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            await this.loadFallbackData();
        }
    }

    async loadFallbackData() {
        try {
            const products = await api.get('/products');
            const orders = await api.get('/orders');

            this.animateNumber('stat-products', products?.length || 0);
            this.animateNumber('stat-orders', orders?.length || 0);

            const revenue = orders?.filter(o => o.isPaid).reduce((acc, o) => acc + (o.totalPrice || 0), 0) || 0;
            this.animateNumber('stat-revenue', revenue, true);

            if (Array.isArray(orders)) {
                const tbody = document.querySelector('#recent-orders tbody');
                if (tbody) {
                    tbody.innerHTML = orders.slice(0, 5).map(o => `
                        <tr>
                            <td>#${o._id.slice(-6)}</td>
                            <td>${o.user?.name || 'Guest'}</td>
                            <td>$${(o.totalPrice || 0).toFixed(2)}</td>
                            <td><span class="status-badge status-${o.isPaid ? 'delivered' : 'pending'}">${o.isPaid ? 'Paid' : 'Pending'}</span></td>
                        </tr>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('Fallback data loading failed:', err);
            this.showErrorMessage('Failed to load dashboard data');
        }
    }

    updateStats(stats) {
        // Animate numbers
        this.animateNumber('stat-products', stats.totalProducts || 0);
        this.animateNumber('stat-orders', stats.totalOrders || 0);
        this.animateNumber('stat-revenue', stats.totalRevenue || 0, true);
        this.animateNumber('stat-customers', stats.totalCustomers || 0);
    }

    setupCharts() {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.salesChart) {
            this.salesChart.destroy();
        }

        // Initialize sales chart
        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.generateDateLabels(7),
                datasets: [{
                    label: 'Sales',
                    data: this.generateMockSalesData(7),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });

        // Setup period selector
        const periodSelector = document.getElementById('sales-period');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.updateSalesChart(parseInt(e.target.value));
            });
        }
    }

    async updateSalesChart(days) {
        if (!this.salesChart) return;

        try {
            const data = await adminAuth.apiCall(`stats/sales-chart?days=${days}`);

            // Format data for chart
            const labels = [];
            const values = [];

            // Create a map of date -> sales for easy lookup
            const salesMap = {};
            data.forEach(item => {
                salesMap[item._id] = item.sales;
            });

            // Generate labels for the last 'days' days and fill in data
            const today = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                values.push(salesMap[dateStr] || 0);
            }

            this.salesChart.data.labels = labels;
            this.salesChart.data.datasets[0].data = values;
            this.salesChart.update();
        } catch (error) {
            console.error('Failed to update sales chart:', error);
            this.showToast('Failed to load sales data', 'error');
        }
    }

    async loadTopProducts() {
        try {
            const topProducts = await adminAuth.apiCall('stats/top-products');
            this.displayTopProducts(topProducts);
        } catch (error) {
            console.error('Failed to load top products:', error);
            this.showToast('Failed to load top products', 'error');
        }
    }

    displayTopProducts(products) {
        const container = document.getElementById('top-products-list');
        if (!container) return;

        container.innerHTML = products.map((product, index) => `
            <div class="top-product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-sales">${product.sales} sold</div>
                </div>
                <div class="product-revenue">₹${product.revenue.toLocaleString('en-IN')}</div>
            </div>
        `).join('');
    }

    animateNumber(elementId, targetValue, isCurrency = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const duration = 2000;
        const start = 0;
        const increment = targetValue / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
            }

            if (isCurrency) {
                element.textContent = '₹' + Math.floor(current).toLocaleString('en-IN');
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }

    updateRecentOrders(orders) {
        const tbody = document.getElementById('recent-orders-body');
        if (!tbody) {
            const fallbackTbody = document.querySelector('#recent-orders tbody');
            if (fallbackTbody && orders) {
                fallbackTbody.innerHTML = orders.map(order => `
                    <tr>
                        <td><strong>#${order.orderNumber || order._id.toString().slice(-6)}</strong></td>
                        <td>${order.customer}</td>
                        <td><strong>$${(order.total || 0).toLocaleString()}</strong></td>
                        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                    </tr>
                `).join('');
            }
            return;
        }

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #6c757d;">No recent orders found</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>#${order.orderNumber || order._id.toString().slice(-6)}</strong></td>
                <td>${order.customer}</td>
                <td><strong>$${(order.total || 0).toLocaleString()}</strong></td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            </tr>
        `).join('');
    }

    setupAnimations() {
        // Add hover effects to stat cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Add smooth scroll behavior
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    setupInteractions() {
        // Add click handlers for interactive elements
        const orderRows = document.querySelectorAll('#recent-orders-body tr, #recent-orders tbody tr');
        orderRows.forEach(row => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                // Navigate to order details (placeholder)
                console.log('Order clicked:', row.querySelector('td:first-child').textContent);
            });
        });

        // Add refresh functionality
        const adminHeader = document.querySelector('.admin-header h1');
        if (adminHeader) {
            adminHeader.style.cursor = 'pointer';
            adminHeader.title = 'Click to refresh dashboard';
            adminHeader.addEventListener('click', () => {
                this.loadDashboardData();
                this.setupCharts();
                this.loadTopProducts();
                this.showSuccessMessage('Dashboard refreshed');
            });
        }
    }

    refreshTopProducts() {
        this.loadTopProducts();
        this.showSuccessMessage('Top products refreshed');
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Remove existing toasts first
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Add content
        const textNode = document.createTextNode(message);
        toast.appendChild(textNode);

        document.body.appendChild(toast);

        // Auto remove after 3 seconds with slide-out animation
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }
}

// Add slide animations
// Animations are now handled in admin-modern.css
// Animations are now handled in admin-modern.css

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if adminAuth is available, otherwise use fallback
    if (typeof adminAuth !== 'undefined') {
        new Dashboard();
    } else {
        // Fallback to original functionality
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        const dashboard = new Dashboard();

        // Setup logout with fallback
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                localStorage.removeItem('user');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = 'login.html';
            };
        }
    }
});
