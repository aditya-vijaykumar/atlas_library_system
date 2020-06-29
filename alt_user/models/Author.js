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
    type: String,
    required: true
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
module.exports = {
  Author,
  AuthorProfile,
  Token
}