module('crawler');

testCrawlingDispatch = function (name, testSearch, theTest) {
  asyncTest(name, function () {
    var crawler = new Crawler();

    crawler.list(testSearch);

    var ajaxInfo = crawler.ajax_manager.queue.shift();
    $.getJSON('jsons/crawling.json').success(function (data) {
      ajaxInfo.success.call(this, data);
      theTest(crawler);
      start();
    }).fail(function () {
      ok(false, 'fail to get resource');
      start();
    });
  });
};

createClosure = function (ajaxInfo) {
  return function (data) {
    ajaxInfo.success.call(this, data);
  };
};

consumeProducts = function (crawler, callback) {
  var ajaxes = [];
  while (crawler.ajax_manager.queue.length > 0) {
    var ajaxInfo = crawler.ajax_manager.queue.shift();
    var deferred = $.getJSON('jsons/product.json');
    deferred.success(createClosure(ajaxInfo)).fail(function () {
      ok(false, 'fail to get resource');
      start();
    });

    ajaxes.push(deferred);
  }

  $.when.apply($, ajaxes).done(callback);

};

testCrawlingProductList = function (name, theTest) {
  asyncTest(name, function () {
    var list = [];

    var crawler = new Crawler(function (product) {
      list.push(product);
    });

    crawler.list('something');

    var ajaxInfo = crawler.ajax_manager.queue.shift();
    $.getJSON('jsons/crawling.json').success(function (data) {
      ajaxInfo.success.call(this, data);

      consumeProducts(crawler, function () {
        theTest(list);
        start();
      });
    }).fail(function () {
      ok(false, 'fail to get resource');
      start();
    });
  });
};

test('Should dispatch ajax', function () {
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

testCrawlingDispatch('Should dispatch all pages ajax after success', 'testSearch', function (crawler) {
  equal(377, crawler.ajax_manager.queue.length);

  var data = {
    count: 100,
    start: 0,
    query: 'testSearch'
  };
  for (var i = 1; i < 377; i++) {
    var ajaxInfo = crawler.ajax_manager.queue.shift();
    data.start = i * 100;

    equal(ajaxInfo.url, 'http://steamcommunity.com/market/search/render');
    deepEqual(ajaxInfo.data, data);
    equal(ajaxInfo.type, 'GET');
  }

});

testCrawlingProductList('Should callback each product url', function (productList) {
//  equal(productList.length, 387);
  equal(productList.length, 10);

  for (var i = 0; i < productList.length; i++) {
    var product = productList[i];
    ok(product.url.match(/^http:\/\/steamcommunity.com\/market\/listings\/\d+\/.+/));
  }
});
