import axios from 'axios';

async function testCricinfoApi() {
    const endpointsToTest = [
        // Modern ESPNcricinfo React SPA API
        'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&limit=10',
        'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/live',
        'https://hs-consumer-api.espncricinfo.com/v1/pages/matches/schedule',
        // ESPN Core UK API (often used by cricinfo backend)
        'https://core.espnuk.org/v2/sports/cricket/leagues/8039/events', 
        // Standard ESPN core API for cricket
        'https://site.api.espn.com/apis/site/v2/sports/cricket/scoreboard',
        'https://site.api.espn.com/apis/site/v2/sports/cricket/8039/scoreboard' // 8039 is often international cricket
    ];

    console.log("Testing ESPNcricinfo Internal APIs...\n");

    for (const url of endpointsToTest) {
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                },
                timeout: 5000
            });
            console.log(`[SUCCESS] ${url}`);
            console.log(`          Status: ${res.status}`);
            
            if (res.data) {
                // If it's standard ESPN core API
                if (res.data.events) {
                    console.log(`          Found ${res.data.events.length} events/matches.`);
                    if (res.data.events.length > 0) {
                        console.log(`          Sample Match: ${res.data.events[0].name}`);
                    }
                } 
                // If it's ESPNcricinfo specific API (hs-consumer-api)
                else if (res.data.matches) {
                     console.log(`          Found ${res.data.matches.length} matches.`);
                     if (res.data.matches.length > 0) {
                         const match = res.data.matches[0];
                         console.log(`          Sample Match: ${match.teams?.[0]?.team?.name} vs ${match.teams?.[1]?.team?.name}`);
                     }
                }
                else {
                    const keys = Object.keys(res.data).slice(0, 5);
                    console.log(`          Keys: ${keys.join(', ')}`);
                }
            }
        } catch (err) {
            console.log(`[FAILED]  ${url}`);
            console.log(`          Error: ${err.message}`);
        }
        console.log("-------------------------------------------------");
    }
}

testCricinfoApi();
