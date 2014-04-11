(function ($) {

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

  Product = function(listinginfo, productUrl) {
    this.extractData(listinginfo, productUrl);
    this.calculate();
  };

  Product.prototype.calculate = function() {
    var prices = [];

console.info(this.listings.length);
    for (var index in this.listings) {
      var listing = this.listings[index];
      prices.push(listing.converted_price);
    }
    console.info(prices.length);

    console.info('prices', prices);
    var avgs = average(prices);

    var avg = avgs.mean;
    for (var index in this.listings) {
      var listing = this.listings[index];
      var in_deviation = withinStd(avgs, listing.converted_price, 2);
      listing.in_deviation = in_deviation;
    }

    this.avgPrice = avg;
    this.minPrice = prices[0];
    this.diffPrice =(avg - prices[0]);
    this.diffPriceWithoutFee = (this.diffPrice - (avg * 15));

    var result = this.minPrice / this.avgPrice;
    this.result = result;
    this.averages = avgs;
  };

  Product.prototype.extractData = function(listinginfo, productUrl) {
    var listings = [];

    for (var index in listinginfo) {
      var listing = listinginfo[index];

      listing.total_price = listing.converted_price + listing.converted_fee,
      listing.url = productUrl,

      listings.push(listing);
    }

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