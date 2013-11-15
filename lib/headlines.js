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

	var died = false;
	function handleError(err) {
		debug(err);
		died = true;
		callback([{title:'Feed unavailable'}]);
	}

	request(url)
	.on('error', handleError)  // network errors
	.pipe(new FeedParser({resume_saxerror: false}))
	.on('error', handleError)  // parsing errors
	.on('readable', function() {
		var stream = this, item;
		while (item = stream.read()) {
			//debug('article: %s', item.title);
			if (!limit || items.length < limit) {
				items.push(item);
			}
		}
	}).on('end', function() {
		if (! died) callback(items);
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

headlines.show = function(response, result) {
	response.render('headlines', {feeds: result});
	debug("finished output");
};

module.exports = headlines;
