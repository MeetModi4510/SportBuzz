import axios from 'axios';
const WIKI_API_HEADERS = { 'User-Agent': 'SportBuzz/1.0' };

const COUNTRY_ESPN_VENUES = {
    'England': [
        { id: 10,   name: "Lord's Cricket Ground, London",           city: 'London' },
        { id: 45,   name: 'The Oval, London',                         city: 'London' },
        { id: 75,   name: 'Old Trafford, Manchester',                 city: 'Manchester' },
        { id: 164,  name: 'Edgbaston, Birmingham',                    city: 'Birmingham' },
    ]
};

function resolveESPNGround(wikiName) {
    const cleanWiki = wikiName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [country, venues] of Object.entries(COUNTRY_ESPN_VENUES)) {
        for (const venue of venues) {
            const cleanEspn = venue.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanWiki === cleanEspn || cleanEspn.startsWith(cleanWiki) || cleanWiki.startsWith(cleanEspn)) {
                return venue;
            }
        }
    }
    return null;
}

async function check() {
    const page = 'List_of_Test_cricket_grounds';
    const wikiRes = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=parse&page=${page}&prop=wikitext&format=json`,
        { headers: WIKI_API_HEADERS, timeout: 12000 }
    );
    const text = wikiRes.data.parse?.wikitext?.['*'] || '';
    const rows = text.split('|-\n');
    for (const row of rows) {
        const rawRow = row.replace(/^\|/, '');
        const cells = rawRow.split(/\|\||\n\|/).map(c => c.trim()).filter(c => c !== '');
        if (cells.length < 3) continue;

        // Rank is cell[0], Name is cell[1]
        const nameRaw = cells[1]; 
        if (!nameRaw) continue;
        const nameMatch = nameRaw.match(/\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/);
        if (!nameMatch) continue;
        
        const wikiTitle = nameMatch[1].trim();
        const rawDisplay = (nameMatch[2] || wikiTitle).trim();
        const wikiName = rawDisplay.replace(/\{\{[^}]+\}\}/g, '').replace(/\[\[[^\]]+\]\]/g, '').trim();
        
        if (wikiName.includes("Lord") || wikiName.includes("Oval")) {
            console.log(`wikiName: ${wikiName} | wikiTitle: ${wikiTitle}`);
            console.log("Resolved:", resolveESPNGround(wikiName));
        }
    }
}
check();
