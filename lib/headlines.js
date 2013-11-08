var util       = require('util'),
    FeedParser = require('feedparser'),
    request    = require('request');

// TODO config file
var DEBUG = true;
var ITEMS_PER_FEED = 10;
var FEEDS = {
	'BBC News': 'http://feeds.bbci.co.uk/news/rss.xml',
	'Sky News': 'http://news.sky.com/feeds/rss/home.xml'
}

var headlines = {};

headlines.getArticles = function(url, limit, callback) {
	if (DEBUG) console.log("fetching %s", url);
	var items = [];
	request(url)
	.pipe(new FeedParser())
	// TODO: handle network/parsing errors
	.on('readable', function() {
		var stream = this, item;
		while (item = stream.read()) {
			//if (DEBUG) console.log('article: %s', item.title);
			if (!limit || items.length < limit) {
				items.push(item);
			}
		}
	}).on('end', function() {
		callback(items);
	});
};

headlines.refresh = function(callback) {
	var pending = Object.keys(FEEDS).length;
	var result = {};
	for (var f in FEEDS) {
		(function(feed) {
			headlines.getArticles(FEEDS[feed], ITEMS_PER_FEED, function(articles) {
				if (DEBUG) console.log('got %d articles from %s', articles.length, feed);
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
	if (DEBUG) console.log("done");
};

module.exports = headlines;
