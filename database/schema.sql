-- ============================================================
--  ShopHub Database Schema
--  MySQL 9.1 Compatible
-- ============================================================

CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  UNIQUE NOT NULL,
  password      VARCHAR(255)  NOT NULL,
  registered_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255)    NOT NULL,
  price       DECIMAL(10,2)   NOT NULL,
  image       TEXT            NOT NULL,
  category    VARCHAR(100)    NOT NULL,
  description TEXT,
  stock       INT             DEFAULT 100,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT            NOT NULL,
  customer_name    VARCHAR(255)   NOT NULL,
  email            VARCHAR(255)   NOT NULL,
  phone            VARCHAR(15)    NOT NULL,
  address          TEXT           NOT NULL,
  city             VARCHAR(100)   NOT NULL,
  state            VARCHAR(100)   NOT NULL,
  pincode          VARCHAR(10)    NOT NULL,
  landmark         VARCHAR(255)   DEFAULT '',
  subtotal         DECIMAL(10,2)  NOT NULL,
  shipping         DECIMAL(10,2)  DEFAULT 0,
  tax              DECIMAL(10,2)  DEFAULT 0,
  total            DECIMAL(10,2)  NOT NULL,
  payment_method   VARCHAR(50)    DEFAULT 'cod',
  payment_ref      VARCHAR(100)   DEFAULT NULL,
  status           VARCHAR(50)    DEFAULT 'pending',
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── Order Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT            NOT NULL,
  product_id INT            NOT NULL,
  name       VARCHAR(255)   NOT NULL,
  image      TEXT           NOT NULL,
  price      DECIMAL(10,2)  NOT NULL,
  quantity   INT            NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
--  SEED DATA — 60 Products across 6 Categories
-- ============================================================
INSERT IGNORE INTO products (id, name, price, image, category, description, stock) VALUES

