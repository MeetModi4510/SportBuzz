const https = require('https');

function getUrl(path) {
    return new Promise((resolve) => {
        const req = https.request({
            method: 'HEAD',
            hostname: 'www.cricbuzz.com',
            path: path,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/avif,image/webp,*/*',
                'Referer': 'https://www.cricbuzz.com/'
            }
        }, (res) => {
            resolve({ path, status: res.statusCode, location: res.headers['location'] });
        });
        req.on('error', (e) => resolve({ path, error: e.message }));
        req.end();
    });
}

async function test() {
    console.log(await getUrl(`/a/img/v1/i1/c352460/i.jpg`));
    console.log(await getUrl(`/a/img/v1/152x152/i1/c352460/i.jpg`));
    console.log(await getUrl(`/a/img/v1/250x250/i1/c352460/i.jpg`));
}

test();
