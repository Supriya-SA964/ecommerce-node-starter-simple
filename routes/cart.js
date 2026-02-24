const express = require('express');
const router = express.Router();
const db = require('../models/db');

// get or create cart by session id
function getCart(sessionId) {
  let cart = db.prepare('SELECT * FROM carts WHERE session_id=?').get(sessionId);
  if (!cart) {
    const info = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(sessionId);
    cart = db.prepare('SELECT * FROM carts WHERE id=?').get(info.lastInsertRowid);
  }
  return cart;
}

router.get('/', (req, res) => {
  const sessionId = req.session.id;
  const cart = getCart(sessionId);
  const items = db.prepare('SELECT ci.*, p.title, p.slug, p.images FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cart.id);
  items.forEach(i => i.images = JSON.parse(i.images || '[]'));
  const total = items.reduce((s,i)=> s + (i.price * i.qty), 0);
  res.render('cart', { title: 'Cart', items, total });
});

router.post('/add', (req, res) => {
  const { productId, qty } = req.body;
  const sessionId = req.session.id;
  const cart = getCart(sessionId);
  const product = db.prepare('SELECT id, price FROM products WHERE id=?').get(productId);
  if (!product) return res.status(400).send('Product not found');
  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id, productId);
  if (existing) {
    db.prepare('UPDATE cart_items SET qty = qty + ? WHERE id=?').run(parseInt(qty,10) || 1, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (cart_id, product_id, qty, price) VALUES (?, ?, ?, ?)').run(cart.id, productId, parseInt(qty,10) || 1, product.price);
  }
  res.redirect('/cart');
});

router.post('/update', (req, res) => {
  const { itemId, qty } = req.body;
  if (qty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id=?').run(itemId);
  } else {
    db.prepare('UPDATE cart_items SET qty=? WHERE id=?').run(qty, itemId);
  }
  res.redirect('/cart');
});

router.post('/remove', (req, res) => {
  const { itemId } = req.body;
  db.prepare('DELETE FROM cart_items WHERE id=?').run(itemId);
  res.redirect('/cart');
});

module.exports = router;
