(function($) {
  var tracker = {
    url : 'http://steamcommunity.com/market/',
    search : '/search/render?start=0&count=300&query=',
    minCount: 1000,
    threshold: 0.8,
    schedule_time: 15 * 1000
  };
  
  function list(name) {
    var query = tracker.url + tracker.search + name;
    console.info('getting', query);
    $.ajax({
      url: query,
      type: 'GET',
      error: function(err) {
        console.info('err', err);
      },
      success : function(data) {
        console.info(data);
        handleHtmlList(data.results_html);
      }
    });
  }
  
  function handleHtmlList(data) {
    var all = $(data);
    var links = all.find('div.market_listing_row');
    $(links).each(function(index) {
      var lnk = $(this).parent().attr('href');
      search(lnk);
    });
  }
  
  function search(product) {
    var query = product + '/render/?query=&start=1&count=100'
    $.ajax({
      url: query,
      type: 'GET',
      error: function(err) {
        console.info('err', err);
      },
      success : function(data) {
        if (data.total_count > tracker.minCount) {
          handleHtml(product, data.results_html);
        }
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
    var avg = 0;
    for (var i = 0; i < prices.length; i++) {
      avg += prices[i];
    }
    avg /= prices.length;
    
    var result = prices[0] / avg;
    if (result <= tracker.threshold) {
      console.info('result', result, ', avg: ',avg, 'min: ', prices[0], 'product: ', product);
    }
  }
  
  function exec() {
    console.info('exec');
    list('trading%20card');
    schedule();
  }
  
  function schedule() {
    console.info('agendado');
    setTimeout(exec, tracker.schedule_time); 
  }
  
 
  
  exec();
})(jQuery);
