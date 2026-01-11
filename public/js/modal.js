function showModal(message) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Create message element
    const messageElement = document.createElement('p');
    messageElement.textContent = message;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.textContent = 'OK';
    closeButton.onclick = function () {
        document.body.removeChild(modalOverlay);
    };

    // Append elements
    modalContent.appendChild(messageElement);
    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Close modal on escape key press
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) document.body.removeChild(overlay);
        }
    });
}

function showGuestDetailsModal(onConfirm, initialData = {}) {
    // Remove existing
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.textAlign = 'left';

    const preName = initialData.name || '';
    const prePhone = initialData.phone || '';

    content.innerHTML = `
        <h3 style="text-align: center; margin-bottom: 1.5rem;">Confirm Your Details</h3>
        <div class="modal-input-group">
            <label>Name</label>
            <input type="text" id="guest-name" class="modal-input" placeholder="Your Name" value="${preName}">
            <span class="modal-error-text" id="error-name">Invalid name (letters only)</span>
        </div>
        <div class="modal-input-group">
            <label>Mobile Number</label>
            <input type="tel" id="guest-phone" class="modal-input" placeholder="10-digit number" maxlength="10" value="${prePhone}">
            <span class="modal-error-text" id="error-phone">Invalid phone (10 digits required)</span>
        </div>
        <button id="guest-submit" class="modal-btn-primary">Proceed to WhatsApp</button>
        <button class="modal-close" style="width: 100%; background: none; color: #555; border: 1px solid #ddd; margin-top: 10px;">Cancel</button>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Validation Logic
    const nameInput = content.querySelector('#guest-name');
    const phoneInput = content.querySelector('#guest-phone');
    const submitBtn = content.querySelector('#guest-submit');
    const cancelBtn = content.querySelector('.modal-close');
    const nameError = content.querySelector('#error-name');
    const phoneError = content.querySelector('#error-phone');

    // Regex
    // Name: Letters, spaces, 2-50 chars
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    // Phone: Exactly 10 digits
    const phoneRegex = /^\d{10}$/;

    // Real-time constraints
    nameInput.addEventListener('input', (e) => {
        // Allow only letters and spaces
        e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');

        if (nameRegex.test(e.target.value)) {
            nameInput.classList.remove('error');
            nameError.style.display = 'none';
        }
    });

    phoneInput.addEventListener('input', (e) => {
        // Allow only digits
        e.target.value = e.target.value.replace(/\D/g, '');

        if (phoneRegex.test(e.target.value)) {
            phoneInput.classList.remove('error');
            phoneError.style.display = 'none';
        }
    });

    submitBtn.onclick = () => {
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        let isValid = true;

        if (!nameRegex.test(name)) {
            nameInput.classList.add('error');
            nameError.style.display = 'block';
            isValid = false;
        }

        if (!phoneRegex.test(phone)) {
            phoneInput.classList.add('error');
            phoneError.style.display = 'block';
            isValid = false;
        }

        if (isValid) {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm({ name, phone });
        }
    };

    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
}

function showOrderConfirmationModal(onConfirm) {
    // Remove existing
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.textAlign = 'center';

    content.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <i class="fa-brands fa-whatsapp" style="font-size: 3rem; color: #25D366; margin-bottom: 1rem;"></i>
            <h3>Order Confirmation</h3>
            <p style="margin-top: 10px; color: #666;">Did you successfully send the message on WhatsApp to place your order?</p>
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="auth-no" style="padding: 10px 20px; border-radius: 8px; border: 1px solid #ddd; background: white; cursor: pointer;">No, not yet</button>
            <button id="auth-yes" style="padding: 10px 20px; border-radius: 8px; border: none; background: var(--primary-orange); color: white; font-weight: bold; cursor: pointer;">Yes, Order Placed</button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    document.getElementById('auth-yes').onclick = () => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm(true);
    };

    document.getElementById('auth-no').onclick = () => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm(false);
    };
}
