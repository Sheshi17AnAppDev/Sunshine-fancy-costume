const SiteContent = require('../models/SiteContent');

const getDefaultDataForKey = (key) => {
    if (key === 'header') {
        return {
            logoText: 'SUNSHINE',
            rotatingWords: ['Fancy', 'Costumes'],
            navLinks: [
                { label: 'Home', href: 'index' },
                { label: 'Shop', href: 'shop' },
                { label: 'About', href: 'about' },
                { label: 'Contact', href: 'contact' },
                { label: 'Blog', href: 'blog' }
            ],
            iconLinks: {
                user: 'profile',
                cart: 'cart'
            }
        };
    }

    if (key === 'home') {
        return {
            hero: {
                title: 'Crafting Comfort, Redefining Spaces.\nYour Home, Your Signature Style!',
                subtitle: 'In store and online, shop our wide collection of home decor and fancy costumes designed for your unique lifestyle.'
            },
            sectionTitles: {
                featured: 'Featured Products',
                categories: 'View Our Range Of Categories',
                popular: 'Most Popular Products',
                stats: 'Have A Look At Our Unique\nSelling Proportions',
                newsletter: 'Subscribe To Your Newsletter To Stay\nUpdated About Discounts'
            }
        };
    }

    if (key === 'about') {
        return {
            story: {
                label: 'OUR STORY',
                title: 'Crafting Comfort & Spreading Joy Since 2010'
            },
            intro: {
                title: 'Quality Meets Fancy',
                paragraph1: "At Sunshine, we believe that your home should be a reflection of your unique personality. What started as a small boutique for fancy costumes has evolved into a premier destination for both whimsical outfits and elegant home decor.",
                paragraph2: "Our mission is simple: to bring a ray of sunshine into every aspect of your life. Whether you're dressing up for a special occasion or dressing up your living room, we provide the quality and style you deserve."
            },
            why: {
                title: 'Why Choose Sunshine?'
            }
        };
    }

    if (key === 'contact') {
        return {
            title: "We'd Love To Hear From You",
            intro: "Have a question about our products or an existing order? Our team is ready to assist you with anything you need. Fill out the form and we'll get back to you within 24 hours.",
            email: 'hello@example.com',
            phone: '+1 (555) 123-4567',
            whatsapp: '919876543210',
            address: '123 Sunshine Blvd, Design District, NY'
        };
    }

    if (key === 'blog') {
        return {
            title: 'Latest News & Stories',
            subtitle: 'Stay updated with the latest trends and company updates.',
            posts: [
                {
                    id: '1',
                    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
                    tag: 'FASHION • OCT 12',
                    title: 'Autumn Collection Release',
                    content: "Discover our new range of cozy and stylish costumes perfect for the season. We've added 50+ new items.",
                    badge: 'New'
                },
                {
                    id: '2',
                    image: 'https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7?auto=format&fit=crop&w=800&q=80',
                    tag: 'TIPS • SEP 28',
                    title: 'Spooky Decor Ideas',
                    content: "Transform your home into a haunted house with these simple, DIY decoration tips using our props.",
                    badge: ''
                },
                {
                    id: '3',
                    image: 'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?auto=format&fit=crop&w=800&q=80',
                    tag: 'EVENTS • AUG 15',
                    title: 'Hosting the Perfect Costume Party',
                    content: "A complete guide to organizing a memorable costume party, from invitations to the best playlist.",
                    badge: 'Popular'
                }
            ]
        };
    }

    if (key === 'faq') {
        return {
            title: 'Frequently Asked Questions',
            subtitle: 'Everything you need to know about our products and services.',
            questions: [
                { q: 'What is your return policy?', a: 'You can return any item within 30 days of purchase if it is unused and in its original packaging.' },
                { q: 'Do you ship internationally?', a: 'Yes, we ship to over 50 countries worldwide. Shipping costs vary by location.' },
                { q: 'How can I track my order?', a: 'Once your order ships, you will receive an email with a tracking number and link to track your package.' }
            ]
        };
    }

    if (key === 'theme') {
        return {
            preset: 'sunshine',
            primaryColor: '#fbb03b',
            primaryDarkColor: '#e89b25',
            font: "'Outfit', sans-serif",
            borderRadius: 'medium'
        };
    }

    if (key === 'shop') {
        return {
            title: 'Our Collection Of Products',
            priceRanges: [
                { label: '₹0 - ₹500', min: 0, max: 500 },
                { label: '₹500 - ₹1000', min: 500, max: 1000 },
                { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
                { label: '₹2000 - ₹5000', min: 2000, max: 5000 },
                { label: 'Above ₹5000', min: 5000, max: 1000000 }
            ],
            ageGroups: [
                { label: '0 - 2 Years' },
                { label: '3 - 5 Years' },
                { label: '6 - 10 Years' },
                { label: '11 - 15 Years' },
                { label: 'Adults' }
            ]
        };
    }

    return {};
};

// @desc    Get website content by key (public)
// @route   GET /api/site-content/:key
// @access  Public
exports.getSiteContentPublic = async (req, res) => {
    try {
        const key = (req.params.key || '').trim();
        if (!key) {
            return res.status(400).json({ message: 'Content key is required' });
        }

        let doc = await SiteContent.findOne({ key });
        const defaults = getDefaultDataForKey(key);
        if (!doc) {
            doc = await SiteContent.create({ key, data: defaults });
        } else {
            // Self-heal: ensure new default fields are added to existing documents
            let modified = false;
            for (const field in defaults) {
                if (doc.data[field] === undefined) {
                    doc.data[field] = defaults[field];
                    modified = true;
                }
            }
            if (modified) {
                doc.markModified('data');
                await doc.save();
            }
        }

        res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    List all site content keys (admin)
// @route   GET /api/admin/site-content
// @access  Private (Admin)
exports.listSiteContentAdmin = async (req, res) => {
    try {
        const docs = await SiteContent.find().select('key updatedAt').sort({ key: 1 });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get website content by key (admin)
// @route   GET /api/admin/site-content/:key
// @access  Private (Admin)
exports.getSiteContentAdmin = async (req, res) => {
    try {
        const key = (req.params.key || '').trim();
        if (!key) {
            return res.status(400).json({ message: 'Content key is required' });
        }

        let doc = await SiteContent.findOne({ key });
        const defaults = getDefaultDataForKey(key);
        if (!doc) {
            doc = await SiteContent.create({ key, data: defaults, updatedBy: req.user?._id });
        } else {
            // Self-heal: ensure new default fields are added to existing documents
            let modified = false;
            for (const field in defaults) {
                if (doc.data[field] === undefined) {
                    doc.data[field] = defaults[field];
                    modified = true;
                }
            }
            if (modified) {
                doc.markModified('data');
                await doc.save();
            }
        }

        res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update website content by key (admin)
// @route   PUT /api/admin/site-content/:key
// @access  Private (Admin)
exports.updateSiteContentAdmin = async (req, res) => {
    try {
        const key = (req.params.key || '').trim();
        if (!key) {
            return res.status(400).json({ message: 'Content key is required' });
        }

        const data = req.body?.data;
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ message: 'Invalid data payload' });
        }

        const doc = await SiteContent.findOneAndUpdate(
            { key },
            { $set: { data, updatedBy: req.user?._id } },
            { new: true, upsert: true }
        );

        res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
