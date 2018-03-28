var Passport = require('passport');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var db = require('./db');

const saltRounds = 10;

module.exports.requireLogin = function (req, res, next) {
  // Todo: handle redirect to previous URL
  if (!req.user) {
    return res.redirect('/users/login?url=' + encodeURIComponent(req.originalUrl))
  }
  return next();
};

// Login Strategy
var localLoginStrategy = new LocalStrategy(
    function (username, password, done) {
      db.findUserByUsername(username, function (err, row) {
        // Return if Error
        if (err) {
          return done(err);
        }

        // Check if user was found
        if (!row || !row.password) {
          console.error('user not found:', username);
          return done(null, false);
        }

        // Check Password
        bcrypt.compare(password, row.password, function(err, res) {
          if (!res) {
            return done(null, false);
          }

          console.log('user logged in!', username);
          return done(null, row);
        });
      });
    }
);

// Registration Strategy
var localRegisterStrategy = new LocalStrategy(
    function (username, password, done) {
      console.log('register user:', username, password);

      db.findUserByUsername(username, function (err, row) {
        // Return if Error
        if (err) {
          return done(err);
        }

        // Check if user was found
        if (row) {
          console.error('user already exists');
          return done(null, false);
        }

        bcrypt.hash(password, saltRounds, function(err, hash) {
          db.insertUser(username, hash, null, null, function (err) {
            if(err) { return done(err) }
            console.log('user registered!', username);
            // Get user from DB so user has ID and can login
            db.findUserByUsername(username, function (err, data) {
              return done(err, data);
            })
          });
        });
      });
    });

Passport.use('local.login', localLoginStrategy);
Passport.use('local.register', localRegisterStrategy);

Passport.serializeUser(function (user, done) {
  done(null, user.id);
});

Passport.deserializeUser(function (user_id, done) {
  db.findUserById(user_id, done)
});
