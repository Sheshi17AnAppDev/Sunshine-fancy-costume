const API_URL = '/api';

async function applyTheme() {
    try {
        const response = await fetch('/api/site-content/theme');
        if (response.ok) {
            const { data } = await response.json();
            if (data && data.primaryColor) {
                const root = document.documentElement;
                root.style.setProperty('--primary-orange', data.primaryColor);
                if (data.primaryDarkColor) {
                    root.style.setProperty('--primary-orange-dark', data.primaryDarkColor);
                }

                // Font Styling
                if (data.font) {
                    root.style.setProperty('--font-main', data.font);
                    // Dynamically load font from Google if needed
                    const fontName = data.font.split(',')[0].replace(/['"]/g, '');
                    if (fontName !== 'Outfit') { // Outfit is default
                        const link = document.createElement('link');
                        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
                        link.rel = 'stylesheet';
                        document.head.appendChild(link);
                    }
                }

                // Radius Styling
                const radii = {
                    none: { sm: '0px', md: '0px', lg: '0px' },
                    small: { sm: '2px', md: '4px', lg: '8px' },
                    medium: { sm: '8px', md: '15px', lg: '25px' }, // Default
                    large: { sm: '12px', md: '20px', lg: '30px' },
                    full: { sm: '15px', md: '25px', lg: '50px' }
                };

                const radiusSet = radii[data.borderRadius] || radii.medium;
                root.style.setProperty('--radius-sm', radiusSet.sm);
                root.style.setProperty('--radius-md', radiusSet.md);
                root.style.setProperty('--radius-lg', radiusSet.lg);
            }
        }
    } catch (error) {
        console.error('Failed to load theme:', error);
    }
}

async function renderOfferBanner() {
    try {
        const response = await fetch('/api/site-content/offerBanner');
        if (response.ok) {
            const { data } = await response.json();
            if (data && data.isVisible) {
                const banner = document.createElement('div');
                banner.id = 'offer-banner';
                // Styles
                Object.assign(banner.style, {
                    backgroundColor: data.backgroundColor || '#000000',
                    color: data.textColor || '#ffffff',
                    textAlign: 'center',
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    position: 'relative',
                    zIndex: '2000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.4'
                });

                let content = data.text;
                if (data.link && data.link !== '#' && data.link.trim() !== '') {
                    content = `<a href="${data.link}" style="color: inherit; text-decoration: underline; margin-left: 0.3rem;">${data.text} <i class="fa-solid fa-arrow-right" style="font-size: 0.8em; margin-left: 2px;"></i></a>`;
                } else {
                    content = `<span>${data.text}</span>`;
                }

                banner.innerHTML = content;

                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '&times;';
                Object.assign(closeBtn.style, {
                    position: 'absolute',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '0 0.5rem',
                    opacity: '0.8'
                });
                closeBtn.onclick = () => banner.remove();
                banner.appendChild(closeBtn);

                // Prepend to body
                document.body.prepend(banner);
            }
        }
    } catch (error) {
        console.error('Failed to render banner:', error);
    }
}

// Authentication check function
function isAuthenticated() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.token;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Handle navigation clicks with authentication
function handleNavigationClick(event, targetPage) {
    event.preventDefault();

    // Allow home page without authentication
    if (targetPage === 'index' || targetPage === '') {
        window.location.href = targetPage === 'index' ? '/' : '/';
        return;
    }

    // Require authentication for all other pages
    if (requireAuth()) {
        window.location.href = `/${targetPage}`;
    }
}

function updateHeaderAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const headerIcons = document.querySelector('.header-icons');
    if (!headerIcons) return;

    // Find the user icon link
    const userLink = headerIcons.querySelector('a[href="profile"]');
    if (!userLink) return;

    if (user && user.token) {
        // Add class for flexible width
        userLink.classList.add('user-logged-in');

        const firstName = user.name ? user.name.split(' ')[0] : 'User';
        userLink.innerHTML = `
            <div class="user-auth-wrapper">
                <span class="user-name">Hi, ${firstName}</span>
                <i class="fa-regular fa-user"></i>
                <div class="user-dropdown">
                    <a href="profile">My Profile</a>
                    <a href="orders">My Orders</a>
                    <a href="#" id="logout-btn">Logout</a>
                </div>
            </div>
        `;
        // Handle Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                window.location.href = '/';
            };
        }
    } else {
        userLink.classList.remove('user-logged-in');
        userLink.innerHTML = '<i class="fa-regular fa-user"></i>';
    }
}

