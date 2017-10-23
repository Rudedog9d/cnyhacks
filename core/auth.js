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
      console.log('register user:', username, password)
      // todo
      // function findOrCreateUser(){
      //   // find a user in Mongo with provided username
      //   User.findOne({'username':username},function(err, user) {
      //     // In case of any error return
      //     if (err){
      //       console.log('Error in SignUp: '+err);
      //       return done(err);
      //     }
      //     // already exists
      //     if (user) {
      //       console.log('User already exists');
      //       return done(null, false,
      //           req.flash('message','User Already Exists'));
      //     } else {
      //       // if there is no user with that email
      //       // create the user
      //       var newUser = new User();
      //       // set the user's local credentials
      //       newUser.username = username;
      //       newUser.password = createHash(password);
      //       newUser.email = req.param('email');
      //       newUser.firstName = req.param('firstName');
      //       newUser.lastName = req.param('lastName');
      //
      //       // save the user
      //       newUser.save(function(err) {
      //         if (err){
      //           console.log('Error in Saving user: '+err);
      //           throw err;
      //         }
      //         console.log('User Registration succesful');
      //         return done(null, newUser);
      //       });
      //     }
      //   });
      // };
      //
      // // Delay the execution of findOrCreateUser and execute
      // // the method in the next tick of the event loop
      // process.nextTick(findOrCreateUser);
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
