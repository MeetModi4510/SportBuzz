const axios = require('axios');
async function test() {
  const comps = ["Premier League", "UEFA Champions League", "Europa League", "Cup Winners' Cup", "Fairs Cup", "European Supercup", "Community Shield", "FA Cup"];
  
  for (const comp of comps) {
    try {
      const { data } = await axios.get(`https://www.fotmob.com/api/search/suggest?term=${encodeURIComponent(comp)}`);
      
      // Fotmob usually returns a list of suggestions.
      let foundLeague = data.suggest?.find(s => s.type === 'league');
      if (!foundLeague && data.suggest) {
         // Maybe it's called 'tournament'
         foundLeague = data.suggest.find(s => s.type === 'tournament' || s.options?.length > 0);
      }
      
      console.log(`\nResults for ${comp}:`);
      console.log(JSON.stringify(data).substring(0, 300));
    } catch (err) {
      console.error(err.message);
    }
  }
}
test();
