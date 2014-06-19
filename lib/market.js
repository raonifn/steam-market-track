(function ($) {

  Market = function () {
    this.search_value = 'trading card';
    this.threshold = 0.66;
    this.minDiff = 0.1;

    this.trader = new Trader();
    this.crawler = new Crawler(this.onProductFound);

  };

  Market.prototype.init = function() {
    this.trader.start();
    this.crawler.start();

    this.crawler.list(this.search_value);
  };

  Market.prototype.onProductFound = function (product) {
    var self = this;
    if (product.result <= this.threshold && product.diffPriceWithoutFee >= this.minDiff) {

      var to_buy = [];
      var undercute_price = 0;
      product.listings.each(function (listing) {
        if (!listing.in_deviation) {
          to_buy.push(listing);
        } else if (undercute_price == 0) {
          undercute_price = listing.converted_price - 1;
        }
      });

      var callback = function (listing) {
        self.trader.sell(listing, undercute_price);
      };

      to_buy.each(function (listing) {
        self.trader.buy(listing, callback);
      });
    }
  };


})(jQuery);
