var util       = require('util'),
    FeedParser = require('feedparser'),
    request    = require('request'),
    config     = require('../config.js');

function debug(msg) {
	if (config.debug) util.debug(util.format.apply(util,arguments));
}

var headlines = {};

headlines.getArticles = function(url, limit, callback) {
	debug("fetching %s", url);
	var items = [];
	request(url)
	.pipe(new FeedParser())
	// TODO: handle network/parsing errors
	.on('readable', function() {
		var stream = this, item;
		while (item = stream.read()) {
			//debug('article: %s', item.title);
			if (!limit || items.length < limit) {
				items.push(item);
			}
		}
	}).on('end', function() {
		callback(items);
	});
};

headlines.refresh = function(callback) {
	var pending = Object.keys(config.feeds).length;
	var result = {};
	for (var f in config.feeds) {
		(function(feed) {
			headlines.getArticles(config.feeds[feed], config.itemsPerFeed, function(articles) {
				debug('got %d articles from %s', articles.length, feed);
				result[feed] = articles;
				pending--;
				if (pending == 0) {
					callback(result);
				}
			});
		})(f);
	}
};

headlines.show = function(out, result) {
	// TODO HTML encoding
	var keys = Object.keys(result).sort();
	out.writeHead(200, {'Content-Type':'text/html'});
	out.write('<html><body>');
	keys.forEach(function(feed) {
		out.write(util.format('<h1>%s</h1>', feed));
		out.write('<ul>');
		result[feed].forEach(function(item) {
			if (typeof item.link == 'undefined') {
				out.write(util.format('<li>%s</li>', item.title));
			} else {
				out.write(util.format('<li><a href="%s">%s</a></li>',
						item.link, item.title));
			}
		});
		out.write('</ul>');
	});
	out.write('</body></html>');
	out.end();
	debug("done");
};

module.exports = headlines;
