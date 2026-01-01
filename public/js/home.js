document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Dynamic content (CMS)
        try {
            const contentRes = await api.get('/site-content/home');
            const data = contentRes || {};

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
        // KEY FIX: Export cats
        window.allCategories = categories;

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
        // KEY FIX: Export to window for product-modals.js
        window.allProducts = products;

        const featuredContainer = document.getElementById('featured-products');
        const popularContainer = document.getElementById('popular-products');

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
                <div class="product-item reveal">
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

        if (featuredContainer) {
            const featured = products.filter(p => p.isFeatured);
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

        // Render Promo Carousel
        try {
            const carouselRes = await api.get('/site-content/promoCarousel');
            const cData = carouselRes;
            console.log('Promo Carousel Data:', cData);
            console.log('Promo Carousel Raw:', JSON.stringify(cData));

            if (cData && cData.isVisible && cData.slides && cData.slides.length > 0) {
                console.log('Rendering', cData.slides.length, 'slides');
                const carouselSection = document.createElement('section');
                carouselSection.className = 'promo-carousel-section';
                carouselSection.style.marginBottom = '3rem';
                carouselSection.style.marginTop = '2rem';

                const styles = `
                    .promo-carousel-container {
                        position: relative;
                        width: 100%;
                        max-width: 1400px;
                        margin: 0 auto;
                        overflow: hidden;
                        border-radius: 16px;
                    }
                    .promo-carousel-track {
                        display: flex;
                        transition: transform 0.5s ease-in-out;
                    }
                    .promo-carousel-slide {
                        min-width: 100%;
                        position: relative;
                        aspect-ratio: 21/9;
                        overflow: hidden;
                    }
                    .promo-carousel-slide img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .promo-carousel-content {
                        position: absolute;
                        bottom: 10%;
                        left: 5%;
                        background: rgba(0,0,0,0.6);
                        padding: 1.5rem;
                        border-radius: 12px;
                        color: white;
                        max-width: 50%;
                        backdrop-filter: blur(5px);
                    }
                    .promo-carousel-content h2 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #fbb03b; }
                    .promo-carousel-content p { font-size: 1.1rem; margin-bottom: 1rem; }
                    .promo-carousel-btn {
                        display: inline-block;
                        padding: 0.8rem 1.5rem;
                        background: #fbb03b;
                        color: black;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        transition: transform 0.2s;
                    }
                    .promo-carousel-btn:hover { transform: scale(1.05); }
                    .pc-nav-btn {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.5);
                        color: white;
                        border: none;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        cursor: pointer;
                        z-index: 10;
                        font-size: 1.2rem;
                    }
                    .pc-prev { left: 1rem; }
                    .pc-next { right: 1rem; }
                    @media (max-width: 768px) {
                        .promo-carousel-slide { aspect-ratio: 16/9; }
                        .promo-carousel-content { max-width: 90%; bottom: 5%; left: 5%; padding: 1rem; }
                        .promo-carousel-content h2 { font-size: 1.5rem; }
                    }
                `;

                const styleSheet = document.createElement("style");
                styleSheet.innerText = styles;
                document.head.appendChild(styleSheet);

                const slidesHtml = cData.slides.map(slide => {
                    let subtitle = slide.subtitle; // fallback

                    // If categoryId is present, try to construct a discount subtitle
                    if (slide.categoryId && categories) {
                        const cat = categories.find(c => c._id === slide.categoryId);
                        if (cat) {
                            if (slide.discount) {
                                subtitle = `Flat ${slide.discount}% OFF on ${cat.name}`;
                            } else {
                                subtitle = `Shop our ${cat.name} Collection`;
                            }
                        }
                    }

                    const isVideo = slide.image && (slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.mov'));

                    return `
                    <div class="promo-carousel-slide">
                        ${isVideo ?
                            `<video src="${slide.image}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;" onmouseover="this.muted=false" onmouseout="this.muted=true"></video>
                             <div style="position:absolute; bottom:20px; right:20px; z-index:20; background:rgba(0,0,0,0.5); color:white; padding:5px 10px; border-radius:4px; font-size:0.8rem; pointer-events:none;">
                                <i class="fa-solid fa-volume-high"></i> Hover for Sound
                             </div>`
                            : `<img src="${slide.image}" alt="${slide.title}">`
                        }
                        <div class="promo-carousel-content" style="pointer-events: none;">
                            ${slide.title ? `<h2>${slide.title}</h2>` : ''}
                            ${subtitle ? `<p>${subtitle}</p>` : ''}
                            ${slide.link ? `<a href="${slide.link}" class="promo-carousel-btn" style="pointer-events: auto;">Shop Now <i class="fa-solid fa-arrow-right"></i></a>` : ''}
                        </div>
                    </div>
                `}).join('');

                carouselSection.innerHTML = `
                    <div class="promo-carousel-container">
                        <div class="promo-carousel-track" id="pc-track">
                            ${slidesHtml}
                        </div>
                        <button class="pc-nav-btn pc-prev" id="pc-prev"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="pc-nav-btn pc-next" id="pc-next"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                `;

                // Logic
                let currentIndex = 0;
                const totalSlides = cData.slides.length;
                const track = carouselSection.querySelector('#pc-track');
                const prev = carouselSection.querySelector('#pc-prev');
                const next = carouselSection.querySelector('#pc-next');

                const updateTrack = () => {
                    track.style.transform = `translateX(-${currentIndex * 100}%)`;
                };

                const nextSlide = () => {
                    currentIndex = (currentIndex + 1) % totalSlides;
                    updateTrack();
                };

                if (prev && next) {
                    prev.onclick = () => {
                        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                        updateTrack();
                    };
                    next.onclick = nextSlide;
                }

                // Auto slide
                setInterval(nextSlide, 5000);

                // Insert before Featured Products
                // The featured products section is the second .reveal section in common layout, or can be identified by containing #featured-products
                const featuredContainer = document.getElementById('featured-products');
                if (featuredContainer) {
                    // Go up to the section parent
                    const heroSection = document.querySelector('.hero');
                    if (heroSection) {
                        heroSection.after(carouselSection);
                    } else {
                        // Fallback if hero not found
                        const featuredProductsSection = document.getElementById('featured-products');
                        if (featuredProductsSection) {
                            // Insert before the parent SECTION of featured products to avoid being inside scroll wrapper
                            const parentSection = featuredProductsSection.closest('section');
                            if (parentSection) {
                                parentSection.before(carouselSection);
                            } else {
                                featuredProductsSection.parentNode.insertBefore(carouselSection, featuredProductsSection);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load promo carousel', err);
        }


        // View All Buttons Logic (Integrated in HTML, no extra JS needed here)
        // Products exported to window.allProducts above for modals to use.


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
                }, 1200); // 1.2s delay for quick browsing
            }
        });

        document.addEventListener('mouseout', (e) => {
            const carousel = e.target.closest('.product-card-carousel');
            if (carousel) {
                // Check if we really left the carousel (not just moved to child)
                const rel = e.relatedTarget;
                if (!carousel.contains(rel)) {
                    stopCardScroll();
                    // Optional: Reset to 0?
                    // carousel.scrollTo({ left: 0, behavior: 'smooth' });
                    // Resetting to 0 is often better for UX so it starts fresh next time
                    carousel.scrollTo({ left: 0 }); // instant reset or smooth? Instant is less dizzying on exit
                }
            }
        });

    } catch (error) {
        console.error(error);
    }
});
