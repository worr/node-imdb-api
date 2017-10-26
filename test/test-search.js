const https = require("https");
const nock = require("nock");
const nodeunit = require("nodeunit");

const imdb = require("../lib/imdb.js");

module.exports.testSearchSuccessful = function(test) {
    const scope = nock('https://www.omdbapi.com').get('/?apikey=foo&page=1&r=json&s=Toxic%20Avenger').reply(200, require('./data/toxic-avenger-search.json'));

    return imdb.search({
        title: 'Toxic Avenger'
    }, {
        apiKey: "foo"
    }).then((data) => {
        test.ok(data);
        test.equal(data.results.length, 10, "testing length of results");
        test.equal(data.totalresults, 98, "testing total length");
        for (const result of data.results) {
            test.ok(result);
        }
        test.done();
    }).catch((err) => {
        test.ifError(err);
        test.done();
    });
};

module.exports.testSearchUnsuccessful = function(test) {
    const scope = nock('https://www.omdbapi.com').get('/?s=Toxic%20Avenger&r=json&apikey=foo&page=1').reply(404);

    return imdb.search({
        title: 'Toxic Avenger'
    }, {
        apiKey: "foo"
    }).then(function(data) {
        test.ifError(data);
        test.done();
    }).catch(function(err) {
        test.ok(err);
        test.done();
    });
};
