const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');

document.addEventListener('DOMContentLoaded', () => {
    fetchBrands();

    document.getElementById('logout')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.adminAuth) window.adminAuth.logout();
    });

    // Add Brand Button
    document.getElementById('add-btn').onclick = () => {
        document.getElementById('brand-form').reset();
        document.getElementById('modal-title').innerText = 'Add Brand';
        document.getElementById('brand-id').value = '';
        document.getElementById('brand-image-preview').innerHTML = '';
        modal.style.display = 'block';
        overlay.style.display = 'block';
    };

    // Cancel Button
    document.getElementById('cancel-btn').onclick = () => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    };

    const form = document.getElementById('brand-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('brand-id').value;
        const formData = new FormData();
        formData.append('name', document.getElementById('brand-name').value);
        formData.append('description', document.getElementById('brand-description').value);

        const imageFile = document.getElementById('brand-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (id) {
                await api.put(`/brands/${id}`, formData);
            } else {
                await api.post('/brands', formData);
            }
            modal.style.display = 'none';
            overlay.style.display = 'none';
            fetchBrands();
        } catch (err) {
            alert(err.message || 'Error saving brand');
        }
    };
});

async function fetchBrands() {
    try {
        const brands = await api.get('/brands');
        const container = document.getElementById('brands-container');

        if (brands.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff; border-radius: 15px;">
                <i class="fa-solid fa-tag" style="font-size: 3rem; color: #eee; margin-bottom: 1rem;"></i>
                <p style="color: var(--muted-text);">No brands found. Start by adding one!</p>
            </div>`;
            return;
        }

        container.innerHTML = brands.map(b => `
            <div class="admin-card brand-card">
                <img src="${b.image}" alt="${b.name}" class="brand-logo">
                <div class="brand-info">
                    <h3>${b.name}</h3>
                    <p>${b.description || 'No description provided'}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" onclick="editBrand('${b._id}', '${b.name}', '${b.image}', '${b.description}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteBrand('${b._id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function editBrand(id, name, image, description) {
    document.getElementById('modal-title').innerText = 'Edit Brand';
    document.getElementById('brand-id').value = id;
    document.getElementById('brand-name').value = name;
    document.getElementById('brand-description').value = description;

    if (image && image !== 'undefined') {
        const previewResult = document.getElementById('brand-image-preview');
        previewResult.innerHTML = `<img src="${image}" style="max-width: 100px; border-radius: 10px;">`;
    } else {
        document.getElementById('brand-image-preview').innerHTML = '';
    }

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

async function deleteBrand(id) {
    if (confirm('Are you sure you want to delete this brand?')) {
        try {
            await api.delete(`/brands/${id}`);
            fetchBrands();
        } catch (err) {
            alert(err.message || 'Delete failed');
        }
    }
}
