const express = require('express');
const router = express.Router();
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
require("dotenv").config();
const skynet = require('@nebulous/skynet');
const fs = require('fs');
const path = require('path');

const { secured } = require('../config/auth');

// mongoose data models
const model = require('../models/User');
const books = model.Books;
const User = model.User;
const rental = model.Rentals;
const transaction = model.Transactions;

//SENDGRID EMAIL API KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// api values
const old_contract_address = "0xd65608ebffe1c417dd5ec845a6011013e602cc7c";
const contract_address = "0xb94960eab249ae05cbdef5c45268c092b0ca15f5";
const old_mint_address = "0x5ee296ebf2a8fa0e875677453510aa5a16c513dc";
const mint_address = "0x5040e5ea53774f0c5b5c873661449ad4cf425ec9";
const book_address = "0x58c08716a36d33bb25a91161ace368a1c5dafd23";
const api_key = process.env.ETHVIGIL_API_KEY;
const rest_api_endpoint = 'https://beta-api.ethvigil.com/v0.1';
let headers = {
    headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': api_key
    }
};

// Browse Books Page
router.get('/browse', secured, (req, res) => {
    books.find().then(data => {
        res.render('browse', { data, user: req.session.user });
    });
});

//For dashboard bookaccess check
router.get('/getbookid', secured, (req, res) => {
    const email = req.session.user.email;
    rental.find({ email: email })
        .then(data => {
            res.send({ data: data });
        })
        .catch(error => {
            console.log(error);
        });
});

//for ebook rendering
router.get('/pdf/:id', secured, (req, res) => {
    let ebookid = req.params.id;
    let user_id = req.session.user.user_id;
    books.findOne({ product_id: ebookid })
        .then(data => {
            let tempdir = "./docs/" + user_id + "/" + data.book_location + ".pdf";
            res.sendFile(path.resolve(tempdir));
        })
        .catch(err => console.error(err));

});

//to get ethereum address across multiple pages
router.get('/geteth', secured, (req, res) => {
    res.send({ ethaddress: req.session.user.ethaddress });
});


//Individual Book page
router.get('/book/:id', secured, (req, res) => {
    let prdid = req.params.id;
    books.findOne({ product_id: prdid })
        .then(data => {
            res.render('book', { data: data, user: req.session.user });
        })
        .catch(error => {
            console.log(error);
            req.flash('error_tx', 'Invalid request, please try again later.');
            res.redirect('/app/browse');
        });
});

//Individual EBook page
router.get('/ebook/:id', secured, (req, res) => {
    let prdid = req.params.id;
    var tempdir = "./docs/" + req.session.user.user_id;
    if (!fs.existsSync(tempdir)) {
        fs.mkdirSync(tempdir);
    }
    books.findOne({ product_id: prdid })
        .then(data => {
            if (fs.existsSync(tempdir + '/' + data.book_location + ".pdf")) {
                console.log('This pdf exists.');
                res.render('ebook', { data: data, user: req.session.user });
            } else {
                downloadFile(data.book_url, tempdir + '/' + data.book_location + ".pdf")
                res.render('ebook', { data: data, user: req.session.user });
            }
        })
        .catch(error => {
            console.log(error);
            req.flash('error_tx', 'Invalid request, please try again later.');
            res.redirect('/dashboard');
        });
});

// Account page
router.get('/account', secured, (req, res) => {
    transaction.find({ email: req.session.user.email })
        .then(txlog => {
            res.render('account', { user: req.session.user, txlog: txlog })
        })
        .catch(error => {
            console.log(error);
            req.flash('error_tx', 'Invalid request, please try again later.');
            res.redirect('/dashboard');
        });
});

// Redirect page
router.get('/redirect', secured, (req, res) => res.render('redirect'));

