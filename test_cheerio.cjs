const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const queries = ["UEFA Champions League", "Cup Winners' Cup", "Fairs Cup", "European Supercup", "Community Shield"];
    
    for (const q of queries) {
      console.log(`\nSearching for: ${q}`);
      const { data } = await axios.get(`https://www.thesportsdb.com/search.php?l=${encodeURIComponent(q)}`);
      const $ = cheerio.load(data);
      
      // Let's find images.
      const images = $('img').map((i, el) => $(el).attr('src')).get();
      const badges = images.filter(src => src.includes('/badge/') || src.includes('/logo/'));
      console.log("Found badges:", badges.slice(0, 3));
    }
  } catch (err) {
    console.error(err.message);
  }
}
test();
