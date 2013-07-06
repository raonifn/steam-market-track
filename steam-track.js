(function($) {
  var tracker = {
    url : 'http://steamcommunity.com/market/',
    search : '/search/render?start=0&count=300&query=',
    minCount: 1000,
    threshold: 0.8,
    schedule_time: 15 * 1000
  };
  
  function updateParams() {
    tracker.minCount = parseInt($('#minCount').val());
    tracker.threshold = parseInt($('#threshold').val());
    tracker.schedule_time = parseInt($('#schedule_time').val());
  }
  
  function stop() {
    var started = tracker.timer;
    if (started) {
      console.info('parando');
      clearInterval(tracker.timer);
      delete tracker.timer;
    }
    return started;
  }
  
  function start() {
    console.info('agendado'); 
    tracker.timer = setInterval(exec, tracker.schedule_time);       
  }
  
  function init() {
    var tracker = $('#tracker');
    if (tracker) {
      tracker.remove();
    }
    
    var div = $('<div id="tracker" />');
    div.attr('style', 'z-index: 100; width: 100%; height: 50%; position:absolute; top: 0; left: 0');
    $('body').prepend(div);
    
    var button = $('<input id="toggle_schedule" type="button" value="toggle schedule"/>');
    button.click(function() {
      if (tracker.timer) {
        stop();        
      } else {
        start();
      }
    });

    div.append($('<input type="text" id="minCount" value="'+tracker.minCount+'" />'));
    div.append($('<input type="text" id="threshold" value="'+tracker.threshold+'" />'));
    div.append($('<input type="text" id="schedule_time" value="'+tracker.schedule_time+'" />'));
    var buttonUpdate = $('<input id="update_info" type="button" value="uodate data"/>')
    buttonUpdate.click(function() {
      var started = stop();
      updateParams();
      if (started) {
        start();
      }
    });


    div.append(buttonUpdate);
    div.append(button);
  }
  
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
  }
  
  
 
  
  init();
})(jQuery);
