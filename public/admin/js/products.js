const tableBody = document.getElementById('product-table-body');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const catSelect = document.getElementById('prod-cat');

let editingId = null;
let allProducts = [];
let filteredProducts = [];

class ProductManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            const products = await api.get('/products');
            const categories = await api.get('/categories');
            const brands = await api.get('/brands');

            allProducts = products;
            filteredProducts = products;

            catSelect.innerHTML = categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
            document.getElementById('prod-brand').innerHTML = '<option value="">No Brand</option>' + brands.map(b => `<option value="${b._id}">${b.name}</option>`).join('');

            this.renderProducts();
        } catch (err) {
            console.error('Failed to load data:', err);
            // Fallback removed to ensure real-time data only
            this.showToast('Failed to load products', 'error');
        }
    }

    // showFallbackData removed

    renderProducts() {
        tableBody.innerHTML = filteredProducts.map(p => `
            <tr>
                <td>
                    <img src="${p.images[0]?.url || p.images[0] || 'https://via.placeholder.com/60x60'}" 
                         class="product-image" alt="${p.name}">
                </td>
                <td>
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="product-stock ${p.countInStock < 5 ? 'stock-low' : p.countInStock === 0 ? 'stock-out' : ''}">
                            Stock: ${p.countInStock || 0}
                        </div>
                    </div>
                </td>
                <td><strong>₹${p.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td>${p.category?.name || 'Uncategorized'}</td>
                <td>
                    <button onclick="productManager.editProduct('${p._id}')" class="btn btn-sm btn-primary">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="productManager.deleteProduct('${p._id}')" class="btn btn-sm btn-danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('product-search');
        searchInput?.addEventListener('input', (e) => {
            this.filterProducts();
        });

        // Filter controls
        const categoryFilter = document.getElementById('category-filter');
        const statusFilter = document.getElementById('status-filter');
        const sortFilter = document.getElementById('sort-filter');

        categoryFilter?.addEventListener('change', () => this.filterProducts());
        statusFilter?.addEventListener('change', () => this.filterProducts());
        sortFilter?.addEventListener('change', () => this.filterProducts());
    }

    filterProducts() {
        const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const sortFilter = document.getElementById('sort-filter')?.value || 'name';

        filteredProducts = allProducts.filter(product => {
            // Search filter
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = !categoryFilter ||
                product.category?.name.toLowerCase() === categoryFilter.toLowerCase();

            // Status filter
            let matchesStatus = true;
            if (statusFilter === 'active') {
                matchesStatus = product.stock > 0;
            } else if (statusFilter === 'inactive') {
                matchesStatus = product.stock === 0;
            } else if (statusFilter === 'out-of-stock') {
                matchesStatus = product.stock === 0;
            }

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Sort products
        this.sortProducts(sortFilter);
        this.renderProducts();
    }

    sortProducts(sortBy) {
        switch (sortBy) {
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'stock':
                filteredProducts.sort((a, b) => (b.countInStock || 0) - (a.countInStock || 0));
                break;
        }
    }

    async editProduct(id) {
        editingId = id;
        const product = allProducts.find(p => p._id === id);

        if (!product) return;

        document.getElementById('modal-title').innerText = 'Edit Product';
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-stock').value = product.countInStock || 0;
        document.getElementById('prod-featured').checked = product.isFeatured || false;
        document.getElementById('prod-popular').checked = product.isPopular || false;
        document.getElementById('prod-cat').value = product.category?._id || '';
        document.getElementById('prod-brand').value = product.brand?._id || '';
        document.getElementById('prod-desc').value = product.description || '';

        const previewContainer = document.getElementById('prod-images-preview');
        previewContainer.innerHTML = (product.images || []).map(img => `
            <img src="${img.url || img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
        `).join('');

        const agePricesList = document.getElementById('age-prices-list');
        agePricesList.innerHTML = '';
        if (product.agePrices && product.agePrices.length > 0) {
            product.agePrices.forEach(ap => this.renderAgePriceRow(ap.ageGroup, ap.price));
        }

        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    renderAgePriceRow(ageGroup = '', price = '') {
        const list = document.getElementById('age-prices-list');
        const div = document.createElement('div');
        div.className = 'age-price-row';
        div.innerHTML = `
            <input type="text" placeholder="Age Group (e.g. 3-5 years)" class="age-group-input" list="age-groups-list" value="${ageGroup}" required style="padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd;">
            <input type="number" placeholder="Price" class="age-price-input" value="${price}" required style="padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd;">
            <button type="button" class="remove-age-price" style="background: none; border: none; color: #e74c3c; cursor: pointer; padding: 0.5rem;"><i class="fas fa-trash"></i></button>
        `;
        div.querySelector('.remove-age-price').addEventListener('click', () => div.remove());
        list.appendChild(div);
    }

    async deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/products/${id}`);
            this.showToast('Product deleted successfully', 'success');
            await this.loadData();
        } catch (error) {
            console.error('Failed to delete product:', error);
            this.showToast('Failed to delete product', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize product manager
const productManager = new ProductManager();

// Global access for legacy or inline calls if necessary
window.editProd = (id) => productManager.editProduct(id);
window.deleteProd = (id) => productManager.deleteProduct(id);

document.getElementById('add-btn').onclick = () => {
    editingId = null;
    document.getElementById('product-form').reset();
    document.getElementById('modal-title').innerText = 'Add Product';
    document.getElementById('prod-images-preview').innerHTML = '';
    document.getElementById('age-prices-list').innerHTML = '';
    document.getElementById('prod-stock').value = '0'; // Default stock
    document.getElementById('prod-featured').checked = false;
    document.getElementById('prod-popular').checked = false;
    modal.style.display = 'block';
    overlay.style.display = 'block';
};

document.getElementById('add-age-price-btn').onclick = () => {
    productManager.renderAgePriceRow();
};

document.getElementById('cancel-btn').onclick = () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
};

document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();

    // Disable submit button
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = 'Processing...';
    btnSubmit.disabled = true;

    try {
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const countInStock = document.getElementById('prod-stock').value;
        const isFeatured = document.getElementById('prod-featured').checked;
        const isPopular = document.getElementById('prod-popular').checked;
        const category = document.getElementById('prod-cat').value;
        const brand = document.getElementById('prod-brand').value;
        const description = document.getElementById('prod-desc').value;

        // Helper to upload files
        const uploadFiles = async (fileInputId) => {
            const files = document.getElementById(fileInputId).files;
            if (!files || files.length === 0) return [];

            btnSubmit.innerText = `Uploading...`;
            const uploaded = [];
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);
                const token = localStorage.getItem('adminToken');

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (res.status === 401) {
                    alert('Session expired. Please log in again.');
                    window.location.href = '/admin/login';
                    throw new Error('Authentication failed');
                }
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Upload failed');
                uploaded.push({ url: data.url, public_id: data.id });
            }
            return uploaded;
        };

        // 1. Upload Main Images
        const newMainImages = await uploadFiles('prod-images');
        // 2. Upload Related Images
        const newRelatedImages = await uploadFiles('prod-related-images');

        const allNewImages = [...newMainImages, ...newRelatedImages];

        // 3. Combine with Existing Images (if editing)
        let finalImages = allNewImages;
        if (editingId) {
            const product = allProducts.find(p => p._id === editingId);
            if (product && product.images) {
                // Determine if we append or replace? 
                // Usually user expects append if picking new files.
                finalImages = [...product.images, ...allNewImages];
            }
        }
        // If it was a new product and no images, finalImages is just allNewImages (which might be empty)

        const agePrices = [];
        const ageRows = document.querySelectorAll('.age-price-row');
        ageRows.forEach(row => {
            const ageGroup = row.querySelector('.age-group-input').value;
            const price = row.querySelector('.age-price-input').value;
            if (ageGroup && price) {
                agePrices.push({ ageGroup, price: Number(price) });
            }
        });

        const payload = {
            name,
            price,
            countInStock,
            category,
            brand,
            description,
            description,
            images: finalImages,
            isFeatured,
            isPopular,
            agePrices
        };

        const method = editingId ? 'put' : 'post';
        const url = editingId ? `/products/${editingId}` : '/products';

        await api[method](url, payload); // api helper handles JSON content-type

        modal.style.display = 'none';
        overlay.style.display = 'none';
        productManager.loadData();
    } catch (err) {
        console.error(err);
        alert(err.message || 'Error saving product');
    } finally {
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
};


