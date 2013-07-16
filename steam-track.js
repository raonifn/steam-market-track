(function($) {
	var tracker = {
		url : 'http://steamcommunity.com/market/',
		search : '/search/render',
		search_param : {
			pagesize : 100
		},
		search_value : 'trading card',
		debug : false,
		stop : true,
		minCount : 100,
		threshold : 0.66,
		schedule_time : 2 * 1000
	};

	var ajax_manager = {
		queue : [],
		mutex : 5
	};

	function ajax(opts) {
		ajax_manager.queue.push(opts);
	}

	function updateParams() {
		tracker.minCount = parseInt($('#minCount').val());
		tracker.threshold = parseFloat($('#threshold').val());
		tracker.schedule_time = parseInt($('#schedule_time').val());
		tracker.search_value = $('#search_value').val();
	}

	function stop() {
		var started = ajax_manager.timer;
		if (started) {
			console.info('parando');
			clearInterval(ajax_manager.timer);
			delete ajax_manager.timer;
		}
		return started;
	}

	function consume() {
		if (ajax_manager.queue.length) {
			if (ajax_manager.mutex > 0) {
				var opts = ajax_manager.queue.shift();
				var success = opts.success;
				var error = opts.error;
				opts.error = function() {
					try {
						error.apply(this, arguments);
					} finally {
						ajax_manager.mutex++;
						console.info('mutex', ajax_manager.mutex);
					}
				}
				opts.success = function() {
					try {
						success.apply(this, arguments);
					} finally {
						ajax_manager.mutex++;
						console.info('mutex', ajax_manager.mutex);
					}
				};
				console.info('consume', opts);
				$.ajax(opts);
				ajax_manager.mutex--;
				console.info('mutex', ajax_manager.mutex);
			}
		} else {
			list();	
		}
	}

	function start() {
		console.info('agendado');
		ajax_manager.timer = setInterval(exec, tracker.schedule_time);
	}

	function init() {
		$.ajaxPrefilter(onAjax);

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
				'z-index: 100; width: 100%; height: 20%; position:absolute; top: 0; left: 0; background-color: #fff;');
		$('body').prepend(divTracker);

		var button = $('<input id="toggle_schedule" type="button" value="toggle schedule"/>');
		button.click(function() {
			if (ajax_manager.timer) {
				stop();
			} else {
				start();
			}
		});
		var buttonClean = $('<input id="clean_messages" type="button" value="clean messages"/>');
		buttonClean.click(clean);

		form.append($('<input type="text" id="search_value" value="' + tracker.search_value + '" />'));
		form.append($('<input type="text" id="minCount" value="' + tracker.minCount + '" />'));
		form.append($('<input type="text" id="threshold" value="' + tracker.threshold + '" />'));
		form.append($('<input type="text" id="schedule_time" value="' + tracker.schedule_time + '" />'));
		var buttonUpdate = $('<input id="update_info" type="button" value="update data"/>');
		buttonUpdate.click(function() {
			var started = stop();
			updateParams();
			if (started) {
				start();
			}
		});

		form.append(buttonUpdate);
		form.append(button);
		form.append(buttonClean);
	}

	function list(page) {
		var start = 0;
		if (page) {
			start = page * tracker.search_param.pagesize;
		}
		var query = tracker.url + tracker.search + '?count=' + tracker.search_param.pagesize + '&start=' + start
				+ '&query=' + encodeURIComponent(tracker.search_value);
		console.info('getting', query);
		ajax({
			url : query,
			type : 'GET',
			error : function(err) {
				console.info('err', err);
			},
			success : function(data) {
				console.info(data);
				if (start == 0) {
					var pages = (data.total_count / tracker.search_param.pagesize) + 1;
					for ( var i = 1; i <= pages; i++) {
						list(i);
					}
				}
				handleHtmlList(data.results_html);
			}
		});
	}

	function handleHtmlList(data) {
		if (!ajax_manager.timer) {
			return;	
		}
		data = data.replace(/src/g, "_src");
		var all = $(data);
		var links = all.find('div.market_listing_row');
		$(links).each(function(index) {
			var lnk = $(this).parent().attr('href');
			lnk = lnk.replace(/\?.*$/, '');
			search(lnk);
		});
	}

	function search(product) {
		var query = product + '/render/?query=&start=1&count=20'
		ajax({
			url : query,
			type : 'GET',
			error : function(err) {
				console.info('err', err);
			},
			success : function(data) {
				if (data.total_count > tracker.minCount) {
					// console.info('product: ', query, data.total_count);
					handleHtml(product, data);
				}
			}
		});
	}

	function handleHtml(product, data) {
		if (!ajax_manager.timer) {
			return;	
		}
		var html = data.results_html;
		html = html.replace(/src/g, "_src");
		var all = $(html);
		var spans = $(all).find('.market_listing_price_with_fee');
		var prices = [];
		spans.each(function(index) {
			var value = $(this).text();
			value = value.replace(/\s*.*(\d+[,\.]\d+)[^\d]*/m, "$1");
			value = value.replace(/,/, ".");
			prices.push(parseFloat(value));
		});
		var avg = 0;
		for ( var i = 0; i < prices.length; i++) {
			avg += prices[i];
		}
		avg /= prices.length;

		var result = prices[0] / avg;
		var diff = avg - prices[0];

		if (tracker.debug) {
			console.info('result', result, ', avg:', avg, 'min:', prices[0], 'product:', product, ' total:',
					data.total_count);
		}
		if (result <= tracker.threshold && diff >= 0.1) {
			var obj = {
				result : result,
				avg : avg,
				min : prices[0],
				product : product,
				total : data.total_count
			};

			message(obj);
		}
	}

	function message(obj) {
		var a = $('<a />').append(JSON.stringify(obj));
		a.attr('href', obj.product);
		a.css('color', '#000');

		var p = $('<p />');
		p.append(a);
		$('#tracker_messages').prepend(p);
		alert('opa');
	}

	function clean() {
		$('#tracker_messages').html('');
	}

	function onAjax(opts, originalOpts, jqXHR) {
		
	}

	function exec() {
		console.info('exec');
		consume();
	}

	init();
})(jQuery);
