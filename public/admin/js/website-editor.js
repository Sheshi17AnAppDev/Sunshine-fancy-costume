(function () {
    const els = {
        pageKey: document.getElementById('page-key'),
        status: document.getElementById('status'),
        saveBtn: document.getElementById('save-btn'),
        heroBlock: document.getElementById('cms-hero-block'),
        sectionTitlesBlock: document.getElementById('cms-section-titles-block'),
        heroTitle: document.getElementById('hero-title'),
        heroSubtitle: document.getElementById('hero-subtitle'),
        titleFeatured: document.getElementById('title-featured'),
        titleCategories: document.getElementById('title-categories'),
        titlePopular: document.getElementById('title-popular'),
        titleStats: document.getElementById('title-stats'),
        titleNewsletter: document.getElementById('title-newsletter'),
        headerExtra: document.getElementById('header-extra'),
        headerLogoText: document.getElementById('header-logo-text'),
        headerRot1: document.getElementById('header-rot-1'),
        headerRot2: document.getElementById('header-rot-2'),
        headerUserHref: document.getElementById('header-user-href'),
        headerCartHref: document.getElementById('header-cart-href'),
        aboutExtra: document.getElementById('about-extra'),
        aboutLabel: document.getElementById('about-label'),
        aboutStoryTitle: document.getElementById('about-story-title'),
        aboutIntroTitle: document.getElementById('about-intro-title'),
        aboutP1: document.getElementById('about-p1'),
        aboutP2: document.getElementById('about-p2'),
        aboutP1: document.getElementById('about-p1'),
        aboutP2: document.getElementById('about-p2'),
        aboutWhy: document.getElementById('about-why'),
        // Theme Elements
        themeExtra: document.getElementById('theme-extra'),
        themePreset: document.getElementById('theme-preset'),
        themePrimary: document.getElementById('theme-primary'),
        themePrimaryText: document.getElementById('theme-primary-text'),
        themeSecondary: document.getElementById('theme-secondary'),
        themeSecondaryText: document.getElementById('theme-secondary-text'),
        themeFont: document.getElementById('theme-font'),
        themeFont: document.getElementById('theme-font'),
        themeRadius: document.getElementById('theme-radius'),
        // New Pages
        contactExtra: document.getElementById('contact-extra'),
        contactTitle: document.getElementById('contact-title'),
        contactIntro: document.getElementById('contact-intro'),
        contactEmail: document.getElementById('contact-email'),
        contactPhone: document.getElementById('contact-phone'),
        contactWhatsapp: document.getElementById('contact-whatsapp'),
        contactAddress: document.getElementById('contact-address'),

        blogExtra: document.getElementById('blog-extra'),
        blogTitle: document.getElementById('blog-title'),
        blogSubtitle: document.getElementById('blog-subtitle'),
        blogList: document.getElementById('blog-list'),
        addPostBtn: document.getElementById('add-post-btn'),

        faqExtra: document.getElementById('faq-extra'),
        faqTitle: document.getElementById('faq-title'),
        faqSubtitle: document.getElementById('faq-subtitle'),
        faqList: document.getElementById('faq-list'),
        addFaqBtn: document.getElementById('add-faq-btn'),

        shopExtra: document.getElementById('shop-extra'),
        shopCollectionTitle: document.getElementById('shop-collection-title'),
        priceRangeList: document.getElementById('price-range-list'),
        addPriceRangeBtn: document.getElementById('add-price-range-btn'),
        ageGroupListAdmin: document.getElementById('age-group-list-admin'),
        addAgeGroupBtn: document.getElementById('add-age-group-btn')
    };

    const setStatus = (text) => {
        if (els.status) els.status.textContent = text;
    };

    const safe = (v) => (v === null || v === undefined ? '' : String(v));

    const setVisibleForPage = (key) => {
        if (els.aboutExtra) els.aboutExtra.hidden = key !== 'about';
        if (els.contactExtra) els.contactExtra.hidden = key !== 'contact';
        if (els.blogExtra) els.blogExtra.hidden = key !== 'blog';
        if (els.faqExtra) els.faqExtra.hidden = key !== 'faq';
        if (els.shopExtra) els.shopExtra.hidden = key !== 'shop';

        if (els.headerExtra) els.headerExtra.hidden = key !== 'header';
        if (els.themeExtra) els.themeExtra.hidden = key !== 'theme';

        const contentKeys = ['home', 'header', 'about', 'shop', 'contact', 'blog', 'faq', 'theme'];
        // Only show generic blocks for 'home' or others if they use them. 
        const showGeneric = !['header', 'theme', 'contact', 'blog', 'faq', 'shop'].includes(key);

        if (els.heroBlock) els.heroBlock.style.display = showGeneric ? '' : 'none';
        if (els.sectionTitlesBlock) els.sectionTitlesBlock.style.display = showGeneric ? '' : 'none';
    };

    const fillForm = (key, content) => {
        if (key === 'header') {
            els.headerLogoText.value = safe(content?.logoText);
            els.headerRot1.value = safe(content?.rotatingWords?.[0]);
            els.headerRot2.value = safe(content?.rotatingWords?.[1]);
            els.headerUserHref.value = safe(content?.iconLinks?.user);
            els.headerCartHref.value = safe(content?.iconLinks?.cart);

            for (let i = 0; i < 5; i++) {
                const labelEl = document.getElementById(`header-nav-${i}-label`);
                const hrefEl = document.getElementById(`header-nav-${i}-href`);
                const item = Array.isArray(content?.navLinks) ? content.navLinks[i] : null;
                if (labelEl) labelEl.value = safe(item?.label);
                if (hrefEl) hrefEl.value = safe(item?.href);
            }
        }

        if (key === 'home') {
            els.heroTitle.value = safe(content?.hero?.title);
            els.heroSubtitle.value = safe(content?.hero?.subtitle);

            els.titleFeatured.value = safe(content?.sectionTitles?.featured);
            els.titleCategories.value = safe(content?.sectionTitles?.categories);
            els.titlePopular.value = safe(content?.sectionTitles?.popular);
            els.titleStats.value = safe(content?.sectionTitles?.stats);
            els.titleNewsletter.value = safe(content?.sectionTitles?.newsletter);
        }

        if (key === 'about') {
            els.heroTitle.value = safe(content?.story?.label);
            els.heroSubtitle.value = safe(content?.story?.title);

            els.aboutLabel.value = safe(content?.story?.label);
            els.aboutStoryTitle.value = safe(content?.story?.title);
            els.aboutIntroTitle.value = safe(content?.intro?.title);
            els.aboutP1.value = safe(content?.intro?.paragraph1);
            els.aboutP2.value = safe(content?.intro?.paragraph2);
            els.aboutWhy.value = safe(content?.why?.title);
        }

        if (key === 'theme') {
            els.themePreset.value = safe(content?.preset || 'custom');

            const p = content?.primaryColor || '#fbb03b';
            const s = content?.primaryDarkColor || '#e89b25';

            els.themePrimary.value = p;
            els.themePrimaryText.value = p;
            els.themeSecondary.value = s;
            els.themeSecondaryText.value = s;
            els.themeFont.value = content?.font || "'Outfit', sans-serif";
            els.themeRadius.value = content?.borderRadius || 'medium';
        }

        if (key === 'contact') {
            els.contactTitle.value = content?.title || '';
            els.contactIntro.value = content?.intro || '';
            els.contactEmail.value = content?.email || '';
            els.contactPhone.value = content?.phone || '';
            els.contactWhatsapp.value = content?.whatsapp || '';
            els.contactAddress.value = content?.address || '';
        }

        if (key === 'blog') {
            els.blogTitle.value = content?.title || '';
            els.blogSubtitle.value = content?.subtitle || '';

            els.blogList.innerHTML = '';
            const posts = content?.posts || [];
            posts.forEach(p => renderBlogPost(p));
        }

        if (key === 'faq') {
            els.faqTitle.value = content?.title || '';
            els.faqSubtitle.value = content?.subtitle || '';
            // Render Questions
            els.faqList.innerHTML = '';
            const questions = content?.questions || [];
            questions.forEach(q => renderFaqItem(q.q, q.a));
        }

        if (key === 'shop') {
            els.shopCollectionTitle.value = content?.title || '';
            els.priceRangeList.innerHTML = '';
            const ranges = content?.priceRanges || [];
            ranges.forEach(r => renderPriceRangeItem(r.label, r.min, r.max));

            els.ageGroupListAdmin.innerHTML = '';
            const groups = content?.ageGroups || [];
            groups.forEach(g => renderAgeGroupItem(g.label));
        }
    };

    // Helper to render FAQ Item
    const renderFaqItem = (question = '', answer = '') => {
        const div = document.createElement('div');
        div.className = 'faq-item glass';
        div.style.padding = '1rem';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <label style="font-weight:600; font-size:0.85rem;">Question</label>
                <button type="button" class="btn-remove" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <input type="text" class="faq-q" value="${question}" placeholder="e.g. How do I return?" style="width:100%; padding:0.8rem; margin-bottom:0.8rem; border-radius:8px; border:1px solid #ddd;">
            <label style="font-weight:600; font-size:0.85rem; display:block; margin-bottom:0.5rem;">Answer</label>
            <textarea class="faq-a" rows="3" placeholder="Answer here..." style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">${answer}</textarea>
        `;
        div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
        els.faqList.appendChild(div);
    };

    // Helper to render Price Range Item
    const renderPriceRangeItem = (label = '', min = 0, max = 0) => {
        const div = document.createElement('div');
        div.className = 'price-range-item glass';
        div.style.padding = '1rem';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <label style="font-weight:600; font-size:0.85rem;">Range Label</label>
                <button type="button" class="btn-remove" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <input type="text" class="range-label" value="${label}" placeholder="e.g. ₹0 - ₹1000" style="width:100%; padding:0.8rem; margin-bottom:0.8rem; border-radius:8px; border:1px solid #ddd;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                <div>
                   <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Min Value</label>
                   <input type="number" class="range-min" value="${min}" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">
                </div>
                <div>
                   <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Max Value</label>
                   <input type="number" class="range-max" value="${max}" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">
                </div>
            </div>
        `;
        div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
        els.priceRangeList.appendChild(div);
    };

    const renderAgeGroupItem = (label = '') => {
        const div = document.createElement('div');
        div.className = 'age-group-item glass';
        div.style.padding = '1rem';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <label style="font-weight:600; font-size:0.85rem;">Age Group Label</label>
                <button type="button" class="btn-remove" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <input type="text" class="age-label" value="${label}" placeholder="e.g. 3-5 Years" style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
        `;
        div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
        els.ageGroupListAdmin.appendChild(div);
    };

    // Helper to render Blog Post
    const renderBlogPost = (post = {}) => {
        const div = document.createElement('div');
        div.className = 'blog-post-item glass';
        div.style.padding = '1.5rem';
        div.style.border = '1px solid rgba(255,255,255,0.1)';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                <h4 style="margin:0;">Blog Post</h4>
                <button type="button" class="btn-remove" style="color:red; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                <div>
                   <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Date/Tag (e.g. FASHION • OCT 12)</label>
                   <input type="text" class="post-tag" value="${post.tag || ''}" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">
                </div>
                <div>
                   <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Badge (e.g. New)</label>
                   <input type="text" class="post-badge" value="${post.badge || ''}" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">
                </div>
            </div>
            <div style="margin-bottom:1rem;">
                <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Post Title</label>
                <input type="text" class="post-title" value="${post.title || ''}" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">
            </div>
             <div style="margin-bottom:1rem;">
                <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Image URL</label>
                <div style="display:flex; gap:0.5rem;">
                    <input type="text" class="post-image" value="${post.image || ''}" style="flex:1; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">
                    <button type="button" class="btn-upload" style="background:var(--primary-color); color:white; border:none; padding:0 1rem; border-radius:6px; cursor:pointer; font-size:0.8rem;">
                        <i class="fa-solid fa-upload"></i> Upload
                    </button>
                    <input type="file" class="file-input" style="display:none;" accept="image/*,video/*">
                </div>
            </div>
            <div>
                <label style="font-weight:600; font-size:0.8rem; display:block; margin-bottom:0.3rem;">Content/Excerpt</label>
                <textarea class="post-content" rows="3" style="width:100%; padding:0.6rem; border-radius:6px; border:1px solid #ddd;">${post.content || ''}</textarea>
            </div>
        `;

        div.querySelector('.btn-remove').addEventListener('click', () => div.remove());

        // Upload Handler
        const btnUpload = div.querySelector('.btn-upload');
        const fileInput = div.querySelector('.file-input');
        const urlInput = div.querySelector('.post-image');

        btnUpload.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Basic Validation before sending
            if (file.size > 25 * 1024 * 1024) {
                alert('File is too large (Max 25MB)');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            const originalBtnText = btnUpload.innerHTML;
            btnUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btnUpload.disabled = true;

            try {
                const res = await adminAuth.makeAuthenticatedRequest('/api/upload', {
                    method: 'POST',
                    body: formData
                }, true); // Pass true to skip JSON stringify for FormData (if your helper supports it) or handle manually.

                // Note: makeAuthenticatedRequest usually sets Content-Type to application/json.
                // For FormData, we must NOT set Content-Type header (browser sets it with boundary).
                // Let's assume we need to handle this manually or update the helper.
                // Assuming adminAuth.makeAuthenticatedRequest isn't built for FormData logic yet.
                // Let's do a fetch directly with the token.

                // Get token for auth
                const token = localStorage.getItem('adminToken');
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Content-Type is auto-set
                    },
                    body: formData
                });

                if (!uploadRes.ok) {
                    const data = await uploadRes.json();
                    if (uploadRes.status === 401) {
                        alert('Session expired. Please log in again.');
                        window.location.href = '/admin/login';
                        return;
                    }
                    throw new Error(data.message || 'Upload failed');
                }

                const data = await uploadRes.json();

                urlInput.value = data.url;
                btnUpload.innerHTML = '<i class="fa-solid fa-check"></i> Done';
                setTimeout(() => {
                    btnUpload.innerHTML = originalBtnText;
                    btnUpload.disabled = false;
                }, 2000);

            } catch (err) {
                console.error(err);
                alert('Upload failed: ' + err.message);
                btnUpload.innerHTML = 'Error';
                setTimeout(() => {
                    btnUpload.innerHTML = originalBtnText;
                    btnUpload.disabled = false;
                }, 2000);
            }
        });

        els.blogList.appendChild(div);
    };

    if (els.addFaqBtn) {
        els.addFaqBtn.addEventListener('click', () => renderFaqItem());
    }

    if (els.addPostBtn) {
        els.addPostBtn.addEventListener('click', () => renderBlogPost());
    }

    if (els.addPriceRangeBtn) {
        els.addPriceRangeBtn.addEventListener('click', () => renderPriceRangeItem());
    }

    if (els.addAgeGroupBtn) {
        els.addAgeGroupBtn.addEventListener('click', () => renderAgeGroupItem());
    }

    const gatherForm = (key) => {
        if (key === 'header') {
            const navLinks = [];
            for (let i = 0; i < 5; i++) {
                const label = (document.getElementById(`header-nav-${i}-label`)?.value || '').trim();
                const href = (document.getElementById(`header-nav-${i}-href`)?.value || '').trim();
                if (label && href) navLinks.push({ label, href });
            }

            return {
                logoText: els.headerLogoText.value,
                rotatingWords: [els.headerRot1.value, els.headerRot2.value].filter(Boolean),
                navLinks,
                iconLinks: {
                    user: els.headerUserHref.value,
                    cart: els.headerCartHref.value
                }
            };
        }

        if (key === 'home') {
            return {
                hero: {
                    title: els.heroTitle.value,
                    subtitle: els.heroSubtitle.value
                },
                sectionTitles: {
                    featured: els.titleFeatured.value,
                    categories: els.titleCategories.value,
                    popular: els.titlePopular.value,
                    stats: els.titleStats.value,
                    newsletter: els.titleNewsletter.value
                }
            };
        }

        if (key === 'about') {
            return {
                story: {
                    label: els.aboutLabel.value || els.heroTitle.value,
                    title: els.aboutStoryTitle.value || els.heroSubtitle.value
                },
                intro: {
                    title: els.aboutIntroTitle.value,
                    paragraph1: els.aboutP1.value,
                    paragraph2: els.aboutP2.value
                },
                why: {
                    title: els.aboutWhy.value
                }
            };
        }

        if (key === 'theme') {
            return {
                preset: els.themePreset.value,
                primaryColor: els.themePrimaryText.value,
                primaryDarkColor: els.themeSecondaryText.value,
                font: els.themeFont.value,
                borderRadius: els.themeRadius.value
            };
        }

        if (key === 'contact') {
            return {
                title: els.contactTitle.value,
                intro: els.contactIntro.value,
                email: els.contactEmail.value,
                phone: els.contactPhone.value,
                whatsapp: els.contactWhatsapp.value,
                address: els.contactAddress.value
            };
        }

        if (key === 'blog') {
            const posts = [];
            const items = els.blogList.querySelectorAll('.blog-post-item');
            items.forEach((item, index) => {
                posts.push({
                    id: String(index + 1),
                    tag: item.querySelector('.post-tag').value,
                    badge: item.querySelector('.post-badge').value,
                    title: item.querySelector('.post-title').value,
                    image: item.querySelector('.post-image').value,
                    content: item.querySelector('.post-content').value
                });
            });

            return {
                title: els.blogTitle.value,
                subtitle: els.blogSubtitle.value,
                posts
            };
        }

        if (key === 'faq') {
            const questions = [];
            const items = els.faqList.querySelectorAll('.faq-item');
            items.forEach(item => {
                const q = item.querySelector('.faq-q').value;
                const a = item.querySelector('.faq-a').value;
                if (q) questions.push({ q, a });
            });
            return {
                title: els.faqTitle.value,
                subtitle: els.faqSubtitle.value,
                questions
            };
        }

        if (key === 'shop') {
            const priceRanges = [];
            const rItems = els.priceRangeList.querySelectorAll('.price-range-item');
            rItems.forEach(item => {
                priceRanges.push({
                    label: item.querySelector('.range-label').value,
                    min: Number(item.querySelector('.range-min').value),
                    max: Number(item.querySelector('.range-max').value)
                });
            });

            const ageGroups = [];
            const aItems = els.ageGroupListAdmin.querySelectorAll('.age-group-item');
            aItems.forEach(item => {
                ageGroups.push({
                    label: item.querySelector('.age-label').value
                });
            });

            return {
                title: els.shopCollectionTitle.value,
                priceRanges,
                ageGroups
            };
        }

        return {};
    };

    const loadPage = async () => {
        const key = els.pageKey.value;
        setVisibleForPage(key);
        setStatus('Loading...');

        try {
            const res = await adminAuth.makeAuthenticatedRequest(`/api/admin/site-content/${key}?t=${Date.now()}`);
            fillForm(key, res.data);
            setStatus(`Loaded • ${new Date(res.updatedAt).toLocaleString()}`);
        } catch (e) {
            setStatus(e.message || 'Failed to load');
        }
    };

    const savePage = async () => {
        const key = els.pageKey.value;
        setStatus('Saving...');

        try {
            const data = gatherForm(key);
            const res = await adminAuth.makeAuthenticatedRequest(`/api/admin/site-content/${key}`, {
                method: 'PUT',
                body: JSON.stringify({ data })
            });
            setStatus(`Saved • ${new Date(res.updatedAt).toLocaleString()}`);
        } catch (e) {
            setStatus(e.message || 'Failed to save');
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        setVisibleForPage(els.pageKey.value);
        els.pageKey.addEventListener('change', loadPage);
        els.saveBtn.addEventListener('click', savePage);

        // Theme Color Sync
        const syncColor = (picker, text) => {
            picker.addEventListener('input', () => text.value = picker.value);
            text.addEventListener('input', () => picker.value = text.value);
        };
        syncColor(els.themePrimary, els.themePrimaryText);
        syncColor(els.themeSecondary, els.themeSecondaryText);

        // Theme Presets
        const presets = {
            sunshine: { p: '#fbb03b', s: '#e89b25', f: "'Outfit', sans-serif", r: 'medium' },
            ocean: { p: '#0ea5e9', s: '#0284c7', f: "'Inter', sans-serif", r: 'small' },
            berry: { p: '#e11d48', s: '#be123c', f: "'Poppins', sans-serif", r: 'large' },
            jungle: { p: '#22c55e', s: '#16a34a', f: "'Roboto', sans-serif", r: 'none' },
            midnight: { p: '#8b5cf6', s: '#7c3aed', f: "'Playfair Display', serif", r: 'full' }
        };

        els.themePreset.addEventListener('change', (e) => {
            const val = e.target.value;
            if (presets[val]) {
                const p = presets[val];
                els.themePrimary.value = p.p;
                els.themePrimaryText.value = p.p;
                els.themeSecondary.value = p.s;
                els.themeSecondaryText.value = p.s;
                els.themeFont.value = p.f;
                els.themeRadius.value = p.r;
            }
        });

        // Initial Load or URL param check
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        if (pageParam && els.pageKey.querySelector(`option[value="${pageParam}"]`)) {
            els.pageKey.value = pageParam;
        }

        loadPage();

        // Expose global switcher for Sidebar links
        window.switchEditorPage = async (key) => {
            if (els.pageKey.querySelector(`option[value="${key}"]`)) {
                els.pageKey.value = key;
                await loadPage();
                // On mobile, close sidebar if open
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    document.querySelector('.sidebar-overlay')?.classList.remove('active');
                    document.querySelector('.mobile-menu-toggle').innerHTML = '<i class="fa-solid fa-bars"></i>';
                }
            }
        };
    });
})();
