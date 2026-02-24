const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Home page
router.get('/', (req, res) => {
  const products = db.prepare('SELECT id, title, slug, price, images FROM products ORDER BY created_at DESC LIMIT 8').all();
  res.render('index', { title: 'Home', products });
});

// About
router.get('/about', (req, res) => res.render('about', { title: 'About Us' }));

// Contact (GET)
router.get('/contact', (req, res) => res.render('contact', { title: 'Contact Us', errors: null }));

// Contact (POST)
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.render('contact', { title: 'Contact Us', errors: ['All fields required'] });
  }
  res.render('contact', { title: 'Contact Us', success: 'Message submitted.', errors: null });
});

// Search
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  const products = q ? db.prepare('SELECT id,title,slug,price,images FROM products WHERE title LIKE ? OR description LIKE ?').all('%' + q + '%','%' + q + '%') : [];
  res.render('search', { title: 'Search', q, products });
});

module.exports = router;
