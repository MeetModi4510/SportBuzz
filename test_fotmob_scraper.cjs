const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeFotmobSearch(query) {
    try {
        const url = `https://www.fotmob.com/search?q=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
        });
        
        const $ = cheerio.load(res.data);
        const nextDataRaw = $('script#__NEXT_DATA__').html();
        if (!nextDataRaw) return null;
        
        const nextData = JSON.parse(nextDataRaw);
        
        // Let's trace where the search results are in FotMob's NextJS props
        // Usually it's in pageProps.fallback or pageProps.initialState
        const pageProps = nextData.props.pageProps;
        console.log(`\nKeys for ${query}:`, Object.keys(pageProps));
        
        // Find if there's any league data
        let leagueId = null;
        
        // Searching through the JSON string for something like "leagueId": or "id": ... "type":"league"
        const jsonString = JSON.stringify(pageProps);
        const match = jsonString.match(/"id":(\d+),"name":"[^"]*","type":"league"/i);
        if (match) {
            leagueId = match[1];
        }
        
        if (leagueId) {
            return `https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png`;
        }
        return null;
    } catch (e) {
        console.error(query, e.message);
        return null;
    }
}

async function test() {
    console.log("PL:", await scrapeFotmobSearch("Premier League"));
    console.log("Fairs Cup:", await scrapeFotmobSearch("Inter-Cities Fairs Cup"));
    console.log("CWC:", await scrapeFotmobSearch("Cup Winners' Cup"));
}
test();
