
asyncTest( "Test Loader", function() {
  var loader = new Loader();

  loader.load_sequence(['loader/loader1.js', 'loader/loader2.js'],
                       function() {
                         ok(LOADER1, 'loader1 ok');
                         ok(LOADER2, 'loader2 ok');
                         start();
                       }, 
                       function() {
                         ok(false, 'fail to load');
                         start();
                       });

});