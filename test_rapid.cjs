const https = require('https');

function testRapidApi(path) {
    return new Promise((resolve) => {
        const req = https.request({
            method: 'GET',
            hostname: 'cricbuzz-cricket.p.rapidapi.com',
            path: path,
            headers: {
                'x-rapidapi-key': '85fb58db70msh50c5add33399bccp10e19ajsn6083f7bc3e30',
                'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
            }
        }, (res) => {
            resolve({ path, status: res.statusCode, length: res.headers['content-length'] });
        });
        req.on('error', (e) => resolve({ path, error: e.message }));
        req.end();
    });
}

async function run() {
    console.log(await testRapidApi('/img/v1/i1/c352460/i.jpg'));
    console.log(await testRapidApi('/img/v1/152x152/i1/c352460/i.jpg'));
    console.log(await testRapidApi('/img/v1/192x192/i1/c352460/i.jpg'));
    console.log(await testRapidApi('/img/v1/250x250/i1/c352460/i.jpg'));
}
run();
