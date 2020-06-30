const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const sha3 = require('js-sha3');
const multer = require('multer');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const privateToAccount = require('ethjs-account').privateToAccount;
require("dotenv").config();

//Mongoose data models
const model = require('../models/Author');
const Author = model.Author;
const AuthorProfile = model.AuthorProfile;
const Token = model.Token;
//SENDGRID EMAIL API KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
//Guarded Route functions
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');

//Multer 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        let account = req.user._id;
        let date = Date.now();
        if (file.mimetype === 'image/jpg') {
            let name = account + file.fieldname + '-' + date + '.jpg';
            cb(null, name);
        } else if (file.mimetype === 'image/jpeg') {
            let name = account + file.fieldname + '-' + date + '.jpeg';
            cb(null, name);
        } else if (file.mimetype === 'image/png') {
            let name = account + file.fieldname + '-' + date + '.png';
            cb(null, name);
        }
    }
});
const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('authorLogin'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('authorRegister'));

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
        Author.findOne({ email: email })
            .then(user => {
                if (user) {
                    errors.push({ msg: 'Email already exists' });
                    res.render('authorRegister', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                } else {
                    let ethaddress = 'test';
                    const newAuthor = new Author({
                        name,
                        email,
                        password,
                        ethaddress
                    });
                    //address generation
                    const salt = 'f1nd1ngn3m0i54e50me';
                    console.log(newAuthor.email);
                    let generated_address = privateToAccount(sha3.keccak256(salt + newAuthor.email)).address.toLowerCase();
                    console.log(generated_address);
                    newAuthor.ethaddress = generated_address;
                    //hashing and storing the password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newAuthor.password, salt, (err, hash) => {
                            if (err) throw err;
                            newAuthor.password = hash;
                            newAuthor
                                .save()
                                .then(user => {
                                    console.log('Successfully created and stored author account');
                                    const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
                                    token
                                        .save()
                                        .then(token => {
                                            const msg = {
                                                to: user.email,
                                                from: 'aditya.devsandbox@gmail.com',
                                                subject: 'Account Verification Token',
                                                html: '<strong>Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.hostname + ':' + req.connection.localPort + '\/author\/confirmation\/' + token._userId + '\/' + token.token +
                                                    '.\n</strong><br>Please note this link expires in 12 hours.',
                                            };
                                            sgMail.send(msg);
                                            req.flash(
                                                'success_msg',
                                                'You have successfully been registered, kindly verify your email to login.'
                                            );
                                            res.redirect('/author/login');
                                        })
                                        .catch(err => {
                                            console.log(err)
                                            req.flash(
                                                'error_msg',
                                                'There was some error, please try again later.'
                                            );
                                            res.redirect('/author/login');
                                        });
                                })
                                .catch(err => {
                                    console.log(err)
                                    req.flash(
                                        'error_msg',
                                        'There was some error, please try again later.'
                                    );
                                    res.redirect('/author/login');
                                });
                        });
                    });
                    res.redirect('/author/login');
                }
            })
            .catch(err => console.error(err));
    }
});

router.get('/confirmation/:user/:token', (req, res) => {
    let user = req.params.user;
    let token = req.params.token;
    Token.findOne({ token })
        .then(val => {
            Author.findOne({ _id: val._userId, _id: user })
                .then(user => {
                    if (!user.isVerified) {
                        user.isVerified = true;
                        user.save()
                            .then(update => {
                                //creating a new author profile
                                const newAuthorProfile = new AuthorProfile({
                                    email: user.email
                                });
                                newAuthorProfile.save()
                                    .then(profile => console.log('Created new profile after verifying email id.'))
                                    .catch(err => console.error(err));
                                //sending success message to user
                                req.flash(
                                    'success_msg',
                                    'Email has been verified'
                                );
                                res.redirect('/author/login');
                            })
                            .catch(err => {
                                console.error(err);
                                req.flash(
                                    'error_msg',
                                    'There was an error in verifying the email, please try after a few minutes.'
                                );
                                res.redirect('/author/login');
                            })
                    } else {
                        req.flash(
                            'success_msg',
                            'The Email has already been verified, login to continue.'
                        );
                        res.redirect('/author/login');
                    }
                })
                .catch(err => {
                    req.flash(
                        'error_msg',
                        'Could not verify your account, please contact our support.'
                    );
                    res.redirect('/author/login');
                });
        })
        .catch(err => {
            req.flash(
                'error_msg',
                'Could not verify your account. Looks like the email verification link has expired. Please request a new link.'
            );
            res.redirect('/author/login');
        })
});

router.get('/resendlink', (req, res) => {
    res.render('newLink');
});

router.post('/resendlink', (req, res) => {
    Author.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
            req.flash(
                'error_msg',
                'We were unable to find a user with that email.'
            );
            res.redirect('/author/resendlink');
        }
        if (user.isVerified) {
            req.flash(
                'error_msg',
                'The account has already been verified, please login to continue.'
            );
            res.redirect('/author/resendlink');
        }

        // Create a verification token, save it, and send email
        const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Send the email
            const msg = {
                to: user.email,
                from: 'aditya.devsandbox@gmail.com',
                subject: 'Account Verification Link',
                html: '<strong>Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.hostname + ':' + req.connection.localPort + '\/author\/confirmation\/' + token._userId + '\/' + token.token + '.\n</strong><br>Please note this link expires in 12 hours.',
            };
            sgMail.send(msg);
            req.flash(
                'success_msg',
                'A new link has been generated and sent, please check your email and verify.'
            );
            res.redirect('/author/login');
        });

    });
});

