(function () {
    const stored = localStorage.getItem('user');
    if (!stored) {
        window.location.href = 'login?redirect=profile';
        return;
    }

    // Logout function moved to avoid duplication

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
                            <td style="text-align: right;">
                                <button class="btn-delete-order" data-id="${o._id}" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 1rem; padding: 5px;" title="Delete Order">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Attach Event Listeners for Main List
                setTimeout(() => {
                    const deleteBtns = ordersBody.querySelectorAll('.btn-delete-order');
                    deleteBtns.forEach(btn => {
                        btn.onclick = async (e) => {
                            e.preventDefault();
                            if (confirm('Are you sure you want to delete this order?')) {
                                try {
                                    const id = btn.getAttribute('data-id');
                                    await api.delete(`/orders/${id}`);
                                    showToast('Order failed/deleted successfully', 'success');
                                    // Refresh
                                    const fresh = await api.get('/orders/myorders');
                                    renderOrders(fresh);
                                } catch (err) {
                                    console.error(err);
                                    showToast(err.message || 'Failed to delete', 'error');
                                }
                            }
                        };
                    });
                }, 0);
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
                            <td style="text-align: right;">
                                <button class="btn-delete-order" data-id="${o._id}" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 1rem; padding: 5px;" title="Delete Order">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Attach Event Listeners
                setTimeout(() => {
                    const deleteBtns = recentBody.querySelectorAll('.btn-delete-order');
                    deleteBtns.forEach(btn => {
                        btn.onclick = async (e) => {
                            e.preventDefault();
                            if (confirm('Are you sure you want to delete this order?')) {
                                try {
                                    const id = btn.getAttribute('data-id');
                                    await api.delete(`/orders/${id}`);
                                    showToast('Order failed/deleted successfully', 'success'); // "Order removed"
                                    // Refresh
                                    const fresh = await api.get('/orders/myorders');
                                    renderOrders(fresh);
                                } catch (err) {
                                    console.error(err);
                                    showToast(err.message || 'Failed to delete', 'error');
                                }
                            }
                        };
                    });
                }, 0);
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

    const logout = (e) => {
        if (e) e.preventDefault();
        console.log('Logout clicked');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'index';
    };

    // ...

    const setupActions = () => {
        console.log('Setting up logout actions');
        const btn1 = document.getElementById('logout-btn');
        const btn2 = document.getElementById('logout-btn-2');

        if (btn1) {
            console.log('Logout btn 1 found');
            btn1.addEventListener('click', logout);
        } else {
            console.error('Logout btn 1 not found');
        }

        if (btn2) {
            console.log('Logout btn 2 found');
            btn2.addEventListener('click', logout);
        }

        const editForm = document.getElementById('edit-profile-form');

        // Real-time validation
        if (editForm) {
            ['edit-name', 'edit-email', 'edit-phone', 'edit-postal', 'edit-password'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const type = id === 'edit-postal' ? 'postalCode' :
                        (id === 'edit-phone' ? 'phone' :
                            (id === 'edit-email' ? 'email' :
                                (id === 'edit-password' ? 'password' : 'name')));

                    el.addEventListener('blur', () => {
                        // Password is optional validation if empty
                        if (id === 'edit-password' && !el.value) {
                            // Clear error if empty
                            const errorEl = el.nextElementSibling;
                            if (errorEl && errorEl.classList.contains('input-error')) errorEl.style.display = 'none';
                            el.style.borderColor = '';
                            return;
                        }
                        Validator.validateField(el, type);
                    });
                }
            });

            editForm.onsubmit = async (e) => {
                e.preventDefault();
                const name = document.getElementById('edit-name').value;
                const email = document.getElementById('edit-email').value;
                const password = document.getElementById('edit-password').value;
                const phoneNumber = document.getElementById('edit-phone').value;
                const address = document.getElementById('edit-address').value;
                const city = document.getElementById('edit-city').value;
                const postalCode = document.getElementById('edit-postal').value;
                const country = document.getElementById('edit-country').value;

                // --- Validation ---
                const isNameValid = Validator.validateField(document.getElementById('edit-name'), 'name');
                const isEmailValid = Validator.validateField(document.getElementById('edit-email'), 'email');
                const isPhoneValid = Validator.validateField(document.getElementById('edit-phone'), 'phone');
                const isPostalValid = Validator.validateField(document.getElementById('edit-postal'), 'postalCode');

                let isPasswordValid = true;
                if (password) {
                    isPasswordValid = Validator.validateField(document.getElementById('edit-password'), 'password');
                }

                if (!isNameValid || !isEmailValid || !isPhoneValid || !isPostalValid || !isPasswordValid) return;
                // --- End Validation ---

                try {
                    const submitBtn = editForm.querySelector('button[type="submit"]');
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

                    const body = {
                        name,
                        email,
                        phoneNumber,
                        address,
                        city,
                        postalCode,
                        country
                    };
                    if (password) body.password = password;

                    const updated = await api.put('/auth/profile', body);

                    // Update local storage
                    const user = JSON.parse(localStorage.getItem('user'));
                    user.name = updated.name;
                    user.email = updated.email;
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('token', updated.token);

                    // Update UI
                    setText('profile-name', updated.name);
                    setText('profile-name-2', updated.name);
                    setText('profile-email', updated.email);

                    showToast('Profile updated successfully', 'success');

                    // Clear password field
                    document.getElementById('edit-password').value = '';
                } catch (error) {
                    showToast(error.message, 'error');
                } finally {
                    const submitBtn = editForm.querySelector('button[type="submit"]');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Save Changes <i class="fa-solid fa-check" style="margin-left: 8px;"></i>';
                }
            };
        }
    };

    const load = async () => {
        setupTabs();
        setupActions();

        try {
            const profile = await api.get('/auth/profile');
            setText('profile-name', profile.name || 'Customer');
            setText('profile-name-2', profile.name || 'Customer');
            setText('profile-email', profile.email || '');
            setText('profile-phone', profile.phoneNumber || '-');
            setText('profile-role', (profile.role || 'user').toUpperCase());

            // Fill form
            const editName = document.getElementById('edit-name');
            const editEmail = document.getElementById('edit-email');
            const editPhone = document.getElementById('edit-phone');
            const editAddress = document.getElementById('edit-address');
            const editCity = document.getElementById('edit-city');
            const editPostal = document.getElementById('edit-postal');
            const editCountry = document.getElementById('edit-country');

            if (editName) editName.value = profile.name || '';
            if (editEmail) editEmail.value = profile.email || '';
            if (editPhone) editPhone.value = profile.phoneNumber || '';
            if (editAddress) editAddress.value = profile.address || '';
            if (editCity) editCity.value = profile.city || '';
            if (editPostal) editPostal.value = profile.postalCode || '';
            if (editCountry) editCountry.value = profile.country || '';
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
