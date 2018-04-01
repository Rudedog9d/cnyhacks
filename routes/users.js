var express = require('express');
var passport = require('passport');
var bcrypt = require('bcrypt');
var router = express.Router();
var auth = require('../core/auth');
var requireLogin = auth.requireLogin;
var db = require('../core/db');
var util = require('../core/util');

const saltRounds = 10;

function login(req, res, next, user) {
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

router.get('/:username/change-password', requireLogin, function(req, res, next) {
  return res.render('users/change-password.html')


});

router.post('/:username/change-password', requireLogin, function(req, res, next) {
  if ( req.body.pass1 !== req.body.pass2 ){
    return res.send({err: "passwords do not match"})
  }
  else if ( !req.body.username ){
    return res.send({err: "user does not exist"})
  }
  else if ( req.body.pass1 && req.body.username ) {
    if (/[^a-zA-Z0-9]/.test(req.body.pass1)) {
      return res.send({err: "password is not alphanumeric!"})
    }
    else {
      bcrypt.hash(req.body.pass1, saltRounds, function (err, hash) {
        db.updatePassword(req.body.username, hash, function (err, user) {
          if (!err) {
            return res.send({success: true})
          }
          else{
            return res.send({success: false})
          }
        });
      });
    }
  }
  else
    {
      return res.send({err: "error occurred"})
    }

});

router.get('/:username/settings', requireLogin, function(req, res, next) {
  return res.render('users/settings.html')
});

router.get('/:username', requireLogin, function (req, res, next) {
  db.findUserByUsername(req.params.username, function (err, user) {
    if(err || !user) { return res.send('User not found', 404) }
    return res.render('users/home.html', {page_user: user})
  })
});

// GET User object (This is a really, REALLY dumb route)
router.get('/api/:username', requireLogin, function (req, res, next) {
  db.findUserByUsername(req.params.username, function (err, user) {
    if(err || !user) { return res.send('User not found', 404) }
    return res.send(user);
  })
});

router.post('/:username/update', requireLogin, function (req, res, next) {
  var updates = {};
  var valid_fields = ['bio', 'avatar'];
  for(prop in valid_fields) {
    prop = valid_fields[prop];
    if(req.body[prop]) {
      updates[prop] = req.body[prop];
    }
  }

  if(!util.objectKeys(updates)) {
    res.send('invalid options provided', 400)
  }

  db.findUserByUsername(req.params.username, function (err, user) {
    if(!user) {
      return next(404, 'User not Found')
    }
    if(req.user.id !== user.id) {
      console.log(req.user.id, user)
      return res.send({error: 'no permission to edit user ' + user.username}, 403)
    }
    if(err || !user) { return res.send('User not found', 404) }
    db.updateUser(user, updates, function (err, user) {
      if(err) { return res.sendStatus(200); /* OK, but no user */ }

      return res.send(user);
    })
  })
});

module.exports = router;
