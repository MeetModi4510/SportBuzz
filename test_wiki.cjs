const axios = require('axios');
async function test() {
  const comps = ["Premier League", "UEFA Champions League", "Europa League", "Cup Winners' Cup", "Fairs Cup", "European Supercup", "Community Shield", "FA Cup"];
  
  for (const comp of comps) {
    try {
      const res = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(comp)}&prop=pageimages&format=json&pithumbsize=200`);
      const pages = res.data.query.pages;
      const pageId = Object.keys(pages)[0];
      const thumbnail = pages[pageId].thumbnail;
      
      if (thumbnail) {
        console.log(`${comp} -> ${thumbnail.source}`);
      } else {
        console.log(`${comp} -> Not found`);
      }
    } catch (err) {
      console.error(err.message);
    }
  }
}
test();
