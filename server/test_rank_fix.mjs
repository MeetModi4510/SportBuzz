import axios from 'axios';
import * as cheerio from 'cheerio';

async function testRankingsFix() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/profiles/11808/shubman-gill', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(res.data);
        
        let iccRankings = {
            batting: { test: null, odi: null, t20i: null },
            bowling: { test: null, odi: null, t20i: null },
            allrounder: { test: null, odi: null, t20i: null }
        };

        // Find the active tab category
        let activeCategory = 'batting';
        const rankingsDiv = $('div:contains("ICC RANKINGS")').last().parent().parent();
        rankingsDiv.find('button').each((i, btn) => {
            if ($(btn).hasClass('bg-white')) {
                activeCategory = $(btn).text().trim().toLowerCase().replace('-', '');
            }
        });
        
        console.log("Active Category:", activeCategory);

        let tableParsed = false;
        $('table').each((i, table) => {
            if (tableParsed) return; // only parse first valid table to avoid mobile/desktop duplicates
            const firstTh = $(table).find('th').first().text().trim();
            if (firstTh === 'Format') {
                const trs = $(table).find('tr');
                if (trs.length > 1) {
                    trs.each((j, tr) => {
                        const tds = $(tr).find('td');
                        if (tds.length >= 3) {
                            const format = $(tds[0]).text().trim().toLowerCase();
                            
                            let rankVal = $(tds[1]).find('span').first().text().trim() || $(tds[1]).text().trim();
                            
                            let trend = '';
                            let trendVal = '';
                            if ($(tds[1]).find('.cbRankUpIcon').length > 0) {
                                trend = 'up';
                                trendVal = $(tds[1]).find('.cbRankUpIcon').next().text().trim();
                            } else if ($(tds[1]).find('.cbRankDownIcon').length > 0) {
                                trend = 'down';
                                trendVal = $(tds[1]).find('.cbRankDownIcon').next().text().trim();
                            }

                            if (format === 'test' || format === 'odi' || format === 't20i') {
                                iccRankings[activeCategory][format] = {
                                    rank: rankVal !== '--' ? rankVal : '--',
                                    trend: trend,
                                    trendVal: trendVal
                                };
                            }
                        }
                    });
                    tableParsed = true;
                }
            }
        });

        console.log(JSON.stringify(iccRankings, null, 2));

    } catch(e) { console.error(e); }
}
testRankingsFix();
