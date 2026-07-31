const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Admin = require('../models/Admin');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.use(authLimiter);

// POST /api/auth/citizen/register
router.post('/citizen/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Citizen account already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      phone: phone || '',
      address: address || ''
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: 'citizen' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: 'citizen'
      }
    });
  } catch (err) {
    console.error(`[Auth Register Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/citizen/login
router.post('/citizen/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid citizen credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid citizen credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: 'citizen' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: 'citizen'
      }
    });
  } catch (err) {
    console.error(`[Auth Citizen Login Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { admin_id, password } = req.body;

    if (!admin_id || !password) {
      return res.status(400).json({ error: 'Admin ID / Email and password are required.' });
    }

    const cleanInput = admin_id.trim();
    let admin = await Admin.findOne({
      $or: [
        { admin_id: cleanInput },
        { email: cleanInput.toLowerCase() }
      ]
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, admin_id: admin.admin_id, name: admin.name, email: admin.email, role: 'admin', department: admin.department },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      admin: {
        id: admin._id,
        admin_id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        department: admin.department,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error(`[Auth Admin Login Error] ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const admin = await Admin.findById(req.user.id).select('-password_hash');
      return res.status(200).json({ admin });
    } else {
      const user = await User.findById(req.user.id).select('-password_hash');
      return res.status(200).json({ user });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
