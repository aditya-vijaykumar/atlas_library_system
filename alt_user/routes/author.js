const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
require("dotenv").config();

//Mongoose data models
const model = require('../models/Author');
const models = require('../models/User');
const Author = model.Author;
const AuthorProfile = model.AuthorProfile;
const DraftBook = model.DraftBook;
const Token = model.Token;
const User = models.User;
const Books = models.Books;

//SENDGRID EMAIL API KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//Guarded Route functions
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');
const { route } = require('.');

//Multer Uploads
const { upload, uploadDrafts } = require('../config/upload');

//Various Routes
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

                                //Updating user profile permissions
                                User.findOneAndUpdate({email : user.email}, {role : "author"})
                                .then(done => console.log('user permission upgraded'))
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

router.get('/profile', ensureAuthenticated, (req, res) => {
    AuthorProfile.findOne({ email : req.session.user.email })
        .then(user =>{
            res.render('authorProfile', { user: req.session.user, profile : user });
        })
        .catch(err => {
            console.error(err);
            req.flash('error_msg', 'Unable to access author profile.');
            res.redirect('/author/dashboard');
        });
});


router.get('/updateprofile', ensureAuthenticated, (req, res) => {
    AuthorProfile.findOne({ email : req.session.user.email })
        .then(user =>{
            res.render('updateauthorprofile', { user: req.session.user, profile : user });
        })
        .catch(err => {
            console.error(err);
            req.flash('error_msg', 'Unable to access author profile.');
            res.redirect('/author/dashboard');
        });
});

router.get('/book', ensureAuthenticated, (req, res) => {
    DraftBook.find({author_email : req.session.user.email})
    .then(drafts => {
        return drafts;})
    .then(drafts => {
        Books.find({author_email : req.session.user.email})
        .then(books => {
            res.render('authorBookTable', { user: req.session.user, books : books, drafts : drafts })
        })
    })
    .catch(err => console.error(err));   
});
router.get('/account', ensureAuthenticated, (req, res) => {
    res.render('authorAccount', { user: req.session.user});
});


router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('authorDashboard', { user: req.session.user });
});

router.get('/about', ensureAuthenticated, (req, res) => {
    res.render('authorAbout', { user: req.session.user });
});

router.get('/newdraft', ensureAuthenticated, (req, res) => {
    AuthorProfile.findOne({ email : req.session.user.email }, function (err, user) {
        if (!user) {
            req.flash('error_msg', 'Unable to process your request.');
            return res.redirect('/author/dashboard');
        }
        res.render('authorNewDraft', { user: req.session.user, profile : user });
    });
}); 

router.post('/updateprofile', upload.single('profileImage'), ensureAuthenticated, (req, res) => {
    if (req.file) {
        console.log('Uploading file...');
        AuthorProfile.findOne({ email: req.session.user.email })
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
        AuthorProfile.findOne({ email: req.session.user.email })
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

router.post('/bookapproval', ensureAuthenticated, uploadDrafts.fields([{
    name: 'coverimage', maxCount: 1
  }, {
    name: 'bookpdf', maxCount: 1
  }]),(req, res) => {
    if (req.files) {
        console.log('\n Uploading files... \n');
        const newDraftBook = new DraftBook({
            book_authors : req.body.author,
            book_desc : req.body.description,
            book_pages : req.body.pages, 
            book_title : req.body.title, 
            genres : req.body.genre, 
            image_url : req.files.coverimage[0].path,
            author_email : req.session.user.email,
            author_username : req.session.user.username,
            book_url : req.files.bookpdf[0].path,
            book_location : req.body.title.replace(/\s/g, ''),
            book_rental_price : req.body.rental,
            admin_approve_request : true
        });
        console.log('\n This is image' + req.files.coverimage[0].path);
        console.log('\n This is pdf' + req.files.bookpdf[0].path);
        newDraftBook.save()
        .then(draft =>{
            req.flash('success_msg', 'The draft book has been successfully saved and sent for approval.');
            res.redirect('/author/book');
        })
        .catch(err => console.error(err));
    }
    else {
        req.flash('error_msg', 'Cannot send draft for approval without cover image and/or book pdf.');
        res.redirect('/author/book');

    }
});

router.get('/:bookid', ensureAuthenticated, (req, res) => {
    DraftBook.findOne({_id : req.params.bookid})
    .then(data => {
        res.render('authorBook', {data : data});
    })
})

module.exports = router;