const https = require('https');

function checkUrl(path) {
    return new Promise((resolve) => {
        const req = https.request({
            method: 'HEAD',
            hostname: 'www.cricbuzz.com',
            path: path,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'image/avif,image/webp,*/*'
            }
        }, (res) => {
            resolve({ path, status: res.statusCode, length: res.headers['content-length'] });
        });
        req.on('error', (e) => resolve({ path, error: e.message }));
        req.end();
    });
}

async function test() {
    // 352460 is Pat Cummins
    const paths = [
        `/img/v1/i1/c352460/i.jpg`,
        `/a/img/v1/i1/c352460/i.jpg`,
        `/a/img/v1/152x152/i1/c352460/i.jpg`,
        `/a/img/v1/192x192/i1/c352460/i.jpg`,
        `/a/img/v1/250x250/i1/c352460/i.jpg`,
        `/a/img/v1/300x300/i1/c352460/i.jpg`,
        `/img/v1/192x192/i1/c352460/i.jpg`,
    ];

    for (const p of paths) {
        console.log(await checkUrl(p));
    }
}

test();
