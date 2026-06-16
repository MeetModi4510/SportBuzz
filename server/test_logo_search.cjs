const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        let teams = [];
        for(let url of ['https://www.cricbuzz.com/cricket-team', 'https://www.cricbuzz.com/cricket-team/domestic', 'https://www.cricbuzz.com/cricket-team/league']) {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(res.data);
            $('a[href*="/cricket-team/"]').each((i, el) => {
                teams.push({ name: $(el).text().trim(), href: $(el).attr('href') });
            });
        }
        console.log("MUMBAI MATCHES:", teams.filter(x => x.name.toLowerCase().includes('mumbai') || x.name.toLowerCase().includes('u19')));
    } catch(e) {
        console.log(e.message);
    }
}
test();
