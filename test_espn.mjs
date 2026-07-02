import axios from 'axios';
async function test() {
  const comps = ["English Premier League", "UEFA Champions League", "Europa League", "Cup Winners' Cup", "Fairs Cup", "European Supercup", "Community Shield", "FA Cup"];
  
  for (const comp of comps) {
    try {
      const res = await axios.get(`https://site.api.espn.com/apis/site/v2/search?query=${encodeURIComponent(comp)}&region=s&lang=en&limit=5`);
      console.log(`\nResults for ${comp}:`);
      console.log(JSON.stringify(res.data, null, 2).substring(0, 500));
    } catch (err) {
      console.error(comp, err.message);
    }
  }
}
test();
