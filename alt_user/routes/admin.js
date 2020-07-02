const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
require("dotenv").config();

// Load User model
const model = require('../models/Admin');
const Admin = model.Admin;
//SENDGRID EMAIL API KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { forwardAuthenticated, ensureAdmin } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('adminLogin'));

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('admin', {
    successRedirect: '/admin/dashboard',
    failureRedirect: '/admin/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/admin/login');
});

//Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('adminRegister'));

//Register 
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('authorRegister', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        Admin.findOne({ email: email })
            .then(user => {
                if (user) {
                    errors.push({ msg: 'Email already exists' });
                    res.render('adminLogin', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                } else {
                    const newAdmin = new Admin({
                        name,
                        email,
                        password
                    });                    
                    //hashing and storing the password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newAdmin.password, salt, (err, hash) => {
                            if (err) throw err;
                            newAdmin.password = hash;
                            newAdmin
                                .save()
                                .then(user => {
                                    console.log('Successfully created and stored admim account');
                                    const msg = {
                                        to: user.email,
                                        from: 'aditya.devsandbox@gmail.com',
                                        subject: 'Account Verification Token',
                                        html: '<strong>Hello,\n\n This is to inform you that uou have been succesfully signed up as an admin at Atlas Library Systems.' + 
                                            '.\n</strong><br>Please note this link expires in 12 hours.',
                                    };
                                    sgMail.send(msg);
                                    req.flash(
                                        'success_msg',
                                        'You have successfully been registered, kindly verify your email to login.'
                                    );
                                    res.redirect('/admin/register');
                                })
                                .catch(err => {
                                    console.log(err)
                                    req.flash(
                                        'error_msg',
                                        'There was some error, please try again later.'
                                    );
                                    res.redirect('/admin/register');
                                });
                        });
                    });
                    res.redirect('/admin/register');
                }
            })
            .catch(err => console.error(err));
    }
});

router.get('/dashboard', ensureAdmin,(req, res) => {
    res.render('adminDashboard', {user : req.user});
});

module.exports = router;
