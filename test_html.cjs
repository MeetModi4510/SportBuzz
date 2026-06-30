const cheerio = require('cheerio');
const fs = require('fs');

const html = fs.readFileSync('campnou.html', 'utf8');
const $ = cheerio.load(html);

// Find Top Visitors
let topVisitorsDiv = null;
$('h3').each((i, el) => {
    if ($(el).text().trim() === 'Top Visitors') {
        topVisitorsDiv = $(el).nextAll('div').first();
    }
});

if (topVisitorsDiv) {
    // Let's see its structure
    console.log("Top Visitors HTML:");
    console.log(topVisitorsDiv.html());
}

// Find Home Team
let homeTeamDiv = null;
$('h2, div').each((i, el) => {
    if ($(el).text().includes('Home Team')) {
        let nxt = $(el).nextAll('.bg-white').first();
        if (nxt.length) homeTeamDiv = nxt;
    }
});
if (homeTeamDiv) {
    console.log("Home Team HTML:");
    console.log(homeTeamDiv.html());
}
