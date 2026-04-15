# ShopHub - Modern E-Commerce Website

A user-friendly e-commerce platform built with Node.js, Express, and EJS templates.

## Features

- **Modern UI**: Navy blue & orange color scheme with clean, responsive design
- **Real Product Images**: 12 products with actual images from Unsplash
- **Category Filtering**: Filter between Electronics and Sports products
- **User Authentication**: Register and login functionality
- **Product Catalog**: Browse products with detailed descriptions and pricing
- **Shopping Cart**: Add/remove items, adjust quantities, view cart summary
- **Simple Backend**: In-memory data storage (easy to understand and modify)
- **Session Management**: Persistent cart and user sessions

## Installation

### Option 1: With MySQL Database (Recommended)

1. Install MySQL and create database:
```bash
mysql -u root -p < database/schema.sql
```

2. Update database credentials in `config/database.js`

3. Install dependencies:
```bash
npm install
```

4. Start the server with MySQL:
```bash
npm run start:mysql
```

### Option 2: Without Database (In-Memory)

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and visit:
```
http://localhost:3000
```

See `MYSQL_SETUP.md` for detailed database setup instructions.

## Project Structure

```
├── server.js           # Main server file
├── package.json        # Dependencies
├── views/              # EJS templates
│   ├── index.ejs       # Home page
│   ├── product.ejs     # Product detail
│   ├── cart.ejs        # Shopping cart
│   ├── login.ejs       # Login page
│   ├── register.ejs    # Registration page
│   └── partials/       # Reusable components
├── public/             # Static files
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side JavaScript
│   └── images/         # Product images
```

## Usage

1. **Browse Products**: View 12 featured products (Electronics & Sports)
2. **Filter by Category**: Use category buttons to filter products
3. **View Details**: Click "View Details" to see full product information
4. **Register/Login**: Create an account or login to checkout
5. **Add to Cart**: Click "🛒 Add" to add products to your cart
6. **Checkout**: Review your cart and complete purchase

## Product Categories

### Electronics (7 products)
- Sony WH-1000XM5 Headphones
- Apple Watch Series 9
- Samsung 4K Smart TV
- Canon EOS R6 Camera
- Gaming Laptop RTX 4070
- Bluetooth Earbuds Pro

### Sports (5 products)
- Nike Air Zoom Pegasus
- Wilson Pro Tennis Racket
- Adidas Football
- Yoga Mat Premium
- Dumbbell Set 20kg
- Basketball Official Size

## Technologies

### Backend
- Node.js & Express
- MySQL Database (mysql2)
- bcryptjs (Password Hashing)
- Express Session
- Body Parser

### Frontend
- EJS templating
- CSS3 with gradients and animations
- Vanilla JavaScript

## Color Scheme

- **Primary**: Navy Blue (#1e3c72, #2a5298) - Navigation & Hero
- **Accent**: Orange (#ff6b35) - Buttons, Prices, CTAs
- **Success**: Green (#28a745) - Add to Cart buttons
- **Background**: Light Gray (#f8f9fa)

## Notes

- Currently uses in-memory storage (data resets on server restart)
- For production, integrate a database (MongoDB, PostgreSQL, etc.)
- Product images are loaded from Unsplash with fallback placeholders
- All products have realistic pricing and detailed descriptions
