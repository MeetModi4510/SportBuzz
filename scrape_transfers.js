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

async function scrapePages() {
  const baseUrl = 'https://www.transfermarkt.co.in/transfers/neuestetransfers/statistik?land_id=0&verein_land_id=0&wettbewerb_id=alle&minMarktwert=500000&maxMarktwert=500000000&plus=1';
  let allResults = [];
  const MAX_PAGES = 10;
  
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${baseUrl}&page=${page}`;
    console.log(`Scraping page ${page}...`);
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
        
        const playerName = tds.eq(0).find('.hauptlink a').text().trim();
        const playerUrl = tds.eq(0).find('.hauptlink a').attr('href');
        const age = tds.eq(1).text().trim();
        const nationality = tds.eq(2).find('img').attr('title');
        
        const leftClub = tds.eq(3).find('.hauptlink a').text().trim();
        const leftLeague = tds.eq(3).find('tr').eq(1).find('a').attr('title') || tds.eq(3).find('tr').eq(1).text().trim();
        
        const joinedClub = tds.eq(4).find('.hauptlink a').text().trim();
        const joinedLeague = tds.eq(4).find('tr').eq(1).find('a').attr('title') || tds.eq(4).find('tr').eq(1).text().trim();
        
        const date = tds.eq(5).text().trim();
        const marketValue = tds.eq(6).text().trim();
        const fee = tds.eq(7).find('a').text().trim() || tds.eq(7).text().trim();
        
        // We only want transfers where the joined league is a target league
        // The user said "just keep first division leagues" and the list provided.
        // It's more logical to only consider the joinedLeague as the destination.
        // But if they left to become a free agent, maybe they want those?
        // "transfers carried out for this season for this leagues listed below"
        // Usually means incoming transfers. Let's strictly enforce joinedLeague.
        if (playerName && isTargetLeague(joinedLeague)) {
          allResults.push({
            playerName,
            age,
            nationality,
            leftClub,
            leftLeague,
            joinedClub,
            joinedLeague,
            date,
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
  
  fs.writeFileSync('latest_transfers.json', JSON.stringify(allResults, null, 2));
  console.log(`Scraping complete. Found ${allResults.length} relevant transfers.`);
}

scrapePages();
