import axios from 'axios';

async function testDalvikApi() {
    const matchId = 129480; 
    
    // Test the specific URL format suggested
    const urlsToTest = [
        `https://www.cricbuzz.com/match-api/${matchId}/commentary.json`,
        `https://m.cricbuzz.com/match-api/${matchId}/commentary.json`,
        `https://mobile.cricbuzz.com/match-api/${matchId}/commentary.json`
    ];

    for (let url of urlsToTest) {
        console.log(`\nTesting Dalvik Mobile Spoof on: ${url}`);
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 13; Build/TP1A.220624.014) Cricbuzz/v6.2.0',
                    'X-Requested-With': 'com.cricbuzz.android',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`Status: ${response.status}`);
            console.log("Bypassed 403 Forbidden successfully!");
            
            if (response.data) {
                console.log(`Data keys:`, Object.keys(response.data));
                if (response.data.commentary) {
                    const comms = response.data.commentary;
                    console.log(`Extracted ${comms.length} items!`);
                    if (comms.length > 0) {
                         const first = comms[0];
                         const last = comms[comms.length-1];
                         console.log(`First item ID: ${first.id || 'N/A'}, Text: ${first.comm_txt ? first.comm_txt.substring(0, 30) : ''}`);
                         console.log(`Last item ID: ${last.id || 'N/A'}, Text: ${last.comm_txt ? last.comm_txt.substring(0, 30) : ''}`);
                         
                         // Check for pagination fields
                         console.log(`Next page field:`, response.data.next_page || response.data.min_id || 'Not found');
                    }
                }
            }
        } catch (err) {
            console.error("Mobile spoof blocked:", err.response ? err.response.status : err.message);
        }
    }
}

testDalvikApi();
