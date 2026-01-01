let sites = [];
let editingId = null;

// Load all sites
async function loadSites() {
    try {
        sites = await api.get('/sites');
        renderSites();
    } catch (error) {
        console.error('Failed to load sites:', error);
        showToast('Failed to load sites', 'error');
    }
}

// Render sites grid
function renderSites() {
    const grid = document.getElementById('sites-grid');

    if (sites.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-globe" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3 style="color: #666; margin-bottom: 0.5rem;">No Sites Yet</h3>
               <p style="color: #999;">Create your first site to get started</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = sites.map(site => `
        <div class="site-card">
            <div class="site-logo" style="background: ${site.theme.primaryColor}15;">
                ${site.logo
            ? `<img src="${site.logo}" alt="${site.name}">`
            : `<i class="fas fa-store" style="color: ${site.theme.primaryColor};"></i>`
        }
            </div>
            <h3 class="site-name">${site.name}</h3>
            <div class="site-slug">/${site.slug}</div>
            <span class="site-status ${site.isActive ? 'active' : 'inactive'}">
                ${site.isActive ? 'Active' : 'Inactive'}
            </span>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <div style="width: 30px; height: 30px; border-radius: 6px; background: ${site.theme.primaryColor};"></div>
                <div style="width: 30px; height: 30px; border-radius: 6px; background: ${site.theme.secondaryColor};"></div>
            </div>
            <div class="site-actions">
                <button class="btn btn-sm btn-primary" onclick="editSite('${site._id}')" style="flex: 1;">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewSite('${site.slug}')" style="flex: 1;">
                    <i class="fas fa-external-link-alt"></i> View
                </button>
                ${sites.length > 1 ? `
                    <button class="btn btn-sm btn-danger" onclick="deleteSite('${site._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Open modal for new site
document.getElementById('add-site-btn').onclick = () => {
    editingId = null;
    document.getElementById('site-form').reset();
    document.getElementById('modal-title').textContent = 'Create New Site';
    document.getElementById('submit-btn').textContent = 'Create Site';
    document.getElementById('site-primary-color').value = '#fbb03b';
    document.getElementById('site-secondary-color').value = '#e89b25';
    document.getElementById('primary-color-value').textContent = '#fbb03b';
    document.getElementById('secondary-color-value').textContent = '#e89b25';
    openModal();
};

// Edit site
async function editSite(id) {
    try {
        const site = await api.get(`/sites/${id}`);
        editingId = id;

        document.getElementById('modal-title').textContent = 'Edit Site';
        document.getElementById('submit-btn').textContent = 'Update Site';

        document.getElementById('site-name').value = site.name;
        document.getElementById('site-slug').value = site.slug;
        document.getElementById('site-description').value = site.description || '';
        document.getElementById('site-primary-color').value = site.theme.primaryColor;
        document.getElementById('site-secondary-color').value = site.theme.secondaryColor;
        document.getElementById('site-currency').value = site.settings.currency;
        document.getElementById('site-currency-symbol').value = site.settings.currencySymbol;
        document.getElementById('site-active').checked = site.isActive;

        document.getElementById('primary-color-value').textContent = site.theme.primaryColor;
        document.getElementById('secondary-color-value').textContent = site.theme.secondaryColor;

        openModal();
    } catch (error) {
        console.error('Failed to load site:', error);
        showToast('Failed to load site details', 'error');
    }
}

// Delete site
async function deleteSite(id) {
    if (!confirm('Are you sure you want to delete this site? All associated data (products, categories, orders, users) will be permanently deleted. This action cannot be undone.')) {
        return;
    }

    const confirmText = prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') {
        showToast('Deletion cancelled', 'info');
        return;
    }

    try {
        await api.delete(`/sites/${id}`);
        showToast('Site deleted successfully', 'success');
        await loadSites();
    } catch (error) {
        console.error('Failed to delete site:', error);
        showToast(error.response?.data?.message || 'Failed to delete site', 'error');
    }
}

// View site
function viewSite(slug) {
    window.open(`/site/${slug}/`, '_blank');
}

// Form submission
document.getElementById('site-form').onsubmit = async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const payload = {
            name: document.getElementById('site-name').value,
            slug: document.getElementById('site-slug').value.toLowerCase(),
            description: document.getElementById('site-description').value,
            isActive: document.getElementById('site-active').checked,
            theme: {
                primaryColor: document.getElementById('site-primary-color').value,
                secondaryColor: document.getElementById('site-secondary-color').value
            },
            settings: {
                currency: document.getElementById('site-currency').value,
                currencySymbol: document.getElementById('site-currency-symbol').value
            }
        };

        if (editingId) {
            await api.put(`/sites/${editingId}`, payload);
            showToast('Site updated successfully', 'success');
        } else {
            await api.post('/sites', payload);
            showToast('Site created successfully', 'success');
        }

        closeModal();
        await loadSites();
    } catch (error) {
        console.error('Failed to save site:', error);
        showToast(error.response?.data?.message || 'Failed to save site', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

// Color picker updates
document.getElementById('site-primary-color').addEventListener('input', (e) => {
    document.getElementById('primary-color-value').textContent = e.target.value;
});

document.getElementById('site-secondary-color').addEventListener('input', (e) => {
    document.getElementById('secondary-color-value').textContent = e.target.value;
});

// Auto-generate slug from name
document.getElementById('site-name').addEventListener('input', (e) => {
    if (!editingId) {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        document.getElementById('site-slug').value = slug;
    }
});

// Modal functions
function openModal() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('site-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('site-modal').style.display = 'none';
}

document.getElementById('modal-overlay').onclick = closeModal;

// Initialize
loadSites();
