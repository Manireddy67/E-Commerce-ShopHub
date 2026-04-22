const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./db');   // MySQL connection pool

// ── Test: callback-style query ───────────────────────────────
db.query("SELECT * FROM products LIMIT 3", (err, result) => {
  if (err) {
    console.log("Query error:", err);
  } else {
    console.log(`📦 Sample products loaded: ${result.length} rows`);
  }
});

const app = express();
const PORT = 3000;

// ============ MIDDLEWARE ============
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'shophub-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect('/admin/login');
  next();
}

// ============ CUSTOMER ROUTES ============

// Home - search, sort, category filter
app.get('/', async (req, res) => {
  try {
    const { search, sort, category } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    if (search) {
      sql += ' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (sort === 'price-asc')  sql += ' ORDER BY price ASC';
    else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
    else if (sort === 'name-asc')   sql += ' ORDER BY name ASC';
    else sql += ' ORDER BY id ASC';

    const [products] = await db.promise().query(sql, params);
    res.render('index', {
      user: req.session.user,
      products,
      search: search || '',
      sort: sort || '',
      category: category || 'all'
    });
  } catch (err) {
    console.error(err);
    res.render('index', { user: req.session.user, products: [], search: '', sort: '', category: 'all' });
  }
});

// Product Detail
app.get('/product/:id', async (req, res) => {
  try {
    const [[product]] = await db.promise().query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.redirect('/');
    const [related] = await db.promise().query('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4', [product.category, product.id]);
    const [galleryRows] = await db.promise().query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]);
    // Build full gallery: main image first, then extras
    const gallery = [product.image, ...galleryRows.map(r => r.image_url)];
    res.render('product', { user: req.session.user, product, related, gallery });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Cart
app.get('/cart', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const cartItems = [];
    for (const item of cart) {
      const [[p]] = await db.promise().query('SELECT * FROM products WHERE id = ?', [item.id]);
      if (p) cartItems.push({ ...p, quantity: item.quantity });
    }
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    res.render('cart', { user: req.session.user, cartItems, subtotal, shipping, total: subtotal + shipping });
  } catch (err) {
    console.error(err);
    res.render('cart', { user: req.session.user, cartItems: [], subtotal: 0, shipping: 0, total: 0 });
  }
});

app.post('/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const existing = req.session.cart.find(i => i.id === parseInt(productId));
  if (existing) existing.quantity += parseInt(quantity) || 1;
  else req.session.cart.push({ id: parseInt(productId), quantity: parseInt(quantity) || 1 });
  const cartCount = req.session.cart.reduce((s, i) => s + i.quantity, 0);
  res.json({ success: true, cartCount });
});

app.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) req.session.cart = req.session.cart.filter(i => i.id !== parseInt(productId));
  res.json({ success: true });
});

app.post('/cart/update', async (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) return res.json({ success: false });
  const item = req.session.cart.find(i => i.id === parseInt(productId));
  if (item) {
    const qty = parseInt(quantity);
    if (qty <= 0) req.session.cart = req.session.cart.filter(i => i.id !== parseInt(productId));
    else item.quantity = qty;
  }
  const cart = req.session.cart || [];
  let subtotal = 0;
  for (const ci of cart) {
    const [[p]] = await db.promise().query('SELECT price FROM products WHERE id = ?', [ci.id]);
    if (p) subtotal += p.price * ci.quantity;
  }
  const shipping = subtotal > 999 ? 0 : 99;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  res.json({ success: true, subtotal, shipping, total: subtotal + shipping, cartCount });
});

app.get('/cart/count', (req, res) => {
  const cart = req.session.cart || [];
  res.json({ count: cart.reduce((s, i) => s + i.quantity, 0) });
});

// Live Search API
app.get('/api/search', async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    if (!req.query.q) return res.json([]);
    const [results] = await db.promise().query(
      'SELECT id, name, price, image, category FROM products WHERE name LIKE ? OR category LIKE ? LIMIT 6',
      [q, q]
    );
    res.json(results);
  } catch (err) { res.json([]); }
});

// Auth
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { user: null, error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('login', { user: null, error: 'Email and password are required' });
  try {
    const [[user]] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) return res.render('login', { user: null, error: 'Invalid email or password' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { user: null, error: 'Invalid email or password' });
    req.session.user = { id: user.id, email: user.email, name: user.name };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { user: null, error: 'Something went wrong. Try again.' });
  }
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { user: null, error: null });
});

