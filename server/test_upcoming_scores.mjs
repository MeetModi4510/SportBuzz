import axios from 'axios';

async function testUpcomingScoresRsc() {
    try {
        console.log("=== TESTING UPCOMING SCORES WITH RSC HACK ===");
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches', {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(live-scores)%22%2C%7B%22children%22%3A%5B%22live-scores%22%2C%7B%22children%22%3A%5B%22upcoming-matches%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D%7D%5D'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log("Starts with:", dataStr.substring(0, 100));
        console.log("Contains typeMatches?", dataStr.includes('typeMatches'));

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testUpcomingScoresRsc();
