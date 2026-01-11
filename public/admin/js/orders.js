const fetchOrders = async () => {
    const list = document.getElementById('orders-list');
    try {
        list.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">Loading orders...</td></tr>';

        const orders = await api.get('/orders');

        if (!orders || orders.length === 0) {
            list.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-muted);">No orders found.</td></tr>';
            return;
        }

        list.innerHTML = orders.map(o => {
            // Defensive check for ID and other fields
            const orderIdStr = (o._id && typeof o._id === 'string') ? o._id.toUpperCase() : 'N/A';
            const shortOrderId = orderIdStr.slice(-6);
            const userName = o.user?.name || o.shippingAddress?.fullName || 'Guest';
            const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A';
            const total = typeof o.totalPrice === 'number' ? o.totalPrice.toLocaleString('en-IN') : '0';
            const method = o.paymentMethod || 'COD';
            const items = o.orderItems || [];

            // Product column logic
            let productsHtml = '';
            if (items.length > 0) {
                const firstItems = items.slice(0, 2);
                productsHtml = `
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        ${firstItems.map(item => `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='}" style="width: 24px; height: 24px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">
                                <span style="font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${item.name}</span>
                            </div>
                        `).join('')}
                        ${items.length > 2 ? `<span style="font-size: 0.75rem; color: var(--primary-orange); font-weight: 600;">+ ${items.length - 2} more items</span>` : ''}
                    </div>
                `;
            } else {
                productsHtml = '<span style="color: var(--text-muted);">No items</span>';
            }

            return `
                <tr>
                    <td>
                        <div style="font-family: monospace; font-weight: 700; color: var(--text-main); background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: inline-block;">
                            #${shortOrderId}
                        </div>
                    </td>
                    <td>${userName}</td>
                    <td>${productsHtml}</td>
                    <td>${orderDate}</td>
                    <td>₹${total}</td>
                    <td>${method}</td>
                    <td>${o.isPaid ? '<span style="color: #10b981; font-weight:600;">Yes</span>' : '<span style="color: #ef4444; font-weight:600;">No</span>'}</td>
                    <td>${o.isDelivered ? '<span style="color: #10b981; font-weight:600;">Yes</span>' : '<span style="color: #ef4444; font-weight:600;">No</span>'}</td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-icon" onclick="viewOrder('${o._id}')" title="View Order" style="background:none; border:none; cursor:pointer; color: var(--text-muted); font-size: 1.1rem;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <a href="invoice?id=${o._id}" class="btn-icon" title="Generate Bill" style="color: var(--primary-orange); font-size: 1.1rem;">
                                <i class="fa-solid fa-file-invoice"></i>
                            </a>
                            <button class="btn-icon" onclick="deleteOrder('${o._id}')" title="Delete Order" style="background:none; border:none; cursor:pointer; color: #ef4444; font-size: 1.1rem;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Fetch Orders Error:', err);
        list.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: #ef4444;">Error: ${err.message || 'Failed to load orders'}</td></tr>`;

        // Show toast if available
        if (typeof showToast === 'function') {
            showToast(err.message || 'Failed to load orders', 'error');
        } else {
            showToast('Error loading orders: ' + (err.message || 'Check console for details'), 'error');
        }
    }
};



const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');

// Close modal handler
document.getElementById('close-modal-btn').onclick = () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
};

let currentOrder = null;