window.api = {
    request: async (method, endpoint, data = null, isFormData = false) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const adminToken = localStorage.getItem('adminToken');
        const isAdminArea = (window.location.pathname || '').startsWith('/admin');
        const headers = {};
        if (isAdminArea) {
            if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
        } else {
            if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;
        }
        if (!isFormData) headers['Content-Type'] = 'application/json';

        const config = {
            method,
            headers,
            body: isFormData ? data : (data ? JSON.stringify(data) : null),
            cache: 'no-store' // Prevent caching for all API requests to ensure real-time data
        };

        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'API Error');
        return result;
    },
    get: (e) => api.request('GET', e),
    post: (e, d) => api.request('POST', e, d, d instanceof FormData),
    put: (e, d) => api.request('PUT', e, d, d instanceof FormData),
    patch: (e, d) => api.request('PATCH', e, d, d instanceof FormData),
    delete: (e) => api.request('DELETE', e)
};

// Global Currency Formatter
window.formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount || 0);
};

// Global Header Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Reveal on Scroll
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    renderOfferBanner();
    updateCartCount();
    // CMS: Dynamic header (public site only)
    try {
        const isAdminArea = (window.location.pathname || '').startsWith('/admin');
        if (!isAdminArea) {
            (async () => {
                try {
                    const res = await api.get('/site-content/header');
                    const data = res?.data || {};

                    const header = document.getElementById('header');
                    if (!header) return;

                    // Logo text
                    const logoTextEl = header.querySelector('.logo-text');
                    if (logoTextEl && data.logoText) {
                        logoTextEl.textContent = data.logoText;
                    }

                    // Rotating words (expects 2)
                    const rotatingSpans = Array.from(header.querySelectorAll('.rotating-words span'));
                    if (Array.isArray(data.rotatingWords) && data.rotatingWords.length > 0 && rotatingSpans.length > 0) {
                        for (let i = 0; i < rotatingSpans.length && i < data.rotatingWords.length; i++) {
                            rotatingSpans[i].textContent = data.rotatingWords[i];
                        }
                    }

                    // Nav links
                    const navList = header.querySelector('nav ul');
                    if (navList && Array.isArray(data.navLinks) && data.navLinks.length > 0) {
                        const currentPageRaw = (window.location.pathname.split('/').pop() || '').toLowerCase();
                        const currentPage = (currentPageRaw || 'index').replace(/\.html$/i, '');

                        navList.innerHTML = data.navLinks
                            .filter(l => l && l.label && l.href)
                            .map(l => {
                                const href = String(l.href).replace(/\.html$/i, '');
                                const label = String(l.label);
                                const normalizedHref = href.replace(/^\//, '').toLowerCase();
                                const isActive = normalizedHref === currentPage;
                                return `<li><a href="${href}"${isActive ? ' class="active"' : ''}>${label}</a></li>`;
                            })
                            .join('');
                    }

                    // Icon links
                    const iconLinks = data.iconLinks || {};
                    const iconAnchors = Array.from(header.querySelectorAll('.header-icons a'));
                    const userAnchor = iconAnchors.find(a => a.querySelector('i.fa-user') || a.querySelector('i.fa-regular.fa-user'));
                    const cartAnchor = iconAnchors.find(a => a.querySelector('i.fa-bag-shopping') || a.querySelector('i.fa-solid.fa-bag-shopping'));

                    if (userAnchor && iconLinks.user) userAnchor.setAttribute('href', iconLinks.user);
                    if (cartAnchor && iconLinks.cart) cartAnchor.setAttribute('href', iconLinks.cart);
                } catch (e) {
                }
            })();
        }
    } catch (e) {
    }

    updateHeaderAuthUI();

    const observerOptions = {
        threshold: 0.1
    };

    window.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => window.observer.observe(el));

    // Add authentication checks to desktop navigation
    const desktopNavLinks = document.querySelectorAll('header nav ul li a');
    desktopNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            const targetPage = href.replace('.html', '').replace(/^\//, '');
            handleNavigationClick(e, targetPage);
        });
    });

    // Add authentication checks to header icon links
    const headerIconLinks = document.querySelectorAll('.header-icons a');
    headerIconLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                const targetPage = href.replace('.html', '').replace(/^\//, '');
                handleNavigationClick(e, targetPage);
            }
        });
    });

    // Add authentication checks to hero search button
    const heroSearchBtn = document.getElementById('hero-search-btn');
    if (heroSearchBtn) {
        heroSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (requireAuth()) {
                // User is authenticated, proceed with search
                const searchInput = document.getElementById('hero-search-input');
                if (searchInput && searchInput.value.trim()) {
                    window.location.href = `/shop?search=${encodeURIComponent(searchInput.value.trim())}`;
                } else {
                    window.location.href = '/shop';
                }
            }
        });
    }

    // Add authentication checks to any product links or action buttons
    const productLinks = document.querySelectorAll('.product-item, .cat-card');
    productLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (!link.getAttribute('href') || link.getAttribute('href') === '#') {
                e.preventDefault();
                requireAuth(); // Redirect to login for product interactions
            }
        });
    });

    // Search Overlay Logic
    const searchTrigger = document.getElementById('search-trigger');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');

    if (searchTrigger && searchOverlay && searchClose) {
        searchTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            searchOverlay.classList.add('active');
            setTimeout(() => searchInput.focus(), 300);
        });

        searchClose.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
        });

        // Modified keydown listener for search overlay
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                searchOverlay.classList.remove('active');
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                window.location.href = `shop?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // Hero Search Logic
    const heroBtn = document.getElementById('hero-search-btn');
    const mobileBtn = document.getElementById('mobile-search-btn');

    const handleSearch = (inputId) => {
        const input = document.getElementById(inputId);
        if (input && input.value.trim()) {
            window.location.href = `/shop?search=${encodeURIComponent(input.value.trim())}`;
        }
    };

    if (heroBtn) {
        heroBtn.addEventListener('click', () => handleSearch('hero-search-input'));
    }
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => handleSearch('mobile-search-input'));
    }

    // Enter key support for both
    document.getElementById('hero-search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch('hero-search-input');
    });
    document.getElementById('mobile-search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch('mobile-search-input');
    });

    // Update Cart Count
    updateCartCount();

    // Mobile app bottom nav (public site only)
    try {
        const isAdminArea = (window.location.pathname || '').startsWith('/admin');
        if (!isAdminArea) {
            const header = document.getElementById('header');
            if (header) {
                injectMobileBottomNav({ searchOverlay, searchInput });
            }
        }
    } catch (e) {
    }

    // DEBUG: Force bottom nav on small screens
    if (window.innerWidth <= 1024) {
        const show = shouldShow();
        if (!show) {
            const existing = document.getElementById('mobile-bottom-nav');
            if (existing) existing.remove();
            return;
        }
        if (document.getElementById('mobile-bottom-nav')) return;
        setTimeout(() => {
            if (!document.getElementById('mobile-bottom-nav')) {
                console.warn('Mobile bottom nav missing; forcing injection');
                injectMobileBottomNav({ searchOverlay, searchInput });
            }
        }, 200);
    }
});

function injectMobileBottomNav({ searchOverlay, searchInput } = {}) {
    // Only show on small screens
    const shouldShow = () => window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;

    const getCurrentPage = () => {
        const raw = (window.location.pathname.split('/').pop() || '').toLowerCase();
        const page = (raw || 'index').replace(/\.html$/i, '');
        return page || 'index';
    };

    const openSearch = () => {
        const overlay = searchOverlay || document.getElementById('search-overlay');
        const input = searchInput || document.getElementById('search-input');
        if (!overlay) return;
        overlay.classList.add('active');
        setTimeout(() => input && input.focus && input.focus(), 300);
    };

    const ensure = () => {
        const existing = document.getElementById('mobile-bottom-nav');
        if (!shouldShow()) {
            if (existing) existing.remove();
            return;
        }

        if (existing) {
            updateMobileNavActive(existing);
            updateMobileNavCartBadge(existing);
            return;
        }

        const current = getCurrentPage();
        const nav = document.createElement('nav');
        nav.id = 'mobile-bottom-nav';
        nav.className = 'mobile-bottom-nav';

        nav.innerHTML = `
            <a href="index" data-page="index" aria-label="Home"><i class="fa-solid fa-house"></i><span>Home</span></a>
            <a href="shop" data-page="shop" aria-label="Shop"><i class="fa-solid fa-store"></i><span>Shop</span></a>
            <a href="#" data-action="search" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i><span>Search</span></a>
            <a href="cart" data-page="cart" aria-label="Cart"><i class="fa-solid fa-bag-shopping"></i><span>Cart</span><span class="nav-cart-badge" id="nav-cart-badge">0</span></a>
            <a href="profile" data-page="profile" aria-label="Profile"><i class="fa-regular fa-user"></i><span>Profile</span></a>
        `;

        const searchBtn = nav.querySelector('[data-action="search"]');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openSearch();
            });
        }

        // Add authentication checks to navigation links
        const navLinks = nav.querySelectorAll('a[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetPage = link.getAttribute('data-page');
                handleNavigationClick(e, targetPage);
            });
        });

        document.body.appendChild(nav);

        // If CMS header overrides links, match them
        try {
            const header = document.getElementById('header');
            const iconAnchors = header ? Array.from(header.querySelectorAll('.header-icons a')) : [];
            const userAnchor = iconAnchors.find(a => a.querySelector('i.fa-user') || a.querySelector('i.fa-regular.fa-user'));
            const cartAnchor = iconAnchors.find(a => a.querySelector('i.fa-bag-shopping') || a.querySelector('i.fa-solid.fa-bag-shopping'));
            if (userAnchor) nav.querySelector('[data-page="profile"]')?.setAttribute('href', userAnchor.getAttribute('href') || 'profile');
            if (cartAnchor) nav.querySelector('[data-page="cart"]')?.setAttribute('href', cartAnchor.getAttribute('href') || 'cart');
        } catch (e) {
        }

        // Active state + badge
        Array.from(nav.querySelectorAll('a[data-page]')).forEach(a => {
            a.classList.toggle('active', (a.getAttribute('data-page') || '') === current);
        });
        updateMobileNavCartBadge(nav);
    };

    const updateMobileNavActive = (nav) => {
        const current = getCurrentPage();
        Array.from(nav.querySelectorAll('a[data-page]')).forEach(a => {
            a.classList.toggle('active', (a.getAttribute('data-page') || '') === current);
        });
    };

    const updateMobileNavCartBadge = (nav) => {
        const badge = nav.querySelector('#nav-cart-badge');
        if (!badge) return;
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((total, item) => total + (item.qty || item.quantity || 0), 0);
        badge.textContent = String(count);
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    };

    ensure();
    window.addEventListener('resize', ensure);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total, item) => total + (item.qty || item.quantity || 0), 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = count;
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
}
window.updateCartCount = updateCartCount;
window.updateCartIcon = updateCartCount; // Alias for backward compatibility
// Wishlist Logic
window.toggleWishlist = (productId) => {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'info');
    } else {
        wishlist.push(productId);
        showToast('Added to wishlist!', 'success');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.updateWishlistUI();
};

window.isInWishlist = (productId) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wishlist.includes(productId);
};

window.updateWishlistUI = () => {
    const heartIcons = document.querySelectorAll('.heart-icon-btn i');
    heartIcons.forEach(icon => {
        const id = icon.closest('.heart-icon-btn')?.getAttribute('data-id');
        if (id) {
            if (window.isInWishlist(id)) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                icon.style.color = '#ef4444';
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                icon.style.color = '';
            }
        }
    });
};

// Quick Add to Cart
window.quickAddToCart = async (productId) => {
    try {
        const product = await api.get(`/products/${productId}`);
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Use base price and no age group for quick add
        const cartItem = {
            ...product,
            qty: 1,
            ageGroup: product.agePrices && product.agePrices.length > 0 ? product.agePrices[0].ageGroup : null,
            price: product.agePrices && product.agePrices.length > 0 ? product.agePrices[0].price : product.price
        };

        const existingIndex = cart.findIndex(item => item._id === product._id && item.ageGroup === cartItem.ageGroup);
        if (existingIndex > -1) {
            cart[existingIndex].qty += 1;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        api.patch(`/products/${productId}/booked`).catch(err => console.error(err));
        window.updateCartCount();
        showToast('Added to cart!', 'success');
    } catch (err) {
        console.error('Quick add failed', err);
        showToast('Failed to add to cart', 'error');
    }
};

// Global Toast
window.showToast = (message, type = 'info') => {
    // Remove existing toasts to prevent stacking issues if desired, 
    // or just let them stack naturally.
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    if (type === 'warning') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

