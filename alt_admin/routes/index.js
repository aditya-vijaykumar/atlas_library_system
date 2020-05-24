const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
require("dotenv").config();

const skynet = require('@nebulous/skynet');
const fs = require('fs-extra');
//multer file storage
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    //let name = Date.now();
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

//models
const model = require('../models/models');
const Book = model.Books;

// api values
const contract_address = "0xd65608ebffe1c417dd5ec845a6011013e602cc7c";
const mint_address = "0x5ee296ebf2a8fa0e875677453510aa5a16c513dc";
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

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard Page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// About Page
router.get('/about', ensureAuthenticated, (req, res) =>
  res.render('about', {
    user: req.user
  })
);

// About Page
router.get('/account', ensureAuthenticated, (req, res) =>
  res.render('account', {
    user: req.user
  })
);

router.post('/upload', upload.single('bookpdf'), ensureAuthenticated, (req, res) => {
  if (req.file) {
    console.log('Uploading file...');
    uploadFile(req.file.path)
      .then(link => {
        let book_authors = req.body.author;
        let book_desc = req.body.description;
        let book_pages = req.body.pages;
        let book_title = req.body.title;
        let genres = req.body.genre;
        let image_url = req.body.image_url;
        let product_id = Date.now();
        let book_url = link.slice(6, link.length);
        let book_location = book_title.replace(/\s/g, '');
        const newBook = new Book({
          book_authors,
          book_desc,
          book_pages,
          book_title,
          genres,
          image_url,
          product_id,
          book_url,
          book_location
        });
        newBook.save()
          .then(book => {
            console.log('Saved Book in the database.')
          })
          .catch(err => console.error(err));
        fs.remove('./uploads/' + req.file.originalname, err => {
          if (err) return console.error(err)
          console.log('success!')
        });
      })
      .catch(err => console.error(err));
    req.flash('success_tx', 'Book has been successfully uploaded');
  } else {
    console.log('No File Uploaded');
    req.flash('error_tx', 'Book upload failed! Something went wrong');
  }
  res.redirect('/dashboard');
});

router.post('/payment', ensureAuthenticated, (req, res) => {
  const ethaddress = req.body.address;
  const token = req.body.token;
  const token2 = req.body.token2;
  const value = token * 10000;
  let errors = [];

  if (!ethaddress || !value) {
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
  }
  else {
    let method_args = {
      'Author': ethaddress,
      'amount': value
    };
    let method_api_endpoint = rest_api_endpoint + '/contract/' + contract_address + '/Redirect';
    axios.post(method_api_endpoint, method_args, headers).then((response) => {
      var success = response.data.success;
      var txHash = response.data.data[0].txHash;
      console.log('THE BOOLEAN: ' + success);
      if (success) {
        console.log('Success message trigerred');
        req.flash('success_tx', 'Your payment of ' + (token) + ' fresh ALT tokens is being processed, transaction pending.');
        req.flash('link', 'https://goerli.etherscan.io/tx/' + txHash);
        res.redirect('/dashboard');
      }
      if (!success) {
        req.flash('error_tx', 'Your payment of ALT tokens failed, please try again later.');
        res.redirect('/dashboard');
      }
    }).catch((error) => {
      console.log(error);
      req.flash('error_tx', 'Your payment of ALT tokens failed, please try again later.');
      res.redirect('/dashboard');
    });


  }
});

async function uploadFile(ref) {
  console.log('Begining upload of file to Sia Skynet')
  const skylink = await skynet.UploadFile(
    ref,
    skynet.DefaultUploadOptions
  );
  console.log(`Upload successful, skylink: ${skylink}`);
  return skylink;
}

// router.get('/file', (req, res) => {
//   res.download('./uploads/test.pdf', 'test.pdf');
// });

// router.get('/download', (req, res) => {

//   axios.get('http://localhost:7000/app/file')
//       .then(response => {
//           var data = [];
//           data.push(response);
//           data = Buffer.concat(data);
//           console.log('requested content length: ', response.headers['content-length']);
//           console.log('parsed content length: ', data.length);
//           res.writeHead(200, {
//               'Content-Type': 'application/pdf',
//               'Content-Disposition': 'attachment; filename=working-test.pdf',
//               'Content-Length': data.length
//           });
//           res.end(data);
//       })
//       .catch(err => console.error(err));
// });

module.exports = router;
