const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ============ DATA HELPERS ============
const DATA_DIR = path.join(__dirname, 'data');

function readData(file) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeData(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function getNextId(file) {
  const counterPath = path.join(DATA_DIR, 'counter.json');
  let counters = {};
  try { counters = JSON.parse(fs.readFileSync(counterPath, 'utf8')); } catch (e) {}
  counters[file] = (counters[file] || 0) + 1;
  fs.writeFileSync(counterPath, JSON.stringify(counters, null, 2));
  return counters[file];
}

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

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect('/admin/login');
  next();
}

// ============ PRODUCTS DATA ============
const products = require('./data/products.js');

// ============ CUSTOMER ROUTES ============

// Home Page - with search & sort
app.get('/', (req, res) => {
  const { search, sort, category } = req.query;
  let filtered = [...products];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

  res.render('index', {
    user: req.session.user,
    products: filtered,
    search: search || '',
    sort: sort || '',
    category: category || 'all'
  });
});

// Product Detail
app.get('/product/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.redirect('/');
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  res.render('product', { user: req.session.user, product, related });
});

// Cart
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const cartItems = cart.map(item => {
    const p = products.find(p => p.id === item.id);
    return p ? { ...p, quantity: item.quantity } : null;
  }).filter(Boolean);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;
  res.render('cart', { user: req.session.user, cartItems, subtotal, shipping, total });
});

app.post('/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  const existing = req.session.cart.find(item => item.id === parseInt(productId));
  if (existing) {
    existing.quantity += parseInt(quantity) || 1;
  } else {
    req.session.cart.push({ id: parseInt(productId), quantity: parseInt(quantity) || 1 });
  }
  const cartCount = req.session.cart.reduce((sum, i) => sum + i.quantity, 0);
  res.json({ success: true, cartCount });
});

app.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
  }
  res.json({ success: true });
});

app.post('/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) return res.json({ success: false });
  const item = req.session.cart.find(i => i.id === parseInt(productId));
  if (item) {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      req.session.cart = req.session.cart.filter(i => i.id !== parseInt(productId));
    } else {
      item.quantity = qty;
    }
  }
  const cartItems = (req.session.cart || []).map(item => {
    const p = products.find(p => p.id === item.id);
    return p ? { ...p, quantity: item.quantity } : null;
  }).filter(Boolean);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 99;
  res.json({ success: true, subtotal, shipping, total: subtotal + shipping, cartCount: cartItems.reduce((s, i) => s + i.quantity, 0) });
});

// Auth
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { user: null, error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.render('login', { user: null, error: 'Email and password are required' });
  }
  const users = readData('users.json');
  const user = users.find(u => u.email === email.toLowerCase().trim());
  if (!user) {
    return res.render('login', { user: null, error: 'Invalid email or password' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('login', { user: null, error: 'Invalid email or password' });
  }
  req.session.user = { id: user.id, email: user.email, name: user.name };
  res.redirect('/');
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('register', { user: null, error: null });
});