//Rental transactions
router.post('/rent', secured, (req, res) => {
    const email = req.session.user.email;
    const cost = req.body.token;
    const days = req.body.days2;
    const product_id = req.body.prdid;
    const author_ethaddress = req.body.author_ethaddress;
    const ethaddress = req.session.user.ethaddress;
    let token = cost * 10000;
    //Token Transfer
    let method_args = {
        'User': ethaddress,
        'amount': token,
        'Author': author_ethaddress
    };
    let method_api_endpoint = rest_api_endpoint + '/contract/' + contract_address + '/DeductBal';

    axios.post(method_api_endpoint, method_args, headers)
        .then((response) => {
            //BookAccess write
            let method_args2 = {
                'User': ethaddress,
                'BookID': product_id,
                '_days': days
            };
            let method_api_endpoint2 = rest_api_endpoint + '/contract/' + book_address + '/GrantAccess';
            axios.post(method_api_endpoint2, method_args2, headers)
                .then((response2) => {
                    console.log('This is the book access txHash:' + response2.data.data[0].txHash)
                    var success = response2.data.success;
                    var txHash = response.data.data[0].txHash;
                    console.log('THE BOOLEAN: ' + success);
                    console.log('THE txHash: ' + txHash);
                    if (success) {
                        console.log('Success message trigerred');
                        books.findOne({ product_id: product_id })
                            .then(data => {
                                let book_author = data.book_author;
                                let book_desc = data.book_desc;
                                let book_pages = data.book_pages;
                                let book_title = data.book_title;
                                let image_url = data.image_url;
                                const newRental = new rental({
                                    email,
                                    ethaddress,
                                    txHash,
                                    cost,
                                    days,
                                    product_id,
                                    book_author,
                                    book_desc,
                                    book_pages,
                                    book_title,
                                    image_url,
                                });
                                newRental.save()
                                    .then(rental => {
                                        req.flash('success_tx', 'Your rental of book is being processed, transaction pending!');
                                        req.flash('link', 'https://goerli.etherscan.io/tx/' + txHash);
                                        res.redirect('/app/redirect');
                                    })
                                    .catch(err => {
                                        console.log(err);
                                        req.flash('error_tx', 'Your rental of book failed, please try again later.');
                                        res.redirect('/dashboard');
                                    });

                                const msg = {
                                    to: email,
                                    from: 'aditya.devsandbox@gmail.com',
                                    subject: 'Purchase Receipt | Atlas Library System',
                                    html: '<strong>Hello,\n\n' + 'Thank you for using Atlas Library System.</strong> \n\n This is an auto generated email regaring your recent book rental purchase. \n\n' +
                                        '\n<br>You have rented the book:' + book_title + 'for'+ days +'days, at a price of' + cost + 'ALT or' + cost*100 +'INR.'+
                                        '\n<br><br>You can access the book by logging into your account on the website.' + 
                                        '\n<br><br>Regards, \n\n Team Atlas Library System',
                                };
                                sgMail.send(msg);

                            })
                            .catch(error => {
                                console.error(error);
                            })

                        let Type = 'Debit';
                        const newTransaction = new transaction({
                            token: (token / 10000),
                            Type,
                            TxHash: txHash,
                            email
                        });
                        newTransaction.save()
                            .then(transaction => {
                                console.log('Successfully recorded transaction');
                            })
                            .catch(err => {
                                console.log('Failed to record transaction');
                                console.log(err);
                            });
                    }
                    if (!success) {
                        req.flash('error_tx', 'Your rental of book failed, please try again later.');
                        res.redirect('/dashboard');
                    }
                })
                .catch(error => console.log('THE BOOK ACCESS TRIGGER FAILED! \n' + error));
        })
        .catch((error) => {
            console.log(error);
            req.flash('error_tx', 'Your rental of book failed, please try again later.');
            res.redirect('/dashboard');
        });
});

//purchasing tokens
router.post('/purchase', secured, (req, res) => {
    const email = req.user._json.email;
    const token = req.body.token;
    const token2 = req.body.token2;
    let errors = [];

    if (!token || !token2) {
        errors.push({ msg: 'Please enter all fields' });
    }
    if (token == 0) {
        errors.push({ msg: 'Token amount cannot be zero.' });
    }
    if (token != token2) {
        errors.push({ msg: 'Token amount do not match' });
    }

    if (errors.length > 0) {
        req.flash('error_tx', 'Invalid submission, please try again.');
        res.redirect('/dashboard');
    } else {
        const ethaddress = req.session.user.ethaddress;
        let valued = (token * 100);
        let method_args = {
            'User': ethaddress,
            'amount': valued
        };
        let method_api_endpoint = rest_api_endpoint + '/contract/' + contract_address + '/UpdateBal';
        axios.post(method_api_endpoint, method_args, headers)
            .then((response) => {
                var success = response.data.success;
                var txHash = response.data.data[0].txHash;
                console.log('THE BOOLEAN: ' + success);
                if (success) {
                    console.log('Success message trigerred');
                    let Type = 'Credit';
                    const newTransaction = new transaction({
                        token: (valued / 10000),
                        Type,
                        TxHash: txHash,
                        email
                    });
                    newTransaction.save()
                        .then(transaction => {
                            console.log('Successfully recorded transaction');
                        })
                        .catch(err => {
                            console.log('Failed to record transaction');
                            console.log(err);
                        });
                    req.flash('success_tx', 'Your purchase of ' + (token / 100) + ' fresh ALT tokens is being processed, transaction pending.');
                    req.flash('link', 'https://goerli.etherscan.io/tx/' + txHash);
                    res.redirect('/app/redirect');
                }
                if (!success) {
                    req.flash('error_tx', 'Your purchase of ALT tokens failed, please try again later.');
                    res.redirect('/dashboard');
                }
            })
            .catch((error) => {
                console.log(error);
                req.flash('error_tx', 'Your purchase of ALT tokens failed, please try again later.');
                res.redirect('/dashboard');
            });
    }
});

function downloadFile(str, location) {
    // upload
    var skylink = str;

    // download
    skynet.DownloadFile(
        location,
        skylink,
        skynet.DefaultDownloadOptions
    );
    console.log('Download successful');
}

module.exports = router;
