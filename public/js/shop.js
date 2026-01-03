document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('products-grid');
    const catList = document.getElementById('cat-list');
    const ageList = document.getElementById('age-group-list');
    const priceList = document.getElementById('price-range-list');
    const collectionTitle = document.querySelector('.shop-content h2');

    let products = [];
    let categories = [];
    let dynamicPriceRanges = [];
    let ageGroups = [];

    // Create Network Banner
    const banner = document.createElement('div');
    banner.className = 'network-status-banner';
    banner.innerHTML = '<i class="fa-solid fa-wifi-slash"></i> No Internet Connection. Working Offline.';
    document.body.prepend(banner);

    const updateNetworkStatus = () => {
        if (navigator.onLine) {
            banner.classList.remove('active');
        } else {
            banner.classList.add('active');
        }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    const showLoading = () => {
        if (!grid) return;
        grid.innerHTML = Array(6).fill(0).map(() => `
            <div class="product-item" style="pointer-events: none;">
                <div class="product-img-box loading-skeleton" style="height: 250px;"></div>
                <div class="loading-skeleton" style="height: 20px; width: 70%; margin-top: 1rem;"></div>
                <div class="loading-skeleton" style="height: 15px; width: 40%; margin-top: 0.5rem;"></div>
            </div>
        `).join('');
    };

    const showError = (message) => {
        if (!grid) return;
        grid.innerHTML = `
            <div class="error-container" style="grid-column: 1/-1;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Connection Issue</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>
            </div>
        `;
    };

    async function initShop() {
        showLoading();
        try {
            const [productsRes, categoriesRes, shopContentRes] = await Promise.all([
                api.get('/products'),
                api.get('/categories'),
                api.get('/site-content/shop')
            ]);

            products = productsRes || [];
            categories = categoriesRes || [];
            dynamicPriceRanges = shopContentRes?.data?.priceRanges || [];
            ageGroups = shopContentRes?.data?.ageGroups || [];

            if (collectionTitle && shopContentRes?.data?.title) {
                collectionTitle.innerText = shopContentRes.data.title;
            }

            renderFilters();
            filterProducts();
        } catch (error) {
            console.error('Shop initialization failed:', error);
            showError('We are having trouble connecting to the server. Please check your data or wifi.');
        }
    }

    function renderFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCategoryId = urlParams.get('category');

        if (catList) {
            catList.innerHTML = categories.map(c => {
                const isChecked = urlCategoryId === (c._id || c.name);
                return `
                    <li style="margin-bottom: 0.8rem;">
                        <label class="custom-checkbox-container">
                            <input type="checkbox" class="cat-filter" value="${c._id || c.name}" ${isChecked ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span class="label-text">${c.name}</span>
                        </label>
                    </li>
                `;
            }).join('');
        }

        if (ageList) {
            ageList.innerHTML = ageGroups.map(age => `
                <label class="custom-checkbox-container" style="margin-bottom: 1rem;">
                    <input type="checkbox" class="age-filter" value="${age.label || age}">
                    <span class="checkmark"></span>
                    <span class="label-text">${age.label || age}</span>
                </label>
            `).join('');
        }

        if (priceList) {
            priceList.innerHTML = dynamicPriceRanges.map((range, index) => `
                <label class="custom-checkbox-container" style="margin-bottom: 1rem;">
                    <input type="checkbox" class="price-filter" value="${index}">
                    <span class="checkmark"></span>
                    <span class="label-text">${range.label}</span>
                </label>
            `).join('');
        }
    }

    const renderItem = (p) => {
        const isFav = window.isInWishlist(p._id);
        const hasMultipleImages = p.images && p.images.length > 1;
        const hasSale = p.originalPrice && p.originalPrice > p.price;
        const discountPercent = hasSale ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

        let imageContent;
        if (hasMultipleImages) {
            imageContent = `
                <div class="product-card-carousel">
                    ${p.images.map(img => `<img src="${img.url || img}" alt="${p.name}">`).join('')}
                </div>
            `;
        } else {
            imageContent = `<img src="${p.images[0]?.url || p.images[0] || ''}" alt="${p.name}">`;
        }

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
    };

    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialCategory = initialUrlParams.get('category');
    const initialFilter = initialUrlParams.get('filter');

    // If entering with a specific category or filter, show more items initially (e.g., 50)
    // otherwise default to 12
    // Dynamic Page Size
    let pageSize = (initialCategory || initialFilter) ? 50 : 12;

    // If entering with a specific category or filter, show more items initially
    let visibleCount = pageSize;

    const loadMoreBtn = document.getElementById('load-more-btn');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += pageSize;
            filterProducts(false); // false = don't reset count
        });
    }

    const filterProducts = (resetCount = true) => {
        if (resetCount) visibleCount = pageSize;

        const searchText = (document.getElementById('shop-search')?.value || '').toLowerCase();
        const selectedCats = Array.from(document.querySelectorAll('.cat-filter:checked')).map(cb => cb.value);
        const selectedAges = Array.from(document.querySelectorAll('.age-filter:checked')).map(cb => cb.value);
        const selectedPriceIndices = Array.from(document.querySelectorAll('.price-filter:checked')).map(cb => parseInt(cb.value));

        // Get filter from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const filterType = urlParams.get('filter'); // e.g., "featured" or "popular"

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchText) ||
                (p.description && p.description.toLowerCase().includes(searchText));

            const matchesCat = selectedCats.length === 0 ||
                selectedCats.includes(p.category?._id) ||
                selectedCats.includes(p.category);

            // Matches if NO selection, or if ANY of the product's ageGroups matches the selection
            const productAges = (p.agePrices || []).map(ap => ap.ageGroup);
            const matchesAge = selectedAges.length === 0 ||
                selectedAges.some(age => productAges.includes(age));

            const matchesPrice = selectedPriceIndices.length === 0 ||
                selectedPriceIndices.some(idx => {
                    const range = dynamicPriceRanges[idx];
                    const allPrices = [p.price, ...(p.agePrices || []).map(ap => ap.price)];
                    return allPrices.some(priceVal => priceVal >= range.min && priceVal <= range.max);
                });

            // Check URL filter parameter
            let matchesFilter = true;
            if (filterType === 'featured') {
                matchesFilter = p.isFeatured === true;
            } else if (filterType === 'popular') {
                matchesFilter = p.isPopular === true;
            }

            return matchesSearch && matchesCat && matchesAge && matchesPrice && matchesFilter;
        });

        const visibleProducts = filtered.slice(0, visibleCount);

        if (grid) {
            if (filtered.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 5rem;">No products match your filters.</div>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            } else {
                grid.innerHTML = visibleProducts.map(renderItem).join('');

                // Handle Load More Button Visibility
                if (loadMoreBtn) {
                    if (filtered.length > visibleCount) {
                        loadMoreBtn.style.display = 'inline-block';
                        loadMoreBtn.innerText = `Load More (${filtered.length - visibleCount} remaining)`;
                    } else {
                        loadMoreBtn.style.display = 'none';
                    }
                }
            }
        }

        if (window.observer) {
            document.querySelectorAll('.reveal').forEach(el => window.observer.observe(el));
        }
        const counter = document.getElementById('counter');
        if (counter) counter.innerText = `Showing 1-${Math.min(visibleCount, filtered.length)} of ${filtered.length} item(s)`;
    };

    // Event Listeners
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('cat-filter') ||
            e.target.classList.contains('age-filter') ||
            e.target.classList.contains('price-filter')) {
            filterProducts();
        }
    });

    const searchInput = document.getElementById('shop-search');
    if (searchInput) {
        searchInput.oninput = filterProducts;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery && searchInput) {
        searchInput.value = searchQuery;
    }

    // Product Card Hover Auto-Scroll (Delegated)
    let cardInterval;
    const stopCardScroll = () => {
        if (cardInterval) clearInterval(cardInterval);
        cardInterval = null;
    };

    document.addEventListener('mouseover', (e) => {
        const carousel = e.target.closest('.product-card-carousel');
        if (carousel && !cardInterval) {
            // Start scrolling
            cardInterval = setInterval(() => {
                const currentScroll = carousel.scrollLeft;
                const width = carousel.clientWidth;
                const totalWidth = carousel.scrollWidth;

                let nextScroll = currentScroll + width;
                if (nextScroll >= totalWidth - 5) {
                    nextScroll = 0; // Loop back
                }
                carousel.scrollTo({ left: nextScroll, behavior: 'smooth' });
            }, 1200);
        }
    });

    document.addEventListener('mouseout', (e) => {
        const carousel = e.target.closest('.product-card-carousel');
        if (carousel) {
            const rel = e.relatedTarget;
            if (!carousel.contains(rel)) {
                stopCardScroll();
                carousel.scrollTo({ left: 0 }); // reset
            }
        }
    });

    // Mobile Filter Drawer Logic
    const filterToggle = document.getElementById('filter-toggle');
    const sidebar = document.querySelector('.shop-sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');

    if (filterToggle && sidebar && overlay) {
        // Create Close Button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'filter-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        // Add title and close button container if not present
        if (!sidebar.querySelector('.filter-close')) {
            const header = document.createElement('div');
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;';
            header.innerHTML = '<h3 style="margin:0; font-size:1.2rem;">Filters</h3>';
            header.appendChild(closeBtn);
            sidebar.prepend(header);
        }

        filterToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    initShop();
});
