import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';
import fs from 'fs';

const targetLeagues = [
  'Premier League', 'LaLiga', 'Ligue 1', 'Bundesliga', 'Serie A',
  'Major League Soccer', 'Saudi Pro League', 'Jupiler Pro League',
  'Eredivisie', 'Indian Super League'
];

function isTargetLeague(leagueName) {
  if (!leagueName) return false;
  const name = leagueName.trim();
  return targetLeagues.includes(name);
}

async function scrapeTopTransfers() {
  const baseUrl = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/1/galerie/0?saison_id=2026&transferfenster=alle&land_id=&ausrichtung=&spielerposition_id=&altersklasse=&leihe=&art=';
  let allResults = [];
  const MAX_PAGES = 20; 
  
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${baseUrl}&page=${page}`;
    console.log(`Scraping top transfers page ${page}...`);
    try {
      const response = await gotScraping({ url });
      const $ = cheerio.load(response.body);
      const rows = $('table.items > tbody > tr');
      
      if (rows.length === 0) {
        console.log('No more rows found, stopping.');
        break;
      }
      
      rows.each((i, el) => {
        const tds = $(el).find('> td');
        
        const rank = tds.eq(0).text().trim();
        const playerName = tds.eq(1).find('.hauptlink a').text().trim();
        const playerUrl = tds.eq(1).find('.hauptlink a').attr('href');
        const age = tds.eq(2).text().trim();
        const marketValue = tds.eq(3).text().trim();
        
        const nationalities = [];
        tds.eq(4).find('img').each((idx, img) => {
          nationalities.push($(img).attr('title'));
        });
        const nationality = nationalities.join(', ');
        
        const leftClub = tds.eq(5).find('.hauptlink a').text().trim();
        const leftLeague = tds.eq(5).find('tr').eq(1).find('a').attr('title') || tds.eq(5).find('tr').eq(1).text().trim();
        
        const joinedClub = tds.eq(6).find('.hauptlink a').text().trim();
        const joinedLeague = tds.eq(6).find('tr').eq(1).find('a').attr('title') || tds.eq(6).find('tr').eq(1).text().trim();
        
        const fee = tds.eq(7).find('a').text().trim() || tds.eq(7).text().trim();
        
        if (playerName && isTargetLeague(joinedLeague)) {
          allResults.push({
            rank,
            playerName,
            age,
            nationality,
            leftClub,
            leftLeague,
            joinedClub,
            joinedLeague,
            marketValue,
            fee,
            playerUrl: playerUrl ? `https://www.transfermarkt.co.in${playerUrl}` : null
          });
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      break;
    }
  }
  
  fs.writeFileSync('top_transfers.json', JSON.stringify(allResults, null, 2));
  console.log(`Scraping complete. Found ${allResults.length} relevant top transfers.`);
}

scrapeTopTransfers();
