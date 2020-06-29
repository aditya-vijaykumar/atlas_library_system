const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const model = require('../models/Author');
const Author = model.Author;

function SessionConstructor(userId, userGroup, details) {
    this.userId = userId;
    this.userGroup = userGroup;
    this.details = details;
  }

module.exports = function(passport) {
  passport.use('author-signup', new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      Author.findOne({
        email: email
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            //code about verification if (!user.isVerified) return res.status(401).send({ type: 'not-verified', msg: 'Your account has not been verified.' }); 
            if(!user.isVerified){
              return done(null, false, { message: 'Email is not yet verified' });
            }else{
              return done(null, user);
            }            
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.serializeUser(function (userObject, done) {
    // userObject could be a Model1 or a Model2... or Model3, Model4, etc.
    let userGroup = "Author";
    let userPrototype =  Object.getPrototypeOf(userObject);

    if (userPrototype === Author.prototype) {
      userGroup = "Author";
    } else if (userPrototype === Resident.prototype) {
      userGroup = "model2";
    }

    let sessionConstructor = new SessionConstructor(userObject.id, userGroup, '');
    done(null,sessionConstructor);
  });


  passport.deserializeUser(function (sessionConstructor, done) {

    if (sessionConstructor.userGroup == 'Author') {
      Author.findOne({
          _id: sessionConstructor.userId
      }, '-localStrategy.password', function (err, user) { // When using string syntax, prefixing a path with - will flag that path as excluded.
          done(err, user);
      });
    }
  });

};
