# MySQL Database Setup Guide

## Prerequisites

1. **Install MySQL**
   - Windows: Download from https://dev.mysql.com/downloads/installer/
   - Mac: `brew install mysql`
   - Linux: `sudo apt-get install mysql-server`

2. **Start MySQL Service**
   ```bash
   # Windows
   net start MySQL80
   
   # Mac
   brew services start mysql
   
   # Linux
   sudo service mysql start
   ```

## Database Setup Steps

### Step 1: Login to MySQL
```bash
mysql -u root -p
```
Enter your MySQL root password when prompted.

### Step 2: Create Database and Tables
Run the SQL script:
```bash
mysql -u root -p < database/schema.sql
```

Or manually in MySQL:
```sql
source database/schema.sql;
```

### Step 3: Verify Database
```sql
USE ecommerce_db;
SHOW TABLES;
SELECT * FROM products;
```

You should see:
- users
- products
- orders
- order_items
- cart

And 12 products in the products table.

## Configuration

### Step 1: Update Database Credentials
Edit `config/database.js`:
```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',           // Your MySQL username
  password: 'your_password',  // Your MySQL password
  database: 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- `mysql2` - MySQL client for Node.js
- `bcryptjs` - Password hashing
- `express` - Web framework
- `express-session` - Session management
- `ejs` - Template engine

### Step 3: Start the Server
```bash
# With MySQL database
npm run start:mysql

# Or for development with auto-reload
npm run dev:mysql
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  stock INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## Backend Features with MySQL

### 1. User Authentication
- Password hashing with bcrypt
- Secure login/registration
- Session-based authentication

### 2. Product Management
- Fetch all products from database
- Get product details by ID
- Category filtering

### 3. Shopping Cart
- Session-based cart storage
- Add/remove items
- Quantity management

### 4. Order Processing
- Create orders in database
- Store order items
- Calculate totals
- Order history tracking

## API Endpoints

### Products
- `GET /` - Home page with all products
- `GET /product/:id` - Product detail page

### Cart
- `GET /cart` - View shopping cart
- `POST /cart/add` - Add item to cart
- `POST /cart/remove` - Remove item from cart

### Authentication
- `GET /login` - Login page
- `POST /login` - Process login
- `GET /register` - Registration page
- `POST /register` - Process registration
- `GET /logout` - Logout user

### Checkout
- `POST /checkout` - Process order and save to database

## Testing the Database

### Check Products
```sql
SELECT * FROM products;
```

### Check Users
```sql
SELECT id, name, email, created_at FROM users;
```

### Check Orders
```sql
SELECT o.id, u.name, o.total_amount, o.status, o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id;
```

### Check Order Details
```sql
SELECT oi.*, p.name, p.price
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = 1;
```

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Make sure MySQL is running
```bash
# Check MySQL status
mysql --version
sudo service mysql status
```

### Authentication Error
```
Error: Access denied for user 'root'@'localhost'
```
**Solution:** Check your MySQL credentials in `config/database.js`

### Database Not Found
```
Error: Unknown database 'ecommerce_db'
```
**Solution:** Run the schema.sql file to create the database

## Security Best Practices

1. **Never commit passwords** - Use environment variables
2. **Hash passwords** - Already implemented with bcrypt
3. **Use prepared statements** - Prevents SQL injection (already implemented)
4. **Validate input** - Add validation middleware
5. **Use HTTPS** - In production
6. **Secure sessions** - Use secure cookies in production

## Production Deployment

1. Update `config/database.js` to use environment variables
2. Set strong session secret
3. Enable HTTPS
4. Use connection pooling (already implemented)
5. Add error logging
6. Set up database backups

## Useful MySQL Commands

```sql
-- Show all databases
SHOW DATABASES;

-- Use database
USE ecommerce_db;

-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE products;

-- Count records
SELECT COUNT(*) FROM products;

-- Delete all orders (for testing)
DELETE FROM order_items;
DELETE FROM orders;

-- Reset auto increment
ALTER TABLE orders AUTO_INCREMENT = 1;
```

## Next Steps

1. ✅ Database is set up
2. ✅ Products are loaded
3. ✅ User authentication works
4. ✅ Orders are saved to database
5. 🔄 Add admin panel (optional)
6. 🔄 Add order history page (optional)
7. 🔄 Add product search (optional)

Your e-commerce site is now fully connected to MySQL! 🎉
