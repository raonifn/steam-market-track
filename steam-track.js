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
    //tracker.iframe.attr('src', prodUrl);
    //tracker.iframe.ready(function() {
      var query = prodUrl + '/render/?query=&start=1&count=100'
      console.info('done', 'getting', query);
      $.ajax({
        url: query,
        type: 'GET',
        error: function(err) {
          console.info('err', err);
        },
        success : function(data) {
          console.info('ajax done, sucess', data.sucess);
          handleHtml(data.results_html);
        }
      });
//    });
  }
  
  function handleHtml(html) {
    var all = $(html);
    var spans = $(all).find('.market_listing_price_with_fee');
    console.info('span', $(spans[0]).text(), $(spans[0]).val());
    var prices = [];
    spans.each(function(index) {
      var value = $(this).text();
      value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
      value = value.replace(/,/, ".");
      prices.push(value);
    });
    console.info('prices', prices);
  }
  
  //createIFrame();
  search('/listings/753/SALVADOR');
  
  //http://steamcommunity.com/market/listings/753/SALVADOR/render/?query=&start=1&count=100
})(jQuery);
