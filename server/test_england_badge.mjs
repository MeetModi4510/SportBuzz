import axios from 'axios';

async function checkEnglandBadge() {
    try {
        const url = 'https://a.espncdn.com/i/teamlogos/soccer/500/448.png';
        await axios.head(url);
        console.log(`[OK] ${url}`);
    } catch (err) {
        console.log(`[FAIL] ${url} - ${err.response?.status}`);
    }
}
checkEnglandBadge();
