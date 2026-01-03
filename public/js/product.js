document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) { window.location.href = '/shop'; return; }

    try {
        const product = await api.get(`/products/${productId}`);
        api.patch(`/products/${productId}/view`).catch(err => console.error(err));

        // Basic Info
        const breadName = document.getElementById('bread-name');
        if (breadName) breadName.innerText = product.name;

        const productName = document.getElementById('product-name');
        if (productName) productName.innerText = product.name;

        const productPrice = document.getElementById('product-price');
        if (productPrice) {
            if (product.originalPrice && product.originalPrice > product.price) {
                const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                productPrice.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span style="text-decoration: line-through; color: #999; font-size: 0.7em;">${formatCurrency(product.originalPrice)}</span>
                        <span style="color: var(--black); font-weight: 700;">${formatCurrency(product.price)}</span>
                        <span style="background: var(--black); color: #fff; font-size: 0.6em; padding: 4px 10px; border-radius: 4px; font-weight: 600;">-${discount}% OFF</span>
                    </div>
                `;
            } else {
                productPrice.innerText = formatCurrency(product.price);
            }
        }

        const productDesc = document.getElementById('product-desc');
        if (productDesc) productDesc.innerText = product.description;

        // Also populate the tab description immediately
        const tabDesc = document.getElementById('tab-desc');
        if (tabDesc) {
            tabDesc.innerText = product.description;
            tabDesc.style.color = 'var(--dark-text)'; // Reset style if needed
        }

        const productCat = document.getElementById('product-category');
        if (productCat) productCat.innerText = (product.category?.name || product.category || 'CATEGORY');

        // Pricing Logic (Age & Size)
        let selectedAgeGroup = null;
        let selectedSize = null;
        let currentPrice = product.price;

        const ageContainer = document.getElementById('age-selection-container');
        const ageChips = document.getElementById('age-chips');
        const sizeContainer = document.getElementById('size-selection-container');
        const sizeChips = document.getElementById('size-chips');

        // Helper to update displayed price
        const updatePriceDisplay = (price) => {
            currentPrice = price;
            if (productPrice) productPrice.innerText = formatCurrency(currentPrice);
        };

        // Render Age Prices
        if (product.agePrices && product.agePrices.length > 0) {
            ageContainer.hidden = false;
            ageChips.innerHTML = product.agePrices.map((ap, index) => `
                <div class="age-chip" data-index="${index}">${ap.ageGroup}</div>
            `).join('');

            const aChips = ageChips.querySelectorAll('.age-chip');
            aChips.forEach(chip => {
                chip.onclick = () => {
                    // Deselect Size if any
                    if (sizeChips) sizeChips.querySelectorAll('.age-chip').forEach(c => c.classList.remove('selected'));
                    selectedSize = null;

                    // Select Age
                    aChips.forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                    const idx = chip.getAttribute('data-index');
                    selectedAgeGroup = product.agePrices[idx].ageGroup;
                    updatePriceDisplay(product.agePrices[idx].price);
                };
            });
        }

        // Render Size Prices
        if (product.sizePrices && product.sizePrices.length > 0) {
            sizeContainer.hidden = false;
            sizeChips.innerHTML = product.sizePrices.map((sp, index) => `
                <div class="age-chip size-chip" data-index="${index}">${sp.size}</div>
            `).join('');

            const sChips = sizeChips.querySelectorAll('.size-chip');
            sChips.forEach(chip => {
                chip.onclick = () => {
                    // Deselect Age if any
                    if (ageChips) ageChips.querySelectorAll('.age-chip').forEach(c => c.classList.remove('selected'));
                    selectedAgeGroup = null;

                    // Select Size
                    sChips.forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                    const idx = chip.getAttribute('data-index');
                    selectedSize = product.sizePrices[idx].size;
                    updatePriceDisplay(product.sizePrices[idx].price);
                };
            });
        }

        // Image Handling
        const mainImgContainer = document.querySelector('.main-img-container');
        const thumbList = document.getElementById('thumb-list');

        if (mainImgContainer) {
            let slides = (product.images && product.images.length > 0) ? [...product.images] : [/* fallback */ 'https://via.placeholder.com/600x600?text=No+Image'];

            // Add video if exists
            if (product.video) {
                slides.push({ isVideo: true, ...product.video });
            }

            mainImgContainer.innerHTML = slides.map(item => {
                if (item.isVideo) {
                    return `
                        <div class="carousel-slide video-slide" style="min-width:100%; height:90%; scroll-snap-align:center; display:flex; align-items:center; justify-content:center;">
                            <video src="${item.url}" controls style="max-width:100%; max-height:100%; border-radius:15px;"></video>
                        </div>
                    `;
                }
                return `<img src="${item.url || item}" class="reveal-delay-1" style="min-width:100%; height:90%; object-fit:contain; scroll-snap-align:center;">`;
            }).join('');

            // Setup Thumbnails
            if (thumbList && slides.length > 1) {
                thumbList.hidden = false;
                thumbList.innerHTML = slides.map((item, index) => {
                    const content = item.isVideo
                        ? `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; color:#fff;"><i class="fa-solid fa-play"></i></div>`
                        : `<img src="${item.url || item}" style="width:100%; height:100%; object-fit:cover;">`;

                    return `
                        <div class="thumb-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                            ${content}
                        </div>
                    `;
                }).join('');

                const thumbs = thumbList.querySelectorAll('.thumb-item');

                // Auto Scroll Logic Variables
                let autoSlideInterval;
                let isScrolling;
                const videos = mainImgContainer.querySelectorAll('video');



                const stopAutoSlide = () => {
                    clearInterval(autoSlideInterval);
                };

                // Click to scroll
                thumbs.forEach((thumb, index) => {
                    thumb.onclick = () => {
                        stopAutoSlide();
                        // Pause all videos if manual nav
                        videos.forEach(v => v.pause());

                        mainImgContainer.scrollTo({
                            left: mainImgContainer.clientWidth * index,
                            behavior: 'smooth'
                        });
                        startAutoSlide(5000); // Resume after delay
                    };
                });

                // Sync scroll to active thumb


                // Video Events
                videos.forEach(v => {
                    v.addEventListener('play', stopAutoSlide);
                    v.addEventListener('pause', () => startAutoSlide(3000));
                    v.addEventListener('ended', () => startAutoSlide(1000));
                });

                // Infinite Loop Logic
                // 1. Clone first slide for seamless loop
                if (mainImgContainer.children.length > 1) {
                    const firstSlideClone = mainImgContainer.children[0].cloneNode(true);
                    firstSlideClone.id = 'slide-clone-first';
                    mainImgContainer.appendChild(firstSlideClone);
                }

                // Start initially
                startAutoSlide();

                // Pause on hover
                mainImgContainer.addEventListener('mouseenter', stopAutoSlide);
                mainImgContainer.addEventListener('mouseleave', () => {
                    // Only resume if video not playing
                    const isVideoPlaying = Array.from(videos).some(v => !v.paused && !v.ended);
                    if (!isVideoPlaying) startAutoSlide();
                });

                // Mobile touch interaction
                mainImgContainer.addEventListener('touchstart', stopAutoSlide);
                mainImgContainer.addEventListener('touchend', () => startAutoSlide(4000));

                // Handle Window Resize
                let resizeTimer;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        const activeThumb = thumbList.querySelector('.thumb-item.active');
                        if (activeThumb) {
                            const index = parseInt(activeThumb.getAttribute('data-index'));
                            if (!isNaN(index)) {
                                mainImgContainer.scrollTo({
                                    left: mainImgContainer.clientWidth * index,
                                    behavior: 'auto'
                                });
                            }
                        }
                    }, 100);
                });

                // Auto Scroll Logic with Infinite Loop
                function startAutoSlide(delay = 3000) {
                    clearInterval(autoSlideInterval);
                    console.log('Starting Auto Slide');
                    autoSlideInterval = setInterval(() => {
                        const isVideoPlaying = Array.from(videos).some(v => !v.paused && !v.ended && v.readyState > 2);
                        if (isVideoPlaying) {
                            console.log('Video playing, skipping slide');
                            return;
                        }

                        const width = mainImgContainer.clientWidth;
                        if (width === 0) return; // Hidden or not ready

                        const currentScroll = mainImgContainer.scrollLeft;
                        const totalWidth = mainImgContainer.scrollWidth;

                        // Calculate current index
                        const currentIndex = Math.round(currentScroll / width);
                        const totalSlides = slides.length + 1; // +1 for clone

                        console.log(`AutoSlide: Index ${currentIndex} / ${totalSlides - 1}`);

                        // If we are currently at the CLONE (last slide, index == slides.length)
                        // Then we should have already snapped to 0. But if we are here, force snap to 0 and move to 1.
                        if (currentIndex >= slides.length) {
                            console.log('At Clone. Resetting to 0');
                            mainImgContainer.scrollTo({ left: 0, behavior: 'auto' });
                            setTimeout(() => {
                                mainImgContainer.scrollTo({ left: width, behavior: 'smooth' });
                            }, 100);
                            return;
                        }

                        // Normal move to next
                        const nextScroll = (currentIndex + 1) * width;
                        console.log(`Scrolling to ${nextScroll}`);

                        // Check if next move hits the clone (End)
                        if (currentIndex + 1 >= slides.length) {
                            // Moving to clone
                            mainImgContainer.scrollTo({ left: nextScroll, behavior: 'smooth' });
                            // Note: The 'scroll' event listener or next interval will handle the reset to 0
                        } else {
                            mainImgContainer.scrollTo({ left: nextScroll, behavior: 'smooth' });
                        }
                    }, delay);
                };

                // Pagination Dots (Mobile)
                const galleryContainer = document.querySelector('.product-gallery-container');
                let dotsContainer = document.querySelector('.carousel-dots');
                if (!dotsContainer && galleryContainer && slides.length > 1) {
                    dotsContainer = document.createElement('div');
                    dotsContainer.className = 'carousel-dots';
                    dotsContainer.innerHTML = slides.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('');
                    galleryContainer.appendChild(dotsContainer);
                }
                const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];

                // Sync scroll logic updated for clone & dots
                mainImgContainer.addEventListener('scroll', () => {
                    window.clearTimeout(isScrolling);
                    isScrolling = setTimeout(() => {
                        let index = Math.round(mainImgContainer.scrollLeft / mainImgContainer.clientWidth);

                        // If index == last one (which is the clone), it maps to index 0
                        // slides.length is the count of REAL slides. 
                        // children.length is slides.length + 1
                        if (index >= slides.length) {
                            index = 0;
                        }

                        // Update Thumbnails
                        thumbs.forEach(t => t.classList.remove('active'));
                        if (thumbs[index]) {
                            thumbs[index].classList.add('active');
                            thumbs[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }

                        // Update Dots
                        dots.forEach(d => d.classList.remove('active'));
                        if (dots[index]) {
                            dots[index].classList.add('active');
                        }

                    }, 60);
                });
            }
        }

        // Tab Logic (Legacy removed, using unified logic at bottom)


        // Related Products
        (async () => {
            const section = document.querySelector('.related-products-section');
            try {
                // Optimize: Filter by category directly on backend
                const categoryId = product.category?._id || product.category;
                if (!categoryId) return;

                const allProducts = await api.get(`/products?category=${categoryId}`);
                const similar = allProducts.filter(p => p._id !== product._id).slice(0, 4);

                const relatedContainer = document.getElementById('related-products');
                if (similar.length > 0 && relatedContainer && section) {
                    section.hidden = false;
                    relatedContainer.innerHTML = similar.map(p => `
                        <a href="/product?id=${p._id}" class="product-card" style="text-decoration: none; color: inherit;">
                            <div class="product-image-wrapper" style="background: #f4f4f4; border-radius: 15px; overflow: hidden; aspect-ratio: 1/1; display:flex; align-items:center; justify-content:center;">
                                <img src="${p.images[0]?.url || p.images[0] || 'https://via.placeholder.com/300'}" alt="${p.name}" style="max-width: 80%; max-height: 80%; object-fit: contain;">
                            </div>
                            <div class="product-info" style="margin-top: 1rem;">
                                <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${p.name}</h4>
                                <div class="product-price" style="font-weight: 700; color: var(--primary-orange);">${formatCurrency(p.price)}</div>
                            </div>
                        </a>
                    `).join('');
                } else if (section) {
                    section.hidden = true;
                }
            } catch (err) {
                console.warn('Failed to load similar products', err);
                if (section) section.hidden = true;
            }
        })();

        const validateSelection = () => {
            if (product.agePrices && product.agePrices.length > 0 && !selectedAgeGroup && !selectedSize) {
                showToast('Please select an age group', 'warning');
                return false;
            }
            if (product.sizePrices && product.sizePrices.length > 0 && !selectedSize && !selectedAgeGroup) {
                showToast('Please select a size', 'warning');
                return false;
            }
            return true;
        };

        const buyNowBtn = document.querySelector('.buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.onclick = () => {
                if (!validateSelection()) return;

                const qty = parseInt(document.getElementById('qty').value) || 1;
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                const cartItem = {
                    ...product,
                    price: currentPrice,
                    qty,
                    ageGroup: selectedAgeGroup,
                    size: selectedSize
                };

                const existingIndex = cart.findIndex(item =>
                    item._id === product._id &&
                    item.ageGroup === selectedAgeGroup &&
                    item.size === selectedSize
                );

                if (existingIndex > -1) cart[existingIndex].qty += qty;
                else cart.push(cartItem);

                localStorage.setItem('cart', JSON.stringify(cart));
                api.patch(`/products/${productId}/booked`).catch(err => console.error(err));
                window.location.href = '/cart';
            };
        }

        // Cart Logic
        window.changeQty = (delta) => {
            const qtyInput = document.getElementById('qty');
            if (qtyInput) {
                let val = parseInt(qtyInput.value) + delta;
                if (val < 1) val = 1;
                qtyInput.value = val;
            }
        };

        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                if (!validateSelection()) return;

                const qty = parseInt(document.getElementById('qty').value) || 1;
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                const cartItem = {
                    ...product,
                    price: currentPrice,
                    qty,
                    ageGroup: selectedAgeGroup,
                    size: selectedSize
                };

                const existingIndex = cart.findIndex(item =>
                    item._id === product._id &&
                    item.ageGroup === selectedAgeGroup &&
                    item.size === selectedSize
                );

                if (existingIndex > -1) {
                    cart[existingIndex].qty += qty;
                } else {
                    cart.push(cartItem);
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                api.patch(`/products/${productId}/booked`).catch(err => console.error(err));
                updateCartCount();
                showToast('Added to cart!', 'success');
            };
        }

        // Initial UI Update
        if (typeof window.updateCartCount === 'function') {
            window.updateCartCount();
        }

        // --- Tabs Logic ---
        const tabHeaders = document.querySelectorAll('.tab-header');
        const tabContents = document.querySelectorAll('.tab-content');

        tabHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const target = header.getAttribute('data-tab');

                tabHeaders.forEach(th => th.classList.remove('active'));
                header.classList.add('active');

                tabContents.forEach(tc => {
                    if (tc.id === `${target}-tab`) {
                        tc.style.display = 'block';
                    } else {
                        tc.style.display = 'none';
                    }
                });
            });
        });

        // --- Reviews Logic ---
        const reviewsList = document.getElementById('reviews-list');
        const reviewForm = document.getElementById('review-form');

        const renderReviews = (reviews) => {
            if (reviews.length === 0) {
                reviewsList.innerHTML = '<p style="text-align:center; color:#999;">No reviews yet. Be the first to review!</p>';
                return;
            }

            reviewsList.innerHTML = reviews.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <span class="review-user">
                            ${r.user}
                            ${r.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                        </span>
                        <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="review-rating">
                        ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                    </div>
                    <div class="review-content">${r.comment}</div>
                </div>
            `).join('');
        };

        const loadReviews = async () => {
            try {
                const reviews = await api.get(`/reviews/${productId}`);
                renderReviews(reviews);

                // Update average rating display if needed
                // const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
                // updateStarDisplay(avgRating, reviews.length);
            } catch (err) {
                console.error('Failed to load reviews', err);
            }
        };

        // Submit Review
        if (reviewForm) {
            reviewForm.onsubmit = async (e) => {
                e.preventDefault();
                const submitBtn = reviewForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Submitting...';
                submitBtn.disabled = true;

                try {
                    const name = document.getElementById('review-name').value;
                    const comment = document.getElementById('review-comment').value;
                    const ratingInput = document.querySelector('input[name="rating"]:checked');

                    if (!ratingInput) {
                        showToast('Please select a rating', 'warning');
                        return;
                    }

                    const rating = parseInt(ratingInput.value);

                    // Get site ID from product
                    const siteId = product.site;

                    await api.post('/reviews', {
                        productId,
                        user: name,
                        rating,
                        comment,
                        siteId
                    });

                    showToast('Review submitted successfully!', 'success');
                    reviewForm.reset();
                    loadReviews(); // Reload to show new review
                } catch (err) {
                    console.error(err);
                    showToast(err.message || 'Failed to submit review', 'error');
                } finally {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            };
        }

        // Initial Load
        loadReviews();

    } catch (error) {
        console.error('Error loading product:', error);
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div style="text-align: center; padding: 10rem 10%;">
                    <h2 style="color: red; margin-bottom: 1rem;">Oops! Product Not Found</h2>
                    <p style="margin-bottom: 2rem;">The product you are looking for might have been removed or is temporarily unavailable.</p>
                    <a href="/shop" class="btn btn-black" style="display: inline-block; padding: 1rem 2rem;">Back to Shop</a>
                </div>
            `;
        }
    }
});
