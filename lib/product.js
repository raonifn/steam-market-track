(function ($) {

  function extractValue(span) {
    var value = $(span).text();
    value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
    value = value.replace(/,/, ".");
    return parseFloat(value);
  };

  function average(a) {
    var r = {
        mean: 0,
        variance: 0,
        deviation: 0
      },
      t = a.length;
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

  Product = function (listinginfo, productUrl) {
    this.extractData(listinginfo, productUrl);
    this.calculate();
  };

  Product.prototype.calculate = function () {
    var prices = [];

    for (var index in this.listings) {
      var listing = this.listings[index];
      prices.push(listing.total_price);
    }

    var avgs = average(prices);

    var avg = Math.round(avgs.mean);
    for (var index in this.listings) {
      var listing = this.listings[index];
      var in_deviation = withinStd(avgs, listing.total_price, 2);
      listing.in_deviation = in_deviation;
    }

    this.avgPrice = avg;
    this.minPrice = prices[0];
    this.diffPrice = (avg - this.minPrice);
    this.diffPriceWithoutFee = Math.round(this.diffPrice * 0.85);

    var result = Math.round(this.minPrice / this.avgPrice * 100);
    this.result = result;
    this.averages = avgs;
  };

  Product.prototype.extractData = function (listinginfo, productUrl) {
    var listings = [];

    for (var index in listinginfo) {
      var listing = listinginfo[index];

      listing.total_price = listing.converted_price + listing.converted_fee;
      listing.url = productUrl;

      listings.push(listing);
    }

    this.url = productUrl;
    this.listings = listings;
    this.listings.sort(function (l1, l2) {
      var diff = l1.total_price - l2.total_price;
      return diff;
    });
  };

  Product.search = function (product, count, ajax_manager, callback) {
    var productUrl = product;

    ajax_manager.ajax({
      url: product + '/render',
      data: {
        query: '',
        start: 0,
        currency: 7,
        count: count
      },
      dataType: 'json',
      type: 'GET',
      error: function (err) {
        console.info('err', err);
      },
      success: function (data) {
        var product = new Product(data.listinginfo, productUrl);
        callback(product);
      }
    });
  };

})(jQuery);
