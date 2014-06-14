module('product');

function testProduct(name, callback) {
    asyncTest(name, function() {
        $.ajax({
            url: 'jsons/product.json',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                var product = new Product(data.listinginfo, 'jsons/product.json');
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

function testSearchProduct(name, theTest) {
    asyncTest(name, function() {
        var ajax_manager = new AjaxManager();
        var count = 10;

        Product.search("jsons/product.json", count, ajax_manager, function(product) {
            theTest(product);
            start();
        });

        var ajaxInfo = ajax_manager.queue.shift();

        var data = {
            query: '',
            start: 0,
            currency: 7,
            count: count
        };

        equal(ajaxInfo.url, 'jsons/product.json/render');
        deepEqual(ajaxInfo.data, data);

        $.ajax({
            url: 'jsons/product.json',
            type: 'GET',
            product: ajaxInfo.product,
            dataType: 'json',
            success: function(data) {
                ajaxInfo.success.call(this, data);
            },
            error: function() {
                ok(false, 'fail to get resource');
                start();
            }
        });

    });
};

function assertDefaultProduct(product) {
    equal(product.url, 'jsons/product.json');
    equal(product.avgPrice, 182),
    equal(product.diffPrice, 29);
    equal(product.diffPriceWithoutFee, 25);
    equal(product.minPrice, 153);
    equal(product.result, 84);
};

testProduct('Test new Product', function(product) {
    assertDefaultProduct(product);

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
        converted_fee: 28,
        converted_price: 192,
        converted_publisher_fee: 19,
        converted_steam_fee: 9,
        currencyid: "2001",
        fee: 12,
        listingid: "2853333201481123869",
        price: 85,
        publisher_fee: 8,
        publisher_fee_app: 239660,
        publisher_fee_percent: "0.10000000149011612",
        steam_fee: 4,
        steamid_lister: "76561198117447949",
        in_deviation: true,
        total_price: 1.53,
        url: "jsons/product.json",
        in_deviation: true,
        total_price: 220,
        url: "jsons/product.json"
    };

    equal(product.listings.length, 10);
    deepEqual(product.listings[0], firstListing);
    deepEqual(product.listings[9], lastListing);
});

testProduct('Test new Product Averages', function(product) {
    var averages = {
        deviation: 19.488714683118538,
        mean: 181.7,
        variance: 379.81000000000006
    };

    deepEqual(product.averages, averages);
});

testSearchProduct('Should search product', function(product) {
    console.info(product);
    assertDefaultProduct(product);
});