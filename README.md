steam-market-track
==================

Market Track to Steam

Logged in to Steam Community, open the console or firebug and run

jQuery.getScript('https://raw.githubusercontent.com/raonifn/steam-market-track/refac/lib/loader.js');
var loader = new Loader('https://raw.githubusercontent.com/raonifn/steam-market-track/refac/lib');
loader.load_sequence(['utils.js', 'ajax_manager.js', 'product.js', 'trader.js', 'crawler.js', 'market.js'], function() { console.info('aa') });
var market = new Market();
market.init();

