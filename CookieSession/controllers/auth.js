const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'login',
        isAuthenticated: req.session.isLoggedIn
    });
};
  
exports.postLogin = (req, res, next) => {
    User.findById('5c13621bdee4712f9444b1a5')
    .then(user => {
      req.session.user = user;
      req.session.isLoggedIn = true;
      req.session.save((err) => {
          res.redirect('/');
      });
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
}