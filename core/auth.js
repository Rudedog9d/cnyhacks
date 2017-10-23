var Passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var db = require('./db');

module.exports.requireLogin = function (req, res, next) {
  // Todo: handle redirect to previous URL
  if (!req.user) {
    return res.redirect('/users/login')
  }
  return next();
};

// Login Strategy
var localLoginStrategy = new LocalStrategy(
    function (username, password, done) {
      var query = 'SELECT * FROM `' + db.USER_DB + '` WHERE `username` = "' + username + '";';
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

        var query = 'INSERT INTO `' + db.USER_DB + '`(`username`,`password`,`credits`) VALUES (?, ?, ?);';
        console.log(query);
        db._db.run(query, [username, password, 10], function (err) {
          console.log('user registered!', username);
          return done(null, {username: username});
        });
      });
    });

Passport.use('local.login', localLoginStrategy);
Passport.use('local.register', localRegisterStrategy);

Passport.serializeUser(function (user, done) {
  done(null, user);
});
Passport.deserializeUser(function (user, done) {
  done(null, user);
});

// todo probably something smarter here
// passport.serializeUser(function(user, done) {
//   done(null, user._id);
// });
//
// passport.deserializeUser(function(id, done) {
//   User.findById(id, function(err, user) {
//     done(err, user);
//   });
// });
