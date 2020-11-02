const imdb = require("imdb-api");

(async function() {
	const movie = await imdb.get({name: "The Toxic Avenger"}, {apiKey: "your api key here"});
	console.log(movie);
})()
