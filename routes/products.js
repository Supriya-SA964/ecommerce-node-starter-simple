const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Listing
router.get('/', (req, res) => {
  const category = req.query.category;
  let products;
  if (category) {
    products = db.prepare('SELECT p.* FROM products p JOIN categories c ON p.category_id=c.id WHERE c.slug=?').all(category);
  } else {
    products = db.prepare('SELECT * FROM products').all();
  }
  res.render('products', { title: 'Products', products });
});

// Product detail
router.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  const product = db.prepare('SELECT * FROM products WHERE slug=?').get(slug);
  if (!product) return res.status(404).send('Product not found');
  product.images = JSON.parse(product.images || '[]');
  const related = db.prepare('SELECT id,title,slug,price,images FROM products WHERE category_id=? AND id!=? LIMIT 4').all(product.category_id, product.id);
  res.render('product', { title: product.title, product, related });
});

module.exports = router;
