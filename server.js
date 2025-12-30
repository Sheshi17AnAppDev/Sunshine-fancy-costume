require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (Must be before static fallbacks)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/site-content', require('./src/routes/siteContentRoutes'));
app.use('/api/admin/auth', require('./src/routes/adminAuthRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/admin', require('./src/routes/superAdminRoutes'));
app.use('/api/admin', require('./src/routes/adminSiteContentRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/brands', require('./src/routes/brandRoutes'));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'API is running' });
});

// Static Folders
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Profile page (clean URL)
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Login page (clean URL)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Clean URLs Fallback for main pages
app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.startsWith('api') || page.startsWith('admin')) return next();
    if (page.includes('.')) return next();
    res.sendFile(path.join(__dirname, 'public', `${page}.html`), err => {
        if (err) next();
    });
});

// Clean URLs Fallback for admin pages
app.get('/admin/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.includes('.')) return next();
    res.sendFile(path.join(__dirname, 'public', 'admin', `${page}.html`), err => {
        if (err) next();
    });
});

// Redirect admin root to login
app.get('/admin', (req, res) => {
    res.redirect('/admin/login');
});

// Redirect root to index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
});
