const cheerio = require('cheerio');
const fs = require('fs');

async function parseBDFutbolHTML(html) {
    const $ = cheerio.load(html);
    const data = {};

    const h1 = $('h1').text().trim();
    if (h1) data.stadium_name = h1;

    function getVal(label) {
        let val = null;
        $('*').each((i, el) => {
            // Find an element that matches exactly the label text, but has no children
            if ($(el).children().length === 0 && $(el).text().trim() === label) {
                let current = $(el);
                // The next element might be a div with the value
                const nxt = current.nextAll('div').first();
                if (nxt.length) {
                    val = nxt.text().trim();
                    return false;
                }
            }
        });
        return val;
    }

    data.capacity = getVal('Capacity');
    data.complete_name = getVal('Complete name');

    // Boxes
    ['Matches', 'Clubs', 'Seasons', 'Competitions'].forEach(box => {
        $('*').each((i, el) => {
            if ($(el).children().length === 0 && $(el).text().trim() === box) {
                const parent = $(el).parent('div');
                if (parent.length) {
                    const valDiv = parent.nextAll('div').first();
                    if (valDiv.length) {
                        data[box.toLowerCase()] = valDiv.text().trim();
                        return false;
                    }
                }
            }
        });
    });

    let homeTeamContainer = null;
    $('*').each((i, el) => {
        const t = $(el).text();
        if (t.includes('Home Team') && ($(el).is('h2') || $(el).is('div'))) {
            homeTeamContainer = $(el).nextAll('.bg-white').first();
            if (homeTeamContainer.length === 0) {
                 homeTeamContainer = $(el).nextAll('div').first();
            }
            return false;
        }
    });
    
    if (homeTeamContainer && homeTeamContainer.length) {
        data['Home Team'] = homeTeamContainer.text().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    $('h2, h3').each((i, sec) => {
        const title = $(sec).text().trim();
        const contentDiv = $(sec).nextAll('div').first();
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
                            cols.push($(c).text().trim().replace(/\s+/g, ' '));
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

    console.log("Raw Scraped Data:", data);

    const statsObj = {
        isBDFutbol: true,
        capacity: data.capacity ? parseInt(data.capacity.replace(/[^\d]/g, '')) : 0,
        matchesHosted: data.matches ? parseInt(data.matches) : 0,
        seasons: data.seasons ? parseInt(data.seasons) : 0,
        clubs: data.clubs ? parseInt(data.clubs) : 0,
        competitionsTotal: data.competitions ? parseInt(data.competitions) : 0,
        competitions: [],
        homeTeams: [],
        seasonsList: [],
        historicalNames: [],
        visitingTeams: [],
        topVisitors: [],
    };

    if (data['Competitions'] && Array.isArray(data['Competitions'])) {
        statsObj.competitions = data['Competitions'].filter(row => row.includes('|')).map(row => {
            const parts = row.split(' | ');
            return {
                name: parts[0].trim(),
                matches: parseInt(parts[1]) || 0
            };
        }).filter(c => c.name !== 'Competition'); 
    }

    if (data['Home Team'] && Array.isArray(data['Home Team'])) {
        statsObj.homeTeams = data['Home Team'].filter(row => row.includes('|')).map(row => {
            const parts = row.split(' | ');
            return {
                name: parts[0].trim(),
                matches: parseInt(parts[1]) || 0
            };
        }).filter(c => c.name !== 'Team');
    }
    
    // Add same for others
    if (data['Seasons'] && Array.isArray(data['Seasons'])) {
        statsObj.seasonsList = data['Seasons'].filter(row => row.includes('|')).map(row => {
            const parts = row.split(' | ');
            return {
                year: parts[0].trim(),
                matches: parseInt(parts[1]) || 0
            };
        }).filter(c => c.year !== 'Season');
    }
    
    if (data['Visiting Teams'] && Array.isArray(data['Visiting Teams'])) {
        statsObj.visitingTeams = data['Visiting Teams'].filter(row => row.includes('|')).map(row => {
            const parts = row.split(' | ');
            // The string might have "1. Liverpool" so let's strip the "1. " part
            let name = parts[0].trim();
            name = name.replace(/^\d+\.\s*/, '');
            return {
                name: name,
                matches: parseInt(parts[1]) || 0
            };
        }).filter(c => c.name !== 'Team');
    }
    
    if (data['Top Visitors'] && Array.isArray(data['Top Visitors'])) {
        statsObj.topVisitors = data['Top Visitors'].filter(row => row.includes('|')).map(row => {
            const parts = row.split(' | ');
            let name = parts[0].trim();
            name = name.replace(/^\d+\.\s*/, '');
            return {
                equip: name,
                partits: parseInt(parts[1]) || 0
            };
        }).filter(c => c.equip !== 'Team' && c.equip !== 'Equip');
    }

    return statsObj;
}

const html = fs.readFileSync('server/bdfutbol_uc.html', 'utf8');
const res = parseBDFutbolHTML(html);
console.log(JSON.stringify(res, null, 2));
