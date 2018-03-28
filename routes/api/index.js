const fs = require("fs");
const path = require("path");
var express = require('express');
const router = express.Router();

function loadRoutes(directory) {
  fs.readdirSync(path.join(__dirname, directory)).forEach(function(file) {
    file = file.replace(/\.js$/, '');  // remove file extension
    router.use(`/${directory}/` + file, require(`./${directory}/` + file));
  });
}

// Load all V1 API routes
loadRoutes('v1');

// random API route
router.get('/', function (req, res, next) {
  res.send('this is an api')
});

module.exports = router;
