const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Products (always from local file) ────────────────────────
const localProducts = (() => {
  try { return require('./data/products.js'); }
  catch(e) { console.log('products.js missing'); return []; }
})();
console.log('Products loaded:', localProducts.length);

// ── In-memory stores (fallback when no DB/filesystem) ────────
const memUsers  = [];
const memOrders = [];

// ── JSON file helpers ─────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
function readJSON(f) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); }
  catch(e) { return null; }
}
function writeJSON(f, d) {
  try { fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2)); return true; }
  catch(e) { return false; }
}

// ── DB (optional) ─────────────────────────────────────────────
let DB = null;
(async () => {
  try {
    const mysql = require('mysql2');
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1422',
      database: process.env.DB_NAME || 'ecommerce_db',
      waitForConnections: true, connectionLimit: 5, queueLimit: 0, connectTimeout: 5000
    }).promise();
    await pool.query('SELECT 1');
    DB = pool;
    console.log('MySQL connected');
  } catch(e) {
    console.log('MySQL unavailable - file/memory fallback active');
    DB = null;
  }
})();

async function Q(sql, p=[]) {
  if (!DB) return null;
  try { const [r] = await DB.query(sql, p); return r; }
  catch(e) { console.log('DB err:', e.message); return null; }
}

// ── Product helpers ───────────────────────────────────────────
async function getProducts(f={}) {
  const {search, sort, category} = f;
  let sql = 'SELECT * FROM products WHERE 1=1', params = [];
  if (search) { sql += ' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)'; const q='%'+search+'%'; params.push(q,q,q); }
  if (category && category!=='all') { sql += ' AND category=?'; params.push(category); }
  if (sort==='price-asc') sql+=' ORDER BY price ASC';
  else if (sort==='price-desc') sql+=' ORDER BY price DESC';
  else if (sort==='name-asc') sql+=' ORDER BY name ASC';
  else sql+=' ORDER BY id ASC';
  const rows = await Q(sql, params);
  if (rows) return rows;
  let r = [...localProducts];
  if (search) { const q=search.toLowerCase(); r=r.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)); }
  if (category && category!=='all') r=r.filter(p=>p.category===category);
  if (sort==='price-asc') r.sort((a,b)=>a.price-b.price);
  else if (sort==='price-desc') r.sort((a,b)=>b.price-a.price);
  else if (sort==='name-asc') r.sort((a,b)=>a.name.localeCompare(b.name));
  return r;
}

async function getProductById(id) {
  const rows = await Q('SELECT * FROM products WHERE id=?', [id]);
  if (rows && rows[0]) return rows[0];
  return localProducts.find(p=>p.id===parseInt(id)) || null;
}

// ── User helpers ──────────────────────────────────────────────
async function findUser(email) {
  const rows = await Q('SELECT * FROM users WHERE email=?', [email]);
  if (rows) return rows[0] || null;
  const list = readJSON('users.json') || memUsers;
  return list.find(u=>u.email===email) || null;
}

async function createUser(name, email, password) {
  const rows = await Q('INSERT INTO users (name,email,password) VALUES (?,?,?)', [name,email,password]);
  if (rows) return { id: rows.insertId, name, email };
  const list = readJSON('users.json') || [...memUsers];
  const id = list.length ? Math.max(...list.map(u=>u.id||0))+1 : 1;
  const u = { id, name, email, password, created_at: new Date().toISOString() };
  list.push(u);
  if (!writeJSON('users.json', list)) { memUsers.length=0; list.forEach(x=>memUsers.push(x)); }
  return { id, name, email };
}

// ── App ───────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'shophub-2024',
  resave: true,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }
}));

const requireLogin  = (req,res,next) => req.session.user  ? next() : res.redirect('/login');
const requireAdmin  = (req,res,next) => req.session.admin ? next() : res.redirect('/admin/login');

// ── HOME ──────────────────────────────────────────────────────
app.get('/', async (req,res) => {
  try {
    const {search,sort,category} = req.query;
    const products = await getProducts({search,sort,category});
    res.render('index', { user:req.session.user, products, search:search||'', sort:sort||'', category:category||'all' });
  } catch(e) {
    res.render('index', { user:req.session.user, products:localProducts, search:'', sort:'', category:'all' });
  }
});

