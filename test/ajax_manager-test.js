asyncTest( "Test ajax", function() {
  var manager = new AjaxManager();

  var started = false;

  manager.ajax({
    dataType: 'script',
    url: 'loader/loader1.js',
    success: function() {
      console.info('started', started);
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
  }, 200);
});