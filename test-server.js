// Simple test server to verify everything works
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const COUNTER_FILE = path.join(DATA_DIR, 'counter.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Helper functions for data persistence
function loadData(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err);
  }
  return defaultValue;
}

function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Load data from files
let users = loadData(USERS_FILE, []);
let orders = loadData(ORDERS_FILE, []);
let products = loadData(PRODUCTS_FILE, []);
let counterData = loadData(COUNTER_FILE, { orderIdCounter: 1 });
let orderIdCounter = counterData.orderIdCounter;

// Admin credentials (in production, use proper authentication)
const adminCredentials = {
  username: 'admin',
  password: 'admin123'
};

// If products file is empty, initialize with default products
if (products.length === 0) {
  products = [
  { id: 1, name: 'Wireless Headphones', price: 32999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', category: 'Electronics', description: 'Premium wireless headphones with noise cancellation' },
  { id: 2, name: 'Smart Watch', price: 35499, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80', category: 'Electronics', description: 'Advanced fitness tracking smartwatch' },
  { id: 3, name: 'Running Shoes', price: 10799, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', category: 'Sports', description: 'Comfortable running shoes for training' },
  { id: 4, name: 'Tennis Racket', price: 15699, image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80', category: 'Sports', description: 'Professional tennis racket' },
  { id: 5, name: 'Football', price: 2899, image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80', category: 'Sports', description: 'Official size football' },
  { id: 6, name: '4K Smart TV', price: 57999, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80', category: 'Electronics', description: '55 inch 4K Smart TV' },
  { id: 7, name: 'Camera', price: 206999, image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', category: 'Electronics', description: 'Professional mirrorless camera' },
  { id: 8, name: 'Yoga Mat', price: 4149, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80', category: 'Sports', description: 'Premium yoga mat' },
  { id: 9, name: 'Gaming Laptop', price: 148999, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80', category: 'Electronics', description: 'High-performance gaming laptop' },
  { id: 10, name: 'Dumbbell Set', price: 7449, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', category: 'Sports', description: 'Adjustable dumbbell set' },
  { id: 11, name: 'Earbuds', price: 12399, image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80', category: 'Electronics', description: 'Wireless earbuds with ANC' },
  { id: 12, name: 'Basketball', price: 3719, image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80', category: 'Sports', description: 'Official size basketball' }
  ];
  saveData(PRODUCTS_FILE, products);
}

console.log('📊 Data loaded:');
console.log(`  - Users: ${users.length}`);
console.log(`  - Orders: ${orders.length}`);
console.log(`  - Products: ${products.length}`);

// Routes
app.get('/', (req, res) => {
  console.log('Home page accessed');
  res.render('index', { user: req.session.user, products });
});

app.get('/product/:id', (req, res) => {
  console.log('Product page accessed:', req.params.id);
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.render('product', { user: req.session.user, product });
  } else {
    res.redirect('/');
  }
});

app.get('/cart', (req, res) => {
  console.log('Cart page accessed');
  const cart = req.session.cart || [];
  const cartItems = cart.map(item => ({
    ...products.find(p => p.id === item.id),
    quantity: item.quantity
  }));
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('cart', { user: req.session.user, cartItems, total });
});

app.post('/cart/add', (req, res) => {
  console.log('Adding to cart:', req.body);
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  
  const existingItem = req.session.cart.find(item => item.id === parseInt(productId));
  if (existingItem) {
    existingItem.quantity += parseInt(quantity) || 1;
  } else {
    req.session.cart.push({ id: parseInt(productId), quantity: parseInt(quantity) || 1 });
  }
  
  console.log('Cart updated:', req.session.cart);
  res.json({ success: true, cartCount: req.session.cart.length });
});

app.post('/cart/remove', (req, res) => {
  console.log('Removing from cart:', req.body);
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(productId));
  }
  res.json({ success: true });
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

app.post('/login', (req, res) => {
  console.log('Login attempt:', req.body.email);
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    req.session.user = { email: user.email, name: user.name };
    console.log('Login successful');
    res.redirect('/');
  } else {
    console.log('Login failed');
    res.render('login', { user: null, error: 'Invalid credentials' });
  }
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user, error: null });
});

app.post('/register', (req, res) => {
  console.log('Registration attempt:', req.body.email);
  const { name, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    res.render('register', { user: null, error: 'Email already exists' });
    return;
  }
  
  users.push({ 
    name, 
    email, 
    password,
    registeredDate: new Date().toISOString()
  });
  saveData(USERS_FILE, users);
  req.session.user = { email, name };
  console.log('Registration successful');
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/checkout', (req, res) => {
  console.log('Checkout page accessed');
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    res.redirect('/cart');
    return;
  }
  
  const cartItems = cart.map(item => ({
    ...products.find(p => p.id === item.id),
    quantity: item.quantity
  }));
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.render('checkout', { user: req.session.user, cartItems, total });
});

app.post('/checkout', (req, res) => {
  console.log('Checkout attempt');
  if (!req.session.user) {
    res.json({ success: false, message: 'Please login first' });
    return;
  }
  
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    res.json({ success: false, message: 'Cart is empty' });
    return;
  }
  
  // Reload orders and counter to get latest
  orders = loadData(ORDERS_FILE, []);
  counterData = loadData(COUNTER_FILE, { orderIdCounter: 1 });
  orderIdCounter = counterData.orderIdCounter;
  
  // Calculate order details
  const cartItems = cart.map(item => ({
    ...products.find(p => p.id === item.id),
    quantity: item.quantity
  }));
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;
  
  // Create order
  const order = {
    id: orderIdCounter++,
    customerName: req.body.shippingDetails.firstName + ' ' + req.body.shippingDetails.lastName,
    email: req.body.shippingDetails.email,
    phone: req.body.shippingDetails.phone,
    shippingAddress: {
      address: req.body.shippingDetails.address,
      city: req.body.shippingDetails.city,
      state: req.body.shippingDetails.state,
      pincode: req.body.shippingDetails.pincode,
      landmark: req.body.shippingDetails.landmark
    },
    orderItems: cartItems,
    items: cartItems.length,
    subtotal: subtotal,
    tax: tax,
    total: total,
    paymentMethod: req.body.paymentMethod,
    status: 'pending',
    date: new Date().toISOString()
  };
  
  orders.push(order);
  saveData(ORDERS_FILE, orders);
  
  counterData.orderIdCounter = orderIdCounter;
  saveData(COUNTER_FILE, counterData);
  
  req.session.cart = [];
  
  console.log('Order placed:', order.id);
  res.json({ success: true, message: 'Order placed successfully!' });
});

// Admin Routes
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

app.get('/admin/login', (req, res) => {
  if (req.session.admin) {
    res.redirect('/admin/dashboard');
    return;
  }
  res.render('admin-login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === adminCredentials.username && password === adminCredentials.password) {
    req.session.admin = { username };
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin-login', { error: 'Invalid credentials' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/admin/login');
});

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    res.redirect('/admin/login');
    return;
  }
  next();
}

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  // Reload data from files to get latest
  const currentOrders = loadData(ORDERS_FILE, []);
  const currentUsers = loadData(USERS_FILE, []);
  
  const stats = {
    totalOrders: currentOrders.length,
    totalRevenue: currentOrders.reduce((sum, order) => sum + order.total, 0),
    totalCustomers: currentUsers.length,
    totalProducts: products.length
  };
  
  const recentOrders = currentOrders.slice(-5).reverse();
  
  res.render('admin-dashboard', { stats, recentOrders });
});

app.get('/admin/orders', requireAdmin, (req, res) => {
  // Reload orders from file to get latest
  const currentOrders = loadData(ORDERS_FILE, []);
  const allOrders = [...currentOrders].reverse();
  res.render('admin-orders', { orders: allOrders });
});

app.get('/admin/orders/:id', requireAdmin, (req, res) => {
  // Reload orders from file to get latest
  const currentOrders = loadData(ORDERS_FILE, []);
  const order = currentOrders.find(o => o.id === parseInt(req.params.id));
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

app.post('/admin/orders/update-status', requireAdmin, (req, res) => {
  const { orderId, status } = req.body;
  // Reload orders from file
  orders = loadData(ORDERS_FILE, []);
  const order = orders.find(o => o.id === parseInt(orderId));
  
  if (order) {
    order.status = status;
    saveData(ORDERS_FILE, orders);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Order not found' });
  }
});

app.get('/admin/products', requireAdmin, (req, res) => {
  res.render('admin-products', { products });
});

app.get('/admin/products/:id', requireAdmin, (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/admin/products/update', requireAdmin, (req, res) => {
  const { id, name, price, category, description, image } = req.body;
  const product = products.find(p => p.id === parseInt(id));
  
  if (product) {
    product.name = name;
    product.price = parseInt(price);
    product.category = category;
    product.description = description;
    product.image = image;
    saveData(PRODUCTS_FILE, products);
    res.json({ success: true, message: 'Product updated successfully' });
  } else {
    res.json({ success: false, message: 'Product not found' });
  }
});

app.post('/admin/products/delete', requireAdmin, (req, res) => {
  const { id } = req.body;
  const index = products.findIndex(p => p.id === parseInt(id));
  
  if (index !== -1) {
    products.splice(index, 1);
    saveData(PRODUCTS_FILE, products);
    res.json({ success: true, message: 'Product deleted successfully' });
  } else {
    res.json({ success: false, message: 'Product not found' });
  }
});

app.post('/admin/products/add', requireAdmin, (req, res) => {
  const { name, price, category, description, image } = req.body;
  const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
  
  const newProduct = {
    id: newId,
    name,
    price: parseInt(price),
    category,
    description,
    image
  };
  
  products.push(newProduct);
  saveData(PRODUCTS_FILE, products);
  res.json({ success: true, message: 'Product added successfully', product: newProduct });
});

app.get('/admin/customers', requireAdmin, (req, res) => {
  // Reload data from files to get latest
  const currentUsers = loadData(USERS_FILE, []);
  const currentOrders = loadData(ORDERS_FILE, []);
  
  // Calculate customer stats from orders
  const customersWithStats = currentUsers.map(user => {
    const userOrders = currentOrders.filter(order => order.email === user.email);
    return {
      ...user,
      registeredDate: user.registeredDate || new Date().toISOString(),
      totalOrders: userOrders.length,
      totalSpent: userOrders.reduce((sum, order) => sum + order.total, 0)
    };
  });
  
  res.render('admin-customers', { customers: customersWithStats });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('📦 Products loaded:', products.length);
  console.log('🚀 Ready to test!');
});
