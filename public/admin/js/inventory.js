document.addEventListener('DOMContentLoaded', async () => {
    const totalVisitedEl = document.getElementById('total-visited');
    const totalBookedEl = document.getElementById('total-booked');
    const totalConfirmedEl = document.getElementById('total-confirmed');
    const totalDeliveredEl = document.getElementById('total-delivered');
    const inventoryBody = document.getElementById('inventory-body');
    const catFilterInput = document.getElementById('category-filter');
    const stockFilterInput = document.getElementById('stock-filter');
    const searchInput = document.getElementById('inventory-search');

    let allProducts = [];
    let filteredProducts = [];
    let allOrders = [];

    async function fetchData() {
        try {
            const [products, orders, categories] = await Promise.all([
                window.api.get('/products'),
                window.api.get('/orders'),
                window.api.get('/categories')
            ]);

            allProducts = products;
            allOrders = orders;

            // Populate Category Filter
            if (catFilterInput) {
                catFilterInput.innerHTML = '<option value="">All Categories</option>' +
                    categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
            }

            // Handle URL Filter (e.g., from Dashboard alert)
            const urlParams = new URLSearchParams(window.location.search);
            const filterParam = urlParams.get('filter');
            if (filterParam === 'low' && stockFilterInput) {
                stockFilterInput.value = 'low';
            }

            filterAndRender();
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            if (window.showToast) window.showToast('Failed to load inventory data', 'error');
        }
    }

    function filterAndRender() {
        const searchTerm = searchInput.value.toLowerCase();
        const catFilter = catFilterInput.value;
        const stockFilter = stockFilterInput.value;

        filteredProducts = allProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm);
            const matchesCat = !catFilter || (p.category?._id === catFilter || p.category === catFilter);

            let matchesStock = true;
            if (stockFilter === 'low') matchesStock = p.countInStock <= 5 && p.countInStock > 0;
            if (stockFilter === 'out') matchesStock = p.countInStock <= 0;

            return matchesSearch && matchesCat && matchesStock;
        });

        renderTable();
        updateStats();
    }

    function renderTable() {
        inventoryBody.innerHTML = filteredProducts.map(p => {
            const convRate = p.views > 0 ? ((p.bookedCount / p.views) * 100).toFixed(1) : 0;

            let stockClass = 'stock-high';
            if (p.countInStock <= 5) stockClass = 'stock-low';
            if (p.countInStock <= 0) stockClass = 'stock-out';

            return `
                <tr data-id="${p._id}">
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${p.images[0]?.url || p.images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=='}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                            <span>${p.name}</span>
                        </div>
                    </td>
                    <td>${p.category?.name || 'N/A'}</td>
                    <td>
                        <input type="number" class="stock-inline-edit" value="${p.countInStock}" 
                               style="width: 70px; padding: 5px; border: 1px solid #ddd; border-radius: 6px; text-align: center;">
                    </td>
                    <td><span class="stock-indicator ${stockClass}">${p.countInStock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
                    <td>${p.views || 0}</td>
                    <td>${p.bookedCount || 0}</td>
                    <td>${convRate}%</td>
                    <td>
                        <button class="btn btn-sm btn-primary save-stock-btn" style="padding: 5px 10px;">
                            <i class="fas fa-save"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach event listeners to save buttons
        document.querySelectorAll('.save-stock-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const tr = e.target.closest('tr');
                const id = tr.dataset.id;
                const newStock = tr.querySelector('.stock-inline-edit').value;
                await saveStock(id, newStock, btn);
            };
        });
    }

    async function saveStock(id, val, btn) {
        try {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            await window.api.put(`/products/${id}`, { countInStock: parseInt(val) });

            // Update local data
            const prod = allProducts.find(p => p._id === id);
            if (prod) prod.countInStock = parseInt(val);

            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.style.background = '#22c55e';

            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.background = '';
                btn.disabled = false;
                filterAndRender(); // Re-render to update indicators
            }, 1000);

            if (window.showToast) window.showToast('Stock updated successfully', 'success');
        } catch (error) {
            console.error('Failed to save stock:', error);
            if (window.showToast) window.showToast('Failed to update stock', 'error');
            btn.innerHTML = '<i class="fas fa-save"></i>';
            btn.disabled = false;
        }
    }

    function updateStats() {
        let totalVisited = allProducts.reduce((acc, p) => acc + (p.views || 0), 0);
        let totalBooked = allProducts.reduce((acc, p) => acc + (p.bookedCount || 0), 0);
        let totalValue = allProducts.reduce((acc, p) => acc + ((p.price || 0) * (p.countInStock || 0)), 0);

        totalVisitedEl.innerText = totalVisited.toLocaleString();
        totalBookedEl.innerText = totalBooked.toLocaleString();
        totalConfirmedEl.innerText = allOrders.length.toLocaleString();
        totalDeliveredEl.innerText = allOrders.filter(o => o.isDelivered).length.toLocaleString();

        const valueEl = document.getElementById('stat-inventory-value');
        if (valueEl) valueEl.innerText = `₹${totalValue.toLocaleString('en-IN')}`;
    }

    // Set up event listeners
    [searchInput, catFilterInput, stockFilterInput].forEach(el => {
        el?.addEventListener('input', () => filterAndRender());
        el?.addEventListener('change', () => filterAndRender());
    });

    // Export Logic
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.onclick = () => {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Product,Category,Stock,Visited,Booked,Conv%\n";
            filteredProducts.forEach(p => {
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
    }

    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.onclick = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text("Sunshine Costumes - Stock Report", 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            const tableColumn = ["Product", "Category", "Stock", "Visited", "Booked", "Conv%"];
            const tableRows = filteredProducts.map(p => {
                const convRate = p.views > 0 ? ((p.bookedCount / p.views) * 100).toFixed(1) : 0;
                return [
                    p.name,
                    p.category?.name || 'N/A',
                    p.countInStock,
                    p.views || 0,
                    p.bookedCount || 0,
                    `${convRate}%`
                ];
            });

            doc.autoTable(tableColumn, tableRows, { startY: 40 });
            doc.save(`stock_report_${new Date().toISOString().slice(0, 10)}.pdf`);
        };
    }

    fetchData();
});
