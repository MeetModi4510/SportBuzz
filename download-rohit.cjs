const https = require('https');
const fs = require('fs');

const options = {
	method: 'GET',
	hostname: 'cricbuzz-cricket.p.rapidapi.com',
	port: null,
	path: '/img/v1/i1/c616514/i.jpg',
	headers: {
		'x-rapidapi-key': '982d5ee668msh085573a4a340b18p114ab3jsn335eb6f0210c',
		'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
	}
};

const req = https.request(options, function (res) {
    const file = fs.createWriteStream('public/rohit-sharma.jpg');
    res.pipe(file);
    file.on('finish', () => {
        console.log("Image successfully saved to public/rohit-sharma.jpg");
        file.close();
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
