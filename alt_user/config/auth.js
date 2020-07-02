module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role == "author") {
      return next();
    }
    else if (req.isAuthenticated() && req.user.role == "admin") {
      req.flash('error_msg', 'Please log in as author to view that resource');
      res.redirect('/admin/dashboard');
    }
    else {
      req.flash('error_msg', 'Please log in as author to view that resource');
      res.redirect('/dashboard');
    }    
  },

  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin") {
      return next();
    }
    else if(req.isAuthenticated() && req.user.role == "author") {
      req.flash('error_msg', 'You do not have access to this.');
      res.redirect('/author/dashboard');
    }
    else {
      req.flash('error_msg', 'You do not have access to this.');
      res.redirect('/dashboard');
    }
  },
  
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    } else if(req.isAuthenticated() && req.user.role == "author" ){
      res.redirect('/author/dashboard');     
    }
    else if(req.isAuthenticated() && req.user.role == "admin" ){
      res.redirect('/admin/dashboard');     
    }
    else if(req.isAuthenticated()){
      res.redirect('/dashboard');     
    }     
  },
};