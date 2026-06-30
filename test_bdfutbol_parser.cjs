const cheerio = require('cheerio');
const fs = require('fs');

async function parseBDFutbolHTML(html) {
    const $ = cheerio.load(html);
    const data = { isBDFutbol: true };

    const h1 = $('h1').text().trim();
    if (h1) data.stadium_name = h1;

    function getVal(label) {
        let val = null;
        $('*').each((i, el) => {
            if ($(el).children().length === 0 && $(el).text().trim() === label) {
                const nextDiv = $(el).next('div');
                if (nextDiv.length) {
                    val = nextDiv.text().trim();
                    return false;
                }
            }
        });
        return val;
    }

    data.complete_name = getVal('Complete name');
    data.capacity = getVal('Capacity');
    data.opening = getVal('Opening');
    data.architect = getVal('Architect');
    data.dimensions = getVal('Dimensions');
    data.location = getVal('Location');

    // Home Team
    let homeTeamContainer = null;
    $('*').each((i, el) => {
        const t = $(el).text();
        if (t.includes('Home Team') && ($(el).is('h2') || $(el).is('div'))) {
            homeTeamContainer = $(el).nextAll('.bg-white').first();
            if (homeTeamContainer.length === 0) {
                 homeTeamContainer = $(el).next('.bg-white');
            }
            return false;
        }
    });
    
    if (homeTeamContainer && homeTeamContainer.length) {
        data.home_team = homeTeamContainer.text().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Boxes: Matches, Clubs, Seasons, Competitions
    ['Matches', 'Clubs', 'Seasons', 'Competitions'].forEach(box => {
        $('*').each((i, el) => {
            if ($(el).text().trim() === box) {
                const parent = $(el).parent('div');
                if (parent.length) {
                    const valDiv = parent.next('div');
                    if (valDiv.length) {
                        data[box.toLowerCase()] = valDiv.text().trim();
                    }
                }
            }
        });
    });

    // Parse sections for arrays like Competitions list
    // Like First Division 1189 etc.
    $('h2, h3').each((i, sec) => {
        const title = $(sec).text().trim();
        const contentDiv = $(sec).next('div');
        if (contentDiv.length) {
            let items = [];
            const lis = contentDiv.find('li');
            if (lis.length > 0) {
                lis.each((j, li) => {
                    const t = $(li).text().trim();
                    if (t) items.push(t);
                });
            } else {
                const table = contentDiv.find('table');
                if (table.length > 0) {
                    table.find('tr').each((j, tr) => {
                        const cols = [];
                        $(tr).find('td, th').each((k, c) => {
                            cols.push($(c).text().trim());
                        });
                        if (cols.length > 0) items.push(cols.join(' | '));
                    });
                } else {
                    items = [contentDiv.text().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()];
                }
            }
            data[title] = items;
        }
    });

    return data;
}

const html = fs.readFileSync('server/bdfutbol_uc.html', 'utf8');
const result = parseBDFutbolHTML(html);

// Now map it into the format VenueAnalysisPanel expects (competitions array of objects, etc.)
const stats = {
    isBDFutbol: true,
    capacity: result.capacity ? parseInt(result.capacity.replace(/[^\d]/g, '')) : 0,
    matchesHosted: result.matches ? parseInt(result.matches) : 0,
    seasons: result.seasons ? parseInt(result.seasons) : 0,
    clubs: result.clubs ? parseInt(result.clubs) : 0,
    competitionsTotal: result.competitions ? parseInt(result.competitions) : 0,
};

if (result['Competitions'] && Array.isArray(result['Competitions'])) {
    stats.competitions = result['Competitions'].filter(row => row.includes('|')).map(row => {
        const parts = row.split(' | ');
        return {
            name: parts[0],
            matches: parseInt(parts[1]) || 0
        };
    }).filter(c => c.name !== 'Competition'); // skip header
}

if (result['Home Team'] && Array.isArray(result['Home Team'])) {
    stats.homeTeams = result['Home Team'].filter(row => row.includes('|')).map(row => {
        const parts = row.split(' | ');
        return {
            name: parts[0],
            matches: parseInt(parts[1]) || 0
        };
    }).filter(c => c.name !== 'Team');
}

console.log(JSON.stringify(stats, null, 2));
