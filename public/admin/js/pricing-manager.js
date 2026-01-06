// Age-based and Size-based Pricing Management
(function () {
    const agePricesList = document.getElementById('age-prices-list');
    const sizePricesList = document.getElementById('size-prices-list');
    const addAgePriceBtn = document.getElementById('add-age-price-btn');
    const addSizePriceBtn = document.getElementById('add-size-price-btn');

    let agePricesCount = 0;
    let sizePricesCount = 0;

    // Helper to create input with exact styles
    const createStyledInput = (type, placeholder, value, className) => {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.value = value || ''; // Safe assignment
        input.className = className;
        // Replicate original inline styles
        input.style.flex = '1';
        input.style.padding = '0.6rem';
        input.style.border = '1px solid #ddd';
        input.style.borderRadius = '6px';
        return input;
    };

    // Add Age Price Row
    window.addAgePriceRow = function (ageGroup = '', price = '') {
        const id = `age-price-${agePricesCount++}`;
        const row = document.createElement('div');
        row.id = id;
        // Exact original container style
        row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

        const nameInput = createStyledInput('text', 'Age Group (e.g., 3-5 Years)', ageGroup, 'age-group-input');

        const priceInput = createStyledInput('number', 'Price', price, 'age-price-input');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-danger';
        removeBtn.style.padding = '0.6rem 1rem';
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.onclick = function () {
            document.getElementById(id).remove();
        };

        row.appendChild(nameInput);
        row.appendChild(priceInput);
        row.appendChild(removeBtn);

        if (agePricesList) agePricesList.appendChild(row);
    };

    // Add Size Price Row (Text Input)
    window.addSizePriceRow = function (size = '', price = '') {
        const id = `size-price-${sizePricesCount++}`;
        const row = document.createElement('div');
        row.id = id;
        row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

        const nameInput = createStyledInput('text', 'Size (e.g. XL, 42)', size, 'size-input');
        const priceInput = createStyledInput('number', 'Price', price, 'size-price-input');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-danger';
        removeBtn.style.padding = '0.6rem 1rem';
        removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        removeBtn.onclick = function () {
            document.getElementById(id).remove();
        };

        row.appendChild(nameInput);
        row.appendChild(priceInput);
        row.appendChild(removeBtn);

        if (sizePricesList) sizePricesList.appendChild(row);
    };

    // Collect Age Prices
    window.getAgePrices = function () {
        if (!agePricesList) return [];
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
        if (!sizePricesList) return [];
        const rows = sizePricesList.querySelectorAll('div[id^="size-price-"]');
        const sizePrices = [];
        rows.forEach(row => {
            const size = row.querySelector('.size-input')?.value.trim();
            const price = parseFloat(row.querySelector('.size-price-input')?.value);
            if (size && price > 0) {
                sizePrices.push({ size, price });
            }
        });
        return sizePrices;
    };

    // Load Age Prices into UI
    window.loadAgePrices = function (agePrices) {
        if (!agePricesList) return;
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
        if (!sizePricesList) return;
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
