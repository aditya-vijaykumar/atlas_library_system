const express = require('express');
const router = express.Router();
const passport = require('passport');
const sha3 = require('js-sha3');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const privateToAccount = require('ethjs-account').privateToAccount;
const { forwardAuthenticated } = require('../config/auth');
require("dotenv").config();

const { secured } = require('../config/auth');

// Load mongoose data models
const model = require('../models/User');
const books = model.Books;
const User = model.User;
const rental = model.Rentals;
const transaction = model.Transactions;
//Mongoose data models
const models = require('../models/Author');
const AuthorProfile = models.AuthorProfile;
const Author = models.Author;
const Token = models.Token;

//api values
let contract_address = "0xd475d181a3217b84073a5d31762c30fae955c014";
let api_key = process.env.MATICVIGIL_API_KEY;
let rest_api_endpoint = 'https://mainnet-api.maticvigil.com/v1.0';
let headers = { headers: { 'accept': 'application/json', 'Content-Type': 'application/json', 'X-API-KEY': api_key } };
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Welcome Page
router.get('/', (req, res) => res.render('welcome'));

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Dashboard Page
router.get('/dashboard', secured, (req, res) => {
  const email = req.session.user.email;
  const ethaddress = req.session.user.ethaddress;
  rental.find({ email: email })
    .then(data => {
      res.render('dashboard', { data: data, user: req.session.user, count: data.length, ethaddress: ethaddress });
    })
    .catch(error => {
      console.log(error);
      req.flash('error_tx', 'Invalid request, please try again later.');
      res.redirect('/app/browse');
    });
});

// About Page
router.get('/about', (req, res) => res.render('about'));


router.get('/author-signup', secured, (req, res) => res.render('become-author', { user: req.session.user }));

router.get('/author-enroll', (req, res) => {
  Author.findOne({ email: req.session.email })
    .then(author => {
      if (author) {
        if (author.isVerified) {
          req.flash(
            'success_msg',
            'You have stumbled upon the wrong page, you are already an author.'
          );
          res.redirect('/author-signup');
        } else {
          req.flash(
            'success_msg',
            'Your author profile request has already been recieved. Please confirm with the link sent to your email or request for a new one.'
          );
          res.redirect('/author-signup');
        }
      }
      if (!author) {
        let ethaddress = req.session.user.ethaddress;
        let name = req.session.user.name;
        let email = req.session.user.email;
        const newAuthor = new Author({
          name,
          email,
          ethaddress
        });
        newAuthor.save()
          .then(user => {
            console.log('Successfully created and stored author account');
            const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
            token.save()
              .then(token => {
                const msg = {
                  to: user.email,
                  from: 'aditya.devsandbox@gmail.com',
                  subject: 'Author Account Confirmation',
                  html: '<strong>Hello,\n\n' + 'Please verify your author account upgrade request by clicking the link: \nhttp:\/\/' + req.hostname + '\/author\/confirmation\/' + token._userId + '\/' + token.token +
                    '.\n</strong><br>Please note this link expires in 12 hours.' +
                    '.\n<br><br>In case you failed to verify within 12 hours, you can request a new link by visiting : \nhttp:\/\/' + req.hostname + '\/author\/resendlink\/',
                };
                sgMail.send(msg);
                req.flash(
                  'success_msg',
                  'Your author account creation process has been recieved. Please complete it by clicking on the link sent to your email.'
                );
                res.redirect('/author-signup');
              })
              .catch(err => {
                console.error(err);
                req.flash(
                  'error_msg',
                  'There was some error, please try again later.'
                );
                res.redirect('/author-signup');
              });
          })
          .catch(err => {
            console.error(err);
            req.flash(
              'error_msg',
              'There was some error, please try again later.'
            );
            res.redirect('/author-signup');
          });
      }
    })
    .catch(err => {
      console.error(err);
      req.flash(
        'error_msg',
        'There was some error, please try again later.');
      res.redirect('/author-signup');
    });
});


//auth0 callback with ethereum address generation
router.get("/callback", (req, res, next) => {
  passport.authenticate("auth0", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      //check if new user
      let email = req.user._json.email;
      User.findOne({ email: email })
        .then(user => {
          if (user) {
            console.log('User found in local database');
            console.log('The EthAddress: ' + user.ethaddress);
            const returnTo = req.session.returnTo;
            delete req.session.returnTo;
            res.locals.user = req.user;
            req.session.user = user;
            res.redirect(returnTo || "/dashboard");
          } if (!user) {
            let user_id = Date.now();
            let ethaddress = 'test';
            let name = req.user.displayName;
            const newUser = new User({
              name,
              email,
              ethaddress,
              user_id
            });
            //address generation
            const salt = '';
            console.log(email);
            let generated_address = privateToAccount(sha3.keccak256(salt + email)).address.toLowerCase();
            console.log('Generated address ' + generated_address);
            newUser.ethaddress = generated_address;
            //api post variables
            let method_args = { '_newUser': generated_address };
            let method_api_endpoint = rest_api_endpoint + '/contract/' + contract_address + '/newUser';
            //post call
            axios.post(method_api_endpoint, method_args, headers)
              .then((response) => {
                var success = response.data.success;
                var txHash = response.data.data[0].txHash;
                console.log('SUCCESS: ' + success);
                console.log('TRANSACTION HASH: ' + txHash);
                //upon successful address registration on the contract
                if (success) {
                  console.log('Success message trigerred');
                  //storing user in the database
                  newUser.save()
                    .then(user => {
                      console.log('Successfully generated and stored new account');
                      const returnTo = req.session.returnTo;
                      delete req.session.returnTo;
                      res.locals.user = req.user;
                      req.session.user = user;
                      res.redirect(returnTo || "/dashboard");
                    })
                    .catch(err => console.log(err));
                  let Type = 'Credit';
                  let token = 0.1;
                  const newTransaction = new transaction({
                    token,
                    Type,
                    TxHash: txHash,
                    email
                  });
                  newTransaction
                    .save()
                    .then(transaction => {
                      console.log('Successfully recorded transaction');
                    })
                    .catch(err => {
                      console.log('Failed to record transaction');
                      console.log(err);
                    });
                }
                //upon unsuccesful address registration on the blockchain
                if (!success) {
                  console.log('Error! Unsuccessfull in generating and storing new account');
                }
              })
              //unsuccessful api call 
              .catch((error) => {
                console.log(error);
                console.log('Error in connecting to the smart contract');
              });
          }
        });
    });
  })(req, res, next);
});

router.get('/:username', (req, res) => {
  AuthorProfile.findOne({ username: req.params.username })
    .then(user => {
      if (user) {
        res.render('profile', { profile: user });
      }
      if (!user) {
        req.flash('error_msg', 'Unable to access author profile.');
        res.redirect('/');
      }
    })
    .catch(err => {
      console.log(err);
      req.flash('error_msg', 'Author profile does not exist.');
      res.redirect('/');
    });
});


module.exports = router;
