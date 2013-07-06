(function($) {
  var tracker = {
    url : 'http://steamcommunity.com/market/',
    search : '/search?q='
  };
  
  function createIFrame() {
    var iframe = $('<iframe width="100%" id="steam_track"/>');
    $('body').prepend(iframe);
    tracker.iframe = iframe;
  }
  
  function search(product) {
    console.info("buscando", product);
    var prodUrl = tracker.url + product;
    tracker.iframe.attr('src', prodUrl);
    tracker.iframe.ready(function() {
      $.ajax({
        url: prodUrl + '/render/?query=&start=1&count=100',
        type: 'GET',
        error: function(err) {
          console.info('err', err);
        },
        success : function(data) {
          console.info('got', data);
        }
      });
    });
  }
  
  createIFrame();
  search('/listings/753/SALVADOR');
  
  //http://steamcommunity.com/market/listings/753/SALVADOR/render/?query=&start=1&count=100
})(jQuery);
