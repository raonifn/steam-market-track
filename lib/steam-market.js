(function($) {

  var loader = new Loader();
  loader.load_sequence(['utils.js', 'ajax_manager.js', 'product.js', 'trader.js', 'crawler.js', 'market.js'], function() {
    var market = new Market();
    market.init();
  });

})(jQuery);
