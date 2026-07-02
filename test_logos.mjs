const teams = ["Arsenal", "Tottenham", "Manchester United", "Everton", "Chelsea", "Liverpool", "Aston Villa", "Newcastle", "Leeds", "Sunderland", "Real Madrid", "Barcelona", "PSG"];
async function test() {
for (const team of teams) {
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team)}`);
    const data = await res.json();
    if (data.teams && data.teams.length > 0) {
      console.log(`${team} Logo URL: ${data.teams[0].strBadge}`);
    } else {
      console.log(`${team} Logo: Not found`);
    }
  } catch (err) {
    console.error(`Error for ${team}:`, err.message);
  }
}

const comps = ["English Premier League", "UEFA Champions League", "Europa League"];
for (const comp of comps) {
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?c=England&s=Soccer`);
    const data = await res.json();
    const match = data.countrys?.find(c => c.strLeague === comp);
    if (match) {
      console.log(`${comp} Logo URL: ${match.strBadge}`);
    } else {
      console.log(`${comp} Logo: Not found in that endpoint`);
    }
  } catch (err) {
    console.error(`Error for ${comp}:`, err.message);
  }
}
}
test();
