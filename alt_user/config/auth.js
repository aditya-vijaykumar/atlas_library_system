module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role == "author") {
      return next();
    }
    else {
      req.flash('error_msg', 'Please log in as author to view that resource');
      res.redirect('/dashboard');
    }
    
  },
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else if(req.isAuthenticated() && req.user.role == "author" ){
      res.redirect('/author/dashboard');     
    }
    else if(req.isAuthenticated()){
      res.redirect('/dashboard');     
    }     
  }
};