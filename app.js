var headlines = require('./lib/headlines.js'),
    config    = require('./config.js'),
    http      = require('http'),
    cache     = require('memory-cache');

var KEY = 'headlines';

http.createServer(function(request, response) {
	if (request.url != '/') {
		response.writeHead(404);
		response.end();
		return;
	}

	var cached = cache.get(KEY);
	if (cached) {
		headlines.show(response, cached);
	} else {
		headlines.refresh(function(result){
			headlines.show(response, result);
			cache.put(KEY, result, config.cacheTime);
		});
	}
}).listen(8080);