router.get('/forgot', (req, res) => {
    res.render('forgotPassword');
});

router.post('/forgot', (req, res) => {
    let token = crypto.randomBytes(20).toString('hex');
    Author.findOne({ email: req.body.email })
        .then(user => {
            user.passwordResetToken = token;
            user.passwordResetExpires = Date.now() + 3600000; // 1 hour
            user.save()
                .then(update => {
                    const msg = {
                        to: user.email,
                        from: 'aditya.devsandbox@gmail.com',
                        subject: 'Password Reset Link',
                        text: 'You are receiving this mail because we recieved a request to reset the password for your account.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
                            'Please note this link will expire in 60 minutes.\n' +
                            'Regards,\n Team Atlas.\n',
                    };
                    sgMail.send(msg);
                    req.flash(
                        'success_msg',
                        'The password reset link has been sent to your email.'
                    );
                    res.redirect('/author/forgot');
                })
                .catch(err => {
                    console.error(err);
                    req.flash(
                        'error_msg',
                        'An error occured, please try again later.'
                    );
                    res.redirect('/author/forgot');
                });
        })
        .catch(err => {
            console.error(err);
            req.flash(
                'error_msg',
                'There is no account registered for this email.'
            );
            res.redirect('/author/forgot');
        });

});

router.get('/reset/:token', (req, res) => {

    Author.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/author/forgot');
        }
        res.render('resetPassword', {
            user: user, token: req.params.token
        });
    });
});

router.post('/reset/:token', (req, res) => {
    let token = req.params.token;
    Author.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/author/forgot');
        }

        if (req.body.password != req.body.password2) {
            req.flash('error_msg', 'Passwords do not match.');
            return res.redirect('/author/reset/' + token);
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
                            from: 'aditya.devsandbox@gmail.com',
                            subject: 'Account Password Reset',
                            text: 'Hello,\n\n' +
                                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n',
                        };
                        sgMail.send(msg);
                        req.flash(
                            'success_msg',
                            'Successfully changed your account password. Login to continue.'
                        );
                        res.redirect('/author/login');
                    })
                    .catch(err => {
                        console.log(err)
                        req.flash(
                            'error_msg',
                            'There was some error, please try again later.'
                        );
                        res.redirect('/author/login');
                    });
            });
        });

    });
});

router.get('/profile', ensureAuthenticated, (req, res) => {
    AuthorProfile.findOne({ email : req.user.email }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Unable to access author profile.');
            return res.redirect('/author/dashboard');
        }
        res.render('authorProfile', { user: req.user, profile : user });
    });
});


router.get('/updateprofile', ensureAuthenticated, (req, res) => {
    AuthorProfile.findOne({ email : req.user.email }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Unable to access author profile.');
            return res.redirect('/author/dashboard');
        }
        res.render('updateauthorprofile', { user: req.user, profile : user });
    });
});

router.get('/book', ensureAuthenticated, (req, res) => {
   res.render('authorBooks', { user: req.user });   
});
router.get('/account', ensureAuthenticated, (req, res) => {
    res.render('authorAccount', { user: req.user});
});


router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('authorDashboard', { user: req.user });
});

router.get('/about', ensureAuthenticated, (req, res) => {
    res.render('authorAbout', { user: req.user });
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('author-signup', {
        successRedirect: '/author/dashboard',
        failureRedirect: '/author/login',
        failureFlash: true
    })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/author/login');
});

router.post('/updateprofile', upload.single('profileImage'), ensureAuthenticated, (req, res) => {
    if (req.file) {
        console.log('Uploading file...');
        AuthorProfile.findOne({ email: req.user.email })
            .then(profile => {
                console.log('The file path : ' + req.file.path);
                profile.fullName = req.body.fullName;
                profile.username = req.body.username;
                profile.bio = req.body.bio;
                profile.location = req.body.location;
                profile.twitter = req.body.twitter;
                profile.website = req.body.website;
                profile.profilePicture = req.file.path;

                profile.save()
                    .then(data => {
                        console.log('Successfully updated profile');
                        req.flash('success_msg', 'Profile has been successfully updated');
                        res.redirect("/author/dashboard");
                    })
                    .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }
    else {
        AuthorProfile.findOne({ email: req.user.email })
            .then(profile => {
                profile.fullName = req.body.fullName;
                profile.username = req.body.username;
                profile.bio = req.body.bio,
                    profile.location = req.body.location,
                    profile.twitter = req.body.twitter,
                    profile.website = req.body.website,

                    profile.save()
                        .then(data => {
                            console.log('Successfully updated profile without image');
                            req.flash('success_msg', 'Profile has been successfully updated');
                            res.redirect("/author/dashboard");
                        })
                        .catch(err => console.error(err));
            })
            .catch(err => console.error(err));
    }
});

module.exports = router;