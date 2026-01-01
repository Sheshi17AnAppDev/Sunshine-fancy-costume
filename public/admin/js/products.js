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
            showToast('Failed to load products', 'error');
        }
    }

    renderProducts() {
        tableBody.innerHTML = filteredProducts.map(p => `
            <tr>
                <td>
                    <img src="${p.images[0]?.url || p.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='}" 
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
                    ${p.isFeatured ? '<span class="status-badge status-active" style="background: #e8f5e9; color: #2e7d32; margin-right: 4px;">Featured</span>' : ''}
                    ${p.isPopular ? '<span class="status-badge status-active" style="background: #fff3e0; color: #f57c00;">Popular</span>' : ''}
                </td>
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
        const typeFilter = document.getElementById('type-filter');

        categoryFilter?.addEventListener('change', () => this.filterProducts());
        statusFilter?.addEventListener('change', () => this.filterProducts());
        sortFilter?.addEventListener('change', () => this.filterProducts());
        typeFilter?.addEventListener('change', () => this.filterProducts());

        // Discount Calculator Logic
        const priceInput = document.getElementById('prod-price');
        const originalInput = document.getElementById('prod-original-price');
        const discountInput = document.getElementById('prod-discount');

        const calculate = (source) => {
            const price = parseFloat(priceInput.value) || 0;
            const original = parseFloat(originalInput.value) || 0;
            const discount = parseFloat(discountInput.value) || 0;

            if (source === 'original' || source === 'discount') {
                if (original > 0 && discount > 0) {
                    const newPrice = original - (original * (discount / 100));
                    priceInput.value = Math.round(newPrice);
                } else if (source === 'original' && original > 0 && discount === 0 && price > 0) {
                    // If original changed, recalculate discount
                    const newDiscount = ((original - price) / original) * 100;
                    if (newDiscount > 0) discountInput.value = Math.round(newDiscount);
                }
            }

            if (source === 'price') {
                if (original > 0 && price > 0 && price < original) {
                    const newDiscount = ((original - price) / original) * 100;
                    discountInput.value = Math.round(newDiscount);
                }
            }
        };

        originalInput?.addEventListener('input', () => calculate('original'));
        discountInput?.addEventListener('input', () => calculate('discount'));
        priceInput?.addEventListener('input', () => calculate('price'));
    }

    filterProducts() {
        const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const sortFilter = document.getElementById('sort-filter')?.value || 'name';
        const typeFilter = document.getElementById('type-filter')?.value || '';

        filteredProducts = allProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category?.name.toLowerCase() === categoryFilter.toLowerCase();
            let matchesStatus = true;
            if (statusFilter === 'active') matchesStatus = product.countInStock > 0;
            else if (statusFilter === 'inactive' || statusFilter === 'out-of-stock') matchesStatus = product.countInStock === 0;

            let matchesType = true;
            if (typeFilter === 'featured') matchesType = product.isFeatured;
            else if (typeFilter === 'popular') matchesType = product.isPopular;

            return matchesSearch && matchesCategory && matchesStatus && matchesType;
        });

        this.sortProducts(sortFilter);
        this.renderProducts();
    }

    sortProducts(sortBy) {
        switch (sortBy) {
            case 'name': filteredProducts.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'price-low': filteredProducts.sort((a, b) => a.price - b.price); break;
            case 'price-high': filteredProducts.sort((a, b) => b.price - a.price); break;
            case 'stock': filteredProducts.sort((a, b) => (b.countInStock || 0) - (a.countInStock || 0)); break;
        }
    }

    async editProduct(id) {
        editingId = id;
        const product = allProducts.find(p => p._id === id);
        if (!product) return;

        document.getElementById('modal-title').innerText = 'Edit Product';
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-original-price').value = product.originalPrice || '';
        document.getElementById('prod-stock').value = product.countInStock || 0;
        document.getElementById('prod-featured').checked = product.isFeatured || false;
        document.getElementById('prod-popular').checked = product.isPopular || false;
        document.getElementById('prod-cat').value = product.category?._id || '';
        document.getElementById('prod-brand').value = product.brand?._id || '';
        document.getElementById('prod-desc').value = product.description || '';

        // Calculate discount for display
        if (product.originalPrice && product.price && product.originalPrice > product.price) {
            const disc = ((product.originalPrice - product.price) / product.originalPrice) * 100;
            document.getElementById('prod-discount').value = Math.round(disc);
        } else {
            document.getElementById('prod-discount').value = '';
        }

        const previewContainer = document.getElementById('prod-images-preview');

        // Store current images for deletion
        window.currentProductImages = [...(product.images || [])];
        window.currentProductVideo = product.video || null;

        previewContainer.innerHTML = (window.currentProductImages || []).map((img, index) => `
            <div style="position: relative; display: inline-block; margin-right: 8px;">
                <img src="${img.url || img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;">
                <button type="button" onclick="removeImage(${index})" 
                    style="position: absolute; top: -8px; right: -8px; background: #ff3838; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    ×
                </button>
            </div>
        `).join('');

        // Add video preview if exists
        if (window.currentProductVideo) {
            const videoPreview = `
                <div style="position: relative; display: inline-block; margin-right: 8px;">
                    <div style="width: 80px; height: 80px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #ddd;">
                        <i class="fa-solid fa-video" style="color: white; font-size: 24px;"></i>
                    </div>
                    <button type="button" onclick="removeVideo()" 
                        style="position: absolute; top: -8px; right: -8px; background: #ff3838; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        ×
                    </button>
                </div>
            `;
            previewContainer.innerHTML += videoPreview;
        }

        // Load Age and Size Prices using Pricing Manager
        if (window.loadAgePrices) {
            window.loadAgePrices(product.agePrices || []);
        } else {
            console.warn('Pricing Manager not loaded');
        }

        if (window.loadSizePrices) {
            window.loadSizePrices(product.sizePrices || []);
        }

        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    async deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            showToast('Product deleted successfully', 'success');
            await this.loadData();
        } catch (error) {
            console.error('Failed to delete product:', error);
            showToast('Failed to delete product', 'error');
        }
    }
}

const productManager = new ProductManager();
window.editProd = (id) => productManager.editProduct(id);
window.deleteProd = (id) => productManager.deleteProduct(id);

document.getElementById('add-btn').onclick = () => {
    editingId = null;
    document.getElementById('product-form').reset();
    document.getElementById('modal-title').innerText = 'Add Product';
    document.getElementById('prod-images-preview').innerHTML = '';

    // Reset Pricing
    if (window.loadAgePrices) window.loadAgePrices([]);
    if (window.loadSizePrices) window.loadSizePrices([]);

    document.getElementById('prod-stock').value = '0';
    document.getElementById('prod-featured').checked = false;
    document.getElementById('prod-popular').checked = false;
    document.getElementById('prod-original-price').value = '';
    document.getElementById('prod-discount').value = '';
    modal.style.display = 'block';
    overlay.style.display = 'block';
};

// Legacy event listener removed - handled by pricing-manager.js
// document.getElementById('add-age-price-btn').onclick = () ...

document.getElementById('cancel-btn').onclick = () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
};

document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = 'Processing...';
    btnSubmit.disabled = true;

    try {
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const originalPrice = document.getElementById('prod-original-price').value;
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
                    showToast('Session expired. Please log in again.', 'error');
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
        // 2. Upload Related Images (if any legacy support needed, otherwise ignore)
        // const newRelatedImages = await uploadFiles('prod-related-images'); // Removed or deprecated in html

        // 3. Upload Video
        const newVideos = await uploadFiles('prod-video');
        const videoData = newVideos.length > 0 ? newVideos[0] : null;

        const allNewImages = [...newMainImages];

        // 4. Combine with Existing Images (if editing)
        let finalImages = allNewImages;
        let finalVideo = videoData;

        if (editingId) {
            // Use the current images array (which has deletions applied) + new uploads
            finalImages = [...(window.currentProductImages || []), ...allNewImages];

            // Use stored video if not deleted and no new video uploaded
            if (!finalVideo && window.currentProductVideo) {
                finalVideo = window.currentProductVideo;
            }
        }

        // Collect age prices (legacy method still here)
        const agePrices = [];
        document.querySelectorAll('.age-price-row').forEach(row => {
            const ageGroup = row.querySelector('.age-group-input').value;
            const price = row.querySelector('.age-price-input').value;
            if (ageGroup && price) agePrices.push({ ageGroup, price: Number(price) });
        });

        // Collect age prices using new pricing manager (if available)
        const agePricesFromManager = window.getAgePrices ? window.getAgePrices() : [];
        const finalAgePrices = agePricesFromManager.length > 0 ? agePricesFromManager : agePrices;

        // Collect size prices using pricing manager
        const sizePrices = window.getSizePrices ? window.getSizePrices() : [];

        const payload = {
            name,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : 0,
            countInStock: Number(countInStock),
            category,
            brand,
            description,
            images: finalImages,
            video: finalVideo, // Add video field
            isFeatured,
            isPopular,
            agePrices: finalAgePrices,
            sizePrices: sizePrices
        };

        const method = editingId ? 'put' : 'post';
        const url = editingId ? `/products/${editingId}` : '/products';
        await api[method](url, payload);

        modal.style.display = 'none';
        overlay.style.display = 'none';
        productManager.loadData();
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Error saving product', 'error');
    } finally {
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
};

// Global functions for deleting images and videos
window.removeImage = function (index) {
    if (confirm('Remove this image?')) {
        window.currentProductImages.splice(index, 1);
        // Re-render the preview
        const previewContainer = document.getElementById('prod-images-preview');
        previewContainer.innerHTML = (window.currentProductImages || []).map((img, i) => `
            <div style="position: relative; display: inline-block; margin-right: 8px;">
                <img src="${img.url || img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;">
                <button type="button" onclick="removeImage(${i})" 
                    style="position: absolute; top: -8px; right: -8px; background: #ff3838; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    ×
                </button>
            </div>
        `).join('');

        // Re-add video preview if exists
        if (window.currentProductVideo) {
            const videoPreview = `
                <div style="position: relative; display: inline-block; margin-right: 8px;">
                    <div style="width: 80px; height: 80px; background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #ddd;">
                        <i class="fa-solid fa-video" style="color: white; font-size: 24px;"></i>
                    </div>
                    <button type="button" onclick="removeVideo()" 
                        style="position: absolute; top: -8px; right: -8px; background: #ff3838; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        ×
                    </button>
                </div>
            `;
            previewContainer.innerHTML += videoPreview;
        }

        showToast('Image removed. Save to apply changes.', 'info');
    }
};

window.removeVideo = function () {
    if (confirm('Remove this video?')) {
        window.currentProductVideo = null;
        // Re-render the preview (remove video but keep images)
        const previewContainer = document.getElementById('prod-images-preview');
        previewContainer.innerHTML = (window.currentProductImages || []).map((img, i) => `
            <div style="position: relative; display: inline-block; margin-right: 8px;">
                <img src="${img.url || img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;">
                <button type="button" onclick="removeImage(${i})" 
                    style="position: absolute; top: -8px; right: -8px; background: #ff3838; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    ×
                </button>
            </div>
        `).join('');

        showToast('Video removed. Save to apply changes.', 'info');
    }
};

