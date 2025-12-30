document.addEventListener('DOMContentLoaded', async () => {
    const totalVisitedEl = document.getElementById('total-visited');
    const totalBookedEl = document.getElementById('total-booked');
    const totalConfirmedEl = document.getElementById('total-confirmed');
    const totalDeliveredEl = document.getElementById('total-delivered');
    const inventoryBody = document.getElementById('inventory-body');

    let allProducts = [];
    let allOrders = [];

    async function fetchData() {
        try {
            if (typeof adminAuth !== 'undefined') {
                const [products, orders] = await Promise.all([
                    window.api.get('/products'),
                    window.api.get('/orders')
                ]);
                allProducts = products;
                allOrders = orders;
            } else {
                allProducts = await window.api.get('/products');
                allOrders = await window.api.get('/orders');
            }

            renderDashboard();
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            if (window.showToast) window.showToast('Failed to load inventory data', 'error');
        }
    }

    // Refresh button check
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchData();
            if (window.showToast) window.showToast('Refreshing data...', 'info');
        });
    }

    function renderDashboard() {
        let totalVisited = 0;
        let totalBooked = 0;
        let totalConfirmed = allOrders.length;
        let totalDelivered = allOrders.filter(o => o.isDelivered).length;

        if (!Array.isArray(allProducts)) {
            console.error('Products data is not an array:', allProducts);
            return;
        }

        inventoryBody.innerHTML = allProducts.map(p => {
            totalVisited += (p.views || 0);
            totalBooked += (p.bookedCount || 0);

            const convRate = p.views > 0 ? ((p.bookedCount / p.views) * 100).toFixed(1) : 0;

            let stockClass = 'stock-high';
            if (p.countInStock <= 5) stockClass = 'stock-low';
            else if (p.countInStock <= 15) stockClass = 'stock-medium';

            return `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${p.images[0]?.url || p.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                            <span>${p.name}</span>
                        </div>
                    </td>
                    <td>${p.category?.name || 'N/A'}</td>
                    <td><span class="stock-indicator ${stockClass}">${p.countInStock}</span></td>
                    <td>${p.countInStock > 0 ? 'In Stock' : 'Out of Stock'}</td>
                    <td>${p.views || 0}</td>
                    <td>${p.bookedCount || 0}</td>
                    <td>${convRate}%</td>
                </tr>
            `;
        }).join('');

        totalVisitedEl.innerText = totalVisited.toLocaleString();
        totalBookedEl.innerText = totalBooked.toLocaleString();
        totalConfirmedEl.innerText = totalConfirmed.toLocaleString();
        totalDeliveredEl.innerText = totalDelivered.toLocaleString();
    }

    // Export CSV
    document.getElementById('export-csv').onclick = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Product,Category,Stock,Visited,Booked,Conv%\n";

        allProducts.forEach(p => {
            const convRate = p.views > 0 ? ((p.bookedCount / p.views) * 100).toFixed(1) : 0;
            csvContent += `"${p.name}","${p.category?.name || ''}",${p.countInStock},${p.views || 0},${p.bookedCount || 0},${convRate}%\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export PDF Report
    document.getElementById('export-pdf').onclick = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Sunshine Costumes - Stock Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["Product", "Category", "Stock", "Visited", "Booked", "Conv%"];
        const tableRows = [];

        allProducts.forEach(p => {
            const convRate = p.views > 0 ? ((p.bookedCount / p.views) * 100).toFixed(1) : 0;
            const rowData = [
                p.name,
                p.category?.name || 'N/A',
                p.countInStock,
                p.views || 0,
                p.bookedCount || 0,
                `${convRate}%`
            ];
            tableRows.push(rowData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 40 });
        doc.save(`stock_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    fetchData();
});
