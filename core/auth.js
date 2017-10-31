var Passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var db = require('./db');

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
        if (row.password !== password) {
          console.error('password does not match:', password);
          return done(null, false);
        }

        console.log('user logged in!', username);
        return done(null, row);
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

        var query = 'INSERT INTO `' + db.USER_DB + '`(`username`,`password`,`credits`, `golden_credits`) VALUES (?, ?, ?, ?);';
        console.log(query);
        db._db.run(query, [username, password, 10, 5], function (err) {
          if(err) { return done(err) }
          console.log('user registered!', username);
          // Get user from DB so user has .id and can login
          db.findUserByUsername(username, function (err, data) {
            return done(err, data);
          })
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
