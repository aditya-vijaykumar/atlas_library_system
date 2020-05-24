const express = require('express');
const router = express.Router();
const passport = require('passport');
const sha3 = require('js-sha3');
const axios = require('axios');
const privateToAccount = require('ethjs-account').privateToAccount;
const {forwardAuthenticated } = require('../config/auth');
require("dotenv").config();
const secured = (req, res, next) => {
  if (req.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/users/login");
};

// Load mongoose data models
const model = require('../models/User');
const books = model.Books;
const User = model.User;
const rental = model.Rentals;
const transaction = model.Transactions;

//api values
let contract_address = "0xd65608ebffe1c417dd5ec845a6011013e602cc7c";
let api_key = process.env.ETHVIGIL_API_KEY;
let rest_api_endpoint = 'https://beta-api.ethvigil.com/v0.1';
let headers = {headers: {'accept': 'application/json', 'Content-Type': 'application/json', 'X-API-KEY': api_key}};

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard Page
router.get('/dashboard', secured, (req, res) =>{
  const email = req.user._json.email;  
  User.findOne({ email: email })
  .then(returndata => {
    const ethaddress = returndata.ethaddress;
    rental.find({email: email})
    .then(data => { 
        res.render('dashboard', {data : data, user : req.user, count : data.length, ethaddress: ethaddress});
      })
    .catch(error =>{
        console.log(error);
        req.flash('error_tx', 'Invalid request, please try again later.');
        res.redirect('/app/browse');
      });
  }).catch(error =>{
    console.log(error);
    req.flash('error_tx', 'Invalid request, please try again later.');
    res.redirect('/app/browse');
  });
});

// About Page
router.get('/about', secured, (req, res) =>
  res.render('about', {
    user: req.user
  }));

//auth0 callback with ethereum address generation
router.get("/callback", (req, res, next) => {
  passport.authenticate("auth0", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
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
          console.log('The EthAddress: '+ user.ethaddress);
          const returnTo = req.session.returnTo;
          delete req.session.returnTo;
          res.locals.user = req.user;
          res.redirect(returnTo || "/dashboard");
        }else {
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
          let generated_address = privateToAccount(sha3.keccak256(salt+email)).address.toLowerCase();
          console.log('Generated address '+generated_address);
          newUser.ethaddress = generated_address;
          //api post variables
          let method_args = {'_newUser': generated_address};
          let method_api_endpoint = rest_api_endpoint+'/contract/'+contract_address+'/newUser';
          //
          //post call
          axios.post(method_api_endpoint, method_args, headers)
          .then((response) => {
            var success = response.data.success;
            var txHash = response.data.data[0].txHash;
            console.log('SUCCESS: '+ success);
            console.log('TRANSACTION HASH: '+ txHash);
            //upon successful address registration on the contract
            if(success) {
              console.log('Success message trigerred');
              //storing user in the database
              newUser.save()
                    .then(user => {
                      console.log('Successfully generated and stored new account');
                      const returnTo = req.session.returnTo;
                      delete req.session.returnTo;
                      res.locals.user = req.user;
                      res.redirect(returnTo || "/dashboard");
                    })
                    .catch(err => console.log(err));
              let Type = 'Credit';
              let token = 0.1;
              const newTransaction = new transaction({
                  token,
                  Type,
                  TxHash : txHash,
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
            if(!success){
              console.log('Error! Unsuccessfull in generating and storing new account');
            } 
        })
        //unsuccessful connection 
        .catch((error) => {
          console.log(error);
          console.log('Error in connecting to the smart contract');
        });
        }
      });
    });
  })(req, res, next);
});

module.exports = router;
