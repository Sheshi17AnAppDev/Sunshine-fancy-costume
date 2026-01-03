// Global state for modals
let currentFeatured = [];
let currentPopular = [];
let currentCategories = [];
let featuredPage = 0;
let popularPage = 0;
let categoriesPage = 0;
const ITEMS_PER_PAGE = 12;

// Parse wishlist once helper
const getWishlist = () => JSON.parse(localStorage.getItem('wishlist') || '[]');

window.showAllFeatured = function () { InitModal('featured'); };
window.showAllPopular = function () { InitModal('popular'); };
window.showAllCategories = function () { InitModal('categories'); };

function InitModal(type) {
    const isCat = type === 'categories';
    const modalId = isCat ? 'categories-modal' : (type === 'featured' ? 'featured-modal' : 'popular-modal');
    const gridId = isCat ? 'categories-modal-grid' : (type === 'featured' ? 'featured-modal-grid' : 'popular-modal-grid');

    const modal = document.getElementById(modalId);
    const grid = document.getElementById(gridId);

    // Reset
    grid.innerHTML = '';

    if (type === 'featured') {
        featuredPage = 0;
        if (window.allProducts) currentFeatured = window.allProducts.filter(p => p.isFeatured);
    } else if (type === 'popular') {
        popularPage = 0;
        if (window.allProducts) currentPopular = window.allProducts.filter(p => p.isPopular);
    } else {
        categoriesPage = 0;
        if (window.allCategories) currentCategories = window.allCategories;
    }

    const data = type === 'featured' ? currentFeatured : (type === 'popular' ? currentPopular : currentCategories);

    if (data.length > 0) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderBatch(type);
    } else {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">No ${type} available</div>`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function renderBatch(type) {
    const isCat = type === 'categories';
    const gridId = isCat ? 'categories-modal-grid' : (type === 'featured' ? 'featured-modal-grid' : 'popular-modal-grid');
    const grid = document.getElementById(gridId);

    let items, page;
    if (type === 'featured') { items = currentFeatured; page = featuredPage; }
    else if (type === 'popular') { items = currentPopular; page = popularPage; }
    else {
        // For categories, we SHOW ALL at once, no pagination
        items = currentCategories;
        page = 0;
    }

    let start, end, batch;

    if (type === 'categories') {
        // Show ALL categories
        start = 0;
        end = items.length;
        batch = items;
    } else {
        // Standard Pagination for others
        start = page * ITEMS_PER_PAGE;
        end = start + ITEMS_PER_PAGE;
        batch = items.slice(start, end);
    }

    if (batch.length === 0) return;

    let html;
    if (isCat) {
        html = batch.map(renderCategoryCard).join('');
    } else {
        const wishlist = getWishlist();
        html = batch.map(p => renderProductCard(p, wishlist)).join('');
    }

    if (page === 0) {
        grid.innerHTML = html;
        if (type !== 'categories' && items.length > end) addLoadMoreButton(grid, type);
    } else {
        const btn = grid.querySelector('.load-more-container');
        if (btn) btn.remove();
        grid.insertAdjacentHTML('beforeend', html);
        if (type !== 'categories' && items.length > end) addLoadMoreButton(grid, type);
    }

    // Increment Page
    if (type === 'featured') featuredPage++;
    else if (type === 'popular') popularPage++;
    else categoriesPage++;
}

function addLoadMoreButton(grid, type) {
    const div = document.createElement('div');
    div.className = 'load-more-container';
    div.style.gridColumn = '1 / -1';
    div.style.textAlign = 'center';
    div.style.padding = '2rem';
    div.innerHTML = `<button class="btn btn-outline" onclick="renderBatch('${type}')">Load More</button>`;
    grid.appendChild(div);
    div.querySelector('button').onclick = () => renderBatch(type);
}

window.closeAllModals = function () {
    document.querySelectorAll('.fullscreen-modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
};

function renderCategoryCard(cat) {
    // Calculate Product Count
    const count = window.allProducts
        ? window.allProducts.filter(p => p.category === cat._id || (p.category && p.category._id === cat._id)).length
        : 0;

    return `
        <a href="/shop?category=${cat._id}" class="category-cat-item" style="text-decoration: none; color: inherit; display: block; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="aspect-ratio: 4/3; overflow: hidden; background: #f9f9f9; width: 100%;">
                <img src="${cat.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(cat.name)}" alt="${cat.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 0.8rem; text-align: center;">
                <h3 style="margin: 0; font-size: 0.95rem; color: #333;">${cat.name}</h3>
                <span class="cat-count" style="display: block; font-size: 0.8rem; color: #999; margin-top: 0.3rem;">${count} Products</span>
            </div>
        </a>
    `;
}

function renderProductCard(p, wishlistArray) {
    const hasSale = p.originalPrice && p.originalPrice > p.price;
    const discountPercent = hasSale ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
    const wishlist = wishlistArray || JSON.parse(localStorage.getItem('wishlist') || '[]');
    const isFav = wishlist.includes(p._id);

    const imageContent = p.images && p.images.length > 0
        ? `<img src="${p.images[0].url || p.images[0]}" alt="${p.name}" loading="lazy">`
        : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#f5f5f5; color:#999;">No Image</div>`;

    return `
        <div class="product-item">
            <div class="product-img-box">
                ${hasSale ? `<span class="sale-tag">-${discountPercent}% OFF</span>` : ''}
                <a href="product?id=${p._id}" style="display: block; width: 100%; height: 100%; position: relative; overflow: hidden;">
                    ${imageContent}
                </a>
                <div class="quick-actions">
                    <button class="action-btn heart-icon-btn ${isFav ? 'active' : ''}" data-id="${p._id}" title="Add to Wishlist" onclick="event.preventDefault(); window.toggleWishlist('${p._id}')">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <button class="action-btn cart-icon-btn" title="Quick Add to Cart" onclick="event.preventDefault(); window.quickAddToCart('${p._id}')">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
            <a href="product?id=${p._id}" style="text-decoration: none; color: inherit;">
                <h4>${p.name}</h4>
                <div class="price-box">
                    ${hasSale ? `<span class="old-price">${formatCurrency(p.originalPrice)}</span>` : ''}
                    <span class="new-price">${formatCurrency(p.price)}</span>
                </div>
            </a>
        </div>
    `;
}

window.allProducts = [];
window.allCategories = [];
