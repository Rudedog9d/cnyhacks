const express = require('express');
const router = express.Router();
const apiUtils = require('../util');
const db = require('../../../core/db');

/**
 * Get Current User's folders
 */
router.get('/folders.json', function (req, res, next) {
  db.getFolders(req.user.username, function (err, data) {
    if(err)
      return apiUtils.apiError(res, err);

    // Convert to array of folders
    let ret = [];
    for(obj of data)
      ret.push(obj.folder);

    apiUtils.apiDataResponse(res, ret);
  })
});

/**
 * Get Current User's mail
 */
router.get('/folder/:folder.json', function (req, res, next) {
  db.getMail({
    username: req.user.username,
    folder: req.params.folder
  }, function (err, data) {
    if(err)
      return apiUtils.apiError(res, err);

    apiUtils.apiDataResponse(res, data);
  })
});

module.exports = router;
