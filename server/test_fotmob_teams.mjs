import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    try {
        const response = await axios.get('https://www.fotmob.com/leagues/77/stats/world-cup/teams', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        const nextData = $('#__NEXT_DATA__').html();
        const json = JSON.parse(nextData);
        const stats = json.props.pageProps.stats;
        console.log('Stats keys:', Object.keys(stats));
        console.log('Teams array length:', stats.teams ? stats.teams.length : 0);
        if (stats.teams) {
            console.log(stats.teams.map(t => t.header));
            console.log('First team stat:', stats.teams[0].fetchAllUrl);
        }
    } catch(e) {
        console.error(e.message);
    }
}
test();
