(function($) {

 
  Loader = function(prefix) {
    this.prefix = prefix || '.';
  };


  Loader.prototype.load_sequence = function(list, finished, fail) {
    this.next_load(list, 0, finished, fail);
  };

  Loader.prototype.next_load = function(list, index, finished, fail) {
    var i = index;
    var self = this;
    
    $.getScript(this.prefix + '/' + list[i]).done(function() {
      
      if (++i < list.length) {
        self.next_load(list, i, finished, fail);
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