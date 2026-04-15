# Quick Start Guide - ShopHub E-Commerce

## 🚀 Fast Setup (No Database Required)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Test Server
```bash
npm test
```

### Step 3: Open Browser
```
http://localhost:3000
```

That's it! Your e-commerce site is running! 🎉

## ✅ What Works:

- ✅ Browse 12 products (Electronics & Sports)
- ✅ Click on product to see details
- ✅ Add products to cart
- ✅ Remove items from cart
- ✅ Register new account
- ✅ Login/Logout
- ✅ Checkout (requires login)
- ✅ Category filtering

## 🎨 Product Display:

Products now show:
- **Product Image** (high quality from Unsplash)
- **Product Name**
- **Price**

Click any product to see full details!

## 🛒 How to Use:

### Browse Products
1. Scroll down to see all products
2. Use category buttons to filter (All/Electronics/Sports)

### View Product Details
1. Click on any product card
2. See full description
3. Select quantity
4. Add to cart

### Shopping Cart
1. Click "Cart" in navigation
2. Review your items
3. Remove items if needed
4. Click "Proceed to Checkout"

### Checkout
1. Login or register first
2. Go to cart
3. Click "Proceed to Checkout"
4. Order complete!

## 🔧 Troubleshooting:

### Products Not Showing?
```bash
# Stop server (Ctrl+C)
# Restart
npm test
```

### Images Not Loading?
- Check internet connection (images load from Unsplash)
- Wait a few seconds for images to load

### Can't Add to Cart?
- Open browser console (F12)
- Check for JavaScript errors
- Make sure you're clicking the product card or "Add to Cart" button

### Port Already in Use?
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill
```

## 📁 Project Structure:

```
├── test-server.js      # Simple test server (START HERE)
├── server.js           # Original server
├── server-mysql.js     # MySQL version
├── views/              # HTML templates
│   ├── index.ejs       # Home page
│   ├── product.ejs     # Product details
│   ├── cart.ejs        # Shopping cart
│   ├── login.ejs       # Login page
│   └── register.ejs    # Registration
├── public/
│   ├── css/style.css   # All styles
│   └── js/main.js      # Frontend JavaScript
└── package.json        # Dependencies
```

## 🎯 Testing Checklist:

- [ ] Home page loads with products
- [ ] Product images display
- [ ] Click product opens detail page
- [ ] Category filter works
- [ ] Add to cart shows notification
- [ ] Cart page shows items
- [ ] Remove from cart works
- [ ] Register creates account
- [ ] Login works
- [ ] Checkout completes order

## 🔄 Switch to MySQL (Optional):

If you want to use MySQL database:

1. Install MySQL
2. Run: `mysql -u root -p < database/schema.sql`
3. Update `config/database.js` with your password
4. Start: `npm run start:mysql`

See `MYSQL_SETUP.md` for details.

## 💡 Tips:

- **Test Mode**: Use `npm test` for quick testing
- **Development**: Use `npm run dev` for auto-reload
- **Production**: Use `npm start` for stable version

## 🐛 Common Issues:

### Issue: "Cannot find module 'express'"
**Solution:**
```bash
npm install
```

### Issue: "Port 3000 already in use"
**Solution:** Change PORT in test-server.js or kill the process

### Issue: "Products not displaying"
**Solution:** Check console for errors, restart server

### Issue: "Add to cart not working"
**Solution:** 
1. Open browser console (F12)
2. Check for JavaScript errors
3. Make sure main.js is loaded

## 📞 Need Help?

Check these files:
- `README.md` - Full documentation
- `MYSQL_SETUP.md` - Database setup
- `BACKEND_GUIDE.md` - Backend details

## 🎉 Success!

If you see products with images and can click them, everything is working!

Enjoy your e-commerce site! 🛍️
