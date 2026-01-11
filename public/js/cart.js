document.addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('cart-body');
    const subEl = document.getElementById('sub');
    const totalEl = document.getElementById('total');

    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let totalVal = 0;

        if (cart.length === 0) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Your cart is empty</td></tr>';
            if (subEl) subEl.innerText = formatCurrency(0);
            if (totalEl) totalEl.innerText = formatCurrency(0);
            return;
        }

        body.innerHTML = cart.map((item, index) => {
            const lineTotal = item.price * item.qty;
            totalVal += lineTotal;
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 1.5rem;">
                            <span class="remove-btn" data-idx="${index}" style="color: #ff4444; cursor: pointer; font-size: 1.2rem;">&times;</span>
                            <img src="${item.images && item.images[0] ? (item.images[0].url || item.images[0]) : ''}" style="width: 60px; height: 60px; object-fit: cover; background: #f4f4f4; border-radius: 5px;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 500;">${item.name}</span>
                                ${item.ageGroup ? `<span style="font-size: 0.8rem; color: var(--muted-text);">Age: ${item.ageGroup}</span>` : ''}
                                ${item.size ? `<span style="font-size: 0.8rem; color: var(--muted-text);">Size: ${item.size}</span>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>
                        <div style="display: flex; align-items: center; border: 1px solid #eee; width: fit-content; padding: 5px 15px; border-radius: 5px;">
                            <button class="qty-dec" data-idx="${index}" style="background: none; border: none; cursor: pointer; padding: 0 5px;">&minus;</button>
                            <span style="padding: 0 10px; font-weight: 700;">${item.qty}</span>
                            <button class="qty-inc" data-idx="${index}" style="background: none; border: none; cursor: pointer; padding: 0 5px;">&plus;</button>
                        </div>
                    </td>
                    <td>${formatCurrency(lineTotal)}</td>
                </tr>
            `;
        }).join('');

        if (subEl) subEl.innerText = formatCurrency(totalVal);
        if (totalEl) totalEl.innerText = formatCurrency(totalVal);

        attachListeners();
        updateCartCount(); // Update header badge too
    }

    function attachListeners() {
        document.querySelectorAll('.qty-dec').forEach(btn => {
            btn.onclick = () => {
                const idx = btn.dataset.idx;
                updateQty(idx, -1);
            };
        });
        document.querySelectorAll('.qty-inc').forEach(btn => {
            btn.onclick = () => {
                const idx = btn.dataset.idx;
                updateQty(idx, 1);
            };
        });
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = btn.dataset.idx;
                removeItem(idx);
            };
        });
    }

    function updateQty(index, change) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart[index]) {
            cart[index].qty += change;
            if (cart[index].qty < 1) cart[index].qty = 1;
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
        }
    }

    function removeItem(index) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // Initial Render
    if (body) renderCart();

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                showToast('Cart is empty', 'warning');
                return;
            }

            const originalText = checkoutBtn.innerText;
            checkoutBtn.innerText = 'Processing...';
            checkoutBtn.disabled = true;

            try {
                // 1. Fetch WhatsApp Number
                let whatsappNumber = '919704022443';
                try {
                    const contactRes = await api.get('/site-content/contact');
                    if (contactRes?.data?.whatsapp) whatsappNumber = contactRes.data.whatsapp;
                } catch (e) {
                    console.warn('Failed to fetch contact', e);
                }

                // 2. Prepare Order Payload
                const orderItems = cart.map(i => ({
                    product: i._id,
                    name: i.name,
                    qty: i.qty,
                    price: i.price,
                    image: i.images && i.images[0] ? (i.images[0].url || i.images[0]) : '',
                    ageGroup: i.ageGroup || null,
                    size: i.size || null
                }));

                const totalPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);

                // Dummy Address for "Quick Buy"
                const shippingAddress = {
                    fullName: 'WhatsApp Guest',
                    phone: 'Pending',
                    address: 'WhatsApp Order',
                    city: 'WhatsApp',
                    postalCode: '000000',
                    country: 'Global'
                };

                // 3. Create Order
                const res = await api.post('/orders', {
                    orderItems,
                    shippingAddress,
                    paymentMethod: 'WhatsApp',
                    itemsPrice: totalPrice,
                    shippingPrice: 0,
                    totalPrice: totalPrice
                });

                // 4. Construct Message & Redirect Logic
                const orderId = res._id;
                const user = JSON.parse(localStorage.getItem('user')) || {};

                const processRedirect = (userName, userPhone) => {
                    let message = `*New Order #${orderId}*\n\n` +
                        `Name: ${userName}\n` +
                        `Mobile: ${userPhone}\n` +
                        `------------------\n` +
                        `I would like to buy:\n`;

                    orderItems.forEach(item => {
                        message += `- ${item.name} (x${item.qty}) - ${formatCurrency(item.price * item.qty)}\n`;
                    });
                    message += `\nTotal: ${formatCurrency(totalPrice)}\n\nPlease confirm my order.`;

                    // 1. Open WhatsApp in NEW TAB
                    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');

                    // 2. Ask User for Confirmation
                    showOrderConfirmationModal((confirmed) => {
                        if (confirmed) {
                            // User said YES -> Clear Cart & Success
                            localStorage.removeItem('cart');
                            window.location.href = '/order-success.html?id=' + orderId;
                        } else {
                            // User said NO -> Keep Cart, Re-enable button
                            checkoutBtn.innerText = originalText;
                            checkoutBtn.disabled = false;
                        }
                    });
                };

                if (user && user.name && user.phoneNumber) {
                    // User is logged in, proceed directly
                    processRedirect(user.name, user.phoneNumber);
                } else {
                    // Guest: Show Modal
                    if (typeof showGuestDetailsModal === 'function') {
                        checkoutBtn.innerText = originalText;
                        checkoutBtn.disabled = false;

                        showGuestDetailsModal((details) => {
                            checkoutBtn.innerText = 'Redirecting...';
                            checkoutBtn.disabled = true;
                            processRedirect(details.name, details.phone);
                        });
                    } else {
                        // Fallback
                        processRedirect('', '');
                    }
                }

            } catch (err) {
                console.error(err);
                showToast(err.message || 'Order failed', 'error');
                checkoutBtn.innerText = originalText;
                checkoutBtn.disabled = false;
            }
        };
    }
});
