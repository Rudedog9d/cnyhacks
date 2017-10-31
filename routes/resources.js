var express = require('express');
var router = express.Router();
var fs = require('fs');
var db = require('../core/db');

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
  if ( req.url.includes('flag.txt')){
    // Return access denied message with rick roll image
    return res.send('Access not allowed; nice try. <br>' +
      '<img src="/images/rick.gif" style="width:100%;height:100%"></img>')
  }
  // Else serve avatar file
  return next()
}, express.static('resources'));

// GET meme with access control
router.get('/memes/:name', function (req, res, next) {
  // Look up meme by image name
  db.getAllProducts(req.user, {imgSrc: '"' + req.params.name + '"'}, function (err, products) {
    if(err){return res.sendStatus(500)} // todo

    // Send 404 if not found in DB
    if(!products.length) {
      return res.sendStatus(404);
    }

    // Check if result is owned by current user
    if(!products[0].owned) {
      return res.sendStatus(403);
    }

    // If found and user has permission, allow Express.static() to serve it
    return next()
  })
}, express.static('resources'));

module.exports = router;
