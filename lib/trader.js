(function ($) {
  Trader = function () {
    this.ajax_manager = new AjaxManager();
    this.ajax_manager.newMax(1);

    this.search_ajax_manager = new AjaxManager();
    this.search_ajax_manager.newMax(1);

    this.messageListener = null;

    this.handleHtmlListings = function (html, callback) {
      var self = this;

      html = html.replace(/src/g, "_src");
      var all = $(html);

      var listingsHtml = all.find("div[id^='mylisting_']");

      $(listingsHtml).each(function () {
        var id = $(this).attr('id');

        if (id.substr(0, 10) !== 'mylisting_') {
          return;
        }

        id = id.replace(/mylisting_(\d*)/, "$1");

        var listing = {};
        listing.listingid = id;

        var linkToRemove = $(this).find('a.item_market_action_button_edit').attr('href');
        linkToRemove = linkToRemove.replace(
          /javascript:RemoveMarketListing\('mylisting', '\d+', \d+, '\d+', '(\d+)'\)/, "$1");
        listing.asset = {};
        listing.asset.id = linkToRemove;

        var lnk = $(this).find('a.market_listing_item_name_link').attr('href');
        lnk = lnk.replace(/\?.*$/, '');

        Product.search(lnk, 10, self.search_ajax_manager, function (productUrl, data) {
          var product = new Product(productUrl);

          listing.url = product.url;

          if (callback) {
            callback(product, listing);
          }
        });
      });
    };
  };

  Trader.prototype.messageListener = function (listener) {
    this.messageListener = listener;
  };

  Trader.prototype.sell = function (listing, price) {
    var self = this;
    var thePrice = Math.round(price);
    var data = {
      sessionid: getCookie('sessionid'),
      currency: g_rgWalletInfo['wallet_currency'],
      appid: listing.asset.appid,
      contextid: listing.asset.contextid,
      amount: 1,
      price: thePrice,
      assetid: listing.asset.id
    };

    this.ajax_manager.ajax({
      url: 'https://steamcommunity.com/market/sellitem/',
      type: 'POST',
      mimeType: 'application/x-www-form-urlencoded; charset=UTF-8',
      crossDomain: true,
      listing: listing,
      price: thePrice,
      xhrFields: {
        withCredentials: true
      },
      error: function (err) {
        if (err.status == 502) {
          var messager = JSON.parse(err.responseText);
          var message = messager.message;
          console.info('erro: ', message);
        }
        console.info('err', err);
      },
      success: function (xhr) {
        self.messageTransaction("Sell", this.listing, this.price);
      },
      data: data
    });
  };

  Trader.prototype.undercut = function (product, my_listing) {
    var self = this;
    var min = product.listings[0];
    var second = product.listings[1];

    var undercute_price = Math.round(min.converted_price - 1);

    if (min.listingid == my_listing.listingid) {
      var diff = (second.converted_price - min.converted_price);
      if (diff > 1) {
        undercute_price = (second.converted_price - 1);
      } else {
        return;
      }
    }

    this.removeListing(my_listing, function (listing) {
      self.sell(listing, undercute_price);
    });
  };

  Trader.prototype.removeListing = function (listing, callback) {
    var self = this;

    this.ajax_manager.ajax({
      url: 'http://steamcommunity.com/market/removelisting/' + listing.listingid,
      type: 'POST',
      mimeType: 'application/x-www-form-urlencoded; charset=UTF-8',
      listing: listing,
      error: function (err) {
        if (err.status == 502) {
          var messager = JSON.parse(err.responseText);
          var message = messager.message;
          console.info('erro: ', message);
        }
        console.info('err', err);
      },
      success: function (xhr) {
        self.messageTransaction("Removed", this.listing);
        if (callback) {
          callback(listing);
        }

      },
      data: {
        sessionid: getCookie('sessionid')
      }
    });
  };

  Trader.prototype.buy = function (listing, callback) {
    var url = 'https://steamcommunity.com/market/buylisting/' + listing.asset.id;
    var data = {
      sessionid: getCookie('sessionid'),
      currency: g_rgWalletInfo['wallet_currency'],
      subtotal: listing.converted_price,
      fee: listing.converted_fee,
      total: listing.converted_price + listing.converted_fee
    };

    this.ajax_manager.ajax({
      url: url,
      type: 'POST',
      mimeType: 'application/x-www-form-urlencoded; charset=UTF-8',
      data: data,
      crossDomain: true,
      listing: listing,
      xhrFields: {
        withCredentials: true
      },
      error: function (err) {
        if (err.status == 502) {
          var messager = JSON.parse(err.responseText);
          var message = messager.message;
          console.info('erro: ' + message);
        }
        console.info('err', err);
      },
      success: function (info) {

        var new_wallet = eval("(" + info + ")");
        g_rgWalletInfo = new_wallet.wallet_info;
        if (callback) {
          callback(listing);
        }
      }
    });
  };

  Trader.prototype.messageTransaction = function (type, listing, price) {
    if (this.messageListener) {
      this.messageListener(type, listing, price);
    }
  };

  Trader.prototype.searchListings = function (callback) {
    var self = this;

    this.search_ajax_manager.ajax({
      url: 'http://steamcommunity.com/market/mylistings',
      type: 'GET',
      dataType: 'json',
      trader: self,
      error: function (err) {
        console.info('err', err);
      },
      success: function (data) {
        if (callback) {
          this.trader.handleHtmlListings(data.results_html, function (product, listing) {
            console.info(listing, product);
            callback(product, listing);
          });
        }
      }
    });
  };

})(jQuery);
