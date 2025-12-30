document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Dynamic content (CMS)
        try {
            const contentRes = await api.get('/site-content/home');
            const data = contentRes?.data || {};

            const heroTitle = document.getElementById('home-hero-title');
            const heroSubtitle = document.getElementById('home-hero-subtitle');
            const titleFeatured = document.getElementById('home-title-featured');
            const titleCategories = document.getElementById('home-title-categories');
            const titlePopular = document.getElementById('home-title-popular');
            const titleStats = document.getElementById('home-title-stats');
            const titleNewsletter = document.getElementById('home-title-newsletter');

            if (heroTitle && data?.hero?.title) heroTitle.innerHTML = String(data.hero.title).replace(/\n/g, '<br>');
            if (heroSubtitle && data?.hero?.subtitle) heroSubtitle.textContent = data.hero.subtitle;

            if (titleFeatured && data?.sectionTitles?.featured) titleFeatured.textContent = data.sectionTitles.featured;
            if (titleCategories && data?.sectionTitles?.categories) titleCategories.textContent = data.sectionTitles.categories;
            if (titlePopular && data?.sectionTitles?.popular) titlePopular.textContent = data.sectionTitles.popular;
            if (titleStats && data?.sectionTitles?.stats) titleStats.innerHTML = String(data.sectionTitles.stats).replace(/\n/g, '<br>');
            if (titleNewsletter && data?.sectionTitles?.newsletter) titleNewsletter.innerHTML = String(data.sectionTitles.newsletter).replace(/\n/g, '<br>');
        } catch (e) {
            // ignore CMS load failures
        }

        const categories = await api.get('/categories');
        const categoriesContainer = document.getElementById('categories-container');
        const catPrev = document.getElementById('cat-prev');
        const catNext = document.getElementById('cat-next');

        if (categories && categories.length > 0) {
            // Function to chunk array
            const chunkArray = (arr, size) => {
                const results = [];
                while (arr.length) {
                    results.push(arr.splice(0, size));
                }
                return results;
            };

            const categoryGroups = chunkArray([...categories], 4);

            categoriesContainer.innerHTML = categoryGroups.map((group, index) => {
                const cardsHtml = group.map(cat => `
                    <a href="/shop?category=${cat._id}" class="category-card">
                        <img src="${cat.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(cat.name)}" alt="${cat.name}">
                        <h3>${cat.name}</h3>
                    </a>
                `).join('');

                return `<div class="category-grid-group reveal">${cardsHtml}</div>`;
            }).join('');

            // Scroll Logic
            if (catPrev && catNext && categoriesContainer) {
                catPrev.onclick = () => {
                    categoriesContainer.scrollBy({ left: -600, behavior: 'smooth' });
                };
                catNext.onclick = () => {
                    categoriesContainer.scrollBy({ left: 600, behavior: 'smooth' });
                };
            }
        }

        const products = await api.get('/products');
        const featuredContainer = document.getElementById('featured-products');
        const popularContainer = document.getElementById('popular-products');

        const renderItem = (p) => {
            const isFav = window.isInWishlist(p._id);
            return `
                <div class="product-item reveal">
                    <div class="product-img-box">
                        <span class="sale-tag">SALE</span>
                        <a href="product?id=${p._id}" style="display: block; width: 100%; height: 100%;">
                            <img src="${p.images[0]?.url || p.images[0] || ''}" alt="${p.name}">
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
                            <span class="old-price">${formatCurrency(p.price * 1.25)}</span>
                            <span class="new-price">${formatCurrency(p.price)}</span>
                        </div>
                    </a>
                </div>
            `;
        };

        if (featuredContainer) {
            const featured = products.filter(p => p.isFeatured);
            // If no products are explicitly featured, fallback to first 4? Better to show nothing layout-wise or just 4 newest.
            // Requirement says "choose ... from admin panel", implying strict control.
            // Let's show filtered ones. If empty, maybe show empty?
            // Actually, for better UX, if 0 featured, maybe show 4 random? 
            // The prompt implies strict control. let's stick to true filtering.
            featuredContainer.innerHTML = featured.length > 0
                ? featured.map(renderItem).join('')
                : '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">No featured products yet.</div>';
        }

        if (popularContainer) {
            const popular = products.filter(p => p.isPopular);
            popularContainer.innerHTML = popular.length > 0
                ? popular.map(renderItem).join('')
                : '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">No popular products yet.</div>';
        }

        // Re-run observer for new items
        document.querySelectorAll('.reveal').forEach(el => {
            if (window.observer) window.observer.observe(el);
            else {
                // Fallback or early load
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('revealed'); });
                });
                obs.observe(el);
            }
        });

        // Helper for scroll buttons
        const setupScroll = (containerId, prevBtnId, nextBtnId) => {
            const container = document.getElementById(containerId);
            const prev = document.getElementById(prevBtnId);
            const next = document.getElementById(nextBtnId);

            if (container && prev && next) {
                prev.onclick = () => container.scrollBy({ left: -300, behavior: 'smooth' });
                next.onclick = () => container.scrollBy({ left: 300, behavior: 'smooth' });
            }
        };

        setupScroll('featured-products', 'featured-prev', 'featured-next');
        setupScroll('popular-products', 'popular-prev', 'popular-next');

    } catch (error) {
        console.error(error);
    }
});
