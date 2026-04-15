const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'ecommerce-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// ============ ROUTES ============

// Home Page - Get all products
app.get('/', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY id');
    res.render('index', { user: req.session.user, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.render('index', { user: req.session.user, products: [] });
  }
});

// Product Detail Page
app.get('/product/:id', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length > 0) {
      res.render('product', { user: req.session.user, product: products[0] });
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.redirect('/');
  }
});

// Shopping Cart Page
app.get('/cart', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const cartItems = [];
    
    for (const item of cart) {
      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [item.id]);
      if (products.length > 0) {
        cartItems.push({
          ...products[0],
          quantity: item.quantity
        });
      }
    }
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.render('cart', { user: req.session.user, cartItems, total });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.render('cart', { user: req.session.user, cartItems: [], total: 0 });
  }
});

// Add to Cart
app.post('/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  
  const existingItem = req.session.cart.find(item => item.id === parseInt(productId));
  if (existingItem) {
    existingItem.quantity += parseInt(quantity) || 1;
  } else {
    req.session.cart.push({ id: parseInt(productId), quantity: parseInt(quantity) || 1 });
  }
  
  res.json({ success: true, cartCount: req.session.cart.length });
});

// Remove from Cart
app.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
  }
  res.json({ success: true });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

// Login POST
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length > 0) {
      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (isMatch) {
        req.session.user = { id: user.id, email: user.email, name: user.name };
        res.redirect('/');
      } else {
        res.render('login', { user: null, error: 'Invalid credentials' });
      }
    } else {
      res.render('login', { user: null, error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { user: null, error: 'An error occurred' });
  }
});

// Register Page
app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user, error: null });
});

// Register POST
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.render('register', { user: null, error: 'Email already exists' });
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    req.session.user = { id: result.insertId, email, name };
    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { user: null, error: 'An error occurred' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Checkout
app.post('/checkout', async (req, res) => {
  try {
    if (!req.session.user) {
      res.json({ success: false, message: 'Please login first' });
      return;
    }
    
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      res.json({ success: false, message: 'Cart is empty' });
      return;
    }
    
    // Calculate total
    let total = 0;
    for (const item of cart) {
      const [products] = await db.query('SELECT price FROM products WHERE id = ?', [item.id]);
      if (products.length > 0) {
        total += products[0].price * item.quantity;
      }
    }
    
    // Create order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [req.session.user.id, total, 'completed']
    );
    
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of cart) {
      const [products] = await db.query('SELECT price FROM products WHERE id = ?', [item.id]);
      if (products.length > 0) {
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.id, item.quantity, products[0].price]
        );
      }
    }
    
    // Clear cart
    req.session.cart = [];
    res.json({ success: true, message: 'Order placed successfully!' });
  } catch (error) {
    console.error('Checkout error:', error);
    res.json({ success: false, message: 'An error occurred during checkout' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure MySQL is running and database is set up!');
});
