var express = require('express');
var router = express.Router();
var db = require('../core/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('store.html');
});

/* GET all golden items. */
router.get('/golden/items', function (req, res, next) {
  db.getAllGoldenProducts(req.user, {}, function (err, product) {
    if(err) { return next(err); }

    return res.send(product);
  })
});

/* GET a golden item. */
router.get('/golden/items/:id', function (req, res, next) {
  db.getGoldenProduct(req.params.id, req.user, function (err, product) {
    console.log(err, product);
    if(err) { return next(err); }

    return res.send(product);
  });
});
/* GET all items. */

router.get('/items', function (req, res, next) {
  db.getAllProducts(req.user, {}, function (err, product) {
    if(err) { return next(err); }

    return res.send(product);
  })
});

/* GET an item. */
router.get('/items/:id', function (req, res, next) {
  db.getProduct(req.params.id, req.user, function (err, product) {
    console.log(err, product);
    if(err) { return next(err); }

    return res.send(product);
  });
});

/* POST purchase an item. */
router.post('/items/:id/purchase', function (req, res, next) {

  db.getProduct(req.params.id, req.user, function (err, product) {
    console.log(err, product);
    if(err) {
      return next(err);
    }

    return res.send(product);
  })
});

module.exports = router;
