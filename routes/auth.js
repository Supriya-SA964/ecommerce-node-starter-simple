const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcryptjs');

router.get('/register', (req, res) => res.render('register', { title: 'Register', errors: null }));
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.render('register', { errors: ['All fields required'] });
  const hash = await bcrypt.hash(password, 10);
  try {
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
    res.redirect('/auth/login');
  } catch (e) {
    res.render('register', { errors: ['User exists or error'] });
  }
});

router.get('/login', (req, res) => res.render('login', { title: 'Login', errors: null }));
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user) return res.render('login', { errors: ['Invalid credentials'] });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.render('login', { errors: ['Invalid credentials'] });
  req.session.userId = user.id;
  req.session.userName = user.name;
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
