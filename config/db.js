const mysql = require('mysql2/promise');
require('dotenv').config();

const MAX_RETRIES = 5; // Number of retries if the DB connection fails
const RETRY_DELAY = 5000; // Time to wait (ms) before retrying

// ✅ Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ✅ Function to test database connection with retries
const testDBConnection = async (retries = 0) => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database');
        connection.release();
    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);

        if (retries < MAX_RETRIES) {
            console.log(`🔁 Retrying in ${RETRY_DELAY / 1000} seconds... (${retries + 1}/${MAX_RETRIES})`);
            setTimeout(() => testDBConnection(retries + 1), RETRY_DELAY);
        } else {
            console.error('🚨 Max retries reached. Exiting process.');
            process.exit(1);
        }
    }
};

// ✅ Test the connection at startup
testDBConnection();

module.exports = pool;
