(function($) {

    Crawler = function() {
        this.ajax_manager = new AjaxManager();
        
        this.searching = false;

        this.search_param = {
            pagesize : 100
        };
        

        var self = this;

        /*this.ajax_manager.callbackFinished(function() {
            if (!self.searching) {
                self.list();
            }
        });*/
    };

    Crawler.prototype.list = function(searchValue, page) {
        var self = this;
        this.searching = true;

        var start = 0;
        if (page > 0) {
            start = page * this.search_param.pagesize;
        } 

        this.ajax_manager.ajax({
            url : 'http://steamcommunity.com/market/search/render',
            type : 'GET',
            data: {
                count: this.search_param.pagesize,
                start: start,
                query: searchValue
            },
            crawler : self,
            error : function(err) {
                console.info('err', err);
                this.crawler.searching = false;
            },
            success : function(data) {
                if (start == 0) {
                    var pages = (data.total_count / this.crawler.search_param.pagesize) + 1;
                    for (var i = 1; i <= pages; i++) {
                        this.crawler.list(searchValue, i);
                    }
                }
                this.crawler.searching = false;
                this.crawler.handleHtmlList(data.results_html);
            }
        });
    };

    Crawler.prototype.handleHtmlList = function(data) {
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

    Crawler.prototype.searchProducts = function(product, count, ajax_manager, callback) {
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


})(jQuery);