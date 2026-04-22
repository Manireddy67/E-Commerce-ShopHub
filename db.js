// db.js — Safe MySQL connection with promise support
// Exports null if MySQL is unavailable (Render/live server without DB)

let pool = null;

try {
  const mysql = require('mysql2');

  const rawPool = mysql.createPool({
    host            : process.env.DB_HOST     || 'localhost',
    user            : process.env.DB_USER     || 'root',
    password        : process.env.DB_PASSWORD || '1422',
    database        : process.env.DB_NAME     || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit : 5,
    queueLimit      : 0,
    connectTimeout  : 5000
  });

  // Get promise-based pool
  pool = rawPool.promise();

  // Test connection silently
  pool.query('SELECT 1')
    .then(() => console.log('✅ Connected to MySQL database!'))
    .catch((err) => {
      console.log('⚠️  MySQL unavailable:', err.code, '— using file fallback');
      pool = null;
    });

} catch (e) {
  console.log('⚠️  MySQL error:', e.message, '— using file fallback');
  pool = null;
}

module.exports = pool;
