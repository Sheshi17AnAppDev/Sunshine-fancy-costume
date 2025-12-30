(function () {
    const stored = localStorage.getItem('user');
    if (!stored) {
        window.location.href = 'login?redirect=profile';
        return;
    }

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index';
    };

    const safeText = (v) => (v === null || v === undefined ? '' : String(v));

    const formatMoney = (value) => {
        return formatCurrency(value);
    };

    const pill = (ok, label) => {
        const cls = ok === null ? 'neutral' : ok ? 'good' : 'bad';
        const icon = ok === null ? 'fa-circle-info' : ok ? 'fa-check' : 'fa-xmark';
        return `<span class="status-pill ${cls}"><i class="fa-solid ${icon}"></i> ${label}</span>`;
    };

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = safeText(value);
    };

    const renderOrders = (orders) => {
        const ordersBody = document.getElementById('orders-body');
        const recentBody = document.getElementById('recent-orders-body');

        const list = Array.isArray(orders) ? orders : [];

        const deliveredCount = list.filter(o => o && o.isDelivered).length;
        setText('stat-orders', list.length);
        setText('stat-delivered', deliveredCount);

        if (ordersBody) {
            if (list.length === 0) {
                ordersBody.innerHTML = `<tr><td colspan="5" class="table-empty">No orders yet. Start shopping and your orders will appear here.</td></tr>`;
            } else {
                ordersBody.innerHTML = list.map(o => {
                    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';
                    const orderId = o._id ? `#${o._id.slice(-6)}` : '-';
                    return `
                        <tr>
                            <td>${orderId}</td>
                            <td>${date}</td>
                            <td>${formatMoney(o.totalPrice)}</td>
                            <td>${o.paymentMethod || 'COD'}</td>
                            <td>${pill(!!o.isPaid, o.isPaid ? 'Paid' : 'Unpaid')}</td>
                            <td>${pill(!!o.isDelivered, o.isDelivered ? 'Delivered' : 'Pending')}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

        if (recentBody) {
            const recent = list.slice(0, 4);
            if (recent.length === 0) {
                recentBody.innerHTML = `<tr><td colspan="4" class="table-empty">No recent orders.</td></tr>`;
            } else {
                recentBody.innerHTML = recent.map(o => {
                    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';
                    const orderId = o._id ? `#${o._id.slice(-6)}` : '-';
                    const statusLabel = o.isDelivered ? 'Delivered' : (o.isPaid ? 'Processing' : 'Pending');
                    const statusKind = o.isDelivered ? 'good' : (o.isPaid ? 'neutral' : 'bad');
                    const icon = o.isDelivered ? 'fa-check' : (o.isPaid ? 'fa-rotate' : 'fa-clock');
                    return `
                        <tr>
                            <td>${orderId}</td>
                            <td>${date}</td>
                            <td>${formatMoney(o.totalPrice)}</td>
                            <td><span class="status-pill ${statusKind}"><i class="fa-solid ${icon}"></i> ${statusLabel}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    };

    const setupTabs = () => {
        const tabs = Array.from(document.querySelectorAll('.account-tab'));
        const panels = {
            overview: document.getElementById('panel-overview'),
            orders: document.getElementById('panel-orders'),
            settings: document.getElementById('panel-settings')
        };

        const activate = (key) => {
            tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === key));
            Object.entries(panels).forEach(([k, el]) => {
                if (!el) return;
                el.classList.toggle('active', k === key);
            });
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => activate(tab.dataset.tab));
        });

        document.getElementById('view-all-orders')?.addEventListener('click', (e) => {
            e.preventDefault();
            activate('orders');
        });
    };

    const setupActions = () => {
        document.getElementById('logout-btn')?.addEventListener('click', logout);
        document.getElementById('logout-btn-2')?.addEventListener('click', logout);

        document.getElementById('copy-email')?.addEventListener('click', async () => {
            const email = document.getElementById('settings-email')?.textContent || '';
            try {
                await navigator.clipboard.writeText(email);
            } catch (e) {
            }
        });
    };

    const load = async () => {
        setupTabs();
        setupActions();

        try {
            const profile = await api.get('/auth/profile');
            setText('profile-name', profile.name || 'Customer');
            setText('profile-name-2', profile.name || 'Customer');
            setText('profile-email', profile.email || '');
            setText('settings-email', profile.email || '');
            setText('profile-role', (profile.role || 'user').toUpperCase());
        } catch (e) {
            logout();
            return;
        }

        try {
            const orders = await api.get('/orders/myorders');
            renderOrders(orders);
        } catch (e) {
            renderOrders([]);
        }
    };

    document.addEventListener('DOMContentLoaded', load);
})();
