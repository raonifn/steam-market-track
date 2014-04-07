(function($) {

 
  Loader = function() {
  };


  Loader.prototype.load_sequence = function(list, finished, fail) {
    this.next_load(list, 0, finished);
  };

  Loader.prototype.next_load = function(list, index, finished, fail) {
    var i = index;
    var self = this;
    
    $.getScript(list[index]).done(function() {
      if (++i < list.length) {
        self.next_load(list, i);
      } else if(finished) {
        finished();
      }
    }).fail(function() {
      if (fail) {
        fail();
      }
    });
  };


})(jQuery);