-- ELECTRONICS (10)
(1,  'Sony WH-1000XM5 Wireless Headphones',    29999, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',  'Electronics', 'Industry-leading noise canceling headphones with 30-hour battery, multipoint connection and crystal-clear call quality.', 50),
(2,  'Apple Watch Series 9 GPS 45mm',           41900, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',  'Electronics', 'Advanced smartwatch with always-on Retina display, ECG, blood oxygen monitoring and crash detection.', 30),
(3,  'Samsung 55" 4K Crystal UHD Smart TV',     52990, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',  'Electronics', 'Crystal clear 4K UHD display with smart streaming, HDR10+ support, voice control and built-in apps.', 20),
(4,  'ASUS ROG Strix G15 Gaming Laptop',        89990, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',  'Electronics', 'High-performance gaming laptop with RTX 4060 GPU, 144Hz display, RGB keyboard and advanced cooling system.', 15),
(5,  'OnePlus 12 5G Smartphone',                64999, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',  'Electronics', 'Flagship smartphone with Snapdragon 8 Gen 3, 50MP Hasselblad camera, 100W fast charging and 120Hz AMOLED display.', 45),
(6,  'boAt Airdopes 141 Bluetooth Earbuds',      1999, 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',  'Electronics', 'True wireless earbuds with 42 hours total playback, IPX4 water resistance and instant voice assistant access.', 120),
(7,  'Canon EOS R6 Mark II Camera',            219999, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',  'Electronics', 'Full-frame mirrorless camera with advanced autofocus, 40fps shooting, 4K video recording and professional image quality.', 10),
(8,  'JBL Flip 6 Portable Bluetooth Speaker',   11999, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',  'Electronics', 'Waterproof portable speaker with powerful JBL Pro Sound, 12-hour playtime and PartyBoost feature.', 70),
(9,  'iPad Air 5th Gen Wi-Fi 256GB',            74900, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',  'Electronics', 'Powerful M1 chip tablet with 10.9-inch Liquid Retina display, USB-C, 5G support and all-day battery life.', 25),
(10, 'Logitech MX Master 3S Wireless Mouse',     9995, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',  'Electronics', 'Advanced wireless mouse with 8K DPI sensor, MagSpeed scroll wheel, ergonomic design and 70-day battery life.', 80),

-- COSMETICS (10)
(11, 'Lakme 9to5 Primer + Matte Lipstick',        399, 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f9b?w=800&q=80',  'Cosmetics', 'Long-lasting matte lipstick with built-in primer for 9-hour wear. Available in 30+ shades for every skin tone.', 200),
(12, 'Maybelline Fit Me Foundation',               499, 'https://images.unsplash.com/photo-1631214524020-3c69b3b0e5e5?w=800&q=80',  'Cosmetics', 'Lightweight foundation with natural finish, SPF 18 protection and 40 shades to match every complexion.', 180),
(13, 'LOreal Paris Revitalift Serum',             1299, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',  'Cosmetics', 'Anti-aging face serum with 1.5% pure hyaluronic acid that visibly reduces wrinkles and plumps skin in 7 days.', 150),
(14, 'Nykaa Cosmetics Eyeshadow Palette',          799, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',  'Cosmetics', '12-shade eyeshadow palette with matte, shimmer and glitter finishes. Highly pigmented and long-lasting formula.', 160),
(15, 'Biotique Bio Papaya Face Wash',              199, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80',  'Cosmetics', 'Natural papaya enzyme face wash that gently exfoliates, brightens skin and removes dead cells for a radiant glow.', 300),
(16, 'Forest Essentials Facial Toner',            1650, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',  'Cosmetics', 'Ayurvedic rose water toner with pure essential oils that tightens pores, balances pH and refreshes skin.', 90),
(17, 'Colorbar Nail Lacquer Set (6 pcs)',           599, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',  'Cosmetics', 'Set of 6 vibrant nail lacquers with chip-resistant formula, quick-dry technology and glossy finish.', 220),
(18, 'Plum Goodness Vitamin C Moisturizer',        895, 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',  'Cosmetics', 'Lightweight daily moisturizer with Vitamin C and E that brightens skin, reduces dark spots and provides SPF 35.', 140),
(19, 'MAC Studio Fix Powder Plus Foundation',     3200, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',  'Cosmetics', 'Professional-grade powder foundation with medium-to-full buildable coverage, matte finish and 12-hour wear.', 60),
(20, 'Himalaya Herbals Nourishing Skin Cream',     175, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',  'Cosmetics', 'Daily moisturizing cream with winter cherry and aloe vera that deeply nourishes, softens and protects skin.', 400),

-- FASHION (10)
(21, 'Levis 511 Slim Fit Jeans',                  3499, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',  'Fashion', 'Classic slim fit jeans in premium stretch denim. Sits below waist with slim fit through thigh and leg opening.', 100),
(22, 'Allen Solly Formal Shirt Men',              1299, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',  'Fashion', 'Premium cotton formal shirt with wrinkle-resistant finish, slim fit cut and easy-care fabric for office wear.', 120),
(23, 'W for Woman Kurta Set',                     1799, 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80',  'Fashion', 'Elegant printed kurta with palazzo pants in breathable cotton blend. Perfect for festive and casual occasions.', 90),
(24, 'Nike Dri-FIT Training T-Shirt',             1995, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',  'Fashion', 'Moisture-wicking performance t-shirt with Dri-FIT technology that keeps you cool and dry during workouts.', 150),
(25, 'Fabindia Cotton Saree',                     2499, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',  'Fashion', 'Handwoven pure cotton saree with traditional block print design. Lightweight, breathable and perfect for daily wear.', 70),
(26, 'H&M Oversized Hoodie',                      1499, 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',  'Fashion', 'Cozy oversized hoodie in soft fleece fabric with kangaroo pocket, ribbed cuffs and relaxed fit for all-day comfort.', 130),
(27, 'Biba Anarkali Suit Set',                    3299, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80',  'Fashion', 'Stunning Anarkali suit with embroidered dupatta in georgette fabric. Ideal for weddings and festive celebrations.', 55),
(28, 'Woodland Leather Casual Shoes',             4995, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',  'Fashion', 'Genuine leather casual shoes with cushioned insole, anti-skid rubber sole and classic lace-up design for everyday wear.', 85),
(29, 'Fossil Gen 6 Smartwatch',                  22995, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',  'Fashion', 'Stylish smartwatch with Wear OS, heart rate monitoring, GPS, NFC payments and 3-day battery life.', 40),
(30, 'Baggit Tote Handbag',                       2199, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',  'Fashion', 'Spacious vegan leather tote bag with multiple compartments, magnetic closure and detachable shoulder strap.', 75),

-- HOME & KITCHEN (10)
(31, 'Prestige Iris 750W Mixer Grinder',          3495, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',  'Home & Kitchen', '3-jar mixer grinder with 750W motor, stainless steel blades, overload protection and 5-year motor warranty.', 60),
(32, 'Philips Air Fryer HD9200',                  6995, 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',  'Home & Kitchen', 'Rapid Air technology air fryer that cooks crispy food with up to 90% less fat. 4.1L capacity with digital display.', 45),
(33, 'Milton Thermosteel Flask 1L',                899, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',  'Home & Kitchen', 'Double-wall vacuum insulated flask that keeps beverages hot for 24 hours and cold for 48 hours. Leak-proof lid.', 200),
(34, 'Solimo Non-Stick Cookware Set 5pc',         2499, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',  'Home & Kitchen', '5-piece non-stick cookware set with PFOA-free coating, induction-compatible base and heat-resistant handles.', 80),
(35, 'Bajaj Majesty 1000W Room Heater',           1799, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',  'Home & Kitchen', 'Compact room heater with 2 heat settings, overheat protection, cool-touch body and 360-degree rotation.', 55),
(36, 'Cello Opalware Dinner Set 18pc',            1999, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',  'Home & Kitchen', '18-piece opalware dinner set with 6 dinner plates, 6 quarter plates and 6 bowls. Microwave and dishwasher safe.', 70),
(37, 'Godrej Aer Pocket Car Freshener',            149, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',  'Home & Kitchen', 'Long-lasting car air freshener with 30-day fragrance, spill-proof design and 3 refreshing scent options.', 500),
(38, 'Pigeon Induction Cooktop 1800W',            2195, 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',  'Home & Kitchen', 'Smart induction cooktop with 7 preset menus, touch panel, auto-off timer and child safety lock feature.', 65),
(39, 'Story@Home Blackout Curtains Set of 2',     1299, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',  'Home & Kitchen', 'Premium blackout curtains that block 99% light, reduce noise and maintain room temperature. Machine washable.', 110),
(40, 'Wonderchef Nutri-Blend 400W Blender',       2995, 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',  'Home & Kitchen', 'Compact personal blender with 400W motor, 2 unbreakable jars, stainless steel blades and travel lid.', 90),

-- SPORTS (10)
(41, 'Nike Air Zoom Pegasus 40',                  9995, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',  'Sports', 'Responsive cushioning running shoes for everyday training with breathable mesh upper and durable rubber outsole.', 100),
(42, 'Yonex Arcsaber 11 Badminton Racket',       18500, 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',  'Sports', 'Professional grade badminton racket used by world champions with enhanced control, power and precision.', 40),
(43, 'Nivia Storm Football Size 5',               1299, 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',  'Sports', 'Official size 5 football with superior grip, durability and FIFA quality certification. Perfect for matches and training.', 200),
(44, 'Kore DM-Hexagon Dumbbell Set 16kg',         4999, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',  'Sports', 'Adjustable dumbbell set (8kg x 2) perfect for home workouts with anti-slip grip handles and durable construction.', 80),
(45, 'Spalding NBA Official Basketball',          2499, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80',  'Sports', 'Professional indoor/outdoor basketball with superior grip, official NBA size and durable composite leather construction.', 60),
(46, 'Strauss Yoga Mat 6mm Premium',              1899, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',  'Sports', 'Non-slip eco-friendly yoga mat with extra cushioning, carrying strap and anti-bacterial surface treatment.', 150),
(47, 'Decathlon Domyos Cross Trainer',           24999, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',  'Sports', 'Home fitness cross trainer with 8 resistance levels, LCD display, heart rate monitoring and compact foldable design.', 25),
(48, 'Cosco Hi-Grip Volleyball',                   899, 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&q=80',  'Sports', 'Official size volleyball with superior grip, synthetic leather construction and excellent bounce characteristics.', 90),
(49, 'Adidas Predator Edge Cricket Bat',          3499, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',  'Sports', 'English willow cricket bat with full-size blade, cane handle and protective cover. Ideal for club and school cricket.', 50),
(50, 'Boldfit Resistance Bands Set 5pc',           799, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80',  'Sports', 'Set of 5 latex resistance bands with varying resistance levels for strength training, yoga and physiotherapy.', 180),

-- BOOKS (10)
(51, 'Atomic Habits by James Clear',               499, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',  'Books', 'International bestseller on building good habits and breaking bad ones. Over 10 million copies sold worldwide.', 300),
(52, 'The Psychology of Money',                    399, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',  'Books', 'Timeless lessons on wealth, greed and happiness by Morgan Housel. A must-read for personal finance enthusiasts.', 250),
(53, 'Rich Dad Poor Dad Hindi Edition',            299, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',  'Books', 'Robert Kiyosakis classic guide to financial literacy, investing and building wealth. Available in Hindi.', 200),
(54, 'Classmate Premium Notebook Set 5pc',         249, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80',  'Books', 'Set of 5 premium ruled notebooks with 200 pages each, smooth paper and durable hard cover binding.', 400),
(55, 'Parker Jotter Ballpoint Pen Set',            699, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80',  'Books', 'Classic Parker Jotter pen set with 3 pens in blue, black and red ink. Stainless steel body with click mechanism.', 180),
(56, 'Camlin Kokuyo Art Kit 25pc',                 599, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',  'Books', '25-piece art kit with watercolors, sketch pens, oil pastels and brushes. Perfect for students and hobbyists.', 150),
(57, 'The Alchemist by Paulo Coelho',              350, 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=800&q=80',  'Books', 'A magical story about following your dreams and listening to your heart. One of the best-selling books of all time.', 280),
(58, 'Faber-Castell Colour Pencils 48 shades',     449, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',  'Books', '48 vibrant colour pencils with break-resistant leads, smooth laydown and excellent blending properties.', 200),
(59, 'Sticky Notes Combo Pack 600 sheets',         199, 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',  'Books', 'Combo pack of 600 sticky notes in 6 neon colors. Strong adhesive, repositionable and perfect for reminders.', 350),
(60, 'Sapiens A Brief History of Humankind',       599, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',  'Books', 'Yuval Noah Hararis groundbreaking exploration of human history from the Stone Age to the 21st century.', 220);
