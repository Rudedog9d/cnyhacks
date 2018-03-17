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

// GET directory listing of avatars
router.get('/avatars', function (req, res, next) {
  getDirs('resources/avatars', function (dirs) {
    res.send(dirs);
  });
});

// GET avatar file
router.get('/avatars/:name', function (req, res, next) {
  // If name contains flag.txt, prevent access
  if ( req.url.includes('flag')){
    // Return access denied message with rick roll image
    return res.send('Access not allowed - "flag" is a forbidden word<br>' +
      '<img src="/images/rick.gif" style="width:100%;height:100%"></img>', 401)
  }
  // Else serve avatar file
  return next()
}, express.static('resources'));

module.exports = router;
