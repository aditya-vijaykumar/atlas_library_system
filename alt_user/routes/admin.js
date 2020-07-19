const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const skynet = require('@nebulous/skynet');
const fs = require('fs-extra');
require("dotenv").config();

// Load User model
const model = require('../models/Admin');
const modelA = require('../models/Author');
const modelU = require('../models/User');
const Admin = model.Admin;
const DraftBook = modelA.DraftBook;
const Books = modelU.Books;

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

router.get('/review', ensureAdmin, (req, res) => {
    DraftBook.find({ admin_approve_request : true})
    .then(data => {
        res.render('adminReview', { data : data})
    })
    .catch(err => console.error(err));
});

router.get('/approved', ensureAdmin, (req, res) => {
    DraftBook.find({ admin_approved : true})
    .then(data => {
        res.render('adminApproved', { data : data})
    })
    .catch(err => console.error(err));
});

router.get('/rejected', ensureAdmin, (req, res) => {
    DraftBook.find({ admin_revert : true})
    .then(data => {
        res.render('adminReject', { data : data})
    })
    .catch(err => console.error(err));
});

router.get('/:bookid', ensureAdmin, (req, res) => {
    DraftBook.findOne({ _id : req.params.bookid})
    .then(data => {
        console.log(data);
        res.render('adminBook', {data})
    })
    .catch(err => console.error(err));
});

router.get('/pdf/:bookid', (req, res) => {
    DraftBook.findOne({ _id : req.params.bookid})
    .then(data => res.send({location : data.book_url}))
    .catch(err => console.error(err));
});

router.get('/book/:id', ensureAdmin, (req, res) => {
    Books.findOne({ product_id: req.params.id })
        .then(data => {
            res.render('bookAdmin', { data: data});
        })
        .catch(error => {
            console.log(error);
            req.flash('error_tx', 'Invalid request, please try again later.');
            res.redirect('/admin/dashboard');
        });
});

router.post('/reject', ensureAdmin, (req,res) => {
    book_id = req.body.bookid;
    console.log(book_id);
    DraftBook.findOne({ _id : book_id})
    .then(book => {
        book.admin_approve_request = false;
        book.admin_revert = true;
        book.admin_revert_msg = req.body.revertMessage;
        book.save()
        .then(data => {
            console.log('Successfully rejected the book');
            req.flash('success_msg', 'Your request has been successfully processed.');
            res.redirect('/admin/review');
        })
    })
    .catch(err => {
        req.flash('error_msg', 'There was some error in processing your request.');
        res.redirect('/admin/review');
    })
});

router.post('/approve', ensureAdmin, (req,res) => {
    book_id = req.body.bookid;
    console.log(book_id);
    DraftBook.findOne({ _id : book_id})
    .then(book => {
        console.log('found the book');
        let product_id = Date.now();
        let image_url = book.image_url.slice(12, book.image_url.length);
            const newBook = new Books({
                book_authors : book.book_authors,
                book_desc : book.book_desc,
                book_pages : book.book_pages,
                book_title : book.book_title,
                genres : book.genres,
                image_url,
                product_id,
                book_url : book.book_url,
                book_location :book.book_location,
                author_email : book.author_email,
                book_rental : book.book_rental,
                author_ethaddress : book.author_ethaddress
            });
            newBook.save()
            .then(book => {
                console.log('Saved Book in the database.');
            })
            .catch(err => console.error(err));
            fs.remove(book.book_url, err => {
                if (err) return console.error(err)
                console.log('success!');
            });
            fs.copy(book.image_url, 'uploads' + image_url, err => {
                if (err) return console.error(err)
                console.log('successfully copied file!')
                fs.remove(book.image_url, err => {
                    if (err) return console.error(err)
                    console.log('successfully deleted copy of image!');
                });
              });
            book.image_url = image_url;
            book.admin_approved = true;
            book.admin_approve_request = false;
            book.admin_product_id = product_id;
            book.save()
            .then( done => {
                req.flash('success_msg', 'Your request has been successfully processed.');
                res.redirect('/admin/review');
            })
            .catch(err => console.error(err));      
       /* uploadFile(book.book_url)
        .then(link => {
            let book_url = link.slice(6, link.length);           
      })
      .catch(err => console.error(err)); */
    })
    .catch(err => {
        req.flash('error_msg', 'There was some error in processing your request.');
        res.redirect('/admin/review');
    })
});

async function uploadFile(ref) {
    console.log('Beginning upload of file to Sia Skynet')
    const skylink = await skynet.UploadFile(
      ref,
      skynet.DefaultUploadOptions
    );
    console.log(`Upload successful, skylink: ${skylink}`);
    return skylink;
  }

module.exports = router;
