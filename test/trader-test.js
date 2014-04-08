function testTrader(name, callback) {
  asyncTest(name, function() {
    $.ajax({
      url: 'jsons/product.json',
      type : 'GET',
      dataType: 'json',
      success: function(data) {
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

testTrader('Test Sell', function(product) {
  var trader = new Seller();
  var listing = product.listings[0];
  var price = 20.923;

  var data =   {
    sessionid : getCookie('sessionid'),
    currency : g_rgWalletInfo['wallet_currency'],
    appid : listing.appid,
    contextid : listing.contextid,
    amount : 1,
    price : Math.round(price),
    assetid : listing.assetid
  };



  trader.sell(listing, price);

  var ajaxInfo = trader.ajax_manager.queue.pop();

  equal(ajaxInfo.url, 'https://steamcommunity.com/market/sellitem/');
  equal(ajaxInfo.type, 'POST');
  equal(ajaxInfo.mimeType, 'application/x-www-form-urlencoded; charset=UTF-8');
  ok(ajaxInfo.crossDomain);
  ok(ajaxInfo.xhrFields.withCredentials);
  deepEqual(ajaxInfo.data, data);

});