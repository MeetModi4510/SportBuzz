import axios from 'axios';

async function run() {
  try {
    const r = await axios.get('https://www.fotmob.com/players/1467236/lamine-yamal', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const match = r.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      const d = JSON.parse(match[1]);
      const fallback = d.props.pageProps.fallback || {};
      for (const k of Object.keys(fallback)) {
        if (typeof fallback[k] === 'object' && fallback[k]) {
           if (fallback[k].recentMatches) {
             console.log(JSON.stringify(fallback[k].recentMatches[0], null, 2));
             break;
           }
        }
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}
run();