// ── PRODUCT DETAIL ────────────────────────────────────────────
app.get('/product/:id', async (req,res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.redirect('/');
    const dbRel = await Q('SELECT * FROM products WHERE category=? AND id!=? LIMIT 4', [product.category, product.id]);
    const related = (dbRel && dbRel.length) ? dbRel : localProducts.filter(p=>p.category===product.category&&p.id!==parseInt(product.id)).slice(0,4);
    const dbGal = await Q('SELECT image_url FROM product_images WHERE product_id=? ORDER BY sort_order', [product.id]);
    let gallery = [product.image];
    if (dbGal && dbGal.length) gallery = [product.image, ...dbGal.map(r=>r.image_url)];
    else if (product.gallery && product.gallery.length) gallery = [product.image, ...product.gallery];
    res.render('product', { user:req.session.user, product, related, gallery });
  } catch(e) { console.error(e); res.redirect('/'); }
});

// ── CART ──────────────────────────────────────────────────────
app.get('/cart', async (req,res) => {
  try {
    const cart = req.session.cart || [];
    const cartItems = [];
    for (const item of cart) {
      const p = await getProductById(item.id);
      if (p) cartItems.push({...p, quantity:item.quantity});
    }
    const subtotal = cartItems.reduce((s,i)=>s+i.price*i.quantity,0);
    const shipping = subtotal>999 ? 0 : 99;
    res.render('cart', { user:req.session.user, cartItems, subtotal, shipping, total:subtotal+shipping });
  } catch(e) {
    res.render('cart', { user:req.session.user, cartItems:[], subtotal:0, shipping:0, total:0 });
  }
});

app.post('/cart/add', (req,res) => {
  if (!req.session.cart) req.session.cart = [];
  const id = parseInt(req.body.productId), qty = parseInt(req.body.quantity)||1;
  const ex = req.session.cart.find(i=>i.id===id);
  if (ex) ex.quantity+=qty; else req.session.cart.push({id,quantity:qty});
  res.json({ success:true, cartCount:req.session.cart.reduce((s,i)=>s+i.quantity,0) });
});

app.post('/cart/remove', (req,res) => {
  if (req.session.cart) req.session.cart = req.session.cart.filter(i=>i.id!==parseInt(req.body.productId));
  res.json({ success:true });
});

app.post('/cart/update', async (req,res) => {
  if (!req.session.cart) return res.json({success:false});
  const id=parseInt(req.body.productId), qty=parseInt(req.body.quantity);
  const item = req.session.cart.find(i=>i.id===id);
  if (item) { if(qty<=0) req.session.cart=req.session.cart.filter(i=>i.id!==id); else item.quantity=qty; }
  let subtotal=0;
  for (const ci of req.session.cart) { const p=await getProductById(ci.id); if(p) subtotal+=p.price*ci.quantity; }
  const shipping=subtotal>999?0:99;
  res.json({ success:true, subtotal, shipping, total:subtotal+shipping, cartCount:req.session.cart.reduce((s,i)=>s+i.quantity,0) });
});

app.get('/cart/count', (req,res) => {
  res.json({ count:(req.session.cart||[]).reduce((s,i)=>s+i.quantity,0) });
});

// ── SEARCH API ────────────────────────────────────────────────
app.get('/api/search', async (req,res) => {
  try {
    const results = await getProducts({ search:req.query.q||'' });
    res.json(results.slice(0,6).map(p=>({id:p.id,name:p.name,price:p.price,image:p.image,category:p.category})));
  } catch(e) { res.json([]); }
});

// ── AUTH ──────────────────────────────────────────────────────
app.get('/login',    (req,res) => req.session.user ? res.redirect('/') : res.render('login',    {user:null,error:null}));
app.get('/register', (req,res) => req.session.user ? res.redirect('/') : res.render('register', {user:null,error:null}));

app.post('/login', async (req,res) => {
  const {email,password} = req.body;
  if (!email||!password) return res.render('login',{user:null,error:'Email and password required'});
  try {
    const user = await findUser(email.toLowerCase().trim());
    if (!user) return res.render('login',{user:null,error:'Invalid email or password'});
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.render('login',{user:null,error:'Invalid email or password'});
    req.session.user = { id:user.id, email:user.email, name:user.name };
    req.session.save(() => res.redirect('/'));
  } catch(e) {
    console.error('Login error:',e);
    res.render('login',{user:null,error:'Something went wrong'});
  }
});

app.post('/register', async (req,res) => {
  const {name,email,password,confirmPassword} = req.body;
  if (!name||!email||!password) return res.render('register',{user:null,error:'All fields required'});
  if (password.length<6) return res.render('register',{user:null,error:'Password min 6 characters'});
  if (password!==confirmPassword) return res.render('register',{user:null,error:'Passwords do not match'});
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.render('register',{user:null,error:'Invalid email'});
  try {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await findUser(cleanEmail);
    if (existing) return res.render('register',{user:null,error:'Email already registered'});
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser(name.trim(), cleanEmail, hashed);
    req.session.user = { id:newUser.id, email:newUser.email, name:newUser.name };
    req.session.save(() => res.redirect('/'));
  } catch(e) {
    console.error('Register error:',e);
    res.render('register',{user:null,error:'Registration failed'});
  }
});

