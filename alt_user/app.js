const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const path = require('path');

//Express app init
const app = express();

// Passport Config
require('./config/auth0')(passport);
require('./config/local')(passport);

// DB Config
const db = 'mongodb://localhost:27017/test';
const dbonline = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose
  .connect(
    dbonline,
    { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

//public folder
app.use('/static', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Express session Have to change
app.use(
  session({
    secret: 'LoxodontaElephasMammuthusPalaeoloxodonPrimelephas',
    resave: false,
    saveUninitialized: false
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.success_tx = req.flash('success_tx');
  res.locals.link = req.flash('link');
  res.locals.error_tx = req.flash('error_tx');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

//Middleware for isAuthenticated
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));
app.use('/app', require('./routes/dapp.js'));
app.use('/author', require('./routes/author.js'));
app.use('/admin', require('./routes/admin.js'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
