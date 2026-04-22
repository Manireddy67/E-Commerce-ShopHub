const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Load products from local file (always available) ─────────
let localProducts = [];
try {
  localProducts = require('./data/products.js');
  console.log(`📦 Local products loaded: ${localProducts.length}`);
} catch (e) {
  console.log('⚠️  data/products.js not found:', e.message);
}

// ── DB setup (optional — falls back gracefully) ───────────────
let db = null;
try {
  const pool = require('./db');
  if (pool) {
    db = pool;
    console.log('🗄️  MySQL pool created');
  }
} catch (e) {
  console.log('⚠️  MySQL not available, using file-based fallback');
}

// Safe DB query wrapper — returns null if DB unavailable
async function dbQuery(sql, params = []) {
  if (!db) return null;
  try {
    const [rows] = await db.promise().query(sql, params);
    return rows;
  } catch (e) {
    console.error('DB query error:', e.message);
    return null;
  }
}

// ── Helper: get products (DB or local fallback) ──────────────
async function getProducts(filters = {}) {
  const { search, sort, category } = filters;

  // Try DB first
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
  if (sort === 'price-asc')       sql += ' ORDER BY price ASC';
  else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
  else if (sort === 'name-asc')   sql += ' ORDER BY name ASC';
  else                            sql += ' ORDER BY id ASC';

  const dbRows = await dbQuery(sql, params);
  if (dbRows !== null) return dbRows;

  // Fallback to local products.js
  let result = [...localProducts];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }
  if (category && category !== 'all') {
    result = result.filter(p => p.category === category);
  }
  if (sort === 'price-asc')       result.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  else if (sort === 'name-asc')   result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

async function getProductById(id) {
  const rows = await dbQuery('SELECT * FROM products WHERE id = ?', [id]);
  if (rows && rows.length) return rows[0];
  return localProducts.find(p => p.id === parseInt(id)) || null;
}

// ── Data helpers (JSON file fallback for users/orders) ───────
const DATA_DIR = path.join(__dirname, 'data');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); }
  catch (e) { return []; }
}

function writeJSON(file, data) {
  try { fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2)); }
  catch (e) { console.error('writeJSON error:', e.message); }
}

function getNextId(key) {
  const counters = readJSON('counter.json') || {};
  counters[key] = (counters[key] || 0) + 1;
  writeJSON('counter.json', counters);
  return counters[key];
}

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'shophub-secret-key-2024',
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
    const products = await getProducts({ search, sort, category });
    res.render('index', {
      user: req.session.user,
      products,
      search: search || '',
      sort: sort || '',
      category: category || 'all'
    });
  } catch (err) {
    console.error(err);
    res.render('index', { user: req.session.user, products: localProducts, search: '', sort: '', category: 'all' });
  }
});

