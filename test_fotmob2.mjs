import axios from 'axios';
async function test() {
  const comps = ["Premier League", "UEFA Champions League", "Europa League", "Cup Winners' Cup", "Fairs Cup", "European Supercup", "Community Shield", "FA Cup"];
  
  for (const comp of comps) {
    try {
      const res = await axios.get(`https://www.fotmob.com/api/searchData?term=${encodeURIComponent(comp)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      
      let foundLeague = res.data.suggest?.find(s => s.type === 'league' || s.type === 'tournament');
      if (foundLeague && foundLeague.options && foundLeague.options.length > 0) {
         console.log(comp, "->", foundLeague.options[0]);
      } else {
         console.log(comp, "-> Not found in FotMob");
      }
    } catch (err) {
      console.error(comp, err.message);
    }
  }
}
test();
