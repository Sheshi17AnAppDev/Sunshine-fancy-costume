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

// Initialize
loadSites();

// Render sites grid
function renderSites() {
    const grid = document.getElementById('sites-grid');

    if (sites.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <i class="fas fa-globe" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3 style="color: #666; margin-bottom: 0.5rem;">No Sites Yet</h3>
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
