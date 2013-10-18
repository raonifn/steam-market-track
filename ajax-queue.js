a = (function($) {
	var ajax_manager = {
		queue : [],
		max : 5,
		mutex : 5,
		ajax: ajax,
		newMax: newMax
		
	};

	function ajax(opts) {
		this.queue.push(opts);
	}
	
	function newMax(newMax) {
	  var diff = newMax - ajax_manager.max;

	  this.max = newMax;
		this.mutex += diff;
	}
	
	return ajax_manager;
})(jQuery);

