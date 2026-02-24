const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const helmet = require('helmet');
const csurf = require('csurf');

const app = express();
const PORT = process.env.PORT || 3000;

// security
app.use(helmet());

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// static
app.use('/public', express.static(path.join(__dirname, 'public')));

// parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// session
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// CSRF protection for forms
app.use(csurf());

// make csrf token + session data available in views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  res.locals.session = req.session;
  next();
});

// routes
const pages = require('./routes/pages');
const products = require('./routes/products');
const cart = require('./routes/cart');
const orders = require('./routes/orders');
const auth = require('./routes/auth');

app.use('/', pages);
app.use('/products', products);
app.use('/cart', cart);
app.use('/orders', orders);
app.use('/auth', auth);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

// error handler
app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send('Form tampered with')
  }
  console.error(err);
  res.status(500).send('Internal error');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
