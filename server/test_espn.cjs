const axios = require('axios');
const cheerio = require('cheerio');

async function testESPN() {
  try {
    const res = await axios.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=3;type=team');
    const $ = cheerio.load(res.data);
    const rows = $('table.engineTable').eq(2).find('tr.data1');
    console.log('Found rows:', rows.length);
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
    console.error(e.message);
  }
}

async function testCricbuzzSquads() {
  try {
    // Cricbuzz Teams page
    // https://www.cricbuzz.com/cricket-team
    const res = await axios.get('https://www.cricbuzz.com/cricket-team');
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
      const squadRes = await axios.get(teams[0].url);
      const $2 = cheerio.load(squadRes.data);
      const players = [];
      $2('.cb-col-67.cb-col.cb-left.cb-top-zero').find('a').each((i, el) => {
         players.push($2(el).text().trim());
      });
      console.log(`Cricbuzz Squad for ${teams[0].name}:`, players.filter(p => p).slice(0, 10));
    }
  } catch (e) {
    console.error(e.message);
  }
}

async function run() {
  console.log("--- ESPN STATSGURU ---");
  await testESPN();
  console.log("\n--- CRICBUZZ SQUADS ---");
  await testCricbuzzSquads();
}

run();
