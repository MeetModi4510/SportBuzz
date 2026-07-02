const axios = require('axios');
async function test() {
  const titles = ['UEFA Cup Winners\' Cup', 'Inter-Cities Fairs Cup', 'UEFA Super Cup', 'FA Community Shield'];
  for (const t of titles) {
    try {
      const res = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&pithumbsize=200&format=json&titles=${encodeURIComponent(t)}`, { headers: { 'User-Agent': 'CoolApp/1.0' } });
      const pages = res.data.query.pages;
      const pid = Object.keys(pages)[0];
      console.log(t, "->", pages[pid].thumbnail ? pages[pid].thumbnail.source : "None");
    } catch (e) {
      console.error(e.message);
    }
  }
}
test();
