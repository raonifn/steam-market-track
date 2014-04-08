function testProduct(name, callback) {
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


testProduct('Test new Product', function(product) {
  equal(product.url, 'jsons/product.json');
  equal(product.avgPrice, 1.82);
  equal(product.diffPrice, 0.29);
  equal(product.diffPriceWithoutFee, 0.02);
  equal(product.minPrice, 1.53);
  equal(product.result, 0.84);

});

testProduct('Test new Product Listins', function(product) {
  var firstListing = {
    assetid: "649955535",
    fee: 0.19,
    id: "2847706952544999335",
    in_deviation: true,
    subtotal_price: 1.34,
    total_price: 1.53,
    url: "jsons/product.json",
    appid: 753,
    contextid: '6'
  };

  var lastListing = {
    assetid: "597037894",
    fee: 0.28,
    id: "2853333201481123869",
    in_deviation: true,
    subtotal_price: 1.92,
    total_price: 2.2,
    url: "jsons/product.json",
    appid: 753,
    contextid: '6'
  };

  equal(product.listings[0].total_price, 1.53);
  equal(product.listings.length, 10);
  deepEqual(product.listings[0], firstListing);
  deepEqual(product.listings[9], lastListing);
});

testProduct('Test new Product Averages', function(product) {
  console.info(product);

  var averages = {
    deviation: 0.19488714683118535,
    mean: 1.8170000000000002,
    variance: 0.037981
  };
  deepEqual(product.averages, averages);

});
