(function ($) {

  function createListing(productUrl, listingSpan) {
    var listing = {};

    var buyParams = listingSpan.find('a.item_market_action_button').attr('href').replace(/^.*\((.*)\)$/, "$1").split(',');
    console.info(buyParams);
    listing.id = buyParams[1].replace(/'/g, '').trim();
    listing.appid = parseInt(buyParams[2].trim());
    listing.contextid = buyParams[3].replace(/'/g, '').trim();
    listing.assetid = buyParams[4].replace(/'/g, '').trim();
    listing.total_price = extractValue($(listingSpan).find('.market_listing_price_with_fee'));
    listing.subtotal_price = extractValue($(listingSpan).find('.market_listing_price_without_fee'));
    listing.fee = Number((listing.total_price - listing.subtotal_price).toFixed(2));
    listing.url = productUrl;

    return listing;
  };

  function extractValue(span) {
    var value = $(span).text();
    value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
    value = value.replace(/,/, ".");
    return parseFloat(value);
  };

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
  };


  function withinStd(avgs, val, stdev) {
    var low = avgs.mean - (stdev * avgs.deviation);
    var hi = avgs.mean + (stdev * avgs.deviation);
    return (val > low) && (val < hi);
  };

  Product = function(result_html, productUrl) {
    this.extractData(result_html, productUrl);
    this.calculate();
  };

  Product.prototype.calculate = function() {
    var prices = [];

    for (var index in this.listings) {
      var listing = this.listings[index];
      prices.push(listing.total_price);
    }

    var avgs = average(prices);

    var avg = avgs.mean;
    for (var index in this.listings) {
      var listing = this.listings[index];
      var in_deviation = withinStd(avgs, listing.total_price, 2);
      listing.in_deviation = in_deviation;
    }

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