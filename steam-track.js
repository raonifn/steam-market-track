(function($) {
  var tracker = {
    url : 'http://steamcommunity.com/market/',
    search : '/search?q='
  };
  
  function createIFrame() {
    var iframe = $('<iframe width="100%"/>');
    $('body').prepend(iframe);
    tracker.iframe = iframe;
  }
  
  createIFrame();
  
})(jQuery);
