// db.js — Safe MySQL connection
// Returns null if MySQL is not available (live server without DB)
// Returns pool if MySQL is available (local development)

let pool = null;

try {
  const mysql = require('mysql2');

  pool = mysql.createPool({
    host            : process.env.DB_HOST     || 'localhost',
    user            : process.env.DB_USER     || 'root',
    password        : process.env.DB_PASSWORD || '1422',
    database        : process.env.DB_NAME     || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit : 5,
    queueLimit      : 0,
    connectTimeout  : 5000,   // 5 second timeout
    acquireTimeout  : 5000
  });

  // Test silently — don't crash if fails
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.log('⚠️  MySQL unavailable:', err.code, '— using file fallback');
      pool = null;
    } else {
      console.log('✅ Connected to MySQL database!');
    }
  });

} catch (e) {
  console.log('⚠️  mysql2 error:', e.message, '— using file fallback');
  pool = null;
}

module.exports = pool;
