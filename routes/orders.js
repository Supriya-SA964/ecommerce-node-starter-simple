const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { body, validationResult } = require('express-validator');

function getCart(sessionId) {
  let cart = db.prepare('SELECT * FROM carts WHERE session_id=?').get(sessionId);
  if (!cart) {
    const info = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(sessionId);
    cart = db.prepare('SELECT * FROM carts WHERE id=?').get(info.lastInsertRowid);
  }
  return cart;
}

router.get('/checkout', (req, res) => {
  const sessionId = req.session.id;
  const cart = getCart(sessionId);
  const items = db.prepare('SELECT ci.*, p.title, p.slug, p.images FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cart.id);
  const total = items.reduce((s,i)=> s + (i.price * i.qty), 0);
  res.render('checkout', { title: 'Checkout', items, total, errors: null, form: {} });
});

router.post('/place', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('address').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const sessionId = req.session.id;
    const cart = getCart(sessionId);
    const items = db.prepare('SELECT ci.*, p.title, p.slug, p.images FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cart.id);
    const total = items.reduce((s,i)=> s + (i.price * i.qty), 0);
    return res.render('checkout', { title: 'Checkout', items, total, errors: errors.array(), form: req.body });
  }

  const sessionId = req.session.id;
  const cart = getCart(sessionId);
  const items = db.prepare('SELECT ci.*, p.title, p.slug FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?').all(cart.id);
  const total = items.reduce((s,i)=> s + (i.price * i.qty), 0);
  const orderNo = 'ORD' + Date.now();
  const shippingInfo = JSON.stringify({
    name: req.body.name,
    email: req.body.email,
    address: req.body.address
  });

  const created = db.prepare('INSERT INTO orders (order_no, total_amount, shipping_info, status) VALUES (?, ?, ?, ?)').run(orderNo, total, shippingInfo, 'Placed');
  const orderId = created.lastInsertRowid;

  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)');
  for (const it of items) {
    insertItem.run(orderId, it.product_id, it.qty, it.price);
  }

  db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);

  res.redirect(`/orders/confirmation/${orderNo}`);
});

router.get('/confirmation/:orderNo', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_no=?').get(req.params.orderNo);
  if (!order) return res.status(404).send('Order not found');
  order.items = db.prepare('SELECT oi.*, p.title FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?').all(order.id);
  res.render('order-confirmation', { title: 'Order Confirmed', order });
});

module.exports = router;
