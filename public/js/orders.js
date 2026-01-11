document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    // if (!user) {
    //    window.location.href = 'login';
    //    return;
    // }

    try {
        const orders = await api.get('/orders/myorders');
        const container = document.getElementById('orders-container');

        if (orders.length === 0) {
            container.innerHTML = '<p>You have no orders yet.</p>';
            return;
        }

        container.innerHTML = orders.map(o => `
            <div style="background: var(--light-gray); padding: 2rem; margin-bottom: 2rem; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;">
                    <div>
                        <h4 style="margin-bottom: 0.5rem;">Order #${o._id.slice(-6)}</h4>
                        <p style="color: var(--muted-text); font-size: 0.9rem;">Placed on ${new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style="text-align: right;">
                        <h4 style="margin-bottom: 0.5rem;">${formatCurrency(o.totalPrice)}</h4>
                        <p style="color: #111; font-weight: 700; font-size: 0.8rem;">${o.paymentMethod || 'COD'} | ${o.isPaid ? 'Paid' : 'Unpaid'}</p>
                        <p style="color: var(--muted-text); font-size: 0.8rem; margin-top: 0.25rem;">${o.isDelivered ? 'Delivered' : 'Processing'}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    ${o.orderItems.map(item => `
                        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: contain; background: white; padding: 5px;">
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        document.getElementById('orders-container').innerHTML = '<p>Failed to load orders.</p>';
    }
});
