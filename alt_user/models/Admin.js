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
  role:{
    type: String,
    default: "admin" 
  },
  isVerified: { 
    type: Boolean, 
    default: true 
  },
  passwordResetToken:{
    type: String
  },
  passwordResetExpires: {
    type:Date
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'admins'
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

const Admin = mongoose.model('Admin', AdminSchema);
const Books = mongoose.model('AdminBooks', BookSchema);

module.exports = {
  Admin,
  Books
}