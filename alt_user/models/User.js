const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  ethaddress: {
    type: String,
    required: true
  },
  user_id: {
    type: Number
  },
  role:{
    type: String,
    default: "user" 
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'userdata'
});

const TransactSchema = new mongoose.Schema({
  token: {
    type: Number
  },
  Type: {
    type: String
  },
  TxHash: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'transacts'
});

const RentalSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  ethaddress: {
    type: String,
    required: true
  },
  txHash: {
    type: String
  },
  cost: {
    type: Number,
    required: true
  },
  product_id: {
    type: Number,
    required: true
  },
  days: {
    type: Number,
    required: true
  },
  book_authors: {
    type: String
  },
  book_desc: {
    type: String
  },
  book_pages: {
    type: String
  },
  book_title: {
    type: String
  },
  image_url: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'rental-new'
});

const BookSchema = new mongoose.Schema({
  book_authors: {
    type: String
  },
  book_desc: {
    type: String
  },
  book_pages: {
    type: String
  },
  book_title: {
    type: String
  },
  genres: {
    type: String
  },
  image_url: {
    type: String
  },
  product_id: {
    type: Number
  },
  book_url : {
    type: String
  },
  book_location :{
    type: String
  },
  author_email : {
    type : String
  },
  book_rental : {
    type : Number
  }
}, {
  collection: 'newbooks'
});

const User = mongoose.model('User', UserSchema);
const Transactions = mongoose.model('transactions', TransactSchema);
const Rentals = mongoose.model('rentals', RentalSchema);
const Books = mongoose.model('books', BookSchema);

module.exports = {
  User,
  Books, 
  Transactions,
  Rentals
}