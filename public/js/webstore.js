var WebStore;

(function () {
  if (WebStore === undefined) {
    WebStore = {};
  }

  // Set up logging with Toast and console messages
  /**
   * Log a message to the console and to the user via TOAST
   * @param message   Message to display to user
   * @param detail    Details to dump to log
   * @param timeout   TOAST timeout (Forever if undefined)
   * @param className Classname of the TOAST (use for color)
   * @private
   */
  WebStore._message = function(message, detail, timeout, className) {
    console.log(message, detail !== undefined ? detail : '');
    // Wrap in doc ready check incase logging is called before page loads
    $(document).ready(function () {
      Materialize.toast(message, timeout || undefined, className || undefined)
    });
  };
  /**
   * Log an informational message
   * @param message Friendly message for the user
   * @param details Detailed message for the log
   */
  WebStore.info = function (message, details) {
    WebStore._message(message, details, 4000)
  };

  /**
   * Log an Successful message
   * @param message Friendly message for the user
   * @param details Detailed message for the log
   */
  WebStore.success = function (message, details) {
    WebStore._message(message, details, 4000, 'green')
  };

  /**
   * Log an error message
   * @param message Friendly message for the user
   * @param details Detailed message for the log
   */
  WebStore.error = function (message, details) {
    WebStore._message('Error: ' + message, details, undefined, 'red')
  };

  /**
   * Log a warning message
   * @param message Friendly message for the user
   * @param details Detailed message for the log
   */
  WebStore.warning = function (message, details) {
    WebStore._message('Warning: ' + message, details, 10000, 'orange')
  };

  WebStore.db = {};
  WebStore.db.find = function () {
    //  Do AJAX here
  };

  WebStore.db.update = function () {
    //  Do AJAX here
  };

  WebStore.getPriceImageUrl = function (price) {
    if(price <= 100) {
      return '/images/100.svg'
    } // else if(price <= 000)
    return '/images/question-mark-pewdiepie.jpg'
  };

  WebStore.getProducts = function (cb) {
    $.ajax({
      url: '/store/items/',
      success: function (data) {
        return cb(data);
      },
      error: function (err) {
        var msg = err.responseJSON.error || err.responseText || 'An Unknown error has occurred';
        WebStore.error(msg, err)
      }
    });
  };
  
  WebStore.purchaseItem = function (id, done) {
    $.ajax({
      url: '/store/items/' + id + '/purchase',
      method: 'POST',
      success: function (data) {
        WebStore.success('Item purchased successfully!');
        done(data);
      },
      error: function (err) {
        var msg = err.responseJSON.error || err.responseText || 'An Error has occurred';
        WebStore.error(msg, err);
        done();
      }
    });
  };

})();