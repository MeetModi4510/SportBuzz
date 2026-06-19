import axios from 'axios';
import * as cheerio from 'cheerio';

async function testMobileScrape() {
  try {
    const res = await axios.get('https://m.cricbuzz.com/profiles/9838/devon-conway', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        }
    });
    const $ = cheerio.load(res.data);
    console.log('Mobile Title:', $('title').text());
    console.log('Mobile H1:', $('h1').text().trim());
    console.log('Mobile H3:', $('h3').text().trim());
    console.log('Mobile Script Count:', $('script').length);
    console.log('Batting stats:', $('table').length > 0 ? 'Found table' : 'No table');
    // Save to file just in case
    import('fs').then(fs => fs.writeFileSync('cricbuzz_mobile_profile.html', res.data));
  } catch(e) {
    console.error(e.message);
  }
}

testMobileScrape();
