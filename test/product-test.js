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
    asset: {
      amount: "1",
      appid: 753,
      contextid: "6",
      currency: 0,
      id: "649955535"
    },
    converted_currencyid: "2007",
    converted_fee: 19,
    converted_price: 134,
    converted_publisher_fee: 13,
    converted_steam_fee: 6,
    currencyid: "2007",
    fee: 19,
    listingid: "2847706952544999335",
    price: 134,
    publisher_fee: 13,
    publisher_fee_app: 239660,
    publisher_fee_percent: "0.10000000149011612",
    steam_fee: 6,
    steamid_lister: "76561197984049299",
    in_deviation: true,
    total_price: 153,
    url: "jsons/product.json"
  };

  var lastListing = {
     asset: {
      amount: "1",
      appid: 753,
      contextid: "6",
      currency: 0,
      id: "597037894"
    },
    converted_currencyid: "2007",
    converted_fee: 20,
    converted_price: 192,
    converted_publisher_fee: 13,
    converted_steam_fee: 7,
    currencyid: "2007",
    fee: 28,
    listingid: "2853333201481123869",
    price: 134,
    publisher_fee: 13,
    publisher_fee_app: 239660,
    publisher_fee_percent: "0.10000000149011612",
    steam_fee: 6,
    steamid_lister: "76561197984049299",
    in_deviation: true,
    total_price: 1.53,
    url: "jsons/product.json",
    in_deviation: true,
    subtotal_price: 192,
    total_price: 220,
    url: "jsons/product.json"
  };

  equal(product.listings.length, 10);
  deepEqual(product.listings[0], firstListing);
  deepEqual(product.listings[9], lastListing);
});

testProduct('Test new Product Averages', function(product) {
  var averages = {
    deviation: 0.19488714683118535,
    mean: 1.8170000000000002,
    variance: 0.037981
  };

  deepEqual(product.averages, averages);
});
