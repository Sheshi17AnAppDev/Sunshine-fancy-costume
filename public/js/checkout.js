document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch Contact Info
    let whatsappNumber = '919704022443';
    try {
        const contactContent = await api.get('/site-content/contact');
        if (contactContent?.data?.whatsapp) {
            whatsappNumber = contactContent.data.whatsapp;
        }
    } catch (e) {
        console.error('Failed to fetch contact WhatsApp number', e);
    }

    // 2. Helper: Visual Feedback
    const toggleError = (input, show, msg = '') => {
        let feedback = input.nextElementSibling;
        if (!feedback || !feedback.classList.contains('feedback-message')) {
            feedback = document.createElement('span');
            feedback.className = 'feedback-message error';
            input.parentNode.appendChild(feedback);
        }

        if (show) {
            input.classList.add('input-error');
            feedback.textContent = msg;
        } else {
            input.classList.remove('input-error');
            feedback.textContent = '';
        }
    };

    // 3. Helper: Format Currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // 4. Cart Logic
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showToast('Cart is empty!', 'warning');
        window.location.href = 'shop';
        return;
    }

    // Render Cart Summary
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

        const shippingCost = 0;
        const total = sub + shippingCost;

        document.getElementById('summ-sub').innerText = formatCurrency(sub);
        document.getElementById('summ-ship').innerText = shippingCost === 0 ? 'Free' : formatCurrency(shippingCost);
        document.getElementById('summ-total').innerText = formatCurrency(total);

        // 5. Form Handling & Validation
        const checkoutForm = document.getElementById('checkout-form');
        const countrySelect = document.getElementById('country-code');
        const phoneInput = document.getElementById('mobile-number');
        const zipInput = document.getElementById('postalCode');
        const nameInput = document.getElementById('full-name');
        const cityInput = document.getElementById('city');
        const countryInput = document.getElementById('country');
        const addressInput = document.getElementById('address');

        // Validation Logic
        const validateForm = () => {
            const countryCode = countrySelect.value;

            // Global Validator for standard fields
            const isNameValid = Validator.validateField(nameInput, 'name');
            const isCityValid = Validator.validateField(cityInput, 'name'); // City is name-like
            const isCountryValid = Validator.validateField(countryInput, 'name'); // Country is name-like
            const isAddressValid = Validator.validateField(addressInput, 'text'); // Address text
            const isZipValid = Validator.validateField(zipInput, 'postalCode');

            // Dynamic Phone Validation
            let isValidPhone = true;
            let phoneRegex = /^\d{10}$/;
            let phoneMsg = '10 digits';
            switch (countryCode) {
                case '+91': case '+1': phoneRegex = /^\d{10}$/; phoneMsg = '10 digits'; break;
                case '+44': phoneRegex = /^\d{10,11}$/; phoneMsg = '10-11 digits'; break;
                case '+971': phoneRegex = /^\d{9}$/; phoneMsg = '9 digits'; break;
                case '+61': phoneRegex = /^\d{9,10}$/; phoneMsg = '9-10 digits'; break;
                default: phoneRegex = /^\d{7,15}$/; phoneMsg = 'valid digits';
            }

            const mobileNumber = phoneInput.value.trim();
            if (!mobileNumber) {
                isValidPhone = false;
                toggleError(phoneInput, true, 'Phone is required');
            } else if (!phoneRegex.test(mobileNumber)) {
                isValidPhone = false;
                toggleError(phoneInput, true, `Must be ${phoneMsg}`);
            } else {
                toggleError(phoneInput, false);
            }

            return isNameValid && isCityValid && isCountryValid && isAddressValid && isZipValid && isValidPhone;
        };

        // Real-time Input Constraints
        if (countrySelect && phoneInput) {
            // ... existing phone constraint logic ...
            const updatePhoneConstraints = () => {
                const code = countrySelect.value;
                let max = 15;
                switch (code) {
                    case '+91': case '+1': max = 10; break;
                    case '+44': max = 11; break;
                    case '+971': max = 9; break;
                    case '+61': max = 10; break;
                }
                phoneInput.maxLength = max;
                phoneInput.placeholder = `${max} digits required`;

                if (phoneInput.value.length > max) {
                    phoneInput.value = phoneInput.value.slice(0, max);
                }
                // Re-validate if dirty
                if (phoneInput.value) toggleError(phoneInput, false);
            };
            updatePhoneConstraints();
            countrySelect.addEventListener('change', updatePhoneConstraints);

            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
            phoneInput.addEventListener('blur', validateForm);
        }

        // Attach blur validators for others
        [nameInput, cityInput, countryInput, addressInput, zipInput].forEach(el => {
            if (el) el.addEventListener('blur', validateForm);
        });

        // On Submit
        if (checkoutForm) {
            checkoutForm.onsubmit = async (e) => {
                e.preventDefault();

                if (!validateForm()) {
                    showToast('Please fix errors in the form', 'error');
                    return;
                }

                const orderItems = cart.map(i => ({
                    product: i._id,
                    name: i.name,
                    qty: i.qty,
                    price: i.price,
                    image: i.images && i.images[0] ? (i.images[0].url || i.images[0]) : '',
                    ageGroup: i.ageGroup || null
                }));
                const fullPhone = `${countrySelect.value} ${phoneInput.value}`;

                const shippingAddress = {
                    fullName: nameInput.value,
                    phone: fullPhone,
                    address: addressInput.value,
                    city: cityInput.value,
                    postalCode: zipInput.value,
                    country: countryInput.value,
                };

                try {
                    const res = await api.post('/orders', {
                        orderItems,
                        shippingAddress,
                        paymentMethod: 'WhatsApp',
                        itemsPrice: sub,
                        shippingPrice: shippingCost,
                        totalPrice: total
                    });
                    localStorage.removeItem('cart');
                    window.location.href = `order-success?id=${res._id}`;
                } catch (err) {
                    showToast(err.message || 'Checkout failed', 'error');
                }
            };
        }
    }
});


