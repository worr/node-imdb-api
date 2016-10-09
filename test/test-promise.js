var https = require('https');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testPromise = function(test) {
	  var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&t=The%20Toxic%20Avenger').reply(200, require('./data/toxic-avenger.json'));

	  return imdb.get('The Toxic Avenger').then(function(data) {
		    test.ok(data);
		    test.equal(data.imdbid, 'tt0090191', "testing returned data");
		    test.equal(data.series, false, "testing series bool");
		    test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

		    test.done();
    }).catch(function(err) {
        test.ifError(err);
        test.done();
    });
}

module.exports.testUnsuccessfulPromise = function(test) {
	  var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&t=The%20Toxic%20Avenger').reply(404);

	  return imdb.get('The Toxic Avenger').then(function(data) {
        test.ifError(data);
        test.done();
    }).catch(function(err) {
        test.ok(err);
        test.done();
    });
}

module.exports.testEpisodes = function(test) {
	  var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

    return imdb.get('How I Met Your Mother').then(function(data) {
        var scope = nock('https://www.omdbapi.com').get('/?i=tt0460649&r=json&Season=1').reply(200, require('./data/how-I-met-your-mother-episodes.json'));

        test.ok(data);
        data.episodes().then(function (eps) {
            test.ok(eps);
            test.done();
        });
    });
}

module.exports.testUnsuccessfulEpisodes = function(test) {
	  var scope = nock('https://www.omdbapi.com').get('/?plot=full&r=json&t=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother.json'));

    return imdb.get('How I Met Your Mother').then(function(data) {
        var scope = nock('https://www.omdbapi.com').get('/?i=tt0460649&r=json&Season=1').reply(404);

        test.ok(data);

        data.episodes().then(function (eps) {
            test.ifError(eps);
            test.done();
        }).catch(function (err) {
            test.ok(err);
            test.done();
        });
    });
}
