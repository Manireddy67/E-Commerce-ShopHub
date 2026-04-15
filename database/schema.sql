-- Create Database
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  stock INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Cart Table (optional - for persistent cart)
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert Sample Products
INSERT INTO products (name, price, image, category, description) VALUES
('Sony WH-1000XM5 Headphones', 32999, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 'Electronics', 'Industry-leading noise canceling wireless headphones with premium sound quality and 30-hour battery life'),
('Apple Watch Series 9', 35499, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80', 'Electronics', 'Advanced health and fitness tracking with always-on Retina display and ECG monitoring'),
('Nike Air Zoom Pegasus', 10799, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 'Sports', 'Responsive cushioning running shoes for everyday training with breathable mesh upper'),
('Wilson Pro Tennis Racket', 15699, 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80', 'Sports', 'Professional grade tennis racket with enhanced control, power and vibration dampening'),
('Adidas Football', 2899, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80', 'Sports', 'Official size 5 football with superior grip, durability and FIFA quality certification'),
('Samsung 4K Smart TV 55"', 57999, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80', 'Electronics', 'Crystal clear 4K UHD display with smart streaming, HDR10+ and voice control'),
('Canon EOS R6 Camera', 206999, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', 'Electronics', 'Full-frame mirrorless camera with advanced autofocus, 20fps shooting and 4K video'),
('Yoga Mat Premium', 4149, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80', 'Sports', 'Non-slip eco-friendly yoga mat with extra cushioning and carrying strap included'),
('Gaming Laptop RTX 4070', 148999, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80', 'Electronics', 'High-performance gaming laptop with RTX 4070 GPU, 144Hz display and RGB keyboard'),
('Dumbbell Set 20kg', 7449, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 'Sports', 'Adjustable dumbbell set perfect for home workouts with anti-slip grip handles'),
('Bluetooth Earbuds Pro', 12399, 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80', 'Electronics', 'True wireless earbuds with active noise cancellation and 24-hour battery life'),
('Basketball Official Size', 3719, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80', 'Sports', 'Professional indoor/outdoor basketball with superior grip and official NBA size');
