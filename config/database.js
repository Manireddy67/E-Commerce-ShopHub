const mysql = require('mysql2');

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1422',
  database: 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();
  async function testConnection() {
  try {
    // This will work only with `promisePool`, not `pool`
    const [rows] = await promisePool.query('SELECT 1');
    console.log('Database connection successful:', rows);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

testConnection();


module.exports = promisePool;
