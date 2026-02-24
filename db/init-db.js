const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const dbFile = path.join(dataDir, 'ecommerce.db');

const db = new Database(dbFile);

db.exec(`
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  slug TEXT UNIQUE,
  description TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  price REAL,
  stock INTEGER,
  images TEXT,
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE product_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  user_id INTEGER,
  rating INTEGER,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id INTEGER,
  product_id INTEGER,
  qty INTEGER,
  price REAL,
  FOREIGN KEY (cart_id) REFERENCES carts(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT,
  user_id INTEGER,
  total_amount REAL,
  shipping_info TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  product_id INTEGER,
  qty INTEGER,
  price REAL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

// seed categories & products
const insertCat = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
insertCat.run('Phones', 'phones', 'Smartphones and accessories');
insertCat.run('Laptops', 'laptops', 'Laptops and notebooks');
insertCat.run('Home', 'home', 'Home appliances');

const insertProd = db.prepare('INSERT INTO products (title, slug, description, price, stock, images, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
insertProd.run('Smartphone A', 'smartphone-a', 'A great phone', 199.99, 20, JSON.stringify(['/public/images/phone1.jpg']), 1);
insertProd.run('Laptop B', 'laptop-b', 'Lightweight laptop', 599.00, 10, JSON.stringify(['/public/images/laptop1.jpg']), 2);
insertProd.run('Blender C', 'blender-c', 'Kitchen blender', 49.50, 50, JSON.stringify(['/public/images/blender1.jpg']), 3);

console.log('Database initialized at', dbFile);
db.close();
