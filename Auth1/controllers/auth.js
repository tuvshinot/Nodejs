const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');
const transport = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_key: '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'
  }
}));

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {email:'', password: ''},
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('userExists');
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    signupError: message,
    oldInput: {email: '', password: '', confirmPass: ''},
    validationErrors: []
  });
};

// with flash error displayer
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res
    .status(422)
    .render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {email: email, password: password},
      validationErrors: errors.array()
    });
  }

  User
    .findOne({email: email})
    .then(user => {
      if(!user) {
        return res
        .status(422)
        .render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {email: email, password: password},
          validationErrors: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if(doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              return res.redirect('/'); 
            });
          }
          return res
          .status(422)
          .render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Password was wrong!.',
            oldInput: {email: email, password: password},
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
    })
    .catch(err => console.log(err));
};


// pure validation error displayer
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res
    .status(422)
    .render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      signupError: errors.array()[0].msg,
      oldInput: {email: email, password: password, confirmPass: req.body.confirmPassword},
      validationErrors: errors.array()
    });
  }
    // User exists validation in auth routes
      // hashing password!
    bcrypt
      .hash(password, 12)
      .then(hashedpass => {
        const user = new User({
          email: email,
          password: hashedpass,
          cart: {items: []} 
        })
        return user.save();
      })
      .then(result => {
          // do not wait it, it returns promise
          transport.sendMail({
          to: email,
          from: 'shop@node-complete.',
          subject: 'Sign up Completed Welcome to Shop!',
          html: '<h1>You signed up to shop!s<h1/>'
        });
        return res.redirect('/login');
      })
      .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session
    .destroy(err => {
      if(err) {
        console.log(err);
      }
      res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, Buffer) => {
    if(err) {
      console.log(err);
      return res.redirect('/');
    }
    const token = Buffer.toString('hex');
    User
    .findOne({email: req.body.email})
    .then(user => {

      if(!user) {
        req.flash('error', 'No account with that email found!');
        return res.redirect('/reset');
      }
      
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;

      return user.save()
      .then(result => {
        res.redirect('/');
        transport.sendMail({
          to: req.body.email,
          from: 'shop@node-complete.',
          subject: 'Password Reset',
          html: `
            <p>You requested password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password!</p>
          `
        });
      })
    })
    .catch(err => console.log(err));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User
    .findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
      if(!user) {
        req.flash('error', 'validation period expired!, try again.');
        return res.redirect('/reset');
      }

      let message = req.flash('error');
      if(message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'new Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken:token
      });
    })
    .catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId;
  const newPassword = req.body.password;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User
    .findOne({_id: userId, resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12)
    })
    .then(hashedpass => {
      resetUser.password = hashedpass;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => console.log(err));
};


