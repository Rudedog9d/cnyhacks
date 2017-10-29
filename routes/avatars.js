var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET directory listing */
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

// cant nav to /avatars/flag.txt
router.get('/:name', function (req, res, next) {
  if ( req.url.includes('flag.txt')){

    return res.send('Access not allowed; nice try. <br>' +
      '<img src="/images/rick.gif" style="width:100%;height:100%"></img>')
  }
  next()
}, express.static('public/images/avatars'));

module.exports = router;
