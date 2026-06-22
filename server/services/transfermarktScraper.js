import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

// Wrap a Transfermarkt image URL through our server-side proxy to bypass hotlink protection
function tmProxy(url) {
  if (!url || url.startsWith('data:image')) return '';
  // Fix double slashes in path (e.g. https://tmssl.akamaized.net//images/...)
  const cleanUrl = url.replace(/([^:])(\/\/+)/g, '$1/');
  return `/api/football/tm-img-proxy?url=${encodeURIComponent(cleanUrl)}`;
}

const targetLeagues = [
  'Premier League', 'LaLiga', 'Ligue 1', 'Bundesliga', 'Serie A',
  'Major League Soccer', 'Saudi Pro League', 'Jupiler Pro League',
  'Eredivisie', 'Indian Super League', 'Liga Portugal', 'Süper Lig', 'Scottish Premiership'
];

function isTargetLeague(leagueName) {
  if (!leagueName) return false;
  const name = leagueName.trim().toLowerCase();
  
  // Blacklist second division / lower division / youth leagues
  const blacklist = [
    '2.', ' 2', 'serie b', 'championship', 'laliga2', 'ligue 2', 
    'league one', 'league two', '3.', 'primavera', 'reserves', 'u21', 'u19', 'u18'
  ];
  
  if (blacklist.some(b => name.includes(b))) {
    return false;
  }
  
  // If it's explicitly in our known top list, accept it immediately
  if (targetLeagues.some(l => name.includes(l.toLowerCase()))) return true;
  
  // If it doesn't contain a blacklist term, and we're just avoiding 2nd divisions, we can return true
  // to "just keep first division leagues" as the user requested.
  return true;
}

function inrToEur(str) {
    if (!str || typeof str !== 'string' || !str.includes('₹')) {
        if (!str) return 0;
        // Check if it's "free transfer" or "-"
        if (str.toLowerCase().includes('free') || str.includes('?')) return 0;
        return 0; // default fallback if no ₹
    }
    
    const numMatch = str.match(/[\d.]+/);
    if (!numMatch) return 0;
    
    const num = parseFloat(numMatch[0]);
    
    let eurValue = 0;
    if (str.includes('Cr')) {
        eurValue = num * 125000;
    } else if (str.includes('L')) {
        eurValue = num * 1250;
    } else if (str.includes('k')) {
        eurValue = num * 12.5;
    } else {
        eurValue = num / 80;
    }
    
    return eurValue;
}

