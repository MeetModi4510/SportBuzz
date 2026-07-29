import axios from 'axios';
import * as cheerio from 'cheerio';

(async () => {
    try {
        const url1 = 'https://www.cricbuzz.com/live-cricket-scores/98555/nba-vs-nep-4th-match-icc-cricket-world-cup-league-two-2023-27';
        let res1 = await axios.get(url1, { validateStatus: false });
        if (res1.status === 404) {
            // Find a real live match URL from cricbuzz
            const liveHtml = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores');
            const $live = cheerio.load(liveHtml.data);
            const href = $live('a[href^="/live-cricket-scores/"]').first().attr('href');
            if (href) {
                console.log(`Testing with live match: ${href}`);
                const fullUrl1 = `https://www.cricbuzz.com${href}`;
                res1 = await axios.get(fullUrl1);
                const $1 = cheerio.load(res1.data);
                console.log('Live scores page balls:', $1('div.font-bold').filter((i, el) => /^\d+\.\d+$/.test($1(el).text().trim())).length);

                const fullHref = href.replace('live-cricket-scores', 'live-cricket-full-commentary');
                const fullUrl2 = `https://www.cricbuzz.com${fullHref}`;
                const res2 = await axios.get(fullUrl2);
                const $2 = cheerio.load(res2.data);
                console.log('Full commentary page balls:', $2('div.font-bold').filter((i, el) => /^\d+\.\d+$/.test($2(el).text().trim())).length);
            }
        }
    } catch (e) {
        console.error(e.message);
    }
})();
