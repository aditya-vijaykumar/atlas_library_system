const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
require("dotenv").config();

const strategy = new Auth0Strategy({
   domain:       process.env.AUTH0_DOMAIN,
   clientID:     process.env.AUTH0_CLIENT_ID,
   clientSecret: process.env.AUTH0_CLIENT_SECRET,
   callbackURL:  process.env.AUTH0_CALLBACK_URL
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

module.exports = function(passport) {
  passport.use(strategy);
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};