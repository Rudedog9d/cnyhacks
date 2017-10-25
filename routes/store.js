var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('store/store.html');
});

/* GET home page. */
router.get('/golden', function(req, res, next) {
    res.render('store/golden/store.html');
});

module.exports = router;