app.get('/logout', (req,res) => { req.session.destroy(); res.redirect('/'); });

// ── CHECKOUT ──────────────────────────────────────────────────
app.get('/checkout', requireLogin, async (req,res) => {
  try {
    const cart = req.session.cart||[];
    if (!cart.length) return res.redirect('/cart');
    const cartItems=[];
    for (const item of cart) { const p=await getProductById(item.id); if(p) cartItems.push({...p,quantity:item.quantity}); }
    const subtotal=cartItems.reduce((s,i)=>s+i.price*i.quantity,0);
    const shipping=subtotal>999?0:99, tax=Math.round(subtotal*0.18);
    res.render('checkout',{user:req.session.user,cartItems,subtotal,shipping,tax,total:subtotal+shipping+tax});
  } catch(e) { res.redirect('/cart'); }
});

app.post('/checkout', requireLogin, async (req,res) => {
  const cart=req.session.cart||[];
  if (!cart.length) return res.json({success:false,message:'Cart is empty'});
  const {paymentMethod,paymentRef,shippingDetails} = req.body;
  const {firstName,lastName,email,phone,address,city,state,pincode,landmark} = shippingDetails||{};
  if (!firstName||!lastName||!phone||!address||!city||!state||!pincode)
    return res.json({success:false,message:'Fill all shipping details'});
  if (!/^[0-9]{10}$/.test(phone)) return res.json({success:false,message:'Invalid phone'});
  if (!/^[0-9]{6}$/.test(pincode)) return res.json({success:false,message:'Invalid PIN'});
  try {
    const cartItems=[];
    for (const item of cart) { const p=await getProductById(item.id); if(p) cartItems.push({...p,quantity:item.quantity}); }
    const subtotal=cartItems.reduce((s,i)=>s+i.price*i.quantity,0);
    const shipping=subtotal>999?0:99, tax=Math.round(subtotal*0.18), total=subtotal+shipping+tax;
    let orderId;
    const dbResult = await Q(
      `INSERT INTO orders (user_id,customer_name,email,phone,address,city,state,pincode,landmark,subtotal,shipping,tax,total_amount,payment_method,payment_ref,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [req.session.user.id,`${firstName} ${lastName}`,email||req.session.user.email,phone,address,city,state,pincode,landmark||'',subtotal,shipping,tax,total,paymentMethod||'cod',paymentRef||null]
    );
    if (dbResult) {
      orderId = dbResult.insertId;
      for (const item of cartItems) await Q('INSERT INTO order_items (order_id,product_id,name,image,price,quantity) VALUES (?,?,?,?,?,?)',[orderId,item.id,item.name,item.image,item.price,item.quantity]);
    } else {
      const orders = readJSON('orders.json') || [...memOrders];
      orderId = orders.length ? Math.max(...orders.map(o=>o.id||0))+1 : 1;
      const newOrder = {id:orderId,userId:req.session.user.id,customerName:`${firstName} ${lastName}`,email:email||req.session.user.email,phone,address,city,state,pincode,landmark:landmark||'',orderItems:cartItems,subtotal,shipping,tax,total,paymentMethod:paymentMethod||'cod',status:'pending',createdAt:new Date().toISOString()};
      orders.push(newOrder);
      if (!writeJSON('orders.json',orders)) memOrders.push(newOrder);
      req.session.lastOrder = newOrder;
    }
    req.session.cart=[];
    res.json({success:true,message:'Order placed!',orderId});
  } catch(e) { console.error(e); res.json({success:false,message:'Order failed'}); }
});

// ── ORDER CONFIRMATION ────────────────────────────────────────
app.get('/order-confirmation/:id', requireLogin, async (req,res) => {
  try {
    let order=null;
    const rows = await Q('SELECT * FROM orders WHERE id=? AND user_id=?',[req.params.id,req.session.user.id]);
    if (rows && rows[0]) {
      order=rows[0];
      const items=await Q('SELECT * FROM order_items WHERE order_id=?',[order.id]);
      order.orderItems=items||[];
    }
    if (!order) {
      if (req.session.lastOrder && String(req.session.lastOrder.id)===String(req.params.id)) order=req.session.lastOrder;
      else { const all=readJSON('orders.json')||memOrders; order=all.find(o=>String(o.id)===String(req.params.id)&&o.userId===req.session.user.id)||null; }
    }
    if (!order) return res.redirect('/');
    order.orderItems=order.orderItems||[];
    order.customerName=order.customerName||order.customer_name||req.session.user.name;
    order.paymentMethod=order.paymentMethod||order.payment_method||'cod';
    order.total=parseFloat(order.total||order.total_amount||0);
    order.subtotal=parseFloat(order.subtotal||order.total);
    order.shipping=parseFloat(order.shipping||0);
    order.tax=parseFloat(order.tax||0);
    order.date=order.date||order.created_at||order.createdAt||new Date();
    order.shippingAddress=order.shippingAddress||{address:order.address,city:order.city,state:order.state,pincode:order.pincode,landmark:order.landmark||''};
    res.render('order-confirmation',{user:req.session.user,order});
  } catch(e) { console.error(e); res.redirect('/'); }
});

// ── MY ORDERS ─────────────────────────────────────────────────
app.get('/my-orders', requireLogin, async (req,res) => {
  try {
    let orders=[];
    const rows=await Q('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC',[req.session.user.id]);
    if (rows) {
      for (const o of rows) {
        const items=await Q('SELECT * FROM order_items WHERE order_id=?',[o.id]);
        orders.push({...o,orderItems:items||[],total:parseFloat(o.total_amount),paymentMethod:o.payment_method||'cod',shippingAddress:{city:o.city,state:o.state},date:o.created_at});
      }
    } else {
      const all=readJSON('orders.json')||memOrders;
      orders=all.filter(o=>o.userId===req.session.user.id).reverse().map(o=>({...o,total:parseFloat(o.total||0),paymentMethod:o.paymentMethod||'cod',shippingAddress:o.shippingAddress||{city:o.city||'',state:o.state||''},date:o.date||o.createdAt||new Date()}));
    }
    res.render('my-orders',{user:req.session.user,orders});
  } catch(e) { res.render('my-orders',{user:req.session.user,orders:[]}); }
});

// ── ADMIN ─────────────────────────────────────────────────────
app.get('/admin', (req,res)=>res.redirect('/admin/login'));
app.get('/admin/login', (req,res)=>req.session.admin?res.redirect('/admin/dashboard'):res.render('admin-login',{error:null}));
app.post('/admin/login', (req,res)=>{
  if (req.body.username==='admin'&&req.body.password==='admin123') { req.session.admin={username:'admin'}; return res.redirect('/admin/dashboard'); }
  res.render('admin-login',{error:'Invalid credentials'});
});
app.get('/admin/logout',(req,res)=>{req.session.admin=null;res.redirect('/admin/login');});

app.get('/admin/dashboard', requireAdmin, async (req,res) => {
  try {
    const to=await Q('SELECT COUNT(*) as c FROM orders'); const totalOrders=to?.[0]?.c??0;
    const tr=await Q('SELECT COALESCE(SUM(total_amount),0) as r FROM orders'); const totalRevenue=parseFloat(tr?.[0]?.r??0);
    const tc=await Q('SELECT COUNT(*) as c FROM users'); const totalCustomers=tc?.[0]?.c??0;
    const tp=await Q('SELECT COUNT(*) as c FROM products'); const totalProducts=tp?.[0]?.c??localProducts.length;
    const po=await Q("SELECT COUNT(*) as c FROM orders WHERE status='pending'"); const pendingOrders=po?.[0]?.c??0;
    const recentRows=await Q('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5')||[];
    const recentOrders=[];
    for (const o of recentRows) {
      const ic=await Q('SELECT COUNT(*) as c FROM order_items WHERE order_id=?',[o.id]);
      recentOrders.push({...o,total:parseFloat(o.total_amount),customerName:o.customer_name,date:o.created_at,paymentMethod:o.payment_method,items:ic?.[0]?.c??0});
    }
    res.render('admin-dashboard',{stats:{totalOrders,totalRevenue,totalCustomers,totalProducts,pendingOrders},recentOrders});
  } catch(e) { res.render('admin-dashboard',{stats:{totalOrders:0,totalRevenue:0,totalCustomers:0,totalProducts:localProducts.length,pendingOrders:0},recentOrders:[]}); }
});

app.get('/admin/orders', requireAdmin, async (req,res) => {
  try {
    const rows=await Q('SELECT * FROM orders ORDER BY created_at DESC')||[];
    const orders=[];
    for (const o of rows) {
      const ic=await Q('SELECT COUNT(*) as c FROM order_items WHERE order_id=?',[o.id]);
      orders.push({...o,total:parseFloat(o.total_amount),customerName:o.customer_name,date:o.created_at,paymentMethod:o.payment_method||'cod',items:ic?.[0]?.c??0});
    }
    res.render('admin-orders',{orders});
  } catch(e) { res.render('admin-orders',{orders:[]}); }
});

app.get('/admin/orders/:id', requireAdmin, async (req,res) => {
  try {
    const rows=await Q('SELECT * FROM orders WHERE id=?',[req.params.id]);
    if (!rows||!rows[0]) return res.status(404).json({error:'Not found'});
    const o=rows[0];
    const items=await Q('SELECT * FROM order_items WHERE order_id=?',[o.id]);
    res.json({...o,orderItems:items||[],total:parseFloat(o.total_amount),customerName:o.customer_name,shippingAddress:{address:o.address,city:o.city,state:o.state,pincode:o.pincode,landmark:o.landmark},paymentMethod:o.payment_method,subtotal:parseFloat(o.subtotal),tax:parseFloat(o.tax)});
  } catch(e) { res.status(500).json({error:'Server error'}); }
});

app.post('/admin/orders/update-status', requireAdmin, async (req,res) => {
  const {orderId,status}=req.body;
  if (!['pending','processing','shipped','delivered','cancelled'].includes(status)) return res.json({success:false,message:'Invalid status'});
  try { await Q('UPDATE orders SET status=? WHERE id=?',[status,orderId]); res.json({success:true,message:'Updated'}); }
  catch(e) { res.json({success:false,message:'Failed'}); }
});

app.get('/admin/products', requireAdmin, async (req,res) => {
  const products=await Q('SELECT * FROM products ORDER BY id')||localProducts;
  res.render('admin-products',{products});
});

app.get('/admin/products/:id', requireAdmin, async (req,res) => {
  const rows=await Q('SELECT * FROM products WHERE id=?',[req.params.id]);
  if (!rows||!rows[0]) return res.status(404).json({error:'Not found'});
  res.json(rows[0]);
});

app.post('/admin/products/add', requireAdmin, async (req,res) => {
  const {name,price,category,description,image,stock}=req.body;
  if (!name||!price||!category||!description||!image) return res.json({success:false,message:'All fields required'});
  try { await Q('INSERT INTO products (name,price,category,description,image,stock) VALUES (?,?,?,?,?,?)',[name.trim(),parseFloat(price),category,description.trim(),image.trim(),parseInt(stock)||100]); res.json({success:true,message:'Added'}); }
  catch(e) { res.json({success:false,message:'Failed'}); }
});

app.post('/admin/products/update', requireAdmin, async (req,res) => {
  const {id,name,price,category,description,image,stock}=req.body;
  try { await Q('UPDATE products SET name=?,price=?,category=?,description=?,image=?,stock=? WHERE id=?',[name.trim(),parseFloat(price),category,description.trim(),image.trim(),parseInt(stock)||100,id]); res.json({success:true,message:'Updated'}); }
  catch(e) { res.json({success:false,message:'Failed'}); }
});

app.post('/admin/products/delete', requireAdmin, async (req,res) => {
  try { await Q('DELETE FROM products WHERE id=?',[req.body.id]); res.json({success:true,message:'Deleted'}); }
  catch(e) { res.json({success:false,message:'Failed'}); }
});

app.post('/admin/customers/delete', requireAdmin, async (req,res) => {
  try { await Q('DELETE FROM orders WHERE user_id=?',[req.body.id]); await Q('DELETE FROM users WHERE id=?',[req.body.id]); res.json({success:true,message:'Deleted'}); }
  catch(e) { res.json({success:false,message:'Failed'}); }
});

app.get('/admin/customers', requireAdmin, async (req,res) => {
  try {
    const users=await Q('SELECT id,name,email,created_at FROM users ORDER BY created_at DESC')||[];
    const customers=[];
    for (const u of users) {
      const to=await Q('SELECT COUNT(*) as c FROM orders WHERE user_id=?',[u.id]);
      const ts=await Q('SELECT COALESCE(SUM(total_amount),0) as s FROM orders WHERE user_id=?',[u.id]);
      customers.push({...u,totalOrders:to?.[0]?.c??0,totalSpent:parseFloat(ts?.[0]?.s??0),registeredDate:u.created_at});
    }
    res.render('admin-customers',{customers});
  } catch(e) { res.render('admin-customers',{customers:[]}); }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req,res)=>res.status(404).render('404',{user:req.session.user||null}));

app.listen(PORT, ()=>{
  console.log(`ShopHub running on port ${PORT}`);
  console.log(`Admin: /admin  (admin/admin123)`);
});
