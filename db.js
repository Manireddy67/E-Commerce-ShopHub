const mysql = require("mysql2");

// Use environment variables if available, otherwise use local defaults
const dbConfig = {
  host            : process.env.DB_HOST     || "localhost",
  user            : process.env.DB_USER     || "root",
  password        : process.env.DB_PASSWORD || "1422",
  database        : process.env.DB_NAME     || "ecommerce_db",
  waitForConnections: true,
  connectionLimit : 10,
  queueLimit      : 0
};

let pool = null;

try {
  pool = mysql.createPool(dbConfig);
  // Test connection silently
  pool.query("SELECT 1", (err) => {
    if (err) {
      console.log("⚠️  MySQL not available:", err.code);
      pool = null; // disable pool so fallback kicks in
    } else {
      console.log("✅ Connected to MySQL database!");
    }
  });
} catch (e) {
  console.log("⚠️  MySQL pool creation failed:", e.message);
  pool = null;
}

module.exports = pool;
