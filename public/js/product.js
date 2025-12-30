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
        if (productPrice) productPrice.innerText = formatCurrency(product.price);

        const productDesc = document.getElementById('product-desc');
        if (productDesc) productDesc.innerText = product.description;

        const productCat = document.getElementById('product-category');
        if (productCat) productCat.innerText = (product.category?.name || product.category || 'CATEGORY');

        // Age Pricing Logic
        let selectedAgeGroup = null;
        let currentPrice = product.price;

        const ageContainer = document.getElementById('age-selection-container');
        const ageChips = document.getElementById('age-chips');

        if (product.agePrices && product.agePrices.length > 0) {
            ageContainer.hidden = false;
            ageChips.innerHTML = product.agePrices.map((ap, index) => `
                <div class="age-chip" data-index="${index}">${ap.ageGroup}</div>
            `).join('');

            const chips = document.querySelectorAll('.age-chip');
            chips.forEach(chip => {
                chip.onclick = () => {
                    chips.forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                    const idx = chip.getAttribute('data-index');
                    selectedAgeGroup = product.agePrices[idx].ageGroup;
                    currentPrice = product.agePrices[idx].price;
                    if (productPrice) productPrice.innerText = formatCurrency(currentPrice);
                };
            });
            // Select first by default? User might want this.
            // chips[0].click();
        }

        // Image Handling
        const productImg = document.getElementById('product-img');
        const thumbList = document.getElementById('thumb-list');

        if (productImg) {
            productImg.src = ((product.images && product.images[0]) ? (product.images[0].url || product.images[0]) : '') || 'https://via.placeholder.com/600x600?text=No+Image';
        }

        if (thumbList && product.images && product.images.length > 1) {
            thumbList.hidden = false;
            thumbList.innerHTML = product.images.map((img, index) => `
                <div class="thumb-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${img.url || img}">
                </div>
            `).join('');

            const thumbs = thumbList.querySelectorAll('.thumb-item');
            thumbs.forEach((thumb, index) => {
                thumb.onclick = () => {
                    thumbs.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    productImg.src = (product.images[index].url || product.images[index]);
                };
            });
        }

        // Tab Logic
        const tabHeaders = document.querySelectorAll('.tab-header');
        const tabContent = document.getElementById('description-tab');

        // Initialize tab content
        if (tabContent) tabContent.innerHTML = `<p style="color: var(--muted-text); line-height: 1.8;">${product.description}</p>`;

        tabHeaders.forEach(header => {
            header.onclick = () => {
                tabHeaders.forEach(h => h.classList.remove('active'));
                header.classList.add('active');
                const tab = header.getAttribute('data-tab');
                if (tab === 'description') {
                    tabContent.innerHTML = `<p style="color: var(--muted-text); line-height: 1.8;">${product.description}</p>`;
                } else {
                    tabContent.innerHTML = `<p style="color: var(--muted-text); line-height: 1.8;">No reviews yet for this product.</p>`;
                }
            };
        });

        // Related Products
        (async () => {
            const section = document.querySelector('.related-products-section');
            try {
                const allProducts = await api.get('/products');
                const similar = allProducts.filter(p =>
                    p.category && product.category &&
                    (p.category._id || p.category) === (product.category._id || product.category) &&
                    p._id !== product._id
                ).slice(0, 4);

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

        const buyNowBtn = document.querySelector('.buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.onclick = () => {
                if (product.agePrices && product.agePrices.length > 0 && !selectedAgeGroup) {
                    alert('Please select an age group');
                    return;
                }
                const qty = parseInt(document.getElementById('qty').value) || 1;
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                const cartItem = { ...product, price: currentPrice, qty, ageGroup: selectedAgeGroup };
                const existingIndex = cart.findIndex(item => item._id === product._id && item.ageGroup === selectedAgeGroup);
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
                if (product.agePrices && product.agePrices.length > 0 && !selectedAgeGroup) {
                    alert('Please select an age group');
                    return;
                }

                const qty = parseInt(document.getElementById('qty').value) || 1;
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                const cartItem = {
                    ...product,
                    price: currentPrice,
                    qty,
                    ageGroup: selectedAgeGroup
                };

                const existingIndex = cart.findIndex(item =>
                    item._id === product._id && item.ageGroup === selectedAgeGroup
                );

                if (existingIndex > -1) {
                    cart[existingIndex].qty += qty;
                } else {
                    cart.push(cartItem);
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                api.patch(`/products/${productId}/booked`).catch(err => console.error(err));
                updateCartCount();
                alert('Added to cart!');
            };
        }

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
