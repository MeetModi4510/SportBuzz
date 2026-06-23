import axios from 'axios';
import * as cheerio from 'cheerio';

async function check() {
    const url = `https://www.fotmob.com/leagues/47/transfers`;
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
    const $ = cheerio.load(response.data);
    const data = JSON.parse($('#__NEXT_DATA__').html());
    console.log(JSON.stringify(data?.props?.pageProps?.transfers?.data?.slice(0,3), null, 2));
}
check();
