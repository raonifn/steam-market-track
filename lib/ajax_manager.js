(function($) {
  
  AjaxManager = function() {
    this.queue = [];
    this.max = 5;
    this.mutex = 5;
  };

  AjaxManager.prototype.stop = function() {
    console.info('stopping', this);
    var started = this.timer;
    if (started) {
      clearInterval(this.timer);
      delete this.timer;
    }
    return started;
  };

  AjaxManager.prototype.start = function() {
    var self = this;
    console.info('starting', self);

    this.timer = setInterval(function() {
      self.consume();
    }, this.schedule_time);
  };

  AjaxManager.prototype.callbackFinished = function(callback) {
    this.callback_finished = callback;
  };

  AjaxManager.prototype.consume = function() {
    var self = this;
    if (this.queue.length > 0) {
      while (this.mutex > 0 && this.queue.length > 0) {
        var opts = this.queue.shift();

        var error = opts.error;
        opts.error = function() {
          try {
            error.apply(this, arguments);
          } finally {
            self.mutex++;
          }
        };

        var success = opts.success;
        opts.success = function() {
          try {
            success.apply(this, arguments);
          } finally {
            self.mutex++;
          }
        };
        $.ajax(opts);
        self.mutex--;
      }
    } else if (this.callback_finished) {
      this.callback_finished();
    }
  };

  AjaxManager.prototype.ajax = function(opts) {
    this.queue.push(opts);
  };

  AjaxManager.prototype.newMax = function(newMax) {
    var diff = newMax - this.max;
    this.max = newMax;
    this.mutex += diff;

  };
})(jQuery);