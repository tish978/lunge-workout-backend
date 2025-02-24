const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const upload = require('../config/s3');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Fetch workouts for the logged-in user
router.get('/', authenticate, async (req, res) => {
    try {
        console.log("📡 Incoming request: GET /api/workouts for user:", req.user);

        // 1️⃣ Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Unauthorized: Please log in' });
        }

        const userId = req.user.id;

        const sql = `
            SELECT id, user_id, workout_type, duration, calories_burned, image_url
            FROM workouts
            WHERE user_id = ?;
        `;

        console.log("📝 SQL Query:", sql);
        console.log("🔢 Query Parameters:", [userId]);

        // 2️⃣ Execute query & return results
        const [workouts] = await db.execute(sql, [userId]);

        if (workouts.length === 0) {
            return res.status(404).json({ error: 'No workouts found for this user' });
        }

        console.log("📊 API Response:", workouts);
        res.json(workouts);

    } catch (error) {
        console.error("❌ Error fetching workouts:", error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Log a new workout (with optional image)
router.post('/', authenticate, upload.single('workoutImage'), async (req, res) => {
    try {
        console.log("📡 Incoming request: POST /api/workouts");

        const { workout_type, duration, calories_burned } = req.body;
        const image_url = req.file ? req.file.location : null;
        const userId = req.user.id;

        // 1️⃣ Validate input fields
        if (!workout_type || typeof workout_type !== 'string' || workout_type.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid workout_type. Must be a non-empty string.' });
        }
        if (!duration || isNaN(duration) || duration <= 0) {
            return res.status(400).json({ error: 'Invalid duration. Must be a positive number.' });
        }
        if (!calories_burned || isNaN(calories_burned) || calories_burned <= 0) {
            return res.status(400).json({ error: 'Invalid calories_burned. Must be a positive number.' });
        }

        // 2️⃣ Insert workout into database
        await db.execute(
            'INSERT INTO workouts (user_id, workout_type, duration, calories_burned, image_url) VALUES (?, ?, ?, ?, ?)',
            [userId, workout_type.trim(), duration, calories_burned, image_url]
        );

        res.status(201).json({ message: 'Workout logged successfully', image_url });

    } catch (error) {
        console.error("❌ Error logging workout:", error);
        res.status(500).json({ error: 'Failed to log workout' });
    }
});

// Update a workout (with optional image)
router.put('/:id', authenticate, upload.single('workoutImage'), async (req, res) => {
    try {
        console.log("📡 Incoming request: PUT /api/workouts/:id");

        const workoutId = parseInt(req.params.id, 10);
        if (isNaN(workoutId) || workoutId <= 0) {
            return res.status(400).json({ error: 'Invalid workout ID. Must be a positive integer.' });
        }

        const { workout_type, duration, calories_burned } = req.body;
        let image_url = req.file ? req.file.location : null;
        const userId = req.user.id;

        // 1️⃣ Validate input fields
        if (!workout_type || typeof workout_type !== 'string' || workout_type.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid workout_type. Must be a non-empty string.' });
        }
        if (!duration || isNaN(duration) || duration <= 0) {
            return res.status(400).json({ error: 'Invalid duration. Must be a positive number.' });
        }
        if (!calories_burned || isNaN(calories_burned) || calories_burned <= 0) {
            return res.status(400).json({ error: 'Invalid calories_burned. Must be a positive number.' });
        }

        // 2️⃣ Check if the workout exists and belongs to the user
        const [existingWorkouts] = await db.execute(
            'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        if (existingWorkouts.length === 0) {
            return res.status(404).json({ error: 'Workout not found or does not belong to this user.' });
        }

        const existingWorkout = existingWorkouts[0];

        // Keep old image if no new one is uploaded
        if (!image_url) {
            image_url = existingWorkout.image_url;
        }

        // 3️⃣ Update workout
        await db.execute(
            'UPDATE workouts SET workout_type = ?, duration = ?, calories_burned = ?, image_url = ? WHERE id = ? AND user_id = ?',
            [workout_type.trim(), duration, calories_burned, image_url, workoutId, userId]
        );

        res.json({ message: 'Workout updated successfully', image_url });

    } catch (error) {
        console.error('❌ Error updating workout:', error);
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

// Delete a workout
router.delete('/:id', authenticate, async (req, res) => {
    try {
        console.log("📡 Incoming request: DELETE /api/workouts/:id");

        const workoutId = parseInt(req.params.id, 10);
        if (isNaN(workoutId) || workoutId <= 0) {
            return res.status(400).json({ error: 'Invalid workout ID. Must be a positive integer.' });
        }

        const userId = req.user.id;

        // 1️⃣ Ensure workout exists and belongs to user
        const [existingWorkouts] = await db.execute(
            'SELECT * FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        if (existingWorkouts.length === 0) {
            return res.status(404).json({ error: 'Workout not found or does not belong to this user.' });
        }

        // 2️⃣ Delete workout
        await db.execute('DELETE FROM workouts WHERE id = ? AND user_id = ?', [workoutId, userId]);

        console.log("✅ Workout deleted successfully:", workoutId);
        res.json({ message: 'Workout deleted successfully' });

    } catch (error) {
        console.error("❌ Error deleting workout:", error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

module.exports = router;