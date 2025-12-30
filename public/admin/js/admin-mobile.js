// Admin Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
    const adminHeader = document.querySelector('.admin-header');
    const sidebar = document.querySelector('.sidebar') || document.querySelector('.admin-sidebar');
    let menuToggle = document.querySelector('.mobile-menu-toggle');

    // Create overlay
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (adminHeader && sidebar) {
        // If toggle doesn't exist in HTML (legacy fallback), create it
        if (!menuToggle) {
            menuToggle = document.createElement('button');
            menuToggle.className = 'mobile-menu-toggle';
            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            adminHeader.insertBefore(menuToggle, adminHeader.firstChild);
        }

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        };

        const openSidebar = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            menuToggle.innerHTML = '<i class="fa-solid fa-times"></i>';
        };

        // Toggle sidebar
        menuToggle.addEventListener('click', function () {
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        // Close when clicking overlay
        overlay.addEventListener('click', closeSidebar);

        // Close on resize > 1024
        window.addEventListener('resize', function () {
            if (window.innerWidth > 1024) {
                closeSidebar();
            }
        });
    }
});
