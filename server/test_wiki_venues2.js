// Test full Wikipedia cricket grounds scraper
import axios from 'axios';

async function scrapeWikiCricketGrounds(country = 'India') {
    // Wikipedia page titles for different countries  
    const pageMap = {
        'India': 'List_of_international_cricket_grounds_in_India',
        'Australia': 'List_of_cricket_grounds_in_Australia',
        'England': 'List_of_cricket_grounds_in_England_and_Wales',
        'South Africa': 'List_of_cricket_grounds_in_South_Africa'
    };

    const page = pageMap[country] || pageMap['India'];

    // Fetch "Active stadiums" section (section=1)
    const r = await axios.get(`https://en.wikipedia.org/w/api.php?action=parse&page=${page}&section=1&prop=wikitext&format=json`, {
        headers: { 'User-Agent': 'SportBuzz/1.0 (pranshu87809@gmail.com)' }
    });

    const text = r.data.parse.wikitext['*'];
    const venues = [];
    const seen = new Set();

    // Parse the wikitable rows - each row is separated by '|-'
    const rows = text.split('|-\n');
    for (const row of rows) {
        const cells = row.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
        if (cells.length < 3) continue;

        // Extract name: [[Name]] or [[Name|Display]]
        const nameRaw = cells[0].replace(/^\|/, '').trim();
        const nameMatch = nameRaw.match(/\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/);
        if (!nameMatch) continue;

        const wikiTitle = nameMatch[1].trim();
        const displayName = nameMatch[2]?.trim() || wikiTitle;

        // Clean display name - remove footnote refs like {{refn...}}
        const name = displayName.replace(/\{\{[^}]+\}\}/g, '').replace(/\[\[[^\]]+\]\]/g, '').trim();

        // Extract city from second cell
        const cityRaw = cells[1].replace(/^\|/, '').trim();
        const cityMatch = cityRaw.match(/\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/);
        const city = cityMatch ? (cityMatch[2] || cityMatch[1]).trim() : cityRaw.replace(/\[\[|\]\]/g, '').trim();

        // Extract capacity from third cell
        const capRaw = cells[2].replace(/^\|/, '').trim();
        const capacity = parseInt(capRaw.replace(/,/g, '')) || 0;

        if (!name || seen.has(name)) continue;
        seen.add(name);

        venues.push({ name, city, capacity, wikiTitle });
    }

    console.log(`\n✅ Found ${venues.length} venues from Wikipedia for ${country}:`);
    venues.forEach((v, i) => console.log(`  ${i+1}. ${v.name} | ${v.city} | ${v.capacity.toLocaleString()}`));
    return venues;
}

scrapeWikiCricketGrounds('India');
