const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

async function testESPN() {
  try {
    const res = await axios.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=3;type=team', { headers: HEADERS });
    const $ = cheerio.load(res.data);
    const rows = $('table.engineTable').eq(2).find('tr.data1');
    console.log('Found ESPN rows:', rows.length);
    const data = [];
    rows.each((i, el) => {
      const tds = $(el).find('td');
      data.push({
        team: tds.eq(0).text().trim(),
        span: tds.eq(1).text().trim(),
        matches: tds.eq(2).text().trim(),
        won: tds.eq(3).text().trim(),
        lost: tds.eq(4).text().trim(),
        tied: tds.eq(5).text().trim(),
        nr: tds.eq(6).text().trim(),
        win_loss_ratio: tds.eq(7).text().trim()
      });
    });
    console.log("ESPN Team Data:", data.slice(0, 5));
  } catch (e) {
    console.error("ESPN Error:", e.response ? e.response.status : e.message);
  }
}

async function testCricbuzzSquads() {
  try {
    const res = await axios.get('https://www.cricbuzz.com/cricket-team', { headers: HEADERS });
    const $ = cheerio.load(res.data);
    const teams = [];
    $('.cb-team-item').each((i, el) => {
      const name = $(el).find('h2').text().trim();
      const href = $(el).attr('href');
      if (name && href) {
        teams.push({ name, url: 'https://www.cricbuzz.com' + href + '/players' });
      }
    });
    console.log("Cricbuzz Teams found:", teams.length);
    if(teams.length > 0) {
      console.log("Fetching squad for:", teams[0].name, teams[0].url);
      const squadRes = await axios.get(teams[0].url, { headers: HEADERS });
      const $2 = cheerio.load(squadRes.data);
      const players = [];
      $2('a.cb-col-67').each((i, el) => {
         players.push($2(el).text().trim());
      });
      // also try alternative selectors
      if (players.length === 0) {
          $2('div.cb-col.cb-col-67.cb-schdl-text').find('a').each((i, el) => {
             players.push($2(el).text().trim());
          });
      }
      console.log(`Cricbuzz Squad for ${teams[0].name}:`, players.filter(p => p).slice(0, 10));
    }
  } catch (e) {
    console.error("Cricbuzz Error:", e.response ? e.response.status : e.message);
  }
}

async function run() {
  console.log("--- ESPN STATSGURU ---");
  await testESPN();
  console.log("\n--- CRICBUZZ SQUADS ---");
  await testCricbuzzSquads();
}

run();
