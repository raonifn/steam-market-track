(function($) {
  Seller = function() {
    this.ajax_manager = new AjaxManager();
    this.ajax_manager.newMax(1);
  };

  Seller.prototype.sell = function(listing, price) {
    var self = this;
    var thePrice =  Math.round(price);
    var data = {
      sessionid : getCookie('sessionid'),
      currency : g_rgWalletInfo['wallet_currency'],
      appid : listing.appid,
      contextid : listing.contextid,
      amount : 1,
      price : thePrice,
      assetid : listing.assetid
    };

    console.info("selling", listing, thePrice);
    this.ajax_manager.ajax({
      url : 'https://steamcommunity.com/market/sellitem/',
      type : 'POST',
      mimeType : 'application/x-www-form-urlencoded; charset=UTF-8',
      crossDomain : true,
      listing : listing,
      price : thePrice,
      xhrFields : {
        withCredentials : true
      },
      error : function(err) {
        if (err.status == 502) {
          var messager = JSON.parse(err.responseText);
          var message = messager.message;
          console.info('erro: ', message);
        }
        console.info('err', err);
      },
      success : function(xhr) {
        console.info('sold', this.listing, xhr);
        self.messageTransaction("Sell", this.listing, this.price);
      },
      data : data
    });
  };

  Seller.prototype.undercut = function(product, my_listing) {
    var self = this;
    var min = product.listings[0];
    var second = product.listings[1];

    var undercute_price = Math.round((min.subtotal_price * 100) - 1);

    if (min.id == my_listing.id) {
      var diff = Math.round((second.subtotal_price - min.subtotal_price) * 100);
      if (diff > 1) {
        undercute_price = Math.round((second.subtotal_price * 100) - 1);
      } else {
        console.info('Doesn\'t need toun undercut', my_listing);
        return;
      }
    }

    console.info('tring undercut', my_listing);
    this.removeListing(my_listing, function(listing) {
      self.sell(listing, undercute_price);
    });
  };

  Seller.prototype.removeListing = function(listing, callback) {
    var self = this;

    this.ajax_manager.ajax({
      url : 'http://steamcommunity.com/market/removelisting/' + listing.id,
      type : 'POST',
      mimeType : 'application/x-www-form-urlencoded; charset=UTF-8',
      listing : listing,
      error : function(err) {
        if (err.status == 502) {
          var messager = JSON.parse(err.responseText);
          var message = messager.message;
          console.info('erro: ', message);
        }
        console.info('err', err);
      },
      success : function(xhr) {
        console.info('removed', this.listing, xhr);
        self.messageTransaction("Removed", this.listing);
        if (callback) {
          callback(listing);
        }

      },
      data : {
        sessionid : getCookie('sessionid')
      }
    });
  };

  Seller.prototype.messageTransaction = function(type, listing, price) {
    var a = $('<a />').append(type + ": " + JSON.stringify(listing));
    a.addClass('result-item');
    a.attr('target', '_blank');
    a.attr('href', listing.url);
    a.css('color', '#000');
    a.css('color', '#000');
    a.css('font-weight', 'bold');

    var p = $('<p />');
    p.append(a);

    $('#tracker_messages').prepend(p);
    $('#tracker_messages .result-item:last').click(function() {
      $(this).css('font-weight', 'none');
    });
  };
})(jQuery);