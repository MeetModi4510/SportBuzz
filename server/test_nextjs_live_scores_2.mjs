import axios from 'axios';

async function testNextJsExtraction() {
    try {
        console.log("=== TESTING AXIOS NEXT.JS EXTRACTION FOR LIVE SCORES ===");
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const html = res.data;
        const chunks = [];
        const regex = /self\.__next_f\.push\(\[1,"(.*?)\]\)/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            chunks.push(match[1].replace(/\\"/g, '"'));
        }
        
        let foundScore = false;
        chunks.forEach((chunk) => {
            if (chunk.includes('inngs1') || chunk.includes('matchScore')) {
                const idx = chunk.indexOf('matchScore');
                if (idx > -1) {
                    console.log(`\nFound matchScore! Raw snippet:\n${chunk.substring(idx - 50, idx + 300)}`);
                    foundScore = true;
                }
            }
        });
        
        if (!foundScore) console.log("NO LIVE SCORE DATA WAS FOUND IN THE CHUNKS!");

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testNextJsExtraction();
