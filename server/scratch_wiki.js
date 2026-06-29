const axios = require('axios');
const WIKI_API_HEADERS = { 'User-Agent': 'SportBuzz/1.0' };

async function check() {
    const page = 'List_of_cricket_grounds_in_Australia';
    const wikiRes = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=parse&page=${page}&section=1&prop=wikitext&format=json`,
        { headers: WIKI_API_HEADERS, timeout: 12000 }
    );
    const text = wikiRes.data.parse?.wikitext?.['*'] || '';
    const rows = text.split('|-\n');
    console.log(`Rows: ${rows.length}`);
    if (rows.length > 0) {
        console.log(rows[1]);
    }
}
check();
