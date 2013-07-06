(function($) {
  var tracker = {
    url : 'http://steamcommunity.com/market/',
    search : '/search?q='
  };
  
  function search(product) {
    var prodUrl = tracker.url + product;
    var query = prodUrl + '/render/?query=&start=1&count=100'
    console.info('done', 'getting', query);
    $.ajax({
      url: query,
      type: 'GET',
      error: function(err) {
        console.info('err', err);
      },
      success : function(data) {
        console.info('ajax done, sucess', data);
        handleHtml(product, data.results_html);
      }
    });
  }
  
  function handleHtml(product, html) {
    var all = $(html);
    var spans = $(all).find('.market_listing_price_with_fee');
    var prices = [];
    spans.each(function(index) {
      var value = $(this).text();
      value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
      value = value.replace(/,/, ".");
      prices.push(parseFloat(value));
    });
    console.info('prices', prices);
    
    var avg = 0;
    for (var i = 0; i < prices.length; i++) {
      avg += prices[i];
    }
    avg /= prices.length;
    
    console.info('avg', avg);
    console.info('min', prices[0]);
    console.info('result', product, prices[0] / avg);
    
  }
  
  search('/listings/753/SALVADOR');
  search('/listings/753/MEDIC%20%28Trading%20Card%29');
})(jQuery);
