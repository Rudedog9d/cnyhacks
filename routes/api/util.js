/**
 * Craft Common API responses
 * @param res
 * @param success
 * @param meta
 * @param status
 * @returns {*}
 * @private
 */
module.exports._apiResponse = function(res, success, meta, status){
  let obj = Object.assign({
    success: success,
  }, meta);

  return res.status(status || 200).send(obj);
};

module.exports.apiError = function(res, error, status = 500){
  return module.exports._apiResponse(res, false, {error: error}, status);
};

module.exports.apiResponse = function(res, message, status = 200){
  return module.exports._apiResponse(res, true, {message: message}, status);
};

module.exports.apiDataResponse = function(res, data, status = 200){
  return module.exports._apiResponse(res, true, {data: data}, status);
};
