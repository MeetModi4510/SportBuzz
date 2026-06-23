import axios from 'axios';
import * as cheerio from 'cheerio';

async function testScrape() {
    try {
        const response = await axios.get('https://www.fotmob.com/fifaranking/men', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        const nextData = $('#__NEXT_DATA__').html();
        if (nextData) {
            const json = JSON.parse(nextData);
            console.log('Has __NEXT_DATA__!');
            const pageProps = json.props.pageProps;
            console.log('Keys:', Object.keys(pageProps));
            
            // Log a sample
            if (pageProps.ranking) {
                 console.log(JSON.stringify(pageProps.ranking.slice(0, 3), null, 2));
            } else if (pageProps.fallback) {
                 // SWR fallback might have it
                 const keys = Object.keys(pageProps.fallback);
                 console.log('Fallback keys:', keys);
                 if (keys.length > 0) {
                     console.log(JSON.stringify(pageProps.fallback[keys[0]].slice(0, 3), null, 2));
                 }
            } else {
                 console.log(JSON.stringify(pageProps, null, 2).slice(0, 500));
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}
testScrape();
