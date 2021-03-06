const express = require('express');
const router = express.Router();
const passport = require('passport');
const util = require("util");
const querystring = require("querystring");
require("dotenv").config();
const fsExtra = require("fs-extra");

// mongoose data models
const model = require('../models/User');
const User = model.User;

//Auth0
router.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile"
  }),
  (req, res) => {
    res.redirect("/");
  }
);

router.get("/logout", (req, res) => {
  lastcheck(req.user._json.email);

  req.logOut();

  let returnTo = req.protocol + "://" + req.hostname;
  const port = req.connection.localPort;

  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo = `${returnTo}/`;
  }

  const logoutURL = new URL(
    util.format("https://%s/v2/logout", process.env.AUTH0_DOMAIN)
  );
  const searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo
  });
  logoutURL.search = searchString;

  res.redirect(logoutURL);
});

function lastcheck(email) {
  User.findOne({ email: email })
    .then(data => {
      let thisurl = "./docs/" + data.user_id;
      fsExtra.emptyDir(thisurl, err => {
        if (err) return console.error(err)
        console.log('successfully deleted all the files!')
      })
    })
    .catch(err => console.error(err));
};

module.exports = router;
