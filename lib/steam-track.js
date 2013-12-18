(function($) {
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

   function average(a) {
      var r = {
         mean : 0,
         variance : 0,
         deviation : 0
      }, t = a.length;
      for (var m, s = 0, l = t; l--; s += a[l])
         ;
      for (m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2))
         ;
      return r.deviation = Math.sqrt(r.variance = s / t), r;
   }

   function withinStd(avgs, val, stdev) {
      var low = avgs.mean - (stdev * avgs.deviation);
      var hi = avgs.mean + (stdev * avgs.deviation);
      return (val > low) && (val < hi);
   }

   function extractValue(span) {
      var value = $(span).text();
      value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
      value = value.replace(/,/, ".");
      return parseFloat(value);
   }

   function createListing(listingSpan) {
      var listing = {};

      listing.id = listingSpan.attr('id').replace(/listing_(.*)/, "$1");
      listing.assetid = listingSpan.find('a.item_market_action_button').attr('href').replace(/^.*'([^,]+)'\)$/, "$1");
      listing.total_price = extractValue($(listingSpan).find('.market_listing_price_with_fee'));
      listing.subtotal_price = extractValue($(listingSpan).find('.market_listing_price_without_fee'));
      listing.fee = Number((listing.total_price - listing.subtotal_price).toFixed(2));

      return listing;
   }

   Product = function(result_html, productUrl) {
      this.extractData(result_html, productUrl);
   };

   Product.prototype.extractData = function(result_html, productUrl) {
      var html = result_html;
      html = html.replace(/src/g, "_src");
      var elements = $(html);
      var all = $('<div />');
      all.append(elements);

      var listing_spans = $(all).find('.market_listing_row');
      var prices = [];
      var listings = [];
     // var avg = 0;
      listing_spans.each(function(index) {
         var listing = createListing($(this));
         listings.push(listing);
         prices.push(listing.total_price);
         //avg += listing.total_price;
      });
      var avgs = average(prices);
     
      var avg = avgs.mean;
      listings.each(function(listing) {
         var in_deviation = withinStd(avgs, listing.total_price, 1);
         listing.in_deviation = in_deviation;
      });

      this.avgPrice = Number(avg.toFixed(2));
      this.minPrice = prices[0];
      this.diffPrice = Number((avg - prices[0]).toFixed(2));
      this.diffPriceWithoutFee = Number((this.diffPrice - (avg * 0.15)).toFixed(2));
      this.url = productUrl;
      this.listings = listings;

      var result = this.minPrice / this.avgPrice;
      this.result = Number(result.toFixed(2));
      this.averages = avgs;
   };

   Product.prototype.buy = function() {
      // console.info('try the get before');
      // $.ajax({
      // url : this.url,
      // product : this,
      // error : function(err) {
      // console.info('err', err);
      // },
      // success : function(info) {
      // var product = this.product;
      var product = this;
      var min = product.listings[0];
      var url = 'https://steamcommunity.com/market/buylisting/' + min.id;
      var data = {
         sessionid : getCookie('sessionid'),
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
            alert('erro!');
            console.info('err', err);
         },
         success : function(info) {
            console.info('bought', info);
            alert('comprado!');

            var new_wallet = eval("(" + info + ")");
            g_rgWalletInfo = new_wallet.wallet_info;
         }

      });
      // }
      // });
   };

   Tracker = function() {
      this.url = 'http://steamcommunity.com/market/';
      this.search = '/search/render';
      this.search_param = {
         pagesize : 100
      };
      this.search_value = 'trading card';
      this.debug = false;
      this.minCount = 100;
      this.threshold = 0.66;
      this.schedule_time = 3 * 100;
      this.minDiff = 0.1;

      this.ajax_manager = new AjaxManager();
      var self = this;

      this.ajax_manager.callbackFinished(function() {
         if (!self.searching) {
            self.list();
         }
      });
   };

   Tracker.prototype.wantBuy = function(product) {
      var passedThreshold = product.result <= this.threshold;
      var hasEnoughtProfit = product.diffPriceWithoutFee >= this.minDiff;

      var balance = g_rgWalletInfo['wallet_balance'];
      var hasMoney = balance >= product.minPrice;

      return passedThreshold && hasEnoughtProfit && hasMoney;
   };

   Tracker.prototype.init = function() {
      var self = this;

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
            'z-index: 100; width: 100%; height: 100%; position:absolute; top: 0; left: 0; background-color: #fff;');
      $('body').prepend(divTracker);

      var button = $('<input id="toggle_schedule" type="button" value="start"/>');
      button.click(function() {
         if (self.ajax_manager.timer) {
            $('#toggle_schedule').val('start');
            self.ajax_manager.stop();
         } else {
            $('#toggle_schedule').val('stop');
            self.ajax_manager.start();
         }
      });
      var buttonClean = $('<input id="clean_messages" type="button" value="clean messages"/>');
      buttonClean.click(this.clean);

      var buttonCleanQueue = $('<input id="clean_queue" type="button" value="clean queue"/>');
      buttonCleanQueue.click(function() {
         self.ajax_manager.queue = [];
         self.ajax_manager.mutex = self.ajax_manager.max;
      });

      form.append($('<input type="text" id="search_value" value="' + this.search_value + '" />'));
      form.append($('<input type="text" id="minCount" value="' + this.minCount + '" />'));
      form.append($('<input type="text" id="threshold" value="' + this.threshold + '" />'));
      form.append($('<input type="text" id="max_ajax" value="' + this.ajax_manager.max + '" />'));
      form.append($('<input type="text" id="schedule_time" value="' + this.schedule_time + '" />'));
      form.append($('<input type="text" id="min_diff" value="' + this.minDiff + '" />'));
      var buttonUpdate = $('<input id="update_info" type="button" value="update data"/>');
      buttonUpdate.click(function() {
         var started = self.ajax_manager.stop();
         self.updateParams();
         if (started) {
            self.ajax_manager.start();
         }
      });

      form.append(buttonUpdate);
      form.append(button);
      form.append(buttonClean);
      form.append(buttonCleanQueue);
   };

   Tracker.prototype.updateParams = function() {
      this.minCount = parseInt($('#minCount').val());
      this.threshold = parseFloat($('#threshold').val());
      this.schedule_time = parseInt($('#schedule_time').val());
      this.search_value = $('#search_value').val();
      this.minDiff = $('#min_diff').val();

      var newMax = parseInt($('#max_ajax').val());
      var diff = newMax - this.ajax_manager.max;
      this.ajax_manager.max = newMax;
      this.ajax_manager.mutex += diff;

      console.info('updated', this);
   };

   Tracker.prototype.list = function(page) {
      var self = this;
      this.searching = true;
      var start = 0;
      if (page) {
         start = page * this.search_param.pagesize;
      } else {
         console.info('relisting', this);
      }
      var query = this.url + this.search + '?count=' + this.search_param.pagesize + '&start=' + start + '&query='
            + encodeURIComponent(this.search_value);
      this.ajax_manager.ajax({
         url : query,
         type : 'GET',
         tracker : self,
         error : function(err) {
            console.info('err', err);
            this.tracker.searching = false;
         },
         success : function(data) {
            if (start == 0) {
               var pages = (data.total_count / this.tracker.search_param.pagesize) + 1;
               for (var i = 1; i <= pages; i++) {
                  this.tracker.list(i);
               }
            }
            this.tracker.searching = false;
            this.tracker.handleHtmlList(data.results_html);
         }
      });
   };

   Tracker.prototype.handleHtml = function(productUrl, data) {
      if (!this.ajax_manager.timer) {
         return;
      }
      var product = new Product(data.results_html, productUrl);

      if (tracker.debug) {
         console.info('product', product);
      }

      if (product.result <= this.threshold && product.diffPriceWithoutFee >= this.minDiff) {
         this.message(product);
      }
   };

   Tracker.prototype.message = function(product) {
      var a = $('<a />').append(JSON.stringify(product));
      a.addClass('result-item');
      a.attr('href', product.url);
      a.attr('target', '_blank');
      a.css('color', '#000');
      a.css('color', '#000');
      a.css('font-weight', 'bold');

      var p = $('<p />');
      p.append(a);

      var buybutton = $('<button>Buy</button>');
      buybutton.click(function() {
         product.buy();
      });

      p.append(buybutton);

      $('#tracker_messages').prepend(p);
      $('#tracker_messages .result-item:last').click(function() {
         $(this).css('font-weight', 'none');
      });

      alert('opa');
   };

   Tracker.prototype.handleHtmlList = function(data) {
      var self = this;
      if (!this.ajax_manager.timer) {
         return;
      }
      data = data.replace(/src/g, "_src");
      var all = $(data);
      var links = all.find('div.market_listing_row');
      $(links).each(function(index) {
         var lnk = $(this).parent().attr('href');
         lnk = lnk.replace(/\?.*$/, '');
         self.searchProducts(lnk);
      });
   };

   Tracker.prototype.searchProducts = function(product) {
      var self = this;
      var query = product + '/render/?query=&start=0&count=10';
      this.ajax_manager.ajax({
         url : query,
         product : product,
         type : 'GET',
         error : function(err) {
            console.info('err', err);
         },
         success : function(data) {
            if (data.total_count > self.minCount) {
               self.handleHtml(this.product, data);
            }
         }
      });
   };

   Tracker.prototype.clean = function() {
      $('#tracker_messages').html('');
   };

   AjaxManager = function() {
      this.queue = [];
      this.max = 5;
      this.mutex = 5;
   };

   AjaxManager.prototype.stop = function() {
      console.info('stopping', this);
      var started = this.timer;
      if (started) {
         clearInterval(this.timer);
         delete this.timer;
      }
      return started;
   };

   AjaxManager.prototype.start = function() {
      var self = this;
      console.info('starting', self);

      this.timer = setInterval(function() {
         self.consume();
      }, this.schedule_time);
   };

   AjaxManager.prototype.callbackFinished = function(callback) {
      this.callback_finished = callback;
   };

   AjaxManager.prototype.consume = function() {
      var self = this;
      if (this.queue.length > 0) {
         while (this.mutex > 0 && this.queue.length > 0) {
            var opts = this.queue.shift();

            var error = opts.error;
            opts.error = function() {
               try {
                  error.apply(this, arguments);
               } finally {
                  self.mutex++;
               }
            };

            var success = opts.success;
            opts.success = function() {
               try {
                  success.apply(this, arguments);
               } finally {
                  self.mutex++;
               }
            };
            $.ajax(opts);
            self.mutex--;
         }
      } else if (this.callback_finished) {
         this.callback_finished();
      }
   };

   AjaxManager.prototype.ajax = function(opts) {
      this.queue.push(opts);
   };

   tracker = new Tracker();
   tracker.init();
})(jQuery);
