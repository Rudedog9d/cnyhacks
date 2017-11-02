var express = require('express');
var router = express.Router();
var db = require('../core/db');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('store/store.html');
});

router.get('/products/:id', function(req, res, next) {
  db.getProduct(req.user, req.params.id, function (err, product) {
    if(err || !product) {
      var err = new Error('Product not found');
      err.status = 404;
      return next(err);
    }

    if(!product.owned) {
      var err = new Error('Product Not Owned');
      err.status = 403;
      return next(err);
    }

    res.render('store/detail.html',
        {
          item_id: req.params.id,
          flag: product.imgSrc === 'flag.png' ? 'flag{fa1s3A1ArM}' : null
        });
  })
});

/* GET home page. */
router.get('/golden', function(req, res, next) {
    res.render('store/golden/store.html');
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
  db.getProduct(req.user, req.params.id, function (err, product) {
    if(err) { return next(err); }

    return res.send(product);
  });
});

/* POST purchase an item. */
router.post('/items/:id/purchase', function (req, res, next) {
  db.getProduct(req.user, req.params.id, function (err, product) {
    if(err) { return next(err); }

    if(!product) {
      res.status(404);
      return res.send({error: 'Product Not Found'});
    }

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
