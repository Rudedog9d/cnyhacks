var express = require('express');
var router = express.Router();
var db = require('../core/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('store.html');
});

/* POST purchase an item. */
router.post('/items/:id/purchase', function (req, res, next) {
  console.log(req.user);
  // Ensure user table exists

  db.getProduct(req.params.id)
});

module.exports = router;
