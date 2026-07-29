import axios from 'axios';
import fs from 'fs';

// FOUND IT! HT serves commentary as static JSON files at:
// https://www.hindustantimes.com/static-content/10s/commentary_{matchId}_SO...
// Let's decode all possible patterns

const matchId = '271827';
const matchFileId = 'sluinu07202026271827';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.hindustantimes.com/'
};

// Test all variants found in the bundle
const urlsToTest = [
    // Inning 1 variants
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchId}_SOI1.json`,
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchId}_SOI2.json`,
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchId}_SO.json`,
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchFileId}_SOI1.json`,
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchFileId}_SOI2.json`,
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchFileId}_SO.json`,
    // Maybe just the matchFile ID without "SOI"
    `https://www.hindustantimes.com/static-content/10s/${matchId}.json`,
    `https://www.hindustantimes.com/static-content/10s/${matchFileId}.json`,
    // Inning specific pages
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchId}_1.json`,
    `https://www.hindustantimes.com/static-content/10s/commentary_${matchId}_2.json`,
];

for (const url of urlsToTest) {
    console.log(`\nTrying: ${url}`);
    try {
        const res = await axios.get(url, { headers, timeout: 5000 });
        console.log(`✅ SUCCESS! Status: ${res.status}`);
        const data = res.data;
        if (Array.isArray(data)) {
            console.log(`Array of ${data.length} items. First: ${JSON.stringify(data[0]).substring(0, 150)}`);
        } else if (typeof data === 'object') {
            console.log(`Object keys: ${Object.keys(data).join(', ')}`);
            if (data.commentary) {
                console.log(`commentary array length: ${data.commentary.length}`);
                console.log(`First item: ${JSON.stringify(data.commentary[0]).substring(0, 150)}`);
            }
        } else {
            console.log(`String: ${String(data).substring(0, 150)}`);
        }
        fs.writeFileSync(`ht_static_${url.split('/').pop()}`, JSON.stringify(data, null, 2));
        console.log(`Saved to ht_static_${url.split('/').pop()}`);
    } catch(e) {
        console.log(`❌ Failed: ${e.response?.status || e.message}`);
    }
}
