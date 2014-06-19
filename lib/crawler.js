(function ($) {

  Crawler = function (productCallback, options) {
    this.ajax_manager = new AjaxManager();
    this.productCallback = productCallback;

    this.searching = false;

    this.options = {};
    this.options.minCount = 80;
    this.options.search_param = {
      pagesize: 100
    };

    $.extend(this.options, options, true);


    var self = this;

    this.ajax_manager.callbackFinished(function () {
      if (!self.searching && self.searchValue) {
        self.list(self.searchValue);
      }
    });

    this.handleHtmlList = function (data, callback) {
      data = data.replace(/src/g, "_src");
      var all = $(data);
      var links = all.find('div.market_listing_row');

      $(links).each(function (index) {
        var ammount = parseInt($(this).find('span.market_listing_num_listings_qty').text().replace(/,/, ''));
        var lnk = $(this).parent().attr('href');
        lnk = lnk.replace(/\?.*$/, '');
        callback(lnk, ammount);
      });
    };
  };

  Crawler.prototype.list = function (searchValue, page) {
    var self = this;
    this.searchValue = searchValue;
    this.searching = true;

    var start = 0;
    if (page > 0) {
      start = page * this.options.search_param.pagesize;
    }

    this.ajax_manager.ajax({
      url: 'http://steamcommunity.com/market/search/render',
      type: 'GET',
      dataType: 'json',
      data: {
        count: this.options.search_param.pagesize,
        start: start,
        query: searchValue
      },
      error: function (err) {
        console.info('err', err);
        self.searching = false;
      },
      success: function (data) {
        var crawler = self;

        if (start == 0) {
          var pages = (data.total_count / crawler.options.search_param.pagesize) + 1;
          for (var i = 1; i <= pages; i++) {
            crawler.list(searchValue, i);
          }
        }
        crawler.searching = false;
        crawler.handleHtmlList(data.results_html, function (productUrl, ammount) {
          if (ammount >= self.options.minCount) {
            if (self.productCallback) {
              Product.search(productUrl, 10, crawler.ajax_manager, function (product) {
                self.productCallback(product);
              });
            }
          }
        });
      }
    });
  };

  Crawler.prototype.start = function() {
    this.ajax_manager.start();
  };

  Crawler.prototype.stop = function() {
    this.ajax_manager.stop();
  };

})(jQuery);