// Product Detail
app.get('/product/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.redirect('/');
    // Related products
    let related = [];
    if (dbAvailable && db) {
      try {
        const rows = await dbQuery('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4', [product.category, product.id]);
        related = rows;
      } catch (e) {}
    }
    if (!related.length) {
      related = localProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    }
    // Gallery images
    let gallery = [product.image];
    if (dbAvailable && db) {
      try {
        const galleryRows = await dbQuery('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]);
        if (galleryRows.length) gallery = [product.image, ...galleryRows.map(r => r.image_url)];
      } catch (e) {}
    }
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
      const _r_p = await dbQuery('SELECT * FROM products WHERE id = ?', [item.id]); const p = _r_p?.[0];
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
    const _r_p = await dbQuery('SELECT price FROM products WHERE id = ?', [ci.id]); const p = _r_p?.[0];
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
    const q = req.query.q || '';
    if (!q) return res.json([]);
    const results = await getProducts({ search: q });
    res.json(results.slice(0, 6).map(p => ({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category })));
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
    let user = null;
    if (dbAvailable && db) {
      const _ur = await dbQuery('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      user = row;
    } else {
      const users = readJSON('users.json');
      user = users.find(u => u.email === email.toLowerCase().trim());
    }
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
    const hashed = await bcrypt.hash(password, 10);
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    if (dbAvailable && db) {
      const _r_existing = await dbQuery('SELECT id FROM users WHERE email = ?', [cleanEmail]); const existing = _r_existing?.[0];
      if (existing) return res.render('register', { user: null, error: 'Email already registered' });
      const result = await dbQuery('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [cleanName, cleanEmail, hashed]);
      req.session.user = { id: result.insertId, email: cleanEmail, name: cleanName };
    } else {
      const users = readJSON('users.json');
      if (users.find(u => u.email === cleanEmail)) return res.render('register', { user: null, error: 'Email already registered' });
      const newUser = { id: getNextId('users'), name: cleanName, email: cleanEmail, password: hashed, created_at: new Date().toISOString() };
      users.push(newUser);
      writeJSON('users.json', users);
      req.session.user = { id: newUser.id, email: cleanEmail, name: cleanName };
    }
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
      const _r_p = await dbQuery('SELECT * FROM products WHERE id = ?', [item.id]); const p = _r_p?.[0];
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
      const _r_p = await dbQuery('SELECT * FROM products WHERE id = ?', [item.id]); const p = _r_p?.[0];
      if (p) cartItems.push({ ...p, quantity: item.quantity });
    }
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const orderResult = await dbQuery(
      `INSERT INTO orders (user_id, customer_name, email, phone, address, city, state, pincode, landmark, subtotal, shipping, tax, total_amount, payment_method, payment_ref, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.session.user.id, `${firstName} ${lastName}`, email || req.session.user.email,
       phone, address, city, state, pincode, landmark || '',
       subtotal, shipping, tax, total, paymentMethod || 'cod', paymentRef || null]
    );
    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await dbQuery(
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
    const _r_order = await dbQuery('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]); const order = _r_order?.[0];
    if (!order) return res.redirect('/');
    const orderItems = await dbQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

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
    const orders = await dbQuery('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
    for (const order of orders) {
      const items = await dbQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
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
    const _to = await dbQuery('SELECT COUNT(*) as totalOrders FROM orders'); const totalOrders = _to?.[0]?.totalOrders ?? 0;
    const _tr = await dbQuery('SELECT COALESCE(SUM(total_amount),0) as totalRevenue FROM orders'); const totalRevenue = _tr?.[0]?.totalRevenue ?? 0;
    const _tc = await dbQuery('SELECT COUNT(*) as totalCustomers FROM users'); const totalCustomers = _tc?.[0]?.totalCustomers ?? 0;
    const _tp = await dbQuery('SELECT COUNT(*) as totalProducts FROM products'); const totalProducts = _tp?.[0]?.totalProducts ?? 0;
    const _po = await dbQuery("SELECT COUNT(*) as pendingOrders FROM orders WHERE status='pending'"); const pendingOrders = _po?.[0]?.pendingOrders ?? 0;
    const recentOrders = await dbQuery('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    for (const o of recentOrders) {
      o.total = parseFloat(o.total_amount);
      o.customerName = o.customer_name;
      o.date = o.created_at;
      o.paymentMethod = o.payment_method;
      const _items = await dbQuery('SELECT COUNT(*) as items FROM order_items WHERE order_id = ?', [o.id]); const items = _items?.[0]?.items ?? 0;
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
    const rows = await dbQuery('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = [];
    for (const o of rows) {
      const _items = await dbQuery('SELECT COUNT(*) as items FROM order_items WHERE order_id = ?', [o.id]); const items = _items?.[0]?.items ?? 0;
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
    const _r_order = await dbQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]); const order = _r_order?.[0];
    if (!order) return res.status(404).json({ error: 'Not found' });
    const orderItems = await dbQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
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
    await dbQuery('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) { res.json({ success: false, message: 'Update failed' }); }
});

app.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await dbQuery('SELECT * FROM products ORDER BY id');
    res.render('admin-products', { products });
  } catch (err) { res.render('admin-products', { products: [] }); }
});

app.get('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const _r_product = await dbQuery('SELECT * FROM products WHERE id = ?', [req.params.id]); const product = _r_product?.[0];
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/admin/products/add', requireAdmin, async (req, res) => {
  const { name, price, category, description, image, stock } = req.body;
  if (!name || !price || !category || !description || !image)
    return res.json({ success: false, message: 'All fields are required' });
  try {
    await dbQuery('INSERT INTO products (name, price, category, description, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), parseFloat(price), category, description.trim(), image.trim(), parseInt(stock) || 100]);
    res.json({ success: true, message: 'Product added successfully' });
  } catch (err) { res.json({ success: false, message: 'Failed to add product' }); }
});

app.post('/admin/products/update', requireAdmin, async (req, res) => {
  const { id, name, price, category, description, image, stock } = req.body;
  try {
    await dbQuery('UPDATE products SET name=?, price=?, category=?, description=?, image=?, stock=? WHERE id=?',
      [name.trim(), parseFloat(price), category, description.trim(), image.trim(), parseInt(stock) || 100, id]);
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) { res.json({ success: false, message: 'Failed to update product' }); }
});

app.post('/admin/products/delete', requireAdmin, async (req, res) => {
  try {
    await dbQuery('DELETE FROM products WHERE id = ?', [req.body.id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) { res.json({ success: false, message: 'Failed to delete product' }); }
});

// Delete user
app.post('/admin/customers/delete', requireAdmin, async (req, res) => {
  const { id } = req.body;
  try {
    await dbQuery('DELETE FROM orders WHERE user_id = ?', [id]);
    await dbQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.json({ success: false, message: 'Failed to delete user' });
  }
});

app.get('/admin/customers', requireAdmin, async (req, res) => {
  try {
    const users = await dbQuery('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    const customers = [];
    for (const u of users) {
      const _uo = await dbQuery('SELECT COUNT(*) as totalOrders FROM orders WHERE user_id = ?', [u.id]); const totalOrders = _uo?.[0]?.totalOrders ?? 0;
      const _us = await dbQuery('SELECT COALESCE(SUM(total_amount),0) as totalSpent FROM orders WHERE user_id = ?', [u.id]); const totalSpent = _us?.[0]?.totalSpent ?? 0;
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