window.viewOrder = async (id) => {
    const content = document.getElementById('order-details-content');
    const markPaidBtn = document.getElementById('mark-paid');
    const markDeliveredBtn = document.getElementById('mark-delivered');
    const billBtn = document.getElementById('download-bill-btn');

    try {
        // Show loading state and open modal immediately for feedback
        content.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading order details...</div>';
        if (markPaidBtn) markPaidBtn.style.display = 'none';
        if (markDeliveredBtn) markDeliveredBtn.style.display = 'none';
        if (billBtn) billBtn.style.display = 'none';

        modal.style.display = 'block';
        overlay.style.display = 'block';

        const order = await api.get(`/orders/admin/${id}`);
        currentOrder = order;

        // Defensive checks for shipping info
        const ship = order.shippingAddress || {};
        const userName = ship.fullName || order.user?.name || 'Guest';
        const address = ship.address || 'N/A';
        const city = ship.city || '';
        const zip = ship.postalCode || '';
        const country = ship.country || '';
        const payment = order.paymentMethod || 'COD';
        const items = order.orderItems || [];

        content.innerHTML = `
            <div class="responsive-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h4 style="margin-bottom: 0.8rem; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Shipping Info</h4>
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
                        <p style="font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-main);">${userName}</p>
                        <p style="margin-bottom: 0.2rem;">${address}</p>
                        <p style="margin-bottom: 0.2rem;">${city}${city && zip ? ', ' : ''}${zip}</p>
                        <p style="margin-bottom: 1rem;">${country}</p>
                        <div style="padding-top: 1rem; border-top: 1px dashed #cbd5e1; font-size: 0.9rem;">
                            <p><span style="color: var(--text-muted);">Payment Method:</span> <strong>${payment}</strong></p>
                            <p><span style="color: var(--text-muted);">Status:</span> ${order.isPaid ? '<span style="color:#10b981;">Paid</span>' : '<span style="color:#ef4444;">Unpaid</span>'}</p>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.8rem; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Order Items (${items.length})</h4>
                    <div style="max-height: 280px; overflow-y: auto; padding-right: 5px;">
                    ${items.map(item => {
            const itemPrice = typeof item.price === 'number' ? item.price : 0;
            const itemQty = typeof item.qty === 'number' ? item.qty : 0;
            return `
                        <div style="display: flex; gap: 1rem; margin-bottom: 0.8rem; align-items: center; background: #fff; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--border-color);">
                            <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;">
                            <div style="flex: 1;">
                                <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.1rem; color: var(--text-main); line-height: 1.2;">${item.name || 'Unknown Item'}</p>
                                ${item.ageGroup ? `<p style="font-size: 0.75rem; color: var(--primary-orange); font-weight: 700; text-transform: uppercase; margin-bottom: 0.2rem;">Age: ${item.ageGroup}</p>` : ''}
                                <p style="font-size: 0.85rem; color: var(--text-muted);">${itemQty} x ₹${itemPrice.toLocaleString('en-IN')}</p>
                            </div>
                            <div style="font-weight: 700; color: var(--text-main);">
                                ₹${(itemQty * itemPrice).toLocaleString('en-IN')}
                            </div>
                        </div>
                    `}).join('')}
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">Total Amount:</span>
                        <span style="font-size: 1.25rem; font-weight: 800; color: var(--primary-orange);">₹${(order.totalPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>
        `;

        // Update actions visibility
        if (billBtn) billBtn.style.display = 'block';

        if (markDeliveredBtn) {
            if (order.isDelivered) {
                markDeliveredBtn.style.display = 'none';
            } else {
                markDeliveredBtn.style.display = 'block';
                markDeliveredBtn.onclick = async () => {
                    if (!confirm('Mark this order as delivered?')) return;
                    try {
                        await api.put(`/orders/${id}/deliver`, {});
                        showToast('Order marked as delivered', 'success');
                        modal.style.display = 'none';
                        overlay.style.display = 'none';
                        fetchOrders();
                    } catch (err) {
                        showToast(err.message || 'Update failed', 'error');
                    }
                };
            }
        }

        if (markPaidBtn) {
            if (order.isPaid) {
                markPaidBtn.style.display = 'none';
            } else {
                markPaidBtn.style.display = 'block';
                markPaidBtn.onclick = async () => {
                    if (!confirm('Mark this order as paid?')) return;
                    try {
                        await api.put(`/orders/${id}/pay`, {});
                        showToast('Order marked as paid', 'success');
                        modal.style.display = 'none';
                        overlay.style.display = 'none';
                        fetchOrders();
                    } catch (err) {
                        showToast(err.message || 'Update failed', 'error');
                    }
                };
            }
        }

    } catch (err) {
        console.error('View Order Error:', err);
        content.innerHTML = `<div style="text-align:center; padding: 2rem; color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Error loading order: ${err.message || 'Internal Server Error'}</p>
            <button class="btn btn-sm btn-primary" onclick="viewOrder('${id}')" style="margin-top: 1rem;">Retry</button>
        </div>`;
    }
};

window.deleteOrder = async (id) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        try {
            await api.delete(`/orders/admin/${id}`);
            showToast('Order deleted successfully', 'success');
            fetchOrders(); // Refresh table
        } catch (err) {
            console.error(err);
            showToast(err.message || 'Failed to delete', 'error');
        }
    }
};

document.getElementById('download-bill-btn').onclick = () => {
    if (!currentOrder) return;
    generateInvoicePDF(currentOrder);
};

function generateInvoicePDF(order) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(251, 176, 59); // Primary Orange
    doc.text("SUNSHINE FANCY COSTUMES", 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Official Invoice", 14, 32);
    doc.text(`Order ID: #${order._id.slice(-8).toUpperCase()}`, 14, 37);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 42);

    // Shipping Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Bill To:", 14, 55);
    doc.setFontSize(10);
    const shipping = order.shippingAddress;
    doc.text(`${shipping.fullName || order.user?.name || 'Customer'}`, 14, 60);
    doc.text(`${shipping.address}`, 14, 65);
    doc.text(`${shipping.city}, ${shipping.postalCode}`, 14, 70);
    doc.text(`${shipping.country}`, 14, 75);
    doc.text(`Email: ${shipping.email || order.user?.email || 'N/A'}`, 14, 80);

    // Table
    const tableColumn = ["Item", "Price", "Qty", "Total"];
    const tableRows = [];

    order.orderItems.forEach(item => {
        const rowData = [
            item.name,
            `INR ${item.price.toLocaleString('en-IN')}`,
            item.qty,
            `INR ${(item.price * item.qty).toLocaleString('en-IN')}`
        ];
        tableRows.push(rowData);
    });

    doc.autoTable(tableColumn, tableRows, {
        startY: 90,
        headStyles: { fillColor: [251, 176, 59] },
        alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Summary
    doc.setFontSize(10);
    doc.text(`Items Price: INR ${(order.itemsPrice || (order.totalPrice - (order.shippingPrice || 0))).toLocaleString('en-IN')}`, 140, finalY);
    doc.text(`Shipping: INR ${(order.shippingPrice || 0).toLocaleString('en-IN')}`, 140, finalY + 5);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Total: INR ${order.totalPrice.toLocaleString('en-IN')}`, 140, finalY + 12);

    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150);
    doc.text("Thank you for choosing Sunshine Fancy Costumes!", 105, finalY + 30, { align: 'center' });

    doc.save(`invoice_${order._id.slice(-6)}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();

    // Auto-refresh every 30 seconds
    setInterval(fetchOrders, 30000);
});
