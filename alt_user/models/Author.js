const mongoose = require('mongoose');

const AuthorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  ethaddress: {
    type: String,
    required: true
  },
  role:{
    type: String,
    default: "author" 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
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
  collection: 'demo-author'
});

const DraftBookSchema = new mongoose.Schema({
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
  author_email: {
    type: String
  },
  author_username: {
    type: String
  },
  book_url : {
    type: String
  },
  book_location :{
    type: String
  },
  book_rental_price : {
    type : Number
  },
  author_ethaddress : {
    type : String
  },
  admin_approve_request :{
    type: Boolean,
    default : false
  },
  admin_revert :{
    type: Boolean, 
    default : false
  },
  admin_approved :{
    type: Boolean, 
    default : false
  },
  admin_revert_msg : {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'draftbooks'
});

const TokenSchema = new mongoose.Schema({
  _userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'demo-author' 
  },
  token: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    required: true, 
    default: Date.now, 
    expires: 43200 
  }
}, {
  collection: 'authortoken'
});

const AuthorProfileSchema = new mongoose.Schema({
    fullName: {
      type: String
    },
    email: {
      type: String,
      required: true
    },
    username: {
      type: String
    },
    bio: {
      type: String,
    },
    location : {
        type : String,
    },
    twitter : {
        type : String,
    },
    website : {
        type : String,
    },
    profilePicture : {
        type: String,
    },
    date: {
      type: Date,
      default: Date.now
    }
  }, {
    collection: 'authordata1'
  });

const Author = mongoose.model('Author', AuthorSchema);
const AuthorProfile = mongoose.model('AuthorProfile', AuthorProfileSchema);
const Token = mongoose.model('Token', TokenSchema);
const DraftBook = mongoose.model('DraftBook', DraftBookSchema);
module.exports = {
  Author,
  AuthorProfile,
  Token,
  DraftBook
}