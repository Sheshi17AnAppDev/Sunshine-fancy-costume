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
});
