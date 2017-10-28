var express = require('express');
var passport = require('passport');
var router = express.Router();

var auth = require('../core/auth');
var requireLogin = auth.requireLogin;

/* TODO GET users listing. */
/* currently redirect to login page or user homepage */
router.get('/', requireLogin);

/* GET Login Page */
router.get('/login', /* UNAUTHENTICATED ROUTE */ function (req, res, next) {
  if (req.user) {
    return res.redirect('/users/' + req.user.username)
  }
  return res.render('users/login.html', {register: false, error: req.flash('error')});
});

router.get('/register', /* UNAUTHENTICATED ROUTE */ function (req, res, next) {
  if (req.user) {
    return res.redirect('/users/' + req.user.username)
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

      req.login(user,null, function() {
        res.redirect('/users/' + user.username)
      })
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
        req.logIn(user, function (err) {
          if (err) {
            return next(err);
          }

          // Redirect to user homepage on successful login
          if(req.query.url){
            return res.redirect(req.query.url)
          }
          return res.redirect('/users/' + user.username)
        })
      })(req, res) // Be sure to CALL the damn function that is returned
    }
);

router.get('/logout', requireLogin, function (req, res) {
  req.logOut();
  return res.redirect('/store')
});

router.get('/:username', requireLogin, function (req, res, next) {
  return res.render('users/home.html', {username: req.params.user})
});

module.exports = router;
