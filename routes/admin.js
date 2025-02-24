const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateAdmin } = require('../middlewares/authMiddleware');

// Fetch all workouts (Admin only)
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        console.log("🎯 Received request to /api/admin/workouts");

        // 1️⃣ Ensure the requesting user is an admin
        if (!req.user || req.user.role !== 'admin') {
            console.log("❌ Access denied: User is not an admin", req.user?.role);
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }

        // 2️⃣ Validate & Sanitize Search Query
        let searchQuery = req.query.query;

        if (searchQuery) {
            if (typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
                return res.status(400).json({ error: 'Invalid search query. Must be a non-empty string.' });
            }
            if (searchQuery.length > 50) {
                return res.status(400).json({ error: 'Search query too long. Max 50 characters allowed.' });
            }
            if (!/^[a-zA-Z0-9\s@._-]+$/.test(searchQuery)) { // ✅ Allow letters, numbers, emails
                return res.status(400).json({ error: 'Search query contains invalid characters.' });
            }

            searchQuery = `%${searchQuery.trim()}%`; // Wildcard for SQL LIKE
        }

        // 3️⃣ Construct SQL Query
        let sql = `
            SELECT w.id, w.user_id, u.name AS user_name, u.email AS user_email, 
                   w.workout_type, w.duration, w.calories_burned, w.image_url
            FROM workouts w
            INNER JOIN users u ON w.user_id = u.id
        `;

        let values = [];

        if (searchQuery) {
            sql += ` WHERE u.name LIKE ? OR u.email LIKE ?`;
            values.push(searchQuery, searchQuery);
        }

        console.log("📝 SQL Query:", sql);
        console.log("🔢 Query Parameters:", values);

        // 4️⃣ Execute Database Query & Handle Errors
        const [workouts] = await db.execute(sql, values);

        if (workouts.length === 0) {
            return res.status(404).json({ error: 'No workouts found matching the search criteria.' });
        }

        console.log("📊 API Response:", workouts);
        res.json(workouts);
        
    } catch (error) {
        console.error("❌ Error fetching workouts for admin:", error);

        // Handle specific database errors like in PUT function
        if (error.code === 'ER_PARSE_ERROR') {
            return res.status(400).json({ error: 'Invalid database query syntax.' });
        }
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            return res.status(500).json({ error: 'Database access denied. Check credentials.' });
        }
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ error: 'Invalid field in database query.' });
        }

        res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
    }
});

// Update a user's workout (Admin Only)
router.put('/:id', authenticateAdmin, async (req, res) => {
    
    try {
        console.log("🛠 Admin Update Request: Workout ID", req.params.id);

        // 1️⃣ Ensure user is an admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }

        // 2️⃣ Validate Workout ID
        const workoutId = parseInt(req.params.id, 10);
        if (isNaN(workoutId) || workoutId <= 0) {
            return res.status(400).json({ error: 'Invalid workout ID. Must be a positive integer.' });
        }

        // 3️⃣ Validate request body
        const { workout_type, duration, calories_burned } = req.body;

        if (!workout_type || typeof workout_type !== 'string' || workout_type.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid workout_type. Must be a non-empty string.' });
        }

        if (!duration || isNaN(duration) || duration <= 0) {
            return res.status(400).json({ error: 'Invalid duration. Must be a positive number.' });
        }

        if (!calories_burned || isNaN(calories_burned) || calories_burned <= 0) {
            return res.status(400).json({ error: 'Invalid calories_burned. Must be a positive number.' });
        }

        // Fetch existing workout (Make sure it exists)
        const [existingWorkouts] = await db.execute('SELECT * FROM workouts WHERE id = ?', [req.params.id]);
        if (existingWorkouts.length === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // Update workout details
        await db.execute(
            'UPDATE workouts SET workout_type = ?, duration = ?, calories_burned = ? WHERE id = ?',
            [workout_type, duration, calories_burned, req.params.id]
        );

        res.json({ message: 'Workout updated successfully' });
    } catch (error) {
        console.error('❌ Error updating workout:', error);

        // Catch specific database errors
        if (error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ error: 'Invalid foreign key reference.' });
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Duplicate entry detected.' });
        }

        res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
    }
});

// Delete a user's workout (Admin Only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        console.log("🗑 Admin Delete Request: Workout ID", req.params.id);

        // 1️⃣ Ensure the requesting user is an admin
        if (!req.user || req.user.role !== 'admin') {
            console.log("❌ Access denied: User is not an admin", req.user?.role);
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }

        // 2️⃣ Validate Workout ID
        const workoutId = parseInt(req.params.id, 10);
        if (isNaN(workoutId) || workoutId <= 0) {
            return res.status(400).json({ error: 'Invalid workout ID. Must be a positive integer.' });
        }

        // 3️⃣ Ensure workout exists before attempting to delete
        const [existingWorkouts] = await db.execute('SELECT * FROM workouts WHERE id = ?', [workoutId]);
        if (existingWorkouts.length === 0) {
            return res.status(404).json({ error: 'Workout not found.' });
        }

        // 4️⃣ Delete workout from database
        const [deleteResult] = await db.execute('DELETE FROM workouts WHERE id = ?', [workoutId]);

        if (deleteResult.affectedRows === 0) {
            return res.status(400).json({ error: 'Failed to delete workout. No changes were made.' });
        }

        console.log("✅ Workout deleted successfully:", workoutId);
        res.json({ message: 'Workout deleted successfully.' });

    } catch (error) {
        console.error("❌ Error deleting workout:", error);

        // Handle specific database errors like in PUT function
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Cannot delete this workout because it is referenced elsewhere.' });
        }
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            return res.status(500).json({ error: 'Database access denied. Check credentials.' });
        }

        res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
    }
});

module.exports = router;
