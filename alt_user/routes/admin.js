const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const skynet = require('@nebulous/skynet');
const axios = require('axios')
const fs = require('fs-extra');
require("dotenv").config();
const aws = require('aws-sdk')

// Load User model
const model = require('../models/Admin');
const modelA = require('../models/Author');
const modelU = require('../models/User');
const Admin = model.Admin;
const DraftBook = modelA.DraftBook;
const Books = modelU.Books;

//SENDGRID EMAIL API KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//Passport Auth Guarded Routes
const { forwardAuthenticated, ensureAdmin } = require('../config/auth');

//Amazon S3 Config

const s3 = new aws.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET,
    Bucket: process.env.BUCKET_NAME
});

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

router.get('/forgot', (req, res) => {
    res.render('forgotPassword');
})

router.post('/forgot', (req, res) => {
    let token = crypto.randomBytes(20).toString('hex');
    Admin.findOne({ email: req.body.email })
        .then(user => {
            user.passwordResetToken = token;
            user.passwordResetExpires = Date.now() + 3600000; // 1 hour
            user.save()
                .then(update => {
                    const msg = {
                        to: user.email,
                        from: 'atlas@adityavijaykumar.me',
                        subject: 'Password Reset Link',
                        text: 'You are receiving this mail because we recieved a request to reset the password for your account.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            '\nhttp:\/\/' + req.hostname + '\/admin\/reset\/' + token + '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
                            'Please note this link will expire in 60 minutes.\n' +
                            'Regards,\n Team Atlas.\n',
                    };
                    sgMail.send(msg);
                    req.flash(
                        'success_msg',
                        'The password reset link has been sent to your email.'
                    );
                    res.redirect('/admin/forgot');
                })
                .catch(err => {
                    console.error(err);
                    req.flash(
                        'error_msg',
                        'An error occured, please try again later.'
                    );
                    res.redirect('/admin/forgot');
                });
        })
        .catch(err => {
            console.error(err);
            req.flash(
                'error_msg',
                'There is no admin account registered for this email.'
            );
            res.redirect('/admin/forgot');
        });
});


router.get('/reset/:token', (req, res) => {
    Admin.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/admin/forgot');
        }
        res.render('resetPassword', {
            user: user, token: req.params.token
        });
    });
});
router.post('/reset/:token', (req, res) => {
    let token = req.params.token;
    Admin.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/admin/forgot');
        }
        if (req.body.password != req.body.password2) {
            req.flash('error_msg', 'Passwords do not match.');
            return res.redirect('/admin/reset/' + token);
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) throw err;
                user.password = hash;
                user.save()
                    .then(user => {
                        console.log('Successfully reset account password.');
                        const msg = {
                            to: user.email,
                            from: 'atlas@adityavijaykumar.me',
                            subject: 'Account Password Reset',
                            text: 'Hello,\n\n' +
                                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n',
                        };
                        sgMail.send(msg);
                        req.flash(
                            'success_msg',
                            'Successfully changed your account password. Login to continue.'
                        );
                        res.redirect('/admin/login');
                    })
                    .catch(err => {
                        console.log(err)
                        req.flash(
                            'error_msg',
                            'There was some error, please try again later.'
                        );
                        res.redirect('/admin/login');
                    });
            });
        });
    });
});

router.get('/dashboard', ensureAdmin, (req, res) => {
    res.render('adminDashboard', { user: req.user });
});

router.get('/review', ensureAdmin, (req, res) => {
    DraftBook.find({ admin_approve_request: true })
        .then(data => {
            res.render('adminReview', { data: data })
        })
        .catch(err => console.error(err));
});

router.get('/approved', ensureAdmin, (req, res) => {
    DraftBook.find({ admin_approved: true })
        .then(data => {
            res.render('adminApproved', { data: data })
        })
        .catch(err => console.error(err));
});

router.get('/rejected', ensureAdmin, (req, res) => {
    DraftBook.find({ admin_revert: true })
        .then(data => {
            res.render('adminReject', { data: data })
        })
        .catch(err => console.error(err));
});

router.get('/revenue', ensureAdmin, (req, res) => {
    res.render('adminRevenue', { user: req.user });
})

router.get('/:bookid', ensureAdmin, (req, res) => {
    if (req.params.bookid.match(/^[0-9a-fA-F]{24}$/)) {
        DraftBook.findById(req.params.bookid)
            .then(data => {
                console.log(data);
                res.render('adminBook', { data })
            })
            .catch(err => console.error(err));
    }
});