app.post('/register', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password) {
    return res.render('register', { user: null, error: 'All fields are required' });
  }
  if (password.length < 6) {
    return res.render('register', { user: null, error: 'Password must be at least 6 characters' });
  }
  if (password !== confirmPassword) {
    return res.render('register', { user: null, error: 'Passwords do not match' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.render('register', { user: null, error: 'Invalid email address' });
  }
  const users = readData('users.json');
  if (users.find(u => u.email === email.toLowerCase().trim())) {
    return res.render('register', { user: null, error: 'Email already registered' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: getNextId('users'),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    registeredDate: new Date().toISOString()
  };
  users.push(newUser);
  writeData('users.json', users);
  req.session.user = { id: newUser.id, email: newUser.email, name: newUser.name };
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Checkout
app.get('/checkout', requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');
  const cartItems = cart.map(item => {
    const p = products.find(p => p.id === item.id);
    return p ? { ...p, quantity: item.quantity } : null;
  }).filter(Boolean);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;
  res.render('checkout', { user: req.session.user, cartItems, subtotal, shipping, tax, total });
});

app.post('/checkout', requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.json({ success: false, message: 'Cart is empty' });

  const { paymentMethod, shippingDetails } = req.body;
  const { firstName, lastName, email, phone, address, city, state, pincode, landmark } = shippingDetails || {};

  if (!firstName || !lastName || !phone || !address || !city || !state || !pincode) {
    return res.json({ success: false, message: 'Please fill all required shipping details' });
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    return res.json({ success: false, message: 'Invalid phone number' });
  }
  if (!/^[0-9]{6}$/.test(pincode)) {
    return res.json({ success: false, message: 'Invalid PIN code' });
  }

  const cartItems = cart.map(item => {
    const p = products.find(p => p.id === item.id);
    return p ? { id: p.id, name: p.name, price: p.price, image: p.image, quantity: item.quantity } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const orders = readData('orders.json');
  const newOrder = {
    id: getNextId('orders'),
    userId: req.session.user.id,
    customerName: `${firstName} ${lastName}`,
    email: email || req.session.user.email,
    phone,
    shippingAddress: { address, city, state, pincode, landmark: landmark || '' },
    orderItems: cartItems,
    subtotal,
    shipping,
    tax,
    total,
    paymentMethod: paymentMethod || 'cod',
    status: 'pending',
    date: new Date().toISOString()
  };

  orders.push(newOrder);
  writeData('orders.json', orders);
  req.session.cart = [];

  res.json({ success: true, message: 'Order placed successfully!', orderId: newOrder.id });
});

// Order Confirmation
app.get('/order-confirmation/:id', requireLogin, (req, res) => {
  const orders = readData('orders.json');
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order || order.userId !== req.session.user.id) return res.redirect('/');
  res.render('order-confirmation', { user: req.session.user, order });
});

// Order History
app.get('/my-orders', requireLogin, (req, res) => {
  const orders = readData('orders.json');
  const userOrders = orders.filter(o => o.userId === req.session.user.id).reverse();
  res.render('my-orders', { user: req.session.user, orders: userOrders });
});

// Cart count API
app.get('/cart/count', (req, res) => {
  const cart = req.session.cart || [];
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  res.json({ count });
});

// Search API (for live search)
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json([]);
  const results = products.filter(p =>
    p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  ).slice(0, 6).map(p => ({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category }));
  res.json(results);
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

app.get('/admin/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/admin/login');
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  const orders = readData('orders.json');
  const users = readData('users.json');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const stats = {
    totalOrders: orders.length,
    totalRevenue,
    totalCustomers: users.length,
    totalProducts: products.length,
    pendingOrders
  };
  const recentOrders = orders.slice(-5).reverse();
  res.render('admin-dashboard', { stats, recentOrders });
});

app.get('/admin/orders', requireAdmin, (req, res) => {
  const orders = readData('orders.json').reverse();
  res.render('admin-orders', { orders });
});

app.get('/admin/orders/:id', requireAdmin, (req, res) => {
  const orders = readData('orders.json');
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/admin/orders/update-status', requireAdmin, (req, res) => {
  const { orderId, status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.json({ success: false, message: 'Invalid status' });
  const orders = readData('orders.json');
  const order = orders.find(o => o.id === parseInt(orderId));
  if (!order) return res.json({ success: false, message: 'Order not found' });
  order.status = status;
  writeData('orders.json', orders);
  res.json({ success: true, message: 'Status updated' });
});

app.get('/admin/products', requireAdmin, (req, res) => {
  res.render('admin-products', { products });
});

app.get('/admin/products/:id', requireAdmin, (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/admin/products/add', requireAdmin, (req, res) => {
  const { name, price, category, description, image, stock } = req.body;
  if (!name || !price || !category || !description || !image) {
    return res.json({ success: false, message: 'All fields are required' });
  }
  const newId = Math.max(...products.map(p => p.id)) + 1;
  const newProduct = {
    id: newId,
    name: name.trim(),
    price: parseFloat(price),
    category,
    description: description.trim(),
    image: image.trim(),
    stock: parseInt(stock) || 100
  };
  products.push(newProduct);
  res.json({ success: true, message: 'Product added successfully', product: newProduct });
});

app.post('/admin/products/update', requireAdmin, (req, res) => {
  const { id, name, price, category, description, image, stock } = req.body;
  const idx = products.findIndex(p => p.id === parseInt(id));
  if (idx === -1) return res.json({ success: false, message: 'Product not found' });
  products[idx] = {
    ...products[idx],
    name: name.trim(),
    price: parseFloat(price),
    category,
    description: description.trim(),
    image: image.trim(),
    stock: parseInt(stock) || products[idx].stock
  };
  res.json({ success: true, message: 'Product updated successfully' });
});

app.post('/admin/products/delete', requireAdmin, (req, res) => {
  const { id } = req.body;
  const idx = products.findIndex(p => p.id === parseInt(id));
  if (idx === -1) return res.json({ success: false, message: 'Product not found' });
  products.splice(idx, 1);
  res.json({ success: true, message: 'Product deleted successfully' });
});

app.get('/admin/customers', requireAdmin, (req, res) => {
  const users = readData('users.json');
  const orders = readData('orders.json');
  const customers = users.map(u => {
    const userOrders = orders.filter(o => o.userId === u.id);
    return {
      ...u,
      totalOrders: userOrders.length,
      totalSpent: userOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  });
  res.render('admin-customers', { customers });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { user: req.session.user || null });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ShopHub running at http://localhost:${PORT}`);
  console.log(`🔑 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`   Username: admin | Password: admin123\n`);
});
