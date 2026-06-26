const https = require('https');
https.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;team=6;template=results;type=batting;view=innings', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const match = data.match(/<tr class="data1"[\s\S]*?<\/tr>/);
        if (match) console.log(match[0]);
    });
});
