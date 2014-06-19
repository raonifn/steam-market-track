module('ajax_manager');

asyncTest( "Test start", function() {
  var manager = new AjaxManager();

  var started = false;

  manager.ajax({
    dataType: 'script',
    url: 'loader/loader1.js',
    success: function() {
      ok(LOADER1, 'loader1 ok');
      ok(started, 'must be started');
      start();
    },
    error: function() {
      ok(false, 'error');
      start();
    }
  });

  setTimeout(function() {
    started = true;
    manager.start();
  }, 100);
});


test('test ajax', function(){
  var manager = new AjaxManager();
  var expect = {
    test: true,
    working: 'test'
  };
  manager.ajax(expect);

  deepEqual(manager.queue.pop(), expect, 'enqueued');
});



asyncTest('test callback finished', function() {
  var manager = new AjaxManager();

  var passSuccess = false;

  manager.callbackFinished(function() {
    this.stop();
    setTimeout(function() {
      ok(passSuccess, 'should pass on success function');
      ok(LOADER1, 'loader1 ok');
      start();
    }, 100);
  });

  manager.ajax({
    dataType: 'script',
    url: 'loader/loader1.js',
    success: function() {
      passSuccess = true;
    },
    error: function() {
      ok(false, 'error');
      start();
    }
  });

  manager.start();
});

test('test stop', function(){
  var manager = new AjaxManager();
  equal(manager.timer, undefined);
  manager.start();
  ok(manager.timer != undefined);
  manager.stop();
  equal(manager.timer, undefined);
});

test('test set max', function(){
  var manager = new AjaxManager();
  equal(manager.max, 5);
  manager.newMax(10);
  equal(manager.max, 10);
});
