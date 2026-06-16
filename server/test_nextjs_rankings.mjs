import axios from 'axios';

async function testNextJsPayload() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/9311/jasprit-bumrah', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const html = res.data;
        // Using a greedy match up to the end of the rankings object
        const match = html.match(/\\"rankings\\":(\{\\"bat\\":.*?\\"all\\":\{.*?\}\})/);
        if (match) {
            console.log("Raw matched string:");
            console.log(match[1]);
            let jsonStr = match[1].replace(/\\"/g, '"');
            try {
                const rankings = JSON.parse(jsonStr);
                console.log(JSON.stringify(rankings, null, 2));
            } catch(e) { console.log("Parse error:", e.message); }
        } else {
            console.log("No rankings JSON found.");
        }

    } catch(e) { console.error(e); }
}
testNextJsPayload();
