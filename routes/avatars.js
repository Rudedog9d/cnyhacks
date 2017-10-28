var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET avatar page. */


/* GET flag.txt. */
function getDirs(rootDir, cb) {
  fs.readdir(rootDir, function(err, files) {
    if (err){
      res.status(500);
      return res.send({error:err});
    }
    return cb(files);
  });
}

router.get('/', function (req, res, next) {
  getDirs('public/images/avatars', function (dirs) {
    res.send(dirs);
  });
});


router.get('/:name', function (req, res, next) {
  if ( req.url.includes('flag.txt')){
    return res.send('Access not allowed; nice try.')
  }

  next()
}, express.static('public/images/avatars'));

module.exports = router;
