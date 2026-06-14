import axios from 'axios';

async function checkFederationBadge() {
    // Mexico ID is 203
    // Brazil ID is 205 (typically)
    // Let's test standard soccer/500/{id}.png
    const urls = [
        'https://a.espncdn.com/i/teamlogos/soccer/500/203.png', // Mexico
        'https://a.espncdn.com/i/teamlogos/soccer/500/205.png', // Brazil
        'https://a.espncdn.com/i/teamlogos/soccer/500/204.png', // Argentina?
        'https://a.espncdn.com/i/teamlogos/soccer/500/188.png', // England?
    ];
    
    for (const url of urls) {
        try {
            const res = await axios.head(url);
            console.log(`[OK] ${url}`);
        } catch (err) {
            console.log(`[FAIL] ${url} - ${err.response?.status}`);
        }
    }
}
checkFederationBadge();
