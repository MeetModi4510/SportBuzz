import axios from 'axios';

async function testCricbuzzAutocomplete() {
    try {
        const query = 'Narendra Modi';
        // Test 1: Mobile Search API
        console.log("Testing mobile search...");
        const url1 = `https://m.cricbuzz.com/api/search/results?q=${encodeURIComponent(query)}`;
        // Test 2: Another common autocomplete
        const url2 = `https://www.cricbuzz.com/api/search/autocomplete?q=${encodeURIComponent(query)}`;
        // Test 3: RapidAPI search but wait, the user said NO rapidapi
        
        try {
            const res1 = await axios.get(url1, { headers: { 'User-Agent': 'Mozilla/5.0' }});
            console.log("Mobile API works:", JSON.stringify(res1.data).substring(0, 100));
        } catch(e) { console.log("Mobile API failed:", e.message); }
        
        try {
            const res2 = await axios.get(url2, { headers: { 'User-Agent': 'Mozilla/5.0' }});
            console.log("Web API works:", JSON.stringify(res2.data).substring(0, 100));
        } catch(e) { console.log("Web API failed:", e.message); }
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testCricbuzzAutocomplete();
