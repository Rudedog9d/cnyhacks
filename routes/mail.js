const express = require('express');
const router = express.Router();
const db = require('../core/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/mail/inbox');
});

router.get('/:folder', function (req, res, next) {
  let locals = {
    folder: req.params.folder
  };

  db.getMail({
    username: req.user.username,
    folder: req.params.folder
  }, function(err, data) {
    if(err) {
      return done(err);
    }
    locals.items = data;
    res.render('mail/index.html', locals);
  });
});

module.exports = router;
