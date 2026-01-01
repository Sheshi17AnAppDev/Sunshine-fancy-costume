document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        showToast('Order ID is missing!', 'error');
        window.history.back();
        return;
    }

    let currentOrder = null;

    async function loadOrder() {
        try {
            const order = await window.api.get(`/orders/admin/${orderId}`);
            currentOrder = order;
            renderInvoice(order);
        } catch (error) {
            console.error('Failed to load order:', error);
            showToast('Error loading order details.', 'error');
        }
    }

    function renderInvoice(order) {
        // Meta Info
        document.getElementById('invoice-id').innerText = `#${order._id.slice(-8).toUpperCase()}`;
        document.getElementById('invoice-date').innerText = `Date: ${new Date(order.createdAt).toLocaleDateString()}`;

        // Customer Info
        const user = order.user || {};
        document.getElementById('customer-info').innerHTML = `
            <p><strong>${order.shippingAddress?.fullName || user.name || 'Guest'}</strong></p>
            <p>${user.email || 'No Email'}</p>
            <p>${user.phone || 'No Phone'}</p>
        `;

        // Shipping Address
        const ship = order.shippingAddress || {};
        document.getElementById('shipping-info').innerHTML = `
            <p>${ship.address || 'N/A'}</p>
            <p>${ship.city || ''}, ${ship.postalCode || ''}</p>
            <p>${ship.country || ''}</p>
        `;

        // Items
        const itemsBody = document.getElementById('items-body');
        itemsBody.innerHTML = order.orderItems.map((item, index) => `
            <tr class="item-row" data-index="${index}">
                <td>
                    <div class="item-info">
                        <img src="${item.image || '../img/placeholder.png'}" alt="${item.name}">
                        <div>
                            <div class="item-name">${item.name}</div>
                            ${item.ageGroup ? `<div class="item-age">AGE: ${item.ageGroup}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <input type="number" class="edit-input item-price" value="${item.price}" oninput="updateTotals()">
                </td>
                <td>
                    <input type="number" class="edit-input item-qty" value="${item.qty}" oninput="updateTotals()">
                </td>
                <td style="text-align: right; font-weight: 700; color: #1a202c;" class="item-total">
                    ₹${(item.price * item.qty).toLocaleString('en-IN')}
                </td>
            </tr>
        `).join('');

        updateTotals(false);
    }

    window.updateTotals = (notify = true) => {
        const rows = document.querySelectorAll('.item-row');
        let subtotal = 0;

        rows.forEach(row => {
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const qty = parseInt(row.querySelector('.item-qty').value) || 0;
            const total = price * qty;
            subtotal += total;

            row.querySelector('.item-total').innerText = `₹${total.toLocaleString('en-IN')}`;
        });

        const shipping = parseFloat(currentOrder.shippingPrice) || 0;
        const grandTotal = subtotal + shipping;

        document.getElementById('subtotal').innerText = `₹${subtotal.toLocaleString('en-IN')}`;
        document.getElementById('shipping-cost').innerText = `₹${shipping.toLocaleString('en-IN')}`;
        document.getElementById('grand-total').innerText = `₹${grandTotal.toLocaleString('en-IN')}`;

        if (notify) {
            document.getElementById('save-btn').style.background = 'var(--primary-orange)';
            document.getElementById('save-btn').innerHTML = '<i class="fas fa-save"></i> Save Changes (Unsaved)';
        }
    };

    window.saveChanges = async () => {
        const rows = document.querySelectorAll('.item-row');
        const updatedItems = Array.from(rows).map(row => {
            const index = row.dataset.index;
            const originalItem = currentOrder.orderItems[index];
            return {
                ...originalItem,
                price: parseFloat(row.querySelector('.item-price').value) || 0,
                qty: parseInt(row.querySelector('.item-qty').value) || 0
            };
        });

        try {
            const saveBtn = document.getElementById('save-btn');
            saveBtn.disabled = true;
            saveBtn.innerText = 'Saving...';

            await window.api.put(`/orders/${orderId}/items`, { orderItems: updatedItems });

            showToast('Order updated successfully!', 'success');
            saveBtn.disabled = false;
            saveBtn.style.background = '#1a202c';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';

            // Reload order to reflect backend state
            loadOrder();
        } catch (error) {
            console.error('Save failed:', error);
            showToast('Failed to save changes: ' + error.message, 'error');
        }
    };

    window.exportPDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Branding
        doc.setFontSize(24);
        doc.setTextColor(251, 176, 59);
        doc.text("SUNSHINE FANCY COSTUMES", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Official Tax Invoice", 14, 32);

        // Meta
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Invoice: #${currentOrder._id.slice(-8).toUpperCase()}`, 140, 25);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 32);

        // Ship To
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("BILL TO:", 14, 50);
        doc.setFontSize(12);
        doc.setTextColor(0);
        const ship = currentOrder.shippingAddress;
        doc.text(ship.fullName, 14, 57);
        doc.setFontSize(10);
        doc.text(`${ship.address}`, 14, 63);
        doc.text(`${ship.city}, ${ship.postalCode}`, 14, 68);
        doc.text(`${ship.country}`, 14, 73);

        // Table
        const rows = document.querySelectorAll('.item-row');
        const tableData = Array.from(rows).map(row => {
            const name = row.querySelector('.item-name').innerText;
            const price = row.querySelector('.item-price').value;
            const qty = row.querySelector('.item-qty').value;
            const total = (parseFloat(price) * parseInt(qty)).toLocaleString('en-IN');
            return [name, `INR ${price}`, qty, `INR ${total}`];
        });

        doc.autoTable({
            startY: 85,
            head: [['Description', 'Unit Price', 'Qty', 'Amount']],
            body: tableData,
            headStyles: { fillColor: [251, 176, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } }
        });

        // Totals
        const finalY = doc.lastAutoTable.finalY + 15;
        const subtotal = document.getElementById('subtotal').innerText;
        const grandTotal = document.getElementById('grand-total').innerText;

        doc.setFontSize(11);
        doc.text(`Subtotal: ${subtotal}`, 140, finalY);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`GRAND TOTAL: ${grandTotal}`, 140, finalY + 10);

        // Footer
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150);
        doc.text("Thank you for your business!", 105, 280, { align: 'center' });

        doc.save(`Invoice_${currentOrder._id.slice(-8)}.pdf`);
    };

    window.exportCSV = () => {
        const rows = document.querySelectorAll('.item-row');
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Item,Price,Quantity,Total\n";

        rows.forEach(row => {
            const name = `"${row.querySelector('.item-name').innerText}"`;
            const price = row.querySelector('.item-price').value;
            const qty = row.querySelector('.item-qty').value;
            const total = parseFloat(price) * parseInt(qty);
            csvContent += `${name},${price},${qty},${total}\n`;
        });

        csvContent += `\nSubtotal,,${document.getElementById('subtotal').innerText.replace('₹', '').replace(',', '')}\n`;
        csvContent += `TOTAL,,${document.getElementById('grand-total').innerText.replace('₹', '').replace(',', '')}\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Order_${orderId.slice(-8)}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    loadOrder();
});
