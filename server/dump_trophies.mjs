import axios from 'axios';
import fs from 'fs';

async function fetchTrophies() {
    const res = await axios.get('https://www.fotmob.com/players/30981/lionel-messi', {headers: {'User-Agent': 'Mozilla/5.0'}});
    const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    const data = JSON.parse(match[1]);
    fs.writeFileSync('trophies_dump.json', JSON.stringify(data.props.pageProps, null, 2));
}

fetchTrophies();
