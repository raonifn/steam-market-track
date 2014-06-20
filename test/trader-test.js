module('trader');

function testTrader(name, url, callback) {
  asyncTest(name, function () {
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      success: function (data) {
        var product = new Product(data.listinginfo, 'jsons/product.json');
        callback(product);
        start();
      },
      error: function () {
        ok(false, 'fail to get resource');
        start();
      }
    });
  });
};

function createConsumeClosure(ajaxInfo) {
  return function (data) {
    ajaxInfo.success.call(this, data);
  };
};

function consumeListinsProducts(trader, callback) {
  var ajaxes = [];
  while (trader.search_ajax_manager.queue.length > 0) {
    var ajaxInfo = trader.search_ajax_manager.queue.shift();
    var deferred = $.getJSON('jsons/product.json');
    deferred.success(createConsumeClosure(ajaxInfo)).fail(function () {
      ok(false, 'fail to get resource');
      start();
    });

    ajaxes.push(deferred);
  }

  $.when.apply($, ajaxes).done(function () {
    callback();
    start();
  });
};

function testSearchListings(name, callback) {
  asyncTest(name, function () {
    var trader = new Trader();

    var ret = [];
    trader.searchListings(function (product, listing) {
      ret.push({
        product: product,
        listing: listing
      });
    });

    var ajaxInfo = trader.search_ajax_manager.queue.shift();

    $.getJSON('jsons/mylistings.json').success(function (data) {
      this.trader = trader;
      ajaxInfo.success.call(this, data);
      consumeListinsProducts(trader, function () {
        callback(ret);
      });
    }).fail(function () {
      ok(false, 'fail to get resource');
      start();
    });
  });
};

//FIXME: remove getCookie and walletinfo
function getCookie(name) {
  return name;
}

g_rgWalletInfo = {
  wallet_currency: 5
};


function assertDontTrade(trader) {
  equal(trader.ajax_manager.queue.length, 0);
}

function assertRemoved(listingid, trader) {
  var ajaxInfo = trader.ajax_manager.queue.pop();
  equal(ajaxInfo.url, 'http://steamcommunity.com/market/removelisting/' + listingid);
  equal(ajaxInfo.type, 'POST');
  equal(ajaxInfo.mimeType, 'application/x-www-form-urlencoded; charset=UTF-8');
  equal(ajaxInfo.data.sessionid, getCookie('sessionid'));

  return ajaxInfo;
}

function assertTradeAjaxInfo(url, data, trader) {
  var ajaxInfo = trader.ajax_manager.queue.pop();

  equal(ajaxInfo.url, url);
  equal(ajaxInfo.type, 'POST');
  equal(ajaxInfo.mimeType, 'application/x-www-form-urlencoded; charset=UTF-8');
  ok(ajaxInfo.crossDomain);
  ok(ajaxInfo.xhrFields.withCredentials);
  deepEqual(ajaxInfo.data, data);

  return ajaxInfo;
}

function assertSell(listing, price, trader) {
  var data = {
    sessionid: getCookie('sessionid'),
    currency: g_rgWalletInfo['wallet_currency'],
    appid: listing.asset.appid,
    contextid: listing.asset.contextid,
    amount: 1,
    price: price,
    appid: 753,
    contextid: '6',
    assetid: listing.asset.id
  };

  return assertTradeAjaxInfo('https://steamcommunity.com/market/sellitem/', data, trader);
}

function assertBuy(listing, trader) {
  var data = {
    sessionid: getCookie('sessionid'),
    currency: g_rgWalletInfo['wallet_currency'],
    subtotal: listing.converted_price,
    fee: listing.converted_fee,
    total: listing.converted_price + listing.converted_fee
  };

  return assertTradeAjaxInfo('https://steamcommunity.com/market/buylisting/' + listing.listingid, data, trader);
}



function executeSuccess(ajaxInfo, info) {
  var passing = info ? info : 'success';
  ajaxInfo.success(passing);
}

testTrader('Test Sell', 'jsons/product.json', function (product) {
  var trader = new Trader();
  var listing = product.listings[0];
  var price = 129;

  trader.sell(listing, price);

  assertSell(listing, price, trader);
});

testTrader('Test Buy', 'jsons/product.json', function (product) {
  var trader = new Trader();
  var listing = product.listings[0];

  trader.buy(listing);

  assertBuy(listing, trader);
});

testTrader('Test Buy with callback', 'jsons/product.json', function (product) {
  var trader = new Trader();
  var listing = product.listings[0];

  trader.buy(listing, function (listingBought) {
    callbacked = true;
    deepEqual(listingBought, listing);
    equal(g_rgWalletInfo, 10);
  });



  var ajaxInfo = assertBuy(listing, trader);
  executeSuccess(ajaxInfo, '{wallet_info: 10}');

  ok(callbacked, 'should call callback');
});

testTrader('Test Remove Listing', 'jsons/product.json', function (product) {
  var trader = new Trader();

  var listing = product.listings[0];

  trader.removeListing(listing);

  assertRemoved('2847706952544999335', trader);
});


testTrader('Test Remove Listing with Callback', 'jsons/product.json', function (product) {
  var trader = new Trader();

  var listing = product.listings[0];

  var callbacked = false;
  trader.removeListing(listing, function (listingRemoved) {
    callbacked = true;
    deepEqual(listingRemoved, listing);
  });

  var ajaxInfo = assertRemoved('2847706952544999335', trader);

  executeSuccess(ajaxInfo);

  ok(callbacked, 'should call callback');
});

testTrader('Test Undercut', 'jsons/undercut.json', function (product) {
  var trader = new Trader();
  var lesser = product.listings[0];
  var my_listing = product.listings[1];

  trader.undercut(product, my_listing);

  var ajaxInfo = assertRemoved('2847706952544999335', trader);
  executeSuccess(ajaxInfo);

  assertSell(my_listing, (lesser.converted_price - 1), trader);
});

testTrader('Test Undercut beeing lesser listing', 'jsons/product_with_undercut.json', function (product) {
  var trader = new Trader();
  var my_listing = product.listings[0];

  trader.undercut(product, my_listing);

  var ajaxInfo = assertRemoved('2847706952544999335', trader);

  executeSuccess(ajaxInfo);
  assertSell(my_listing, (product.listings[1].converted_price - 1), trader);

});

testTrader('Test dont Undercut', 'jsons/product.json', function (product) {
  var trader = new Trader();
  var my_listing = product.listings[0];

  trader.undercut(product, my_listing);

  assertDontTrade(trader);
});

testSearchListings('Test Search Listings', function (result) {
  equal(result.length, 4);

  ok(contains(result, "2800426047176798406"));
  ok(contains(result, "2800426047177599341"));
  ok(contains(result, "2800426047177611181"));
  ok(contains(result, "2800426047177647181"));
});

function contains(results, value) {
  for (var k = 0; k < results.length; k++) {
    if (results[k].listing.listingid == value) {
      return true;
    }
  }
  return false;
};
