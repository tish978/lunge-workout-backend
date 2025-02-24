const jwt = require('jsonwebtoken');

// ✅ General Authentication Middleware (For All Users)
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ error: 'Access denied: No token provided' });
        }

        const tokenParts = authHeader.split(' ');

        // Validate token format
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(400).json({ error: 'Invalid token format. Expected: Bearer <token>' });
        }

        const token = tokenParts[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return res.status(500).json({ error: 'Authentication failed. Please try again.' });
    }
};

// ✅ Admin-Specific Authentication Middleware
const authenticateAdmin = (req, res, next) => {
    authenticate(req, res, () => {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }
        next();
    });
};

module.exports = { authenticate, authenticateAdmin };
