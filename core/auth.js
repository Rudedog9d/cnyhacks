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
      var query = 'SELECT `_rowid_` as id,* FROM `' + db.USER_DB + '` WHERE `username` = "' + username + '";';
      console.log(query);
      db._db.get(query, {}, function (err, row) {
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

      var query = 'SELECT * FROM `' + db.USER_DB + '` WHERE `username` = "' + username + '";';
      console.log(query);

      db._db.get(query, {}, function (err, row) {
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
          var query = 'INSERT INTO `' + db.USER_DB + '`(`username`,`password`,`credits`, `golden_credits`, `bio`) VALUES (?, ?, ?, ?, ?);';
          var values = [
            username,  // username
            hash,      // password
            10,        // default credits
            5,         // default golden credits
            'I am <b>Awesome</b>!' // Default Bio
          ];
          console.log(query);

          db._db.run(query, values, function (err) {
            if(err) { return done(err) }
            console.log('user registered!', username);
            // Get user from DB so user has .id and can login
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
