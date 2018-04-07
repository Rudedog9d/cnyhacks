const express = require('express');
const router = express.Router();
const db = require('../core/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/mail/inbox');
});

router.get('/:folder', function (req, res, next) {
  let folder = req.params.folder;

  if(folder === "admin") {
    if(!req.query.password) {
      let err = new Error("A Password parameter is required for this page.");
      err.status = 403;
      return next(err)
    } else if(req.query.password !== "hack3rman") {
      let err = new Error("Incorrect Username or Password!");
      err.status = 403;
      return next(err)
    }
  }

  let locals = {
    folder: folder
  };

  db.getMail({
    username: req.user.username,
    folder: folder
  }, function(err, data) {
    if(err) {
      return done(err);
    }
    locals.items = data;
    res.render('mail/index.html', locals);
  });
});

module.exports = router;
