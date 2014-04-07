(function($) {

  load_sequence = function(list, finished, fail) {
    next_load(list, 0, finished);
  }

  next_load = function(list, index, finished, fail) {
    var i = index;
    $.getScript(list[index]).done(function() {
      if (++i < list.length) {
        next_load(list, i);
      } else if(finished) {
        finished();
      }
    }).fail(function() {
      if (fail) {
        fail();
    });
  }

})(jQuery);