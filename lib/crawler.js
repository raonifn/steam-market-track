(function($) {

    Crawler = function() {
        this.ajax_manager = new AjaxManager();

        this.searching = false;

        this.search_param = {
            pagesize: 100
        };


        var self = this;

        /*this.ajax_manager.callbackFinished(function() {
            if (!self.searching) {
                self.list();
            }
        });*/

        this.handleHtmlList = function(data, callback) {
            var self = this;
            data = data.replace(/src/g, "_src");
            var all = $(data);
            var links = all.find('div.market_listing_row');

            $(links).each(function(index) {
                var lnk = $(this).parent().attr('href');
                lnk = lnk.replace(/\?.*$/, '');
                callback(lnk);
            });
        };
    };

    Crawler.prototype.list = function(searchValue, page, callback) {
        var self = this;
        this.searching = true;

        var start = 0;
        if (page > 0) {
            start = page * this.search_param.pagesize;
        }

        this.ajax_manager.ajax({
            url: 'http://steamcommunity.com/market/search/render',
            type: 'GET',
            data: {
                count: this.search_param.pagesize,
                start: start,
                query: searchValue
            },
            error: function(err) {
                console.info('err', err);
                this.crawler.searching = false;
            },
            success: function(data) {
                var crawler = self;

                if (start == 0) {
                    var pages = (data.total_count / crawler.search_param.pagesize) + 1;
                    for (var i = 1; i <= pages; i++) {
                        crawler.list(searchValue, i, callback);
                    }
                }
                crawler.searching = false;
                crawler.handleHtmlList(data.results_html, function(productUrl) {
                    if (callback) {
                        Product.search(productUrl, 10, crawler.ajax_manager, function(product) {
                            callback(product);
                        });
                    }
                });
            }
        });
    };

})(jQuery);