export async function scrapeLatestTransfers(pages = 15) {
  const baseUrl = 'https://www.transfermarkt.co.in/transfers/neuestetransfers/statistik?land_id=0&verein_land_id=0&wettbewerb_id=alle&minMarktwert=500000&maxMarktwert=500000000&plus=1';
  let allResults = [];
  
  for (let page = 1; page <= pages; page++) {
    const url = `${baseUrl}&page=${page}`;
    console.log(`[TM Scraper] Scraping latest transfers page ${page}/${pages}...`);
    try {
      const response = await gotScraping({ url });
      const $ = cheerio.load(response.body);
      const rows = $('table.items > tbody > tr');
      
      if (rows.length === 0) break;
      
      rows.each((i, el) => {
        const tds = $(el).find('> td');
        
        const playerName = tds.eq(0).find('.hauptlink a').text().trim();
        const playerUrl = tds.eq(0).find('.hauptlink a').attr('href');
        
        // Image logic
        const imgTag = tds.eq(0).find('img.bilderrahmen-fixed');
        let rawPlayerImage = imgTag.attr('data-src') || imgTag.attr('src') || '';
        const playerImage = tmProxy(rawPlayerImage);
        
        const position = tds.eq(0).find('table tr:nth-child(2) td').text().trim();
        
        const age = tds.eq(1).text().trim();
        
        const nationalities = [];
        tds.eq(2).find('img').each((idx, img) => nationalities.push($(img).attr('title')));
        const nationality = nationalities.join(', ');
        
        const leftClub = tds.eq(3).find('.hauptlink a').text().trim();
        const leftLeague = tds.eq(3).find('tr').eq(1).find('a').attr('title') || tds.eq(3).find('tr').eq(1).text().trim();
        const leftClubLogo = tmProxy(tds.eq(3).find('img.tiny_wappen').attr('src') || '');
        
        const joinedClub = tds.eq(4).find('.hauptlink a').text().trim();
        const joinedLeague = tds.eq(4).find('tr').eq(1).find('a').attr('title') || tds.eq(4).find('tr').eq(1).text().trim();
        const joinedClubLogo = tmProxy(tds.eq(4).find('img.tiny_wappen').attr('src') || '');
        
        const dateStr = tds.eq(5).text().trim();
        
        const marketValueStr = tds.eq(6).text().trim();
        const feeStr = tds.eq(7).find('a').text().trim() || tds.eq(7).text().trim();
        
        if (playerName && isTargetLeague(joinedLeague)) {
          // Parse date
          const [day, month, year] = dateStr.split('/');
          const transferDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
          
          allResults.push({
            playerId: playerUrl ? playerUrl : playerName,
            name: playerName,
            playerImage,
            position: { label: position, key: position },
            transferDate,
            fromClub: leftClub,
            fromClubFullName: leftClub,
            fromClubId: 0,
            fromClubLogo: leftClubLogo,
            toClub: joinedClub,
            toClubFullName: joinedClub,
            toClubId: 0,
            toClubLogo: joinedClubLogo,
            fee: feeStr,
            feeValue: inrToEur(feeStr),
            transferType: feeStr.toLowerCase().includes('loan') ? 'Loan' : 'Transfer',
            contractExtension: false,
            onLoan: feeStr.toLowerCase().includes('loan'),
            fromDate: null,
            toDate: null,
            marketValue: inrToEur(marketValueStr),
            leagueId: joinedLeague
          });
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error(`[TM Scraper] Error on latest transfers page ${page}:`, error.message);
      break;
    }
  }
  
  return allResults;
}

export async function scrapeTopTransfers(limit = 40) {
  const baseUrl = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/1/galerie/0?saison_id=2026&transferfenster=alle&land_id=&ausrichtung=&spielerposition_id=&altersklasse=&leihe=&art=';
  let allResults = [];
  let page = 1;
  
  while (allResults.length < limit) {
    const url = `${baseUrl}&page=${page}`;
    console.log(`[TM Scraper] Scraping top transfers page ${page}...`);
    try {
      const response = await gotScraping({ url });
      const $ = cheerio.load(response.body);
      const rows = $('table.items > tbody > tr');
      
      if (rows.length === 0) break;
      
      rows.each((i, el) => {
        if (allResults.length >= limit) return; // limit reached
        
        const tds = $(el).find('> td');
        
        // Top layout has Rank at td[0], Player at td[1]
        const playerName = tds.eq(1).find('.hauptlink a').text().trim();
        const playerUrl = tds.eq(1).find('.hauptlink a').attr('href');
        
        const imgTag = tds.eq(1).find('img.bilderrahmen-fixed');
        let rawPlayerImage = imgTag.attr('data-src') || imgTag.attr('src') || '';
        const playerImage = tmProxy(rawPlayerImage);
        
        const position = tds.eq(1).find('table tr:nth-child(2) td').text().trim();
        
        const age = tds.eq(2).text().trim();
        
        const marketValueStr = tds.eq(3).text().trim();
        
        const leftClub = tds.eq(5).find('.hauptlink a').text().trim();
        const leftLeague = tds.eq(5).find('tr').eq(1).find('a').attr('title') || tds.eq(5).find('tr').eq(1).text().trim();
        const leftClubLogo = tmProxy(tds.eq(5).find('img.tiny_wappen').attr('src') || '');
        
        const joinedClub = tds.eq(6).find('.hauptlink a').text().trim();
        const joinedLeague = tds.eq(6).find('tr').eq(1).find('a').attr('title') || tds.eq(6).find('tr').eq(1).text().trim();
        const joinedClubLogo = tmProxy(tds.eq(6).find('img.tiny_wappen').attr('src') || '');
        
        const feeStr = tds.eq(7).find('a').text().trim() || tds.eq(7).text().trim();
        
        if (playerName && isTargetLeague(joinedLeague)) {
          allResults.push({
            playerId: playerUrl ? playerUrl : playerName,
            name: playerName,
            playerImage,
            position: { label: position, key: position },
            // Date is not available on top transfers page, so we use current date as fallback or keep it null.
            // But UI expects transferDate string for sorting and displaying. Let's use start of season.
            transferDate: new Date('2026-07-01T00:00:00Z'),
            fromClub: leftClub,
            fromClubFullName: leftClub,
            fromClubId: 0,
            fromClubLogo: leftClubLogo,
            toClub: joinedClub,
            toClubFullName: joinedClub,
            toClubId: 0,
            toClubLogo: joinedClubLogo,
            fee: feeStr,
            feeValue: inrToEur(feeStr),
            transferType: feeStr.toLowerCase().includes('loan') ? 'Loan' : 'Transfer',
            contractExtension: false,
            onLoan: feeStr.toLowerCase().includes('loan'),
            fromDate: null,
            toDate: null,
            marketValue: inrToEur(marketValueStr),
            leagueId: joinedLeague
          });
        }
      });
      
      page++;
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error(`[TM Scraper] Error on top transfers page ${page}:`, error.message);
      break;
    }
  }
  
  return allResults;
}
