var WebStore;

(function () {
  // Set up string proto functions
  String.prototype.hexEncode = function(){
    var hex, i;

    var result = "";
    for (i=0; i<this.length; i++) {
      hex = this.charCodeAt(i).toString(16);
      result += ("000"+hex).slice(-4);
    }

    return result
  };

  String.prototype.hexDecode = function(){
    var j;
    var hexes = this.match(/.{1,4}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
      back += String.fromCharCode(parseInt(hexes[j], 16));
    }

    return back;
  };

  if (WebStore === undefined) {
    WebStore = {};
  }

  // A Place to store local page variables as needed
  WebStore.locals = {};

  // Placeholder for user object
  WebStore.User = null;

  WebStore.getAllUsers = function (done) {
    $.ajax({
      url: '/users/api/users',
      success: function (data) {
        return done(null, data);
      },
      error: function (err) {
        return done(err);
      }
    });
  };
})();