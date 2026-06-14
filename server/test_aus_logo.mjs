import axios from 'axios';
import fs from 'fs';

async function checkSoccer500() {
    try {
        // Download Australia's soccer/500 logo to see what it actually is
        // We will just fetch the URL and check if there's a redirect or check content type
        const res = await axios.get('https://a.espncdn.com/i/teamlogos/soccer/500/201.png', { responseType: 'arraybuffer' });
        fs.writeFileSync('australia_soccer_500.png', res.data);
        console.log("Saved australia_soccer_500.png. Size:", res.data.length);
        
        const res2 = await axios.get('https://a.espncdn.com/i/teamlogos/countries/500/aus.png', { responseType: 'arraybuffer' });
        fs.writeFileSync('australia_country_500.png', res2.data);
        console.log("Saved australia_country_500.png. Size:", res2.data.length);
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}
checkSoccer500();
