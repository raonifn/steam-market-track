(function($) {
  function getCookie(c_name) {
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) {
      c_start = c_value.indexOf(c_name + "=");
    }
    if (c_start == -1) {
      c_value = null;
    } else {
      c_start = c_value.indexOf("=", c_start) + 1;
      var c_end = c_value.indexOf(";", c_start);
      if (c_end == -1) {
        c_end = c_value.length;
      }
      c_value = unescape(c_value.substring(c_start, c_end));
    }
    return c_value;
  }

  function average(a) {
    var r = {
      mean : 0,
      variance : 0,
      deviation : 0
    }, t = a.length;
    for (var m, s = 0, l = t; l--; s += a[l])
      ;
    for (m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2))
    ;
    return r.deviation = Math.sqrt(r.variance = s / t), r;
  }

  function withinStd(avgs, val, stdev) {
    var low = avgs.mean - (stdev * avgs.deviation);
    var hi = avgs.mean + (stdev * avgs.deviation);
    return (val > low) && (val < hi);
  }

  function extractValue(span) {
    var value = $(span).text();
    value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
    value = value.replace(/,/, ".");
    return parseFloat(value);
  }

  function createListing(productUrl, listingSpan) {
    var listing = {};

    listing.id = listingSpan.attr('id').replace(/listing_(.*)/, "$1");
    listing.assetid = listingSpan.find('a.item_market_action_button').attr('href').replace(/^.*'([^,]+)'\)$/, "$1");
    listing.total_price = extractValue($(listingSpan).find('.market_listing_price_with_fee'));
    listing.subtotal_price = extractValue($(listingSpan).find('.market_listing_price_without_fee'));
    listing.fee = Number((listing.total_price - listing.subtotal_price).toFixed(2));
    listing.url = productUrl;

    return listing;
  }
})(jQuery);