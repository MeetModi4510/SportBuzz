import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchPlayerStats(playerName) {
    try {
        console.log(`Fetching Wikipedia page for: ${playerName}...`);
        // Format the name for Wikipedia URL
        const pageName = playerName.replace(' ', '_');
        
        // Wikipedia requires a User-Agent
        const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&prop=text&format=json`;
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'SportsBuzz/1.0 (contact@sportsbuzz.com)' }
        });

        const html = res.data.parse.text['*'];
        const $ = cheerio.load(html);

        // Find the infobox table
        const infobox = $('table.infobox.vcard');
        
        // Find the "National team information" or similar section header to know we are in the right place
        // Actually, the stats are usually under a "Career statistics" header inside the infobox
        
        let stats = {
            matches: {},
            runs: {},
            battingAverage: {},
            topScore: {}
        };

        // Wikipedia tables have rows with headers on the left (th) and columns (td) for formats
        // Let's find the header row for the formats (Test, ODI, T20I)
        let formatNames = [];
        let formatColIndexes = {};

        infobox.find('tr').each((i, row) => {
            const thText = $(row).find('th').first().text().trim();
            
            // If the row contains the format headers (e.g. Test, ODI, T20I)
            if ($(row).find('th').length > 1 && !thText.includes('Career') && !thText.includes('National')) {
                 if (formatNames.length === 0) {
                     $(row).find('th').each((j, th) => {
                         const txt = $(th).text().trim().replace(/[^a-zA-Z0-9]/g, '');
                         if (txt && (txt.includes('Test') || txt.includes('ODI') || txt.includes('T20I') || txt.includes('FC') || txt.includes('LA'))) {
                             formatNames.push(txt);
                             formatColIndexes[j] = txt; // e.g. {1: 'Test', 2: 'ODI', 3: 'T20I'}
                         }
                     });
                 }
            }

            // Matches
            if (thText.includes('Matches')) {
                $(row).find('td').each((j, td) => {
                    const format = formatColIndexes[j+1];
                    if (format) stats.matches[format] = $(td).text().trim();
                });
            }
            // Runs
            if (thText.includes('Runs scored')) {
                $(row).find('td').each((j, td) => {
                    const format = formatColIndexes[j+1];
                    if (format) stats.runs[format] = $(td).text().trim();
                });
            }
            // Batting Average
            if (thText.includes('Batting average')) {
                $(row).find('td').each((j, td) => {
                    const format = formatColIndexes[j+1];
                    if (format) stats.battingAverage[format] = $(td).text().trim();
                });
            }
            // Top Score
            if (thText.includes('Top score') || thText.includes('Highest score') || thText.includes('100s/50s')) {
                $(row).find('td').each((j, td) => {
                    const format = formatColIndexes[j+1];
                    if (format) {
                         const text = $(td).text().trim();
                         // Just collect any other important rows
                         stats.topScore[format] = stats.topScore[format] ? stats.topScore[format] + ' | ' + text : text;
                    }
                });
            }
        });

        console.log("===============================");
        console.log(`Stats for ${playerName}`);
        console.log("===============================");
        console.log(JSON.stringify(stats, null, 2));

    } catch (e) {
        console.error("Error fetching from Wikipedia:", e.message);
    }
}

fetchPlayerStats('Shubman Gill');
