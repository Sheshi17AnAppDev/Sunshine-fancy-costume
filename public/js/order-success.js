document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        window.location.href = 'index';
        return;
    }

    let currentOrder = null;
    let whatsappNumber = '919704022443'; // Default

    async function loadData() {
        try {
            // Fetch WhatsApp number
            const contactContent = await api.get('/site-content/contact');
            if (contactContent && contactContent.data && contactContent.data.whatsapp) {
                whatsappNumber = contactContent.data.whatsapp;
            }

            // Fetch Order Details
            // Note: Since the user is likely logged in or just placed the order, 
            // the backend should allow fetching this if we have the ID and permissions.
            const order = await api.get(`/orders/${orderId}`);
            currentOrder = order;
            renderSuccess(order);
        } catch (error) {
            console.error('Failed to load order:', error);
            document.getElementById('display-order-id').innerText = '#' + orderId.toUpperCase().slice(-8);
        }
    }

    function renderSuccess(order) {
        document.getElementById('display-order-id').innerText = `#${order._id.toUpperCase().slice(-8)}`;
        document.getElementById('display-total').innerText = `₹${order.totalPrice.toLocaleString('en-IN')}`;

        const itemsPreview = document.getElementById('items-preview');
        itemsPreview.innerHTML = order.orderItems.map(item => `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>${item.qty}x ${item.name}</span>
                <span>₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
            </div>
        `).join('');

        // Set up WhatsApp button
        const whatsappBtn = document.getElementById('whatsapp-btn');
        if (whatsappBtn) {
            whatsappBtn.onclick = () => {
                const message = encodeURIComponent(`Hello, I just placed an order (ID: #${order._id.slice(-8).toUpperCase()}). I'd like to confirm my order details.`);
                window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
            };
        }
    }

    window.downloadPDF = () => {
        if (!currentOrder) {
            showToast('Wait for order details to load...', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header Branding
        doc.setFontSize(22);
        doc.setTextColor(251, 176, 59);
        doc.text("SUNSHINE FANCY COSTUMES", 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Order Receipt", 14, 32);

        // Meta Info
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.text(`Order ID: #${currentOrder._id.slice(-8).toUpperCase()}`, 140, 25);
        doc.text(`Date: ${new Date(currentOrder.createdAt).toLocaleDateString()}`, 140, 32);

        // Bill To
        const ship = currentOrder.shippingAddress;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("DELIVER TO:", 14, 50);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(ship.fullName, 14, 57);
        doc.setFontSize(10);
        doc.text(`${ship.address}`, 14, 63);
        doc.text(`${ship.city}, ${ship.postalCode}`, 14, 68);
        doc.text(`${ship.country}`, 14, 73);

        // Table
        const tableData = currentOrder.orderItems.map(item => [
            item.name,
            `INR ${item.price.toLocaleString('en-IN')}`,
            item.qty,
            `INR ${(item.price * item.qty).toLocaleString('en-IN')}`
        ]);

        doc.autoTable({
            startY: 85,
            head: [['Description', 'Unit Price', 'Qty', 'Amount']],
            body: tableData,
            headStyles: { fillColor: [251, 176, 59] },
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL AMOUNT: INR ${currentOrder.totalPrice.toLocaleString('en-IN')}`, 140, finalY);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150);
        doc.text("Thank you for shopping with Sunshine!", 105, 280, { align: 'center' });

        doc.save(`Receipt_Sunshine_${currentOrder._id.slice(-8)}.pdf`);
    };

    loadData();
});
