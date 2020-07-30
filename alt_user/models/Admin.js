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

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = {
  Admin
}