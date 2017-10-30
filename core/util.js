module.exports.objectKeys = function (obj) {
  var keys = [],
      k;
  for (k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      keys.push(k);
    }
  }
  return keys;
};
