var headlines = require('./lib/headlines.js'),
    http      = require('http');

http.createServer(function(request, response) {
	if (request.url != '/') {
		response.writeHead(404);
		response.end();
		return;
	}

	headlines.refresh(function(result){  // TODO cache
		headlines.show(response, result);
	});
}).listen(8080);
