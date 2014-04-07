(function($) {

  var loader = new Loader();
  loader.load_sequence(['util.js', 'ajax_manager.js', 'product.js', 'seller.js', 'tracker.js'], function() {
    var tracker = new Tracker();
    tracker.init();
  });

})(jQuery);