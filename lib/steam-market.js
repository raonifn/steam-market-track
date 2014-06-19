(function($) {

  var loader = new Loader();
  loader.load_sequence(['util.js', 'ajax_manager.js', 'product.js', 'trader.js', 'crawler.js', 'market.js'], function() {
    var market = new Market();
    market.init();
  });

})(jQuery);
