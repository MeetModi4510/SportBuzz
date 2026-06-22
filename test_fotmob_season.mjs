import axios from 'axios';
import * as cheerio from 'cheerio';
axios.get('https://www.fotmob.com/players/30981/lionel-messi?seasonId=2022/2023-53', {headers: {'User-Agent': 'Mozilla/5.0'}})
  .then(r => {
    const $ = cheerio.load(r.data);
    const nextDataRaw = $('script#__NEXT_DATA__').html();
    const nextData = JSON.parse(nextDataRaw);
    const keys = Object.keys(nextData.props.pageProps.fallback || {});
    console.log('Fallback keys:', keys);
    const statsKey = keys.find(k => k.includes('playerStats'));
    if(statsKey) {
      const stats = nextData.props.pageProps.fallback[statsKey];
      console.log('Stats topStatCard:', stats.topStatCard?.items?.map(i => i.title));
      console.log('Has shotmap?', !!stats.shotmap);
    } else {
      console.log('No playerStats key found');
    }
  })
  .catch(e => console.error(e.message));
