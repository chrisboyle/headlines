var headlines = require('../lib/headlines.js'),
    util      = require('util'),
    assert    = require('assert'),
    mocha     = require('mocha'),
    fakeweb   = require('node-fakeweb');

var FAKE_URL = 'http://example.com:80/rss.xml';

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
		fakeweb.allowNetConnect = false;
		fakeweb.registerUri({uri: FAKE_URL, body: makeRSS(12)});
	});
	after(function () { fakeweb.allowNetConnect = true });

	it('should parse items from RSS', function () {
		headlines.getArticles(FAKE_URL, 10, function(out) {
			assert(typeof out == 'object');
			assert.equal(out.length, 10);
			assert.equal(out[0].title, "Item 1");
			assert.equal(out[9].title, "Item 10");
		});
	});

	it('should render items to HTML', function () {
		var written = '';
		out = {
			writeHead: function(){},
			write: function(w) { written += w; },
			end: function(){}
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
		assert.equal(written, '<html><body>'+
			'<h1>First site</h1><ul>'+
			'<li><a href="http://example.com/1">item 1</a></li>'+
			'<li>item 2</li>'+
			'<li><a href="http://example.com/3">item 3</a></li>'+
			'</ul><h1>Second site</h1><ul>'+
			'<li><a href="http://example.com/4">item 4</a></li>'+
			'<li><a href="http://example.com/5">item 5</a></li>'+
			'</ul></body></html>');
	});
});