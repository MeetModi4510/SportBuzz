const https = require('https');

const options = {
	method: 'GET',
	hostname: 'cricbuzz-cricket2.p.rapidapi.com',
	port: null,
	path: '/photos/v1/detail/170677',
	headers: {
		'x-rapidapi-key': '85fb58db70msh50c5add33399bccp10e19ajsn6083f7bc3e30',
		'x-rapidapi-host': 'cricbuzz-cricket2.p.rapidapi.com'
	}
};

const req = https.request(options, function (res) {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => console.log("detail:", Buffer.concat(chunks).toString()));
});
req.end();
