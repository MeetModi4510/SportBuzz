import axios from 'axios';

async function test() {
    try {
        console.log("Fetching match list with User-Agent...");
        const response = await axios.get('https://freewebapi.com/api/matches/list', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://freewebapi.com/'
            }
        });

        console.log("Response Status:", response.status);
        if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
            console.log("Still receiving HTML. Content start:", response.data.substring(0, 200));
        } else {
            console.log("Response Data Keys:", Object.keys(response.data));
            console.log("Sample Data:", JSON.stringify(response.data, null, 2).substring(0, 500));
        }

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
        }
    }
}

test();
