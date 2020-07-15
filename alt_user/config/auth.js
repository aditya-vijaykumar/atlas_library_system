module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.user && req.session.user.role == "author") {
      return next();
    }
    else if (req.isAuthenticated() && req.user.role == "admin") {
      req.flash('error_msg', 'Please log in as author to view that resource');
      res.redirect('/admin/dashboard');
    }
    else if(req.user && req.session.user.role == "user") {
      req.flash('error_msg', 'That resource is restricted to author accounts.');
      res.redirect('/dashboard');
    }
    else{
      req.flash('error_msg', 'Please log in to view that resource.');
      res.redirect('/');
    }    
  },

  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.role == "admin") {
      return next();
    }
    else if(req.isAuthenticated() && req.session.user.role == "author") {
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

  secured : function(req, res, next) {
    if (req.user && req.user.role != "admin") {
        return next();
    }
    // else if (req.isAuthenticated() && req.user.role == "admin") {
    //   req.flash('error_msg', 'Please log in as an user to view that resource.');
    //   res.redirect("/admin/dashboard");
    // }
    req.session.returnTo = req.originalUrl;
    req.flash('error_msg', 'Please log in to view that resource.');
    res.redirect("/");
},
};