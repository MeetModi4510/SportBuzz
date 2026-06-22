import axios from 'axios';
import fs from 'fs';

async function fetchMatch() {
    const url = 'https://www.fotmob.com/match/4667801';
    const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    const nextData = JSON.parse(match[1]);
    
    fs.writeFileSync('fotmob_test.json', JSON.stringify(nextData?.props?.pageProps, null, 2));
    console.log('Saved fotmob_test.json');
}

fetchMatch();
