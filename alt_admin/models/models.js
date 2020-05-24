const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'admin'
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
  }
}, {
  collection: 'newbooks'
});

const Admin = mongoose.model('User', AdminSchema);
const Books = mongoose.model('books', BookSchema);

module.exports = {
  Admin,
  Books
}