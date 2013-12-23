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

   function createListing(productUrl, listingSpan) {
      var listing = {};

      listing.id = listingSpan.attr('id').replace(/listing_(.*)/, "$1");
      listing.assetid = listingSpan.find('a.item_market_action_button').attr('href').replace(/^.*'([^,]+)'\)$/, "$1");
      listing.total_price = extractValue($(listingSpan).find('.market_listing_price_with_fee'));
      listing.subtotal_price = extractValue($(listingSpan).find('.market_listing_price_without_fee'));
      listing.fee = Number((listing.total_price - listing.subtotal_price).toFixed(2));
      listing.url = productUrl;

      return listing;
   }

   Product = function(result_html, productUrl) {
      this.extractData(result_html, productUrl);
      this.calculate();
   };

   Product.prototype.calculate = function() {
      var prices = [];

      this.listings.each(function(listing) {
         prices.push(listing.total_price);
      });

      var avgs = average(prices);

      var avg = avgs.mean;
      this.listings.each(function(listing) {
         var in_deviation = withinStd(avgs, listing.total_price, 2);
         listing.in_deviation = in_deviation;
      });

      this.avgPrice = Number(avg.toFixed(2));
      this.minPrice = prices[0];
      this.diffPrice = Number((avg - prices[0]).toFixed(2));
      this.diffPriceWithoutFee = Number((this.diffPrice - (avg * 0.15)).toFixed(2));

      var result = this.minPrice / this.avgPrice;
      this.result = Number(result.toFixed(2));
      this.averages = avgs;
   };

   Product.prototype.extractData = function(result_html, productUrl) {
      var html = result_html;
      html = html.replace(/src/g, "_src");
      var elements = $(html);
      var all = $('<div />');
      all.append(elements);

      var listing_spans = $(all).find('.market_listing_row');
      var listings = [];
      listing_spans.each(function(index) {
         var listing = createListing(productUrl, $(this));
         listings.push(listing);
      });

      this.url = productUrl;
      this.listings = listings;
   };

   Product.prototype.buy = function(listing, callback) {
      var url = 'https://steamcommunity.com/market/buylisting/' + listing.id;
      var data = {
         sessionid : getCookie('sessionid'),
         currency : g_rgWalletInfo['wallet_currency'],
         subtotal : Math.round(listing.subtotal_price * 100),
         fee : Math.round(listing.fee * 100),
         total : Math.round(listing.total_price * 100)
      };

      console.info('buying', url, data);
      $.ajax({
         url : url,
         type : 'POST',
         mimeType : 'application/x-www-form-urlencoded; charset=UTF-8',
         data : data,
         crossDomain : true,
         listing : listing,
         xhrFields : {
            withCredentials : true
         },
         error : function(err) {
            if (err.status == 502) {
               var messager = JSON.parse(err.responseText);
               var message = messager.message;
               console.info('erro: ' + message);
            }
            console.info('err', err);
         },
         success : function(info) {
            console.info('bought', this.listing, info);

            var new_wallet = eval("(" + info + ")");
            g_rgWalletInfo = new_wallet.wallet_info;
            if (callback) {
               callback(listing);
            }
         }

      });
   };

   Seller = function() {
      this.ajax_manager = new AjaxManager();
      this.ajax_manager.newMax(1);
   };

   Seller.prototype.sell = function(listing, price) {
      var self = this;
      var data = {
         sessionid : getCookie('sessionid'),
         currency : g_rgWalletInfo['wallet_currency'],
         // appid : appid,
         appid : 753,
         // contextid : contextid,
         contextid : 6,
         amount : 1,
         price : price,
         assetid : listing.assetid
      };

      console.info("selling", listing, price);
      this.ajax_manager.ajax({
         url : 'https://steamcommunity.com/market/sellitem/',
         type : 'POST',
         mimeType : 'application/x-www-form-urlencoded; charset=UTF-8',
         crossDomain : true,
         listing : listing,
         price : price,
         xhrFields : {
            withCredentials : true
         },
         error : function(err) {
            if (err.status == 502) {
               var messager = JSON.parse(err.responseText);
               var message = messager.message;
               console.info('erro: ', message);
            }
            console.info('err', err);
         },
         success : function(xhr) {
            console.info('sold', this.listing, xhr);
            self.messageTransaction("Sell", this.listing, this.price);
         },
         data : data
      });
   };

   Seller.prototype.undercut = function(product, my_listing) {
      var self = this;
      var min = product.listings[0];

      if (min.id == my_listing.id) {
         console.info('Doesn\'t need to undercut', my_listing);
         return;
      }

      console.info('tring undercut', my_listing);
      this.removeListing(my_listing, function(listing) {
         self.sell(listing, (min.subtotal_price * 100) - 1);
      });
   };

   Seller.prototype.removeListing = function(listing, callback) {
      var self = this;

      this.ajax_manager.ajax({
         url : 'http://steamcommunity.com/market/removelisting/' + listing.id,
         type : 'POST',
         mimeType : 'application/x-www-form-urlencoded; charset=UTF-8',
         listing : listing,
         error : function(err) {
            if (err.status == 502) {
               var messager = JSON.parse(err.responseText);
               var message = messager.message;
               console.info('erro: ', message);
            }
            console.info('err', err);
         },
         success : function(xhr) {
            console.info('removed', this.listing, xhr);
            self.messageTransaction("Removed", this.listing);
            if (callback) {
               callback(listing);
            }

         },
         data : {
            sessionid : getCookie('sessionid')
         }
      });
   };

   Seller.prototype.messageTransaction = function(type, listing, price) {
      var a = $('<a />').append(type + ": " + JSON.stringify(listing));
      a.addClass('result-item');
      a.attr('target', '_blank');
      a.attr('href', listing.url);
      a.css('color', '#000');
      a.css('color', '#000');
      a.css('font-weight', 'bold');

      var p = $('<p />');
      p.append(a);

      $('#tracker_messages').prepend(p);
      $('#tracker_messages .result-item:last').click(function() {
         $(this).css('font-weight', 'none');
      });
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
      this.undercut_ajax_manager = new AjaxManager();
      this.undercut_ajax_manager.newMax(1); // Required 1

      var self = this;

      this.ajax_manager.callbackFinished(function() {
         if (!self.searching) {
            self.list();
         }
      });

      this.seller = new Seller();
   };

   Tracker.prototype.undercuteAllListings = function() {
      var self = this;
      this.searchListings(function(listing, product) {
         self.seller.undercut(product, listing);
      });
   };

   Tracker.prototype.searchListings = function(callback) {
      var self = this;

      this.undercut_ajax_manager.ajax({
         url : 'http://steamcommunity.com/market/',
         type : 'GET',
         tracker : self,
         error : function(err) {
            console.info('err', err);
         },
         success : function(data) {
            if (callback) {
               this.tracker.handleHtmlListings(data, function(listing, product) {
                  callback(listing, product);
               });
            }
         }
      });
   };

   Tracker.prototype.handleHtmlListings = function(html, callback) {
      var self = this;

      html = html.replace(/src/g, "_src");
      var all = $(html);

      var listingsHtml = all.find('div.market_listing_row');

      $(listingsHtml).each(
            function() {
               var id = $(this).attr('id');

               if (id.substr(0, 10) !== 'mylisting_') {
                  return;
               }

               id = id.replace(/mylisting_(\d*)/, "$1");

               var listing = {};
               listing.id = id;

               var linkToRemove = $(this).find('a.item_market_action_button_edit').attr('href');
               linkToRemove = linkToRemove.replace(
                     /javascript:RemoveMarketListing\('mylisting', '\d+', \d+, '\d+', '(\d+)'\)/, "$1");
               listing.assetid = linkToRemove;

               var lnk = $(this).find('a.market_listing_item_name_link').attr('href');
               lnk = lnk.replace(/\?.*$/, '');

               self.searchProducts(lnk, 10, self.undercut_ajax_manager, function(productUrl, data) {
                  var product = new Product(data.results_html, productUrl);

                  listing.url = productUrl;

                  if (callback) {
                     callback(listing, product);
                  }
               });
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
            self.stop();
         } else {
            $('#toggle_schedule').val('stop');
            self.start();
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
         var started = self.stop();
         self.updateParams();
         if (started) {
            self.start();
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
      this.ajax_manager.newMax(newMax);

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

   Tracker.prototype.handleHtml = function(productUrl, html) {
      var self = this;
      if (!this.ajax_manager.timer) {
         return;
      }
      var product = new Product(html, productUrl);

      if (tracker.debug) {
         console.info('product', product);
      }

      if (product.result <= this.threshold && product.diffPriceWithoutFee >= this.minDiff) {

         var to_buy = [];
         var undercute_price = 0;
         product.listings.each(function(listing) {
            if (!listing.in_deviation) {
               to_buy.push(listing);
            } else if (undercute_price == 0) {
               undercute_price = (listing.subtotal_price * 100) - 1;
            }
         });

         var callback = function(listing) {
            self.seller.messageTransaction("Buy", listing, listing.total_price);
            self.seller.sell(listing, undercute_price);
         };

         to_buy.each(function(listing) {
            product.buy(listing, callback);
         });
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

         self.searchProducts(lnk, 10, self.ajax_manager, function(product, data) {
            if (data.total_count > self.minCount) {
               self.handleHtml(this.product, data.results_html);
            }
         });
      });
   };

   Tracker.prototype.searchProducts = function(product, count, ajax_manager, callback) {
      var query = product + '/render/?query=&start=0&count=' + count;
      ajax_manager.ajax({
         url : query,
         product : product,
         type : 'GET',
         error : function(err) {
            console.info('err', err);
         },
         success : function(data) {
            if (callback) {
               callback(this.product, data);
            }
         }
      });
   };

   Tracker.prototype.clean = function() {
      $('#tracker_messages').html('');
   };

   Tracker.prototype.stop = function() {
      this.seller.ajax_manager.stop();
      this.undercut_ajax_manager.stop();
      return this.ajax_manager.stop();
   };

   Tracker.prototype.start = function() {
      this.ajax_manager.start();
      this.undercut_ajax_manager.start();
      this.seller.ajax_manager.start();
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

   AjaxManager.prototype.newMax = function(newMax) {
      var diff = newMax - this.max;
      this.max = newMax;
      this.mutex += diff;

   };

   tracker = new Tracker();
   tracker.init();
})(jQuery);
