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
    closeButton.onclick = function() {
        document.body.removeChild(modalOverlay);
    };

    // Append elements
    modalContent.appendChild(messageElement);
    modalContent.appendChild(closeButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Close modal on escape key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.body.removeChild(modalOverlay);
        }
    });
}
