// Admin Management JavaScript
class AdminManagement {
    constructor() {
        this.admins = [];
        this.initializeEventListeners();
        this.loadAdmins();
    }

    initializeEventListeners() {
        // Add admin button
        document.getElementById('add-admin-btn').addEventListener('click', () => {
            this.showAddAdminModal();
        });

        // Admin form submission
        document.getElementById('admin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminSubmit();
        });

        // Cancel buttons
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-permissions-btn').addEventListener('click', () => {
            this.closePermissionsModal();
        });

        // Overlay clicks
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeModal();
            this.closePermissionsModal();
        });

        // Permissions form submission
        document.getElementById('permissions-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePermissionsSubmit();
        });
    }

    async loadAdmins() {
        try {
            const response = await adminAuth.makeAuthenticatedRequest('/api/admin/admins');
            this.admins = response;
            this.renderAdminTable();
        } catch (error) {
            console.error('Failed to load admins:', error);
            this.showToast('Failed to load admin users', 'error');
        }
    }

    renderAdminTable() {
        const tbody = document.getElementById('admin-table-body');
        tbody.innerHTML = '';

        this.admins.forEach(admin => {
            const row = this.createAdminRow(admin);
            tbody.appendChild(row);
        });
    }

    createAdminRow(admin) {
        const tr = document.createElement('tr');
        
        const statusBadge = admin.isActive ? 
            '<span class="status-badge status-delivered">Active</span>' : 
            '<span class="status-badge status-cancelled">Inactive</span>';

        const lastLogin = admin.lastLogin ? 
            new Date(admin.lastLogin).toLocaleDateString() : 'Never';
        
        const createdDate = new Date(admin.createdAt).toLocaleDateString();

        const isSuperAdmin = admin.role === 'super_admin';
        const canManage = window.adminAuth?.user?.role === 'super_admin';

        tr.innerHTML = `
            <td>${admin.name}</td>
            <td>${admin.email}</td>
            <td>
                <span class="status-badge ${isSuperAdmin ? 'status-shipped' : 'status-processing'}">
                    ${isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
            </td>
            <td>${statusBadge}</td>
            <td>${lastLogin}</td>
            <td>${createdDate}</td>
            <td>
                <div class="table-actions">
                    ${canManage && !isSuperAdmin ? `
                        <button class="btn btn-sm btn-secondary" onclick="adminManagement.editPermissions('${admin._id}')">
                            <i class="fa-solid fa-key"></i> Permissions
                        </button>
                        <button class="btn btn-sm ${admin.isActive ? 'btn-warning' : 'btn-success'}" 
                                onclick="adminManagement.toggleStatus('${admin._id}')">
                            <i class="fa-solid fa-${admin.isActive ? 'pause' : 'play'}"></i> 
                            ${admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminManagement.deleteAdmin('${admin._id}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    ` : isSuperAdmin ? '<span style="color: var(--text-light);">Super Admin</span>' : '<span style="color: var(--text-light);">No Access</span>'}
                </div>
            </td>
        `;

        return tr;
    }

    showAddAdminModal() {
        document.getElementById('modal-title').textContent = 'Add New Admin';
        document.getElementById('admin-form').reset();
        document.getElementById('modal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    closePermissionsModal() {
        document.getElementById('permissions-modal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }

    async handleAdminSubmit() {
        const formData = {
            name: document.getElementById('admin-name').value,
            email: document.getElementById('admin-email').value,
            password: document.getElementById('admin-password').value,
            permissions: {
                canManageProducts: document.getElementById('perm-products').checked,
                canManageCategories: document.getElementById('perm-categories').checked,
                canManageBrands: document.getElementById('perm-brands').checked,
                canManageOrders: document.getElementById('perm-orders').checked,
                canManageWebsite: document.getElementById('perm-website')?.checked || false,
                canViewStats: document.getElementById('perm-stats').checked,
                canChangeCredentials: document.getElementById('perm-credentials').checked
            }
        };

        try {
            const response = await adminAuth.makeAuthenticatedRequest('/api/admin/admins/create', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            this.showToast('Admin created successfully', 'success');
            this.closeModal();
            this.loadAdmins();
        } catch (error) {
            console.error('Failed to create admin:', error);
            this.showToast(error.message || 'Failed to create admin', 'error');
        }
    }

    editPermissions(adminId) {
        const admin = this.admins.find(a => a._id === adminId);
        if (!admin) return;

        document.getElementById('permissions-admin-id').value = adminId;
        document.getElementById('permissions-admin-name').value = admin.name;

        // Set current permissions
        document.getElementById('edit-perm-products').checked = admin.permissions.canManageProducts;
        document.getElementById('edit-perm-categories').checked = admin.permissions.canManageCategories;
        document.getElementById('edit-perm-brands').checked = admin.permissions.canManageBrands;
        document.getElementById('edit-perm-orders').checked = admin.permissions.canManageOrders;
        if (document.getElementById('edit-perm-website')) {
            document.getElementById('edit-perm-website').checked = !!admin.permissions.canManageWebsite;
        }
        document.getElementById('edit-perm-stats').checked = admin.permissions.canViewStats;
        document.getElementById('edit-perm-credentials').checked = admin.permissions.canChangeCredentials;

        document.getElementById('permissions-modal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    }

    async handlePermissionsSubmit() {
        const adminId = document.getElementById('permissions-admin-id').value;
        const permissions = {
            canManageProducts: document.getElementById('edit-perm-products').checked,
            canManageCategories: document.getElementById('edit-perm-categories').checked,
            canManageBrands: document.getElementById('edit-perm-brands').checked,
            canManageOrders: document.getElementById('edit-perm-orders').checked,
            canManageWebsite: document.getElementById('edit-perm-website')?.checked || false,
            canViewStats: document.getElementById('edit-perm-stats').checked,
            canChangeCredentials: document.getElementById('edit-perm-credentials').checked
        };

        try {
            await adminAuth.makeAuthenticatedRequest(`/api/admin/admins/${adminId}/permissions`, {
                method: 'PUT',
                body: JSON.stringify({ permissions })
            });

            this.showToast('Permissions updated successfully', 'success');
            this.closePermissionsModal();
            this.loadAdmins();
        } catch (error) {
            console.error('Failed to update permissions:', error);
            this.showToast(error.message || 'Failed to update permissions', 'error');
        }
    }

    async toggleStatus(adminId) {
        try {
            await adminAuth.makeAuthenticatedRequest(`/api/admin/admins/${adminId}/toggle`, {
                method: 'PUT'
            });

            this.showToast('Admin status updated successfully', 'success');
            this.loadAdmins();
        } catch (error) {
            console.error('Failed to toggle admin status:', error);
            this.showToast(error.message || 'Failed to update admin status', 'error');
        }
    }

    async deleteAdmin(adminId) {
        if (!confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
            return;
        }

        try {
            await adminAuth.makeAuthenticatedRequest(`/api/admin/admins/${adminId}`, {
                method: 'DELETE'
            });

            this.showToast('Admin deleted successfully', 'success');
            this.loadAdmins();
        } catch (error) {
            console.error('Failed to delete admin:', error);
            this.showToast(error.message || 'Failed to delete admin', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManagement = new AdminManagement();
});
