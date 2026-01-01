// Age-based and Size-based Pricing Management
(function () {
    const agePricesList = document.getElementById('age-prices-list');
    const sizePricesList = document.getElementById('size-prices-list');
    const addAgePriceBtn = document.getElementById('add-age-price-btn');
    const addSizePriceBtn = document.getElementById('add-size-price-btn');

    let agePricesCount = 0;
    let sizePricesCount = 0;

    // Common sizes for clothing
    const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    // Add Age Price Row
    window.addAgePriceRow = function (ageGroup = '', price = '') {
        const id = `age-price-${agePricesCount++}`;
        const row = document.createElement('div');
        row.id = id;
        row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        row.innerHTML = `
            <input type="text" placeholder="Age Group (e.g., 3-5 Years)" 
                   value="${ageGroup}" 
                   class="age-group-input" 
                   style="flex: 1; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px;">
            <input type="number" placeholder="Price" 
                   value="${price}" 
                   class="age-price-input" 
                   style="flex: 1; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px;">
            <button type="button" class="btn btn-sm btn-danger" 
                    onclick="document.getElementById('${id}').remove()"
                    style="padding: 0.6rem 1rem;">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        agePricesList.appendChild(row);
    };

    // Add Size Price Row
    window.addSizePriceRow = function (size = '', price = '') {
        const id = `size-price-${sizePricesCount++}`;
        const row = document.createElement('div');
        row.id = id;
        row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        row.innerHTML = `
            <select class="size-input" 
                    style="flex: 1; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px;">
                <option value="">Select Size</option>
                ${commonSizes.map(s => `<option value="${s}" ${s === size ? 'selected' : ''}>${s}</option>`).join('')}
                <option value="custom" ${!commonSizes.includes(size) && size ? 'selected' : ''}>Custom Size</option>
            </select>
            <input type="text" placeholder="Custom Size" 
                   value="${!commonSizes.includes(size) && size ? size : ''}" 
                   class="size-custom-input" 
                   style="flex: 1; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px; display: ${!commonSizes.includes(size) && size ? 'block' : 'none'};">
            <input type="number" placeholder="Price" 
                   value="${price}" 
                   class="size-price-input" 
                   style="flex: 1; padding: 0.6rem; border: 1px solid #ddd; border-radius: 6px;">
            <button type="button" class="btn btn-sm btn-danger" 
                    onclick="document.getElementById('${id}').remove()"
                    style="padding: 0.6rem 1rem;">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        sizePricesList.appendChild(row);

        // Handle custom size input visibility
        const sizeSelect = row.querySelector('.size-input');
        const customInput = row.querySelector('.size-custom-input');
        sizeSelect.addEventListener('change', function () {
            customInput.style.display = this.value === 'custom' ? 'block' : 'none';
            if (this.value !== 'custom') {
                customInput.value = '';
            }
        });
    };

    // Collect Age Prices
    window.getAgePrices = function () {
        const rows = agePricesList.querySelectorAll('div[id^="age-price-"]');
        const agePrices = [];
        rows.forEach(row => {
            const ageGroup = row.querySelector('.age-group-input')?.value.trim();
            const price = parseFloat(row.querySelector('.age-price-input')?.value);
            if (ageGroup && price > 0) {
                agePrices.push({ ageGroup, price });
            }
        });
        return agePrices;
    };

    // Collect Size Prices
    window.getSizePrices = function () {
        const rows = sizePricesList.querySelectorAll('div[id^="size-price-"]');
        const sizePrices = [];
        rows.forEach(row => {
            const sizeSelect = row.querySelector('.size-input')?.value;
            const customSize = row.querySelector('.size-custom-input')?.value.trim();
            const size = sizeSelect === 'custom' ? customSize : sizeSelect;
            const price = parseFloat(row.querySelector('.size-price-input')?.value);
            if (size && price > 0) {
                sizePrices.push({ size, price });
            }
        });
        return sizePrices;
    };

    // Load Age Prices into UI
    window.loadAgePrices = function (agePrices) {
        agePricesList.innerHTML = '';
        agePricesCount = 0;
        if (agePrices && agePrices.length > 0) {
            agePrices.forEach(ap => {
                addAgePriceRow(ap.ageGroup, ap.price);
            });
        }
    };

    // Load Size Prices into UI
    window.loadSizePrices = function (sizePrices) {
        sizePricesList.innerHTML = '';
        sizePricesCount = 0;
        if (sizePrices && sizePrices.length > 0) {
            sizePrices.forEach(sp => {
                addSizePriceRow(sp.size, sp.price);
            });
        }
    };

    // Event Listeners
    if (addAgePriceBtn) {
        addAgePriceBtn.addEventListener('click', () => addAgePriceRow());
    }

    if (addSizePriceBtn) {
        addSizePriceBtn.addEventListener('click', () => addSizePriceRow());
    }
})();
