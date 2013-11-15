var headlines = require('../lib/headlines.js'),
    util      = require('util'),
    assert    = require('assert'),
    mocha     = require('mocha'),
    fakeweb   = require('node-fakeweb');

var FAKE_OK_URL     = 'http://example.com:80/rss.xml';
var BAD_CONTENT_URL = 'http://example.com:80/broken.xml';
var BAD_NET_URL     = 'http://example.invalid:80/rss.xml';

function makeRSS(n) {
	var s = '<rss>';
	for (var i=1; i<=n; i++) {
		s += util.format(
			'<item><title>Item %d</title>'+
			'<link>http://example.com/%d</link></item>',
			i, i);
	}
	s += '</rss>';
	return s;
}

describe('headlines', function () {
	before(function () {
		// Let the example.invalid URL fail realistically
		fakeweb.allowNetConnect = true;
		var validRSS = makeRSS(12);
		fakeweb.registerUri({uri: FAKE_OK_URL, body: validRSS});
		var invalidRSS = validRSS.substring(0, validRSS.length - 1);
		fakeweb.registerUri({uri: BAD_CONTENT_URL, body: invalidRSS});
	});

	it('should parse items from RSS', function () {
		headlines.getArticles(FAKE_OK_URL, 10, function(out) {
			assert(typeof out == 'object');
			assert.equal(out.length, 10);
			assert.equal(out[0].title, "Item 1");
			assert.equal(out[9].title, "Item 10");
		});
	});

	it('should handle errors gracefully', function () {
		function expectUnavailable(out) {
			assert(typeof out == 'object');
			assert.equal(out.length, 1);
			assert.equal(out[0].title, "Feed unavailable");
		}
		headlines.getArticles(BAD_NET_URL, 10, expectUnavailable);
		headlines.getArticles(BAD_CONTENT_URL, 10, expectUnavailable);
	});

	it('should render items using jade', function () {
		var called = 0;
		var calledData;
		out = {
			render: function(template, data) {
				called++;
				calledData = data;
			}
		};
		result = {
			'First site': [
				{title:'item 1', link:'http://example.com/1'},
				{title:'item 2'},
				{title:'item 3', link:'http://example.com/3'}
			],
			'Second site': [
				{title:'item 4', link:'http://example.com/4'},
				{title:'item 5', link:'http://example.com/5'},
			]
		};
		headlines.show(out, result);
		assert.equal(called, 1);
		assert.deepEqual(calledData, {feeds:result});
	});
});
