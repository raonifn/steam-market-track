(function($) {
   var tracker = {
      url : 'http://steamcommunity.com/market/',
      search : '/search/render',
      search_param : {
         pagesize : 100
      },
      search_value : 'trading card',
      debug : false,
      stop : true,
      currency : 7,
      minCount : 100,
      threshold : 0.66,
      schedule_time : 3 * 100,
      minDiff : 0.1,
      sessionid : getCookie('sessionid')
   };

   var ajax_manager = {
      queue : [],
      max : 5,
      mutex : 5
   };

   function getCookie(c_name) {
      var c_value = document.cookie;
      var c_start = c_value.indexOf(" " + c_name + "=");
      if (c_start == -1) {
         c_start = c_value.indexOf(c_name + "=");
      }
      if (c_start == -1) {
         c_value = null;
      } else {
         c_start = c_value.indexOf("=", c_start) + 1;
         var c_end = c_value.indexOf(";", c_start);
         if (c_end == -1) {
            c_end = c_value.length;
         }
         c_value = unescape(c_value.substring(c_start, c_end));
      }
      return c_value;
   }

   function ajax(opts) {
      ajax_manager.queue.push(opts);
   }

   function updateParams() {
      tracker.minCount = parseInt($('#minCount').val());
      tracker.threshold = parseFloat($('#threshold').val());
      tracker.schedule_time = parseInt($('#schedule_time').val());
      tracker.search_value = $('#search_value').val();
      tracker.minDiff = $('#min_diff').val();

      var newMax = parseInt($('#max_ajax').val());
      var diff = newMax - ajax_manager.max;
      ajax_manager.max = newMax;
      ajax_manager.mutex += diff;
   }

   function stop() {
      var started = ajax_manager.timer;
      if (started) {
         clearInterval(ajax_manager.timer);
         delete ajax_manager.timer;
      }
      return started;
   }

   function consume() {
      if (ajax_manager.queue.length > 0) {
         while (ajax_manager.mutex > 0 && ajax_manager.queue.length > 0) {
            var opts = ajax_manager.queue.shift();
            var success = opts.success;
            var error = opts.error;
            opts.error = function() {
               try {
                  error.apply(this, arguments);
               } finally {
                  ajax_manager.mutex++;
               }
            }
            opts.success = function() {
               try {
                  success.apply(this, arguments);
               } finally {
                  ajax_manager.mutex++;
               }
            };
            $.ajax(opts);
            ajax_manager.mutex--;
         }
      } else if (!ajax_manager.list) {
         list();
      }
   }

   function start() {
      ajax_manager.timer = setInterval(consume, tracker.schedule_time);
   }

   function init() {
      var tracker_div = $('#tracker');
      if (tracker_div) {
         tracker_div.remove();
      }

      var divTracker = $('<div id="tracker" />');
      var form = $('<div id="tracker_form" />');
      var messages = $('<div id="tracker_messages" style="width: 100%;"/>');
      divTracker.append(form);
      divTracker.append(messages);

      divTracker.attr('style',
            'z-index: 100; width: 100%; height: 20%; position:absolute; top: 0; left: 0; background-color: #fff;');
      $('body').prepend(divTracker);

      var button = $('<input id="toggle_schedule" type="button" value="start"/>');
      button.click(function() {
         if (ajax_manager.timer) {
            $('#toggle_schedule').val('start');
            stop();
         } else {
            $('#toggle_schedule').val('stop');
            start();
         }
      });
      var buttonClean = $('<input id="clean_messages" type="button" value="clean messages"/>');
      buttonClean.click(clean);

      var buttonCleanQueue = $('<input id="clean_queue" type="button" value="clean queue"/>');
      buttonCleanQueue.click(function() {
         ajax_manager.queue = [];
         ajax_manager.mutex = ajax_manager.max;
      });

      form.append($('<input type="text" id="search_value" value="' + tracker.search_value + '" />'));
      form.append($('<input type="text" id="minCount" value="' + tracker.minCount + '" />'));
      form.append($('<input type="text" id="threshold" value="' + tracker.threshold + '" />'));
      form.append($('<input type="text" id="max_ajax" value="' + ajax_manager.max + '" />'));
      form.append($('<input type="text" id="schedule_time" value="' + tracker.schedule_time + '" />'));
      form.append($('<input type="text" id="min_diff" value="' + tracker.minDiff + '" />'));
      var buttonUpdate = $('<input id="update_info" type="button" value="update data"/>');
      buttonUpdate.click(function() {
         var started = stop();
         updateParams();
         if (started) {
            start();
         }
      });

      form.append(buttonUpdate);
      form.append(button);
      form.append(buttonClean);
      form.append(buttonCleanQueue);
   }

   function list(page) {
      ajax_manager.list = true;
      var start = 0;
      if (page) {
         start = page * tracker.search_param.pagesize;
      }
      var query = tracker.url + tracker.search + '?count=' + tracker.search_param.pagesize + '&start=' + start
            + '&query=' + encodeURIComponent(tracker.search_value);
      ajax({
         url : query,
         type : 'GET',
         error : function(err) {
            console.info('err', err);
            ajax_manager.list = false;
         },
         success : function(data) {
            if (start == 0) {
               var pages = (data.total_count / tracker.search_param.pagesize) + 1;
               for (var i = 1; i <= pages; i++) {
                  list(i);
               }
            }
            handleHtmlList(data.results_html);
            ajax_manager.list = false;
         }
      });
   }

   function handleHtmlList(data) {
      if (!ajax_manager.timer) {
         return;
      }
      data = data.replace(/src/g, "_src");
      var all = $(data);
      var links = all.find('div.market_listing_row');
      $(links).each(function(index) {
         var lnk = $(this).parent().attr('href');
         lnk = lnk.replace(/\?.*$/, '');
         search(lnk);
      });
   }

   function search(product) {
      var query = product + '/render/?query=&start=1&count=10'
      var prod = product;
      ajax({
         url : query,
         product : product,
         type : 'GET',
         error : function(err) {
            console.info('err', err);
         },
         success : function(data) {
            if (data.total_count > tracker.minCount) {
               handleHtml(this.product, data);
            }
         }
      });
   }

   function extractValue(span) {
      var value = $(span).text();
      value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
      value = value.replace(/,/, ".");
      return parseFloat(value);

   }

   function handleListing(listingSpan) {
      var listing = {};

      listing.id = listingSpan.attr('id').replace(/listing_(.*)/, "$1");
      listing.total_price = extractValue($(listingSpan).find('.market_listing_price_with_fee'));
      listing.subtotal_price = extractValue($(listingSpan).find('.market_listing_price_without_fee'));
      listing.fee = Number((listing.total_price - listing.subtotal_price).toFixed(2));

      return listing;
   }

   function handleHtml(product, data) {
      if (!ajax_manager.timer) {
         return;
      }
      var html = data.results_html;
      html = html.replace(/src/g, "_src");
      var elements = $(html);
      var all = $('<div />');
      all.append(elements);

      var listing_spans = $(all).find('.market_listing_row');
      var prices = [];
      var listings = [];
      var avg = 0;
      listing_spans.each(function(index) {
         var listing = handleListing($(this));
         listings.push(listing);
         prices.push(listing.total_price);
         avg += listing.total_price;
      });
      avg /= prices.length;

      var result = prices[0] / avg;
      var diff = avg - prices[0];

      if (tracker.debug) {
         console.info('result', result, ', avg:', avg, 'min:', prices[0], 'product:', product, ' total:',
               data.total_count);
      }
      if (result <= tracker.threshold) {
         var obj = {
            result : Number(result),
            avg : Number(avg.toFixed(2)),
            min : prices[0],
            diff : Number((avg - prices[0]).toFixed(2)),
            diffWithFee : Number((diff - (avg * 0.15)).toFixed(2)),
            product : product,
            total : data.total_count,
            listings : listings
         };

         if (obj.diffWithFee >= tracker.minDiff) {
            message(obj);
         }
      }
   }

   function message(obj) {
      var a = $('<a />').append(JSON.stringify(obj));
      a.attr('href', obj.product);
      a.attr('target', '_blank');
      a.css('color', '#000');

      var p = $('<p />');
      p.append(a);

      var buybutton = $('<button>Buy</button>');
      buybutton.click(function() {
         buy(obj);
      });

      p.append(buybutton);

      $('#tracker_messages').prepend(p);

      alert('opa');
   }

   function buy(obj) {

      console.info('try the get before');
      $.ajax({
         url : obj.product,
         obj : obj,
         error : function(err) {
            console.info('err', err);
         },
         success : function(info) {
            var obj = this.obj;
            var min = obj.listings[0];
            var url = 'https://steamcommunity.com/market/buylisting/' + min.id;
            var data = {
               sessionid : tracker.sessionid,
               currency : g_rgWalletInfo['wallet_currency'],
               subtotal : Math.round(min.subtotal_price * 100),
               fee : Math.round(min.fee * 100),
               total : Math.round(min.total_price * 100)
            };

            console.info('buying', url, data);
            $.ajax({
               url : url,
               type : 'POST',
               mimeType : 'application/x-www-form-urlencoded; charset=UTF-8',
               data : data,
               crossDoamin : true,
               xhrFields : {
                  withCredentials : true
               },
               error : function(err) {
                  console.info('err', err);
               },
               success : function(info) {
                  console.info('bought', info);
               }

            });
         }
      });
   }

   function clean() {
      $('#tracker_messages').html('');
   }

   init();
})(jQuery);
