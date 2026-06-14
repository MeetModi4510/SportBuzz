import axios from 'axios';

async function checkLogos() {
    const urls = [
        'https://a.espncdn.com/i/teamlogos/countries/500/mex.png',
        'https://a.espncdn.com/i/teamlogos/countries/500/aus.png',
        'https://a.espncdn.com/i/teamlogos/countries/500/tur.png',
        'https://a.espncdn.com/i/teamlogos/soccer/500/203.png' // Mexico club fallback
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
checkLogos();
