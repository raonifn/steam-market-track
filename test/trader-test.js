function testTrader(name, url, callback) {
  asyncTest(name, function() {
    $.ajax({
      url: url,
      type : 'GET',
      dataType: 'json',
      success: function(data) {
        console.info("aaaaaa", data.listinginfo);
        var product = new Product(data.results_html, 'jsons/product.json');
        callback(product);
        start();
      },
      error: function() {
        ok(false, 'fail to get resource');
        start();
      }
    });
  });
}

//FIXME: remove getCookie and walletinfo
function getCookie(name) {
  return name;
}

g_rgWalletInfo = {
  wallet_currency: 5
};


function assertRemoved(listingid, trader) {
  var ajaxInfo = trader.ajax_manager.queue.pop();
  equal(ajaxInfo.url, 'http://steamcommunity.com/market/removelisting/' + listingid);
  equal(ajaxInfo.type, 'POST');
  equal(ajaxInfo.mimeType, 'application/x-www-form-urlencoded; charset=UTF-8');
  equal(ajaxInfo.data.sessionid, getCookie('sessionid'));
  
  return ajaxInfo;
}

function assertSell(listing, price, trader) {
  var ajaxInfo = trader.ajax_manager.queue.pop();
  
  var data =   {
    sessionid : getCookie('sessionid'),
    currency : g_rgWalletInfo['wallet_currency'],
    appid : listing.appid,
    contextid : listing.contextid,
    amount : 1,
    price : Math.round(price),
    assetid : listing.assetid
  };

  equal(ajaxInfo.url, 'https://steamcommunity.com/market/sellitem/');
  equal(ajaxInfo.type, 'POST');
  equal(ajaxInfo.mimeType, 'application/x-www-form-urlencoded; charset=UTF-8');
  ok(ajaxInfo.crossDomain);
  ok(ajaxInfo.xhrFields.withCredentials);
  deepEqual(ajaxInfo.data, data);
  
  return ajaxInfo;
}

function executeSuccessRemove(ajaxInfo) {
  ajaxInfo.success('removed');
}

testTrader('Test Sell', 'jsons/product.json', function(product) {
  var trader = new Seller();
  var listing = product.listings[0];
  var price = 20.923;

  trader.sell(listing, price);

  assertSell(listing, price, trader);
});

testTrader('Test Remove Listing', 'jsons/product.json', function(product) {
  var trader = new Seller();

  var listing = product.listings[0];

  trader.removeListing(listing);

  assertRemoved('2847706952544999335', trader);
});


testTrader('Test Remove Listing with Callback', 'jsons/product.json', function(product) {
  var trader = new Seller();

  var listing = product.listings[0];

  var callbacked = false;
  trader.removeListing(listing, function(listingRemoved) {
    callbacked = true;
    deepEqual(listingRemoved, listing);
  });

  ajaxInfo = assertRemoved('2847706952544999335', trader);

  executeSuccessRemove(ajaxInfo);

  ok(callbacked, 'should call callback');
});

testTrader('Test Undercut', 'jsons/undercut.json', function(product) {
  var trader = new Seller();
  var lesser = product.listings[0];
  var my_listing = product.listings[1];

  trader.undercut(product, my_listing);

  var ajaxInfo = assertRemoved('2847706952544999335', trader);
  executeSuccessRemove(ajaxInfo);

  assertSell(my_listing, (lesser.subtotal_price * 100) - 1, trader);
});
