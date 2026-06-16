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

        $('div').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt === 'Born') profileInfo.born = $(el).next().text().trim();
            if (txt === 'Birth Place') profileInfo.birthPlace = $(el).next().text().trim();
            if (txt === 'Role') profileInfo.role = $(el).next().text().trim();
            if (txt === 'Batting Style') profileInfo.battingStyle = $(el).next().text().trim();
            if (txt === 'Bowling Style') profileInfo.bowlingStyle = $(el).next().text().trim();
            if (txt === 'Teams') {
                const nextText = $(el).parent().next().text().trim();
                if (nextText && nextText.length > 5) profileInfo.teams = nextText;
                else profileInfo.teams = $(el).next().text().trim();
            }
        });

        $('table').each((i, table) => {
            const firstTh = $(table).find('th').first().text().trim();
            if (firstTh === 'Format') {
                const trs = $(table).find('tr');
                if (trs.length > 1) {
                    let category = 'batting';
                    if (i === 1) category = 'bowling';
                    if (i === 2) category = 'allrounder';
                    
                    trs.each((j, tr) => {
                        const tds = $(tr).find('td');
                        if (tds.length >= 3) {
                            const format = $(tds[0]).text().trim().toLowerCase();
                            const rank = $(tds[1]).text().trim();
                            if (format === 'test') profileInfo.iccRankings[category].test = rank;
                            if (format === 'odi') profileInfo.iccRankings[category].odi = rank;
                            if (format === 't20i') profileInfo.iccRankings[category].t20i = rank;
                        }
                    });
                }
            }
        });

        console.log(profileInfo);

    } catch(e) { console.error(e); }
}
testProfileScrape();
