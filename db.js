const mysql = require("mysql2");

// ── Create connection pool ───────────────────────────────────
const pool = mysql.createPool({
  host            : "localhost",
  user            : "root",
  password        : "1422",
  database        : "ecommerce_db",
  waitForConnections: true,
  connectionLimit : 10,
  queueLimit      : 0
});

// ── Test connection on startup ───────────────────────────────
pool.query("SELECT 1", (err) => {
  if (err) {
    console.error("❌ DB Connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL database!");
  }
});

// ── Callback-style usage (as requested) ─────────────────────
//
//   const db = require("./db");
//
//   db.query("SELECT * FROM products", (err, result) => {
//     if (err) { console.log(err); }
//     else     { console.log(result); }
//   });
//
// ── Promise / async-await usage ─────────────────────────────
//
//   const db = require("./db");
//
//   const [rows] = await db.promise().query("SELECT * FROM products");
//   console.log(rows);
//

module.exports = pool;
