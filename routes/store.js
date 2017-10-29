var express = require('express');
var router = express.Router();
var db = require('../core/db');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('store.html');
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
  db.getProduct(req.user, req.params.id, function (err, product) {
    if(err) { return next(err); }

    return res.send(product);
  });
});

/* POST purchase an item. */
router.post('/items/:id/purchase', function (req, res, next) {
  db.getProduct(req.user, req.params.id, function (err, product) {
    if(err) { return next(err); }

    if(product.owned) {
      res.status(400);
      return res.send({error: 'already owned'});
    }

    if(product.cost > req.user.credits) {
      res.status(400);
      return res.send({error: 'not enough credits'})
    }

    db.purchaseProduct(req.user, product, function (err) {
      if(err) {
        console.log(err);
        res.status(500);
        return res.send({error: 'Database Error', detail: err});
      }
      return res.send('OK');
    })
  })
});

module.exports = router;
