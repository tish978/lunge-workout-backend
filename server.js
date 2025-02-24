require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/admin/workouts', adminRoutes); // Admin workouts


app.use((req, res, next) => {
    console.log(`📡 Incoming request: ${req.method} ${req.url}`);
    console.log(`🔑 Headers:`, req.headers);
    console.log(`📦 Body:`, req.body);
    next();
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
