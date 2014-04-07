(function($) {
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
})(jQuery);