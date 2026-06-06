const https = require('https');

function getUrl(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            resolve({ status: res.statusCode, length: res.headers['content-length'] });
        });
        req.on('error', (e) => resolve({ error: e.message }));
    });
}

async function test() {
    console.log(await getUrl('https://static.cricbuzz.com/a/img/v1/192x192/i1/c352460/i.jpg'));
    console.log(await getUrl('https://static.cricbuzz.com/a/img/v1/152x152/i1/c352460/i.jpg'));
    // Shreyas Iyer
    console.log(await getUrl('https://static.cricbuzz.com/a/img/v1/152x152/i1/c9428/i.jpg'));
}
test();
