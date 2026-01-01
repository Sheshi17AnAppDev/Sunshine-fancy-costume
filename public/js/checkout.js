document.addEventListener('DOMContentLoaded', async () => {
    // Fetch WhatsApp number from contact site content
    let whatsappNumber = '919704022443'; // Default
    try {
        const contactContent = await api.get('/site-content/contact');
        if (contactContent && contactContent.data && contactContent.data.whatsapp) {
            whatsappNumber = contactContent.data.whatsapp;
        }
    } catch (e) {
        console.error('Failed to fetch contact WhatsApp number', e);
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showToast('Cart is empty!', 'warning');
        window.location.href = 'shop';
        return;
    }

    const container = document.getElementById('summary-items');
    let sub = 0;

    if (container) {
        container.innerHTML = cart.map(item => {
            const rowTotal = item.price * item.qty;
            sub += rowTotal;
            return `
                <tr>
                    <td style="padding: 1rem 0; font-size: 0.8rem;">${item.name}</td>
                    <td style="text-align: center; font-size: 0.8rem;">${item.qty}</td>
                    <td style="text-align: right; font-size: 0.8rem;">${formatCurrency(rowTotal)}</td>
                </tr>
            `;
        }).join('');

        const shippingCost = 0; // Free shipping for everything
        const total = sub + shippingCost;

        const subEl = document.getElementById('summ-sub');
        const shipEl = document.getElementById('summ-ship');
        const totalEl = document.getElementById('summ-total');

        if (subEl) subEl.innerText = formatCurrency(sub);
        if (shipEl) shipEl.innerText = shippingCost === 0 ? 'Free' : formatCurrency(shippingCost);
        if (totalEl) totalEl.innerText = formatCurrency(total);

        // ... form submission logic ...
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.onsubmit = async (e) => {
                e.preventDefault();
                const orderItems = cart.map(i => ({
                    product: i._id,
                    name: i.name,
                    qty: i.qty,
                    price: i.price,
                    image: i.images && i.images[0] ? (i.images[0].url || i.images[0]) : '',
                    ageGroup: i.ageGroup || null
                }));
                const shippingAddress = {
                    fullName: document.getElementById('full-name').value,
                    email: document.getElementById('email').value,
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    postalCode: document.getElementById('postalCode').value,
                    country: document.getElementById('country').value,
                };
                const paymentMethod = 'WhatsApp';

                try {
                    const res = await api.post('/orders', {
                        orderItems,
                        shippingAddress,
                        paymentMethod,
                        itemsPrice: sub,
                        shippingPrice: shippingCost,
                        totalPrice: total
                    });

                    const orderId = res._id;

                    // Clear cart
                    localStorage.removeItem('cart');

                    // Redirect to native success page
                    window.location.href = `order-success?id=${orderId}`;
                } catch (err) {
                    showToast(err.message || 'Checkout failed', 'error');
                }
            };
        }
    }
});

function formatWhatsAppMessage(order, shipping) {
    let message = `*New Order Request*\n`;
    message += `--------------------------\n`;
    message += `*Order ID:* ${order._id || 'Pending'}\n`;
    message += `*Customer:* ${shipping.fullName}\n`;
    message += `--------------------------\n`;
    message += `*Items:*\n`;

    order.orderItems.forEach(item => {
        message += `- ${item.name}${item.ageGroup ? ` (${item.ageGroup})` : ''} (x${item.qty}) - ₹${item.price * item.qty}\n`;
    });

    message += `--------------------------\n`;
    message += `*Subtotal:* ₹${order.totalPrice - (order.shippingPrice || 0)}\n`;
    message += `*Shipping:* Free\n`;
    message += `*Total:* ₹${order.totalPrice}\n`;
    message += `--------------------------\n`;
    message += `*Shipping Address:*\n`;
    message += `${shipping.address}, ${shipping.city}, ${shipping.postalCode}, ${shipping.country}\n`;
    message += `--------------------------\n`;
    message += `_Please confirm order._`;

    return message;
}
