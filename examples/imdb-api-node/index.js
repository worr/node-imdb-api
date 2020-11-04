const imdb = require("imdb-api");

(async function() {
	const movie = await imdb.get({name: "Toxic Avenger"}, {apiKey: "your api key here", baseURL: "http://localhost:3000"});
	console.log(movie);
})()