router.get('/pdf/:bookid', ensureAdmin, (req, res) => {
    if (req.params.bookid.match(/^[0-9a-fA-F]{24}$/)) {
        DraftBook.findById(req.params.bookid)
            .then(data => res.send({ location: data.book_url }))
            .catch(err => console.error(err));
    }
});

router.get('/book/:id', ensureAdmin, (req, res) => {
    let id = req.params.id;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        DraftBook.findById(id)
            .then(data => {
                res.render('bookAdmin', { data: data });
            })
            .catch(error => {
                console.log(error);
                req.flash('error_tx', 'Invalid request, please try again later.');
                res.redirect('/admin/dashboard');
            });
    } else {
        Books.findOne({ product_id: req.params.id })
            .then(data => {
                res.render('bookAdmin', { data: data });
            })
            .catch(error => {
                console.log(error);
                req.flash('error_tx', 'Invalid request, please try again later.');
                res.redirect('/admin/dashboard');
            });
    }

});


router.post('/reject', ensureAdmin, (req, res) => {
    book_id = req.body.bookid;
    console.log(book_id);
    if (book_id.match(/^[0-9a-fA-F]{24}$/)) {
        DraftBook.findById(book_id)
            .then(book => {
                const paramsOne = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: book.book_key
                };
                const paramsTwo = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: book.image_key
                };
                s3.deleteObject(paramsOne, function (err, data) {
                    if (err) console.log(err);
                    else
                        console.log(
                            "Successfully deleted file from bucket");
                    console.log(data);
                });
                s3.deleteObject(paramsTwo, function (err, data) {
                    if (err) console.log(err);
                    else
                        console.log(
                            "Successfully deleted image from bucket");
                    console.log(data);
                });
                book.admin_approve_request = false;
                book.admin_revert = true;
                book.admin_revert_msg = req.body.revertMessage;
                book.save()
                    .then(data => {
                        console.log('Successfully rejected the book');
                        req.flash('success_msg', 'Your request has been successfully processed.');
                        res.redirect('/admin/review');
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => {
                req.flash('error_msg', 'There was some error in processing your request.');
                res.redirect('/admin/review');
            })
    }
});

router.post('/approve', ensureAdmin, (req, res) => {
    book_id = req.body.bookid;
    console.log(book_id);
    if (book_id.match(/^[0-9a-fA-F]{24}$/)) {
        DraftBook.findById(book_id)
            .then(book => {
                console.log('found the book');
                const file = "./docs/" + book.book_key;
                downloadPDF(book.book_url, file)
                    .then(resolve => {
                        uploadFile(file)
                            .then(link => {
                                let book_url = link.slice(6, link.length);
                                console.log('Sia link' + link);
                                console.log('\n book link' + book_url);

                                let product_id = Date.now();
                                let image_url = book.image_url;

                                const newBook = new Books({
                                    book_authors: book.book_authors,
                                    book_desc: book.book_desc,
                                    book_pages: book.book_pages,
                                    book_title: book.book_title,
                                    genres: book.genres,
                                    image_url,
                                    product_id,
                                    book_url,
                                    book_location: book.book_location,
                                    author_email: book.author_email,
                                    book_rental: book.book_rental,
                                    author_ethaddress: book.author_ethaddress
                                });

                                newBook.save()
                                    .then(book => {
                                        console.log('Saved Book in the database.');
                                    })
                                    .catch(err => console.error(err));

                                const params = {
                                    Bucket: process.env.BUCKET_NAME,
                                    Key: book.book_key
                                };

                                s3.deleteObject(params, function (err, data) {
                                    if (err) console.log(err);
                                    else
                                        console.log(
                                            "Successfully deleted file from bucket");
                                    console.log(data);
                                });

                                fs.remove(file, err => {
                                    if (err) return console.error(err)
                                    console.log('success, fs deleted file!');
                                });

                                book.admin_approved = true;
                                book.admin_approve_request = false;
                                book.admin_product_id = product_id;
                                book.save()
                                    .then(done => {
                                        req.flash('success_msg', 'Your request has been successfully processed.');
                                        res.redirect('/admin/review');
                                    })
                                    .catch(err => console.error(err));

                            })
                            .catch(err => console.error(err));
                    })
                    .catch(err => console.error(err));

            })
            .catch(err => {
                req.flash('error_msg', 'There was some error in processing your request.');
                res.redirect('/admin/review');
            })
    }
});

async function uploadFile(ref) {
    console.log('Beginning upload of file to Sia Skynet')
    const skylink = await skynet.UploadFile(
        ref,
        skynet.DefaultUploadOptions
    );
    console.log(`Upload successful, skylink: ${skylink}`);
    return skylink;
};

async function downloadPDF(url, path) {
    const writer = fs.createWriteStream(path)

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

module.exports = router;
