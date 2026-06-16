import axios from 'axios';

async function testNextJsPayload() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/9311/jasprit-bumrah', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const html = res.data;
        const match = html.match(/"rankings":(\{.*?\})/);
        if (match) {
            console.log("Found rankings in JSON!");
            console.log(match[1].substring(0, 500));
        } else {
            console.log("No rankings JSON found.");
            // search for anything looking like rankings
            const matches = html.match(/rank[^a-zA-Z0-9].{0,100}/gi);
            console.log(matches ? matches.slice(0, 10) : "Nothing");
        }

    } catch(e) { console.error(e); }
}
testNextJsPayload();
