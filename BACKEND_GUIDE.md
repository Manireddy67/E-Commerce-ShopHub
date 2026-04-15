# Node.js Backend Guide - ShopHub E-Commerce

## Complete Backend Architecture

### 1. Server Setup (server.js)

```javascript
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware Configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'ecommerce-secret-key',
  resave: false,
  saveUninitialized: false
}));
```

### 2. Data Storage (In-Memory)

```javascript
// Users array - stores registered users
const users = [];

// Products array - stores all products
const products = [
  {
    id: 1,
    name: 'Product Name',
    price: 99.99,
    image: 'https://image-url.com',
    category: 'Electronics',
    description: 'Product description'
  }
  // ... more products
];
```

### 3. API Endpoints

#### Home Page
```javascript
app.get('/', (req, res) => {
  res.render('index', { 
    user: req.session.user, 
    products 
  });
});
```

#### Product Detail Page
```javascript
app.get('/product/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.render('product', { user: req.session.user, product });
  } else {
    res.redirect('/');
  }
});
```

#### Shopping Cart
```javascript
// View Cart
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const cartItems = cart.map(item => ({
    ...products.find(p => p.id === item.id),
    quantity: item.quantity
  }));
  const total = cartItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  res.render('cart', { user: req.session.user, cartItems, total });
});

// Add to Cart
app.post('/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  if (!req.session.cart) req.session.cart = [];
  
  const existingItem = req.session.cart.find(
    item => item.id === parseInt(productId)
  );
  
  if (existingItem) {
    existingItem.quantity += parseInt(quantity) || 1;
  } else {
    req.session.cart.push({ 
      id: parseInt(productId), 
      quantity: parseInt(quantity) || 1 
    });
  }
  
  res.json({ success: true, cartCount: req.session.cart.length });
});

// Remove from Cart
app.post('/cart/remove', (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(
      item => item.id !== parseInt(productId)
    );
  }
  res.json({ success: true });
});
```

#### User Authentication
```javascript
// Login Page
app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

// Login POST
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => 
    u.email === email && u.password === password
  );
  
  if (user) {
    req.session.user = { email: user.email, name: user.name };
    res.redirect('/');
  } else {
    res.render('login', { user: null, error: 'Invalid credentials' });
  }
});

// Register Page
app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user, error: null });
});

// Register POST
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (users.find(u => u.email === email)) {
    res.render('register', { 
      user: null, 
      error: 'Email already exists' 
    });
    return;
  }
  
  users.push({ name, email, password });
  req.session.user = { email, name };
  res.redirect('/');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
```

#### Checkout
```javascript
app.post('/checkout', (req, res) => {
  if (!req.session.user) {
    res.json({ 
      success: false, 
      message: 'Please login first' 
    });
    return;
  }
  
  // Clear cart after successful checkout
  req.session.cart = [];
  res.json({ 
    success: true, 
    message: 'Order placed successfully!' 
  });
});
```

### 4. Start Server
```javascript
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

## Backend Features

### Session Management
- User authentication stored in session
- Shopping cart persists across pages
- Automatic session cleanup on logout

### Data Flow
1. **User Registration** → Store in users array → Create session
2. **User Login** → Verify credentials → Create session
3. **Add to Cart** → Store in session.cart → Update quantity
4. **Checkout** → Verify user → Clear cart → Success message

### Security Notes
⚠️ **For Production:**
- Use bcrypt for password hashing
- Add CSRF protection
- Use environment variables for secrets
- Implement rate limiting
- Add input validation
- Use HTTPS

### Database Integration (Future)
Replace in-memory storage with:
- **MongoDB**: NoSQL database
- **PostgreSQL**: Relational database
- **MySQL**: Relational database

Example MongoDB integration:
```javascript
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  image: String,
  category: String,
  description: String
});

const Product = mongoose.model('Product', ProductSchema);
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## Testing the Backend

### Using cURL
```bash
# Add to cart
curl -X POST http://localhost:3000/cart/add \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'

# Remove from cart
curl -X POST http://localhost:3000/cart/remove \
  -H "Content-Type: application/json" \
  -d '{"productId": 1}'
```

### Using Postman
1. Import endpoints
2. Test each route
3. Verify responses

## Dependencies

```json
{
  "express": "^4.18.2",
  "ejs": "^3.1.9",
  "express-session": "^1.17.3",
  "body-parser": "^1.20.2"
}
```

## Run the Backend

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (with auto-restart)
npm run dev
```

Your backend is now running at `http://localhost:3000`
