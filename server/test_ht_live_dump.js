import axios from 'axios';
import fs from 'fs';

async function testHTLiveScores() {
    console.log("Fetching HT live scores page...");
    try {
        const res = await axios.get('https://www.hindustantimes.com/cricket/live-score', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        
        fs.writeFileSync('ht_live_score.html', res.data);
        console.log(`Saved ht_live_score.html, size: ${res.data.length} bytes`);
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testHTLiveScores();
