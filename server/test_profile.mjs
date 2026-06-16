import axios from 'axios';
import * as cheerio from 'cheerio';

async function testProfileScrape() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let profileInfo = {
            born: '',
            birthPlace: '',
            role: '',
            battingStyle: '',
            bowlingStyle: '',
            teams: '',
            iccRankings: {
                batting: { test: '--', odi: '--', t20i: '--' },
                bowling: { test: '--', odi: '--', t20i: '--' },
                allrounder: { test: '--', odi: '--', t20i: '--' }
            }
        };

        // Extract Personal Info and Teams
        $('.cb-lst-itm-sm').each((i, el) => {
            const text = $(el).text().trim();
            if (text === 'Born') profileInfo.born = $(el).next().text().trim();
            if (text === 'Birth Place') profileInfo.birthPlace = $(el).next().text().trim();
            if (text === 'Role') profileInfo.role = $(el).next().text().trim();
            if (text === 'Batting Style') profileInfo.battingStyle = $(el).next().text().trim();
            if (text === 'Bowling Style') profileInfo.bowlingStyle = $(el).next().text().trim();
            if (text === 'Teams') profileInfo.teams = $(el).next().text().trim();
        });

        // Extract ICC Rankings
        const rankingsDiv = $('div:contains("ICC RANKINGS")').last().parent();
        console.log("Found rankings container:", rankingsDiv.length > 0);
        
        // Actually, ICC Rankings is a table
        // We can look for table where the th says 'Format', 'Current Rank', 'Best Rank'
        $('table').each((i, table) => {
             const firstTh = $(table).find('th').first().text().trim();
             if (firstTh === 'Format') {
                 // Usually there is a tab for Batting, Bowling, All-rounder, but Cricbuzz DOM might render all or hide some
                 // The tables are usually in divs. Let's dump the row texts of this table
                 console.log("Found Rankings Table!");
                 $(table).find('tr').each((j, tr) => {
                     console.log($(tr).text().replace(/\s+/g, ' '));
                 });
             }
        });

        // Let's also check how they render the tabs for batting/bowling rankings.
        // It's possible the data is all there just hidden.
        
        console.log(JSON.stringify(profileInfo, null, 2));

    } catch(e) { console.error(e); }
}
testProfileScrape();
