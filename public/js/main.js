const API_URL = '/api';

// Global Validation Utility
const Validator = {
    regex: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        phone: /^[0-9\s\-]{6,20}$/, // Allow spaces and hyphens, 6-20 chars
        name: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
        password: /^.{6,}$/,
        strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        postalCode: /^[0-9]{5,6}$/,
        text: /^.+$/
    },

    messages: {
        email: 'Please enter a valid email address.',
        phone: 'Please enter a valid phone number.',
        name: 'Name must contain only letters, spaces, hyphens, or apostrophes (2-50 chars).',
        password: 'Password must be at least 6 characters.',
        strongPassword: 'Password must be 8+ chars, include uppercase, lowercase, number, and special character.',
        postalCode: 'Please enter a valid postal code.',
        text: 'This field is required.',
        confirmPassword: 'Passwords do not match.'
    },

    validate: function (type, value) {
        if (!this.regex[type]) return { isValid: true };
        const isValid = this.regex[type].test(value);
        return {
            isValid,
            message: isValid ? '' : this.messages[type]
        };
    },

    // Helper to validate and toggle UI error
    validateField: function (inputElement, type, matchValue = null) {
        const value = inputElement.value.trim();
        let result = this.validate(type, value);

        // Special case for matching (e.g., Confirm Password)
        if (type === 'confirmPassword' && matchValue !== null) {
            const isValid = value === matchValue.trim();
            result = {
                isValid,
                message: isValid ? '' : this.messages.confirmPassword
            };
        }

        const parent = inputElement.closest('.input-group') || inputElement.parentNode;

        let errorEl = parent.querySelector('.input-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'input-error';
            parent.appendChild(errorEl);
        }

        if (!result.isValid) {
            errorEl.textContent = result.message;
            errorEl.style.display = 'block';
            inputElement.style.borderColor = 'red';
            return false;
        } else {
            errorEl.style.display = 'none';
            inputElement.style.borderColor = ''; // Reset
            return true;
        }
    }
};
window.Validator = Validator;

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
    // Restrict to Home Page
    const path = window.location.pathname.toLowerCase();
    const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/index');
    if (!isHome) return;

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

