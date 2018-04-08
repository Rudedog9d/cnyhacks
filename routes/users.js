var express = require('express');
var passport = require('passport');
var bcrypt = require('bcrypt');
var router = express.Router();
var auth = require('../core/auth');
var requireLogin = auth.requireLogin;
var db = require('../core/db');
var util = require('../core/util');
var apiUtil = require('../routes/api/util');

const saltRounds = 10;

function login(req, res, next, user) {
  req.logIn(user, function (err) {
    if (err) {
      return next(err);
    }

    // Redirect to webmail on successful login
    if(req.query.url){
      return res.redirect(req.query.url)
    }
    return res.redirect('/mail/')
  })
}

/* currently redirect to login page or user homepage */
router.get('/', requireLogin, function (req, res, next) {
  res.render('users/index.html')
});

router.get('/api/users', requireLogin, function (req, res, next) {
  db.findAllUsers(function (err, data) {
    if(err) { return res.send({error: 'Internal Server Error'}, 500) }
    return res.send(data);
  })
});

/* GET Login Page */
router.get('/login', /* UNAUTHENTICATED ROUTE */ function (req, res, next) {
  if (req.user) {
    return res.redirect('/mail');
  }
  return res.render('users/login.html', {register: false, error: req.flash('error')});
});

router.get('/register', /* UNAUTHENTICATED ROUTE */ function (req, res, next) {
  if (req.user) {
    return res.redirect('/mail/')
  }
  return res.render('users/login.html', {register: true, error: req.flash('error')});
});

router.post('/register', /* UNAUTHENTICATED ROUTE */
  function (req, res, next) {
    passport.authenticate('local.register', {
      failureFlash: 'user already exists'
    }, function (err, user) {

      if(err) {
        console.error(err);
        res.statusCode = 500;
      }

      if(!user) {
        return res.render('users/login.html', {register: true, error: 'Username already exists'});
      }

      return login(req, res, next, user);
    })(req, res);
});

/* POST Login Info */
router.post('/login', /* UNAUTHENTICATED ROUTE */ function (req, res, next) {
      if (!req.body.username || !req.body.password) {
        return res.render('users/login.html', {error: 'Please supply a username and password'})
      }

      passport.authenticate('local.login', function (err, user) {
        // Check for Error
        if (err) {
          return next(err)
        }

        // Check for user
        if (!user || !user.username) {
          return res.render('users/login.html', {error: 'Invalid Username or Password'})
        }

        // Checks passed, Login succeeded
        return login(req, res, next, user);
      })(req, res) // Be sure to CALL the damn function that is returned
    }
);

router.get('/logout', requireLogin, function (req, res) {
  req.logOut();
  return res.redirect('/')
});

router.get('/change-password', requireLogin, function(req, res, next) {
  return res.render('users/change-password.html')
});

router.post('/change-password', requireLogin, function(req, res, next) {
  let password = req.body.password;
  if ( password && req.body.username ) {
    if (/[^a-zA-Z0-9]/.test()) {
      return apiUtil.apiError(res, 'password is not alphanumeric!')
    }
    bcrypt.hash(password, saltRounds, function (err, hash) {
      db.updatePassword(req.body.username, hash, function (err, user) {
        if (err)
          return apiUtil.apiError(res, err.message, err.status);
        return apiUtil.apiResponse(res, 'update successful')
      });
    });
  }
});

module.exports = router;
