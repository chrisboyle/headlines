var headlines = require('./lib/headlines.js'),
    config    = require('./config.js'),
    express   = require('express'),
    path      = require('path'),
    cache     = require('memory-cache');

var KEY = 'headlines';

var app = express();
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', function(request, response) {
	var cached = cache.get(KEY);
	if (cached) {
		headlines.show(response, cached);
	} else {
		headlines.refresh(function(result){
			headlines.show(response, result);
			cache.put(KEY, result, config.cacheTime);
		});
	}
});

app.listen(8080);
