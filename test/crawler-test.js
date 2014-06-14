module('crawler list');

testCrawling = function(name, testSearch, callback) {
    asyncTest(name, function() {
        var crawler = new Crawler();

        crawler.list(testSearch);

        var ajaxInfo = crawler.ajax_manager.queue.shift();
        $.ajax({
            url: 'jsons/crawling.json',
            type: 'GET',
            crawler: crawler,
            dataType: 'json',
            success: function(data) {
                ajaxInfo.success.call(this, data);
                callback(this.crawler);
                start();
            },
            error: function() {
                ok(false, 'fail to get resource');
                start();
            }
        });
    });
};

test('Should dispatch ajax', function() {
    var crawler = new Crawler();
    var testSearch = 'testeSearch';

    crawler.list(testSearch);
    var ajaxInfo = crawler.ajax_manager.queue.shift();

    var data = {
        count: 100,
        start: 0,
        query: testSearch
    };

    equal(ajaxInfo.url, 'http://steamcommunity.com/market/search/render');
    deepEqual(ajaxInfo.data, data);
    equal(ajaxInfo.type, 'GET');
});

testCrawling('Should dispatch all pages ajax after success', 'testSearch', function(crawler) {
    equal(377, crawler.ajax_manager.queue.length);

    var data = {
        count: 100,
        start: 0,
        query: 'testSearch'
    };
    for (var i = 1 ; i < 377; i++) {
        var ajaxInfo = crawler.ajax_manager.queue.shift();
        data.start = i * 100;

        equal(ajaxInfo.url, 'http://steamcommunity.com/market/search/render');
        deepEqual(ajaxInfo.data, data);
        equal(ajaxInfo.type, 'GET');
    }

});