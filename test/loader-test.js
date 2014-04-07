
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

asyncTest( "Test Loader with prefix", function() {
  var loader = new Loader('http://localhost:8084/test');

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

asyncTest( "Test Loader with fail", function() {
  var loader = new Loader('http://localhost:8084/test');

  loader.load_sequence(['loader/loader1.js', 'loader/loader3.js'],
                       function() {
                         ok(false, 'must fail cause loader3.js');
                         start();
                       }, 
                       function() {
                         ok(LOADER1, 'loader1 ok');
                         start();
                       });

});
