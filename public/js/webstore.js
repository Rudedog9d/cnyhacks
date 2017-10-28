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
    return '/images/100.svg'
  };
  
  WebStore.purchaseItem = function (id) {
    console.log('purchasing ID', id);
    $.post('/store/items/' + id + '/purchase', {}, function (data, status) {
      if(status === 200) {
        return WebStore.success('Item purchased successfully!')
      }
      return WebStore.error('An Error has occurred', [data, status])
    })
  };

})();