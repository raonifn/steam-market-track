(function ($) {
  Market = function () {
    this.search_value = 'trading card';
    this.debug = false;
    this.minCount = 100;
    this.threshold = 0.66;
    this.schedule_time = 3 * 100;
    this.minDiff = 0.1;

    var messageTransaction = function (type, listing, price) {
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
      $('#tracker_messages .result-item:last').click(function () {
        $(this).css('font-weight', 'none');
      });
    };
  };

  Market.prototype.init = function () {};

  Market.prototype.printForm = function () {
    var self = this;

    var tracker_div = $('#tracker');
    if (tracker_div) {
      tracker_div.remove();
    }

    var divTracker = $('<div id="tracker" />');
    var form = $('<div id="tracker_form" />');
    var messages = $('<div id="tracker_messages" style="width: 100%;"/>');
    divTracker.append(form);
    divTracker.append(messages);

    divTracker.attr('style',
      'z-index: 500; width: 100%; height: 100%; position:absolute; top: 0; left: 0; background-color: #fff;');
    $('body').prepend(divTracker);

    var button = $('<input id="toggle_schedule" type="button" value="start"/>');
    button.click(function () {
      if (self.ajax_manager.timer) {
        $('#toggle_schedule').val('start');
        self.stop();
      } else {
        $('#toggle_schedule').val('stop');
        self.start();
      }
    });
    var buttonClean = $('<input id="clean_messages" type="button" value="clean messages"/>');
    buttonClean.click(this.clean);

    var buttonCleanQueue = $('<input id="clean_queue" type="button" value="clean queue"/>');
    buttonCleanQueue.click(function () {
      self.ajax_manager.queue = [];
      self.ajax_manager.mutex = self.ajax_manager.max;
    });

    form.append($('<input type="text" id="search_value" value="' + this.search_value + '" />'));
    form.append($('<input type="text" id="minCount" value="' + this.minCount + '" />'));
    form.append($('<input type="text" id="threshold" value="' + this.threshold + '" />'));
    form.append($('<input type="text" id="max_ajax" value="' + this.ajax_manager.max + '" />'));
    form.append($('<input type="text" id="schedule_time" value="' + this.schedule_time + '" />'));
    form.append($('<input type="text" id="min_diff" value="' + this.minDiff + '" />'));
    var buttonUpdate = $('<input id="update_info" type="button" value="update data"/>');
    buttonUpdate.click(function () {
      var started = self.stop();
      self.updateParams();
      if (started) {
        self.start();
      }
    });

    form.append(buttonUpdate);
    form.append(button);
    form.append(buttonClean);
    form.append(buttonCleanQueue);
  };

})(jQuery);
