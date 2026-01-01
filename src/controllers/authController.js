const User = require('../models/User');
const Site = require('../models/Site');
const generateToken = require('../config/generateToken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory store for OTPs (in production, use Redis or database)
const otpStore = new Map();
const unverifiedUsers = new Map();

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email service function
const sendOTPEmail = async (email, otp, subject, type = 'verify') => {
    try {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`=== OTP EMAIL DEBUG (No SMTP Configured) ===`);
            console.log(`Email: ${email}`);
            console.log(`OTP: ${otp}`);
            console.log(`To send actual emails, configure EMAIL_USER and EMAIL_PASS in .env`);
            console.log(`================================================`);
            return true;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // Only for development
            }
        });

        const mailOptions = {
            from: `"Sunshine Costumes" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: subject || 'Verify Your Email - Sunshine Costumes',
            html: createEmailTemplate(otp, type)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        // Fallback to console log if email fails
        console.log(`=== OTP EMAIL FALLBACK ===`);
        console.log(`Email: ${email}`);
        console.log(`OTP: ${otp}`);
        console.log(`========================`);
        return true; // Continue with registration even if email fails
    }
};

// Email template
function createEmailTemplate(otp, type = 'verify') {
    const isReset = type === 'reset';
    const title = isReset ? 'Reset Your Password' : 'Verify Your Email Address';
    const intro = isReset
        ? 'We received a request to reset your password. Use the code below to proceed:'
        : 'Thank you for signing up with Sunshine Costumes! To complete your registration, please use the verification code below:';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f8f9fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #fbb03b, #f39c12);
            padding: 40px 30px;
            color: white;
            text-align: center;
        }
        .brand-name {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .content {
            padding: 40px 30px;
        }
        .otp-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: 8px;
            color: white;
            background: rgba(255,255,255,0.2);
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .expiry-info {
            color: rgba(255,255,255,0.9);
            font-size: 0.9rem;
            margin-top: 15px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 0.85rem;
        }
        .brand-logo {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fbb03b;
            margin-bottom: 10px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .header, .content, .footer {
                padding: 30px 20px;
            }
            .otp-code {
                font-size: 2rem;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="brand-name">SUNSHINE</h1>
            <p style="margin:10px 0 0;font-size:1rem;opacity:0.9">Fancy Costumes</p>
        </div>
        <div class="content">
            <h2 style="color:#333;margin-bottom:20px">${title}</h2>
            <p style="font-size:1.1rem;line-height:1.6;color:#555">
                ${intro}
            </p>
            <div class="otp-container">
                <p style="color:white;font-size:1.1rem;margin:0 0 15px">Your Code:</p>
                <div class="otp-code">${otp}</div>
                <p class="expiry-info">This code will expire in 10 minutes</p>
            </div>
            <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0;border-radius:4px">
                <p style="margin:0;color:#856404;font-size:0.9rem">
                    <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
                </p>
            </div>
            <p style="color:#666;font-size:0.9rem;margin-top:30px">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
        <div class="footer">
            <div class="brand-logo">SUNSHINE Fancy Costumes</div>
            <p style="margin:5px 0">Your one-stop shop for premium costumes</p>
            <p style="margin:10px 0 0;font-size:0.8rem;color:#999">© 2023 Sunshine Fancy Costumes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

// @desc    Initiate registration with OTP
// @route   POST /api/auth/register-init
// @access  Public
exports.initiateRegistration = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists and is verified
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ message: 'User already registered' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store user data temporarily
        unverifiedUsers.set(email, {
            name,
            email,
            password,
            otp,
            otpExpiry,
            createdAt: Date.now()
        });

        // Store OTP for verification
        otpStore.set(email, {
            otp,
            expiry: otpExpiry
        });

        // Send OTP email (with fallback)
        try {
            await sendOTPEmail(email, otp);
            console.log('OTP email sent successfully to:', email);
        } catch (emailError) {
            console.error('Email sending failed, but continuing with registration:', emailError.message);
            // Continue with registration even if email fails for demo purposes
            // In production, you might want to handle this differently
        }

        res.status(200).json({
            message: 'OTP sent to your email',
            email: email,
            debugOTP: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Check if OTP exists and is valid
        const storedOTP = otpStore.get(email);
        if (!storedOTP || storedOTP.expiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Verify OTP
        if (storedOTP.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Get user data
        const userData = unverifiedUsers.get(email);
        if (!userData) {
            return res.status(400).json({ message: 'Registration session expired' });
        }

        // Find default/active site
        // Find default/active site
        // Ideally this should come from middleware/request context in multi-site setup
        let defaultSite = await Site.findOne({ isActive: true });

        // Auto-create default site if none exists (Failsafe for empty DB)
        if (!defaultSite) {
            console.log('No active site found. Creating default site...');
            try {
                defaultSite = await Site.create({
                    name: 'Sunshine Fancy Costumes',
                    slug: 'sunshine-default',
                    description: 'Default site created by auth failsafe',
                    isActive: true
                });
            } catch (siteErr) {
                console.error('Failed to create default site:', siteErr);
                // Try finding ANY site if creation fail
                defaultSite = await Site.findOne({});
            }
        }

        // Create user
        const user = await User.create({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: 'user',
            isVerified: true,
            site: defaultSite ? defaultSite._id : null
        });

        // Clean up stores
        otpStore.delete(email);
        unverifiedUsers.delete(email);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const userData = unverifiedUsers.get(email);
        if (!userData) {
            return res.status(400).json({ message: 'No registration in progress' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Update stores
        userData.otp = otp;
        userData.otpExpiry = otpExpiry;
        otpStore.set(email, { otp, expiry: otpExpiry });

        // Send OTP email (with fallback)
        try {
            await sendOTPEmail(email, otp);
            console.log('OTP email resent successfully to:', email);
        } catch (emailError) {
            console.error('Email sending failed, but continuing with resend:', emailError.message);
            // Continue with resend even if email fails for demo purposes
        }

        res.status(200).json({
            message: 'OTP resent to your email',
            debugOTP: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clean up expired data (run periodically)
function cleanupExpiredData() {
    const now = Date.now();

    // Clean expired OTPs
    for (const [email, data] of otpStore.entries()) {
        if (data.expiry < now) {
            otpStore.delete(email);
        }
    }

    // Clean expired unverified users (30 minutes)
    for (const [email, data] of unverifiedUsers.entries()) {
        if (data.createdAt + 30 * 60 * 1000 < now) {
            unverifiedUsers.delete(email);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredData, 5 * 60 * 1000);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                address: user.address,
                city: user.city,
                postalCode: user.postalCode,
                country: user.country
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;

            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
                user.email = req.body.email;
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.address = req.body.address || user.address;
            user.city = req.body.city || user.city;
            user.postalCode = req.body.postalCode || user.postalCode;
            user.country = req.body.country || user.country;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phoneNumber: updatedUser.phoneNumber,
                address: updatedUser.address,
                city: updatedUser.city,
                postalCode: updatedUser.postalCode,
                country: updatedUser.country,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = generateOTP();

        // Hash and save to DB
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(otp)
            .digest('hex');

        // Expire in 10 minutes
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Send email
        try {
            await sendOTPEmail(email, otp, 'Reset Your Password - Sunshine Costumes', 'reset');
            res.status(200).json({
                success: true,
                message: 'Password reset code sent to email',
                debugOTP: process.env.NODE_ENV === 'development' ? otp : undefined
            });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        // Hash the provided OTP to compare with stored hash
        const hashedOTP = crypto
            .createHash('sha256')
            .update(otp)
            .digest('hex');

        const user = await User.findOne({
            email,
            resetPasswordToken: hashedOTP,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