app.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password) return res.render('register', { user: null, error: 'All fields are required' });
  if (password.length < 6) return res.render('register', { user: null, error: 'Password must be at least 6 characters' });
  if (password !== confirmPassword) return res.render('register', { user: null, error: 'Passwords do not match' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.render('register', { user: null, error: 'Invalid email address' });
  try {
    const [[existing]] = await db.promise().query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.render('register', { user: null, error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashed]
    );
    req.session.user = { id: result.insertId, email: email.toLowerCase().trim(), name: name.trim() };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('register', { user: null, error: 'Registration failed. Try again.' });
  }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

// Checkout
app.get('/checkout', requireLogin, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) return res.redirect('/cart');
    const cartItems = [];
    for (const item of cart) {
      const [[p]] = await db.promise().query('SELECT * FROM products WHERE id = ?', [item.id]);
      if (p) cartItems.push({ ...p, quantity: item.quantity });
    }
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    res.render('checkout', { user: req.session.user, cartItems, subtotal, shipping, tax, total: subtotal + shipping + tax });
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
});

app.post('/checkout', requireLogin, async (req, res) => {
  const cart = req.session.cart || [];
  if (!cart.length) return res.json({ success: false, message: 'Cart is empty' });
  const { paymentMethod, paymentRef, shippingDetails } = req.body;
  const { firstName, lastName, email, phone, address, city, state, pincode, landmark } = shippingDetails || {};
  if (!firstName || !lastName || !phone || !address || !city || !state || !pincode)
    return res.json({ success: false, message: 'Please fill all required shipping details' });
  if (!/^[0-9]{10}$/.test(phone)) return res.json({ success: false, message: 'Invalid phone number' });
  if (!/^[0-9]{6}$/.test(pincode)) return res.json({ success: false, message: 'Invalid PIN code' });
  try {
    const cartItems = [];
    for (const item of cart) {
      const [[p]] = await db.promise().query('SELECT * FROM products WHERE id = ?', [item.id]);
      if (p) cartItems.push({ ...p, quantity: item.quantity });
    }
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const [orderResult] = await db.promise().query(
      `INSERT INTO orders (user_id, customer_name, email, phone, address, city, state, pincode, landmark, subtotal, shipping, tax, total_amount, payment_method, payment_ref, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.session.user.id, `${firstName} ${lastName}`, email || req.session.user.email,
       phone, address, city, state, pincode, landmark || '',
       subtotal, shipping, tax, total, paymentMethod || 'cod', paymentRef || null]
    );
    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await db.promise().query(
        'INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.image, item.price, item.quantity]
      );
    }
    req.session.cart = [];
    res.json({ success: true, message: 'Order placed!', orderId });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Order failed. Please try again.' });
  }
});

// Order Confirmation
app.get('/order-confirmation/:id', requireLogin, async (req, res) => {
  try {
    const [[order]] = await db.promise().query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
    if (!order) return res.redirect('/');
    const [orderItems] = await db.promise().query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    // Map DB snake_case → camelCase for the view
    order.orderItems      = orderItems;
    order.customerName    = order.customer_name;
    order.paymentMethod   = order.payment_method  || 'cod';
    order.paymentRef      = order.payment_ref      || null;
    order.total           = parseFloat(order.total_amount);
    order.subtotal        = parseFloat(order.subtotal)  || order.total;
    order.shipping        = parseFloat(order.shipping)  || 0;
    order.tax             = parseFloat(order.tax)       || 0;
    order.date            = order.created_at;
    order.shippingAddress = {
      address  : order.address,
      city     : order.city,
      state    : order.state,
      pincode  : order.pincode,
      landmark : order.landmark || ''
    };

    res.render('order-confirmation', { user: req.session.user, order });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// My Orders
app.get('/my-orders', requireLogin, async (req, res) => {
  try {
    const [orders] = await db.promise().query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
    for (const order of orders) {
      const [items] = await db.promise().query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.orderItems      = items;
      order.total           = parseFloat(order.total_amount);
      order.paymentMethod   = order.payment_method || 'cod';
      order.shippingAddress = { city: order.city, state: order.state };
      order.date            = order.created_at;
    }
    res.render('my-orders', { user: req.session.user, orders });
  } catch (err) {
    console.error(err);
    res.render('my-orders', { user: req.session.user, orders: [] });
  }
});

// ============ ADMIN ROUTES ============
app.get('/admin', (req, res) => res.redirect('/admin/login'));

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin/dashboard');
  res.render('admin-login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.admin = { username: 'admin' };
    return res.redirect('/admin/dashboard');
  }
  res.render('admin-login', { error: 'Invalid admin credentials' });
});

app.get('/admin/logout', (req, res) => { req.session.admin = null; res.redirect('/admin/login'); });

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [[{ totalOrders }]]  = await db.promise().query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalRevenue }]] = await db.promise().query('SELECT COALESCE(SUM(total_amount),0) as totalRevenue FROM orders');
    const [[{ totalCustomers }]] = await db.promise().query('SELECT COUNT(*) as totalCustomers FROM users');
    const [[{ totalProducts }]]  = await db.promise().query('SELECT COUNT(*) as totalProducts FROM products');
    const [[{ pendingOrders }]]  = await db.promise().query("SELECT COUNT(*) as pendingOrders FROM orders WHERE status='pending'");
    const [recentOrders] = await db.promise().query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    for (const o of recentOrders) {
      o.total = parseFloat(o.total_amount);
      o.customerName = o.customer_name;
      o.date = o.created_at;
      o.paymentMethod = o.payment_method;
      const [[{ items }]] = await db.promise().query('SELECT COUNT(*) as items FROM order_items WHERE order_id = ?', [o.id]);
      o.items = items;
    }
    res.render('admin-dashboard', {
      stats: { totalOrders, totalRevenue: parseFloat(totalRevenue), totalCustomers, totalProducts, pendingOrders },
      recentOrders
    });
  } catch (err) {
    console.error(err);
    res.render('admin-dashboard', { stats: { totalOrders:0, totalRevenue:0, totalCustomers:0, totalProducts:0, pendingOrders:0 }, recentOrders: [] });
  }
});

app.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = [];
    for (const o of rows) {
      const [[{ items }]] = await db.promise().query('SELECT COUNT(*) as items FROM order_items WHERE order_id = ?', [o.id]);
      orders.push({
        ...o,
        total         : parseFloat(o.total_amount),
        customerName  : o.customer_name,
        date          : o.created_at,
        paymentMethod : o.payment_method || 'cod',
        items
      });
    }
    res.render('admin-orders', { orders });
  } catch (err) {
    console.error(err);
    res.render('admin-orders', { orders: [] });
  }
});

app.get('/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const [[order]] = await db.promise().query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    const [orderItems] = await db.promise().query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    res.json({ ...order, orderItems, total: parseFloat(order.total_amount), customerName: order.customer_name,
      shippingAddress: { address: order.address, city: order.city, state: order.state, pincode: order.pincode, landmark: order.landmark },
      paymentMethod: order.payment_method, subtotal: parseFloat(order.subtotal), tax: parseFloat(order.tax) });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/admin/orders/update-status', requireAdmin, async (req, res) => {
  const { orderId, status } = req.body;
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (!valid.includes(status)) return res.json({ success: false, message: 'Invalid status' });
  try {
    await db.promise().query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) { res.json({ success: false, message: 'Update failed' }); }
});

app.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const [products] = await db.promise().query('SELECT * FROM products ORDER BY id');
    res.render('admin-products', { products });
  } catch (err) { res.render('admin-products', { products: [] }); }
});

app.get('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const [[product]] = await db.promise().query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/admin/products/add', requireAdmin, async (req, res) => {
  const { name, price, category, description, image, stock } = req.body;
  if (!name || !price || !category || !description || !image)
    return res.json({ success: false, message: 'All fields are required' });
  try {
    await db.promise().query('INSERT INTO products (name, price, category, description, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), parseFloat(price), category, description.trim(), image.trim(), parseInt(stock) || 100]);
    res.json({ success: true, message: 'Product added successfully' });
  } catch (err) { res.json({ success: false, message: 'Failed to add product' }); }
});

app.post('/admin/products/update', requireAdmin, async (req, res) => {
  const { id, name, price, category, description, image, stock } = req.body;
  try {
    await db.promise().query('UPDATE products SET name=?, price=?, category=?, description=?, image=?, stock=? WHERE id=?',
      [name.trim(), parseFloat(price), category, description.trim(), image.trim(), parseInt(stock) || 100, id]);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) { res.json({ success: false, message: 'Failed to update product' }); }
});

app.post('/admin/products/delete', requireAdmin, async (req, res) => {
  try {
    await db.promise().query('DELETE FROM products WHERE id = ?', [req.body.id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) { res.json({ success: false, message: 'Failed to delete product' }); }
});

// Delete user
app.post('/admin/customers/delete', requireAdmin, async (req, res) => {
  const { id } = req.body;
  try {
    await db.promise().query('DELETE FROM orders WHERE user_id = ?', [id]);
    await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.json({ success: false, message: 'Failed to delete user' });
  }
});

app.get('/admin/customers', requireAdmin, async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    const customers = [];
    for (const u of users) {
      const [[{ totalOrders }]] = await db.promise().query('SELECT COUNT(*) as totalOrders FROM orders WHERE user_id = ?', [u.id]);
      const [[{ totalSpent }]]  = await db.promise().query('SELECT COALESCE(SUM(total_amount),0) as totalSpent FROM orders WHERE user_id = ?', [u.id]);
      customers.push({ ...u, totalOrders, totalSpent: parseFloat(totalSpent), registeredDate: u.created_at });
    }
    res.render('admin-customers', { customers });
  } catch (err) {
    console.error(err);
    res.render('admin-customers', { customers: [] });
  }
});

// 404
app.use((req, res) => res.status(404).render('404', { user: req.session.user || null }));

app.listen(PORT, () => {
  console.log(`\n🚀 ShopHub running at http://localhost:${PORT}`);
  console.log(`🗄️  Database: MySQL (ecommerce_db)`);
  console.log(`🔑 Admin: http://localhost:${PORT}/admin  (admin / admin123)\n`);
});
