(function($) {
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
})(jQuery);