async function renderWhatsAppButton() {
    // Avoid on admin pages
    if (window.location.pathname.startsWith('/admin')) return;

    try {
        const response = await fetch('/api/site-content/contact');
        if (response.ok) {
            const { data } = await response.json();
            if (data && data.whatsapp) {
                const whatsappNumber = data.whatsapp.replace(/\D/g, ''); // Clean number
                if (!whatsappNumber) return;

                const button = document.createElement('a');
                button.href = `https://wa.me/${whatsappNumber}`;
                button.className = 'whatsapp-float';
                button.target = '_blank';
                button.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';

                document.body.appendChild(button);
            }
        }
    } catch (error) {
        console.error('Failed to render WhatsApp button:', error);
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

    // Allow most pages without authentication
    const protectedPages = ['checkout', 'profile', 'orders', 'logout'];

    // Only require authentication for protected pages
    if (protectedPages.includes(targetPage) && requireAuth()) {
        window.location.href = `/${targetPage}`;
    } else {
        // For public pages, just navigate
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
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('API Parse Error:', text.substring(0, 500)); // Log HTML for debugging
            throw new Error(`Server Error: ${response.status} (Received non-JSON response)`);
        }

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
    renderWhatsAppButton();
    updateCartCount();
    // CMS: Dynamic header (public site only)
    try {
        const isAdminArea = (window.location.pathname || '').startsWith('/admin');
        if (!isAdminArea) {
            // Header Content
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

            // Home Page Content
            const path = window.location.pathname.toLowerCase();
            const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/index');
            if (isHome) {
                (async () => {
                    try {
                        const res = await api.get('/site-content/home');
                        const data = res?.data || {};

                        if (data.hero) {
                            const heroTitle = document.getElementById('home-hero-title');
                            // Replace newlines with <br> for title and subtitle
                            if (heroTitle && data.hero.title) heroTitle.innerHTML = data.hero.title.replace(/\n/g, '<br>');

                            const heroSubtitle = document.getElementById('home-hero-subtitle');
                            if (heroSubtitle && data.hero.subtitle) heroSubtitle.innerHTML = data.hero.subtitle.replace(/\n/g, '<br>');
                        }

                        if (data.sectionTitles) {
                            const setTxt = (id, txt) => {
                                const el = document.getElementById(id);
                                if (el && txt) el.innerHTML = txt.replace(/\n/g, '<br>');
                            };
                            setTxt('title-featured', data.sectionTitles.featured);
                            setTxt('title-categories', data.sectionTitles.categories);
                            setTxt('title-popular', data.sectionTitles.popular);
                            setTxt('title-stats', data.sectionTitles.stats);
                            setTxt('title-newsletter', data.sectionTitles.newsletter);
                        }

                    } catch (e) {
                        console.error('Failed to load home content', e);
                    }
                })();
            }

            // About Page Content
            if (path.includes('about')) {
                (async () => {
                    try {
                        const res = await api.get('/site-content/about');
                        const data = res?.data || {};

                        if (data.story) {
                            const storyTitle = document.getElementById('about-story-title');
                            if (storyTitle && data.story.title) storyTitle.innerHTML = data.story.title.replace(/\n/g, '<br>');
                        }
                        if (data.intro) {
                            const introTitle = document.getElementById('about-intro-title');
                            if (introTitle && data.intro.title) introTitle.textContent = data.intro.title;

                            const p1 = document.getElementById('about-intro-p1');
                            if (p1 && data.intro.paragraph1) p1.textContent = data.intro.paragraph1;

                            const p2 = document.getElementById('about-intro-p2');
                            if (p2 && data.intro.paragraph2) p2.textContent = data.intro.paragraph2;
                        }
                    } catch (e) {
                        console.error('Failed to load about content', e);
                    }
                })();
            }
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
                window.location.href = `/shop?search=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }

    // Hero Search Logic
    const heroBtn = document.getElementById('hero-search-btn');
    const mobileBtn = document.getElementById('mobile-search-btn');

    const handleSearch = (inputId) => {
        const input = document.getElementById(inputId);
        if (input && input.value.trim()) {
            const query = input.value.trim();
            // Encode the collection param, but "search" is typically just ?search=...
            window.location.href = `/shop?search=${encodeURIComponent(query)}`;
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

// Setup Mobile App Header
function setupMobileHeader() {
    if (window.innerWidth > 1024) return;

    const header = document.getElementById('header');
    if (!header) return;

    const path = window.location.pathname.toLowerCase();
    const isHome = path === '/' || path.endsWith('index.html') || path.endsWith('index');

    const logo = header.querySelector('.logo');
    const headerIcons = header.querySelector('.header-icons');

    // Remove existing dynamic content if any
    const existingDynamic = header.querySelector('.mobile-app-header-content');
    if (existingDynamic) existingDynamic.remove();

    // Check for existing home-specific elements
    let homeCatBtn = header.querySelector('.mobile-home-cat-btn');

    if (isHome) {
        // Home View: Logo only (Icons hidden)
        if (logo) logo.classList.remove('hidden-mobile');
        if (headerIcons) headerIcons.classList.remove('visible-mobile');

        // Feature: Category Menu Button
        if (!homeCatBtn) {
            homeCatBtn = document.createElement('button');
            homeCatBtn.className = 'mobile-home-cat-btn';
            homeCatBtn.innerHTML = '<i class="fa-solid fa-border-all"></i>';
            homeCatBtn.onclick = () => { if (window.showAllCategories) window.showAllCategories(); };

            // Inline Styles for positioning
            homeCatBtn.style.position = 'absolute';
            homeCatBtn.style.right = '1rem';
            homeCatBtn.style.top = '50%';
            homeCatBtn.style.transform = 'translateY(-50%)';
            homeCatBtn.style.background = 'none';
            homeCatBtn.style.border = 'none';
            homeCatBtn.style.fontSize = '1.3rem';
            homeCatBtn.style.color = '#1a1a1a';
            homeCatBtn.style.cursor = 'pointer';

            header.appendChild(homeCatBtn);
        } else {
            homeCatBtn.style.display = 'block';
        }

    } else {
        // Sub-page View: Back + Title + Action
        if (logo) logo.classList.add('hidden-mobile');
        if (headerIcons) headerIcons.classList.remove('visible-mobile');

        // Hide Home Button if persists
        if (homeCatBtn) homeCatBtn.style.display = 'none';
        // Hide standard icons, we might add specific ones
        // Actually, keep standard icons hidden and let dynamic header handle it if needed

        let pageTitle = 'Sunshine';
        if (path.includes('shop')) pageTitle = 'Shop';
        else if (path.includes('cart')) pageTitle = 'My Cart';
        else if (path.includes('checkout')) pageTitle = 'Checkout';
        else if (path.includes('profile')) pageTitle = 'Profile';
        else if (path.includes('login') || path.includes('signup')) pageTitle = 'Account'; // Usually full screen anyway
        else if (path.includes('product')) pageTitle = 'Product Details';
        else if (path.includes('order')) pageTitle = 'Orders';

        // Check for specific element to grab title
        const productTitleEl = document.getElementById('product-name');
        if (path.includes('product') && productTitleEl) {
            // For product page, stick to generic or short name to avoid overflow
            pageTitle = 'Details';
        }

        const dynamicContainer = document.createElement('div');
        dynamicContainer.className = 'mobile-app-header-content';

        dynamicContainer.innerHTML = `
            <button class="mobile-back-btn" onclick="history.back()"><i class="fa-solid fa-arrow-left"></i></button>
            <span class="mobile-page-title">${pageTitle}</span>
            <div class="mobile-header-spacer" style="width: 40px;"></div> 
        `;

        // Optional: Add a specific action button on right instead of spacer
        // e.g. on Shop, show Search? On Product, show Cart?
        if (path.includes('shop')) {
            const rightAction = document.createElement('div');
            rightAction.className = 'mobile-back-btn'; // Reuse style
            rightAction.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
            rightAction.onclick = () => document.getElementById('search-trigger')?.click();
            dynamicContainer.querySelector('.mobile-header-spacer').replaceWith(rightAction);
        } else if (path.includes('product')) {
            const rightAction = document.createElement('a');
            rightAction.href = 'cart';
            rightAction.className = 'mobile-back-btn';
            rightAction.innerHTML = '<i class="fa-solid fa-bag-shopping"></i>';
            dynamicContainer.querySelector('.mobile-header-spacer').replaceWith(rightAction);
        }

        header.appendChild(dynamicContainer);
    }
}

// Call on load and resize
setupMobileHeader(); // Run immediately in case deferred
document.addEventListener('DOMContentLoaded', () => {
    setupMobileHeader();
    window.addEventListener('resize', setupMobileHeader);
});
