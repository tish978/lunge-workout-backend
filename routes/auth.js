const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

// ✅ Utility function to validate email format
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ✅ Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 🚨 Input validation
        if (!email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // 🚨 Check if the email is already registered
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email is already registered' }); // 409 Conflict
        }

        // ✅ Hash password and insert user
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

// ✅ Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 🚨 Input validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // 🚨 Check if user exists
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // 🚨 Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // ✅ Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email, role: user.role } 
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

module.exports = router;
