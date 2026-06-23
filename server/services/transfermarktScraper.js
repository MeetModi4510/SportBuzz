import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

// Wrap a Transfermarkt image URL through our server-side proxy to bypass hotlink protection
function tmProxy(url) {
  if (!url || url.startsWith('data:image')) return '';
  // Fix double slashes in path (e.g. https://tmssl.akamaized.net//images/...)
  const cleanUrl = url.replace(/([^:])(\/\/+)/g, '$1/');
  return `/api/football/tm-img-proxy?url=${encodeURIComponent(cleanUrl)}`;
}

// ── Exact-match leagues ───────────────────────────────────────────────────
// These names are TOO GENERIC to use substring matching — "Premier League"
// would also match "Azerbaijan Premier League", "Armenian Premier League" etc.
// So we require the FULL league name to be exactly one of these strings.
const EXACT_LEAGUES = new Set([
  'premier league',    // England ONLY — not Azerbaijan/Armenia/Wales/etc.
  'ligue 1',           // France ONLY
  '1. bundesliga',     // Germany ONLY
  'bundesliga',        // Germany fallback
  'eredivisie',        // Netherlands ONLY
]);

// ── Substring-match leagues ────────────────────────────────────────────────
// These names are unique enough that a substring match is safe.
const INCLUDES_LEAGUES = [
  'laliga',               // Spain
  'la liga',              // Spain alternate
  'major league soccer',  // USA/Canada
  'saudi pro league',     // Saudi Arabia
  'jupiler pro league',   // Belgium
  'indian super league',  // India
];

// Known false positives — reject even if they match a whitelist entry
const EXCLUDED_PATTERNS = [
  'liga pro',          // Ecuador's LigaPro — contains "serie a" in full name
  'serie b',           // Italian 2nd division
  'serie c',           // Italian 3rd division
  'bundesliga 2',      // German 2nd division
  '2. bundesliga',     // German 2nd division
  'ligue 2',           // French 2nd division
  'laliga2',           // Spanish 2nd division
  'la liga 2',         // Spanish 2nd division alternate
  'challenger',        // Belgian 2nd division
  'nisa',              // US lower division
  'usl',               // US lower division
  'liga mx',           // Mexico
  'primeira liga',     // Portugal
  'super lig',         // Turkey
  'scottish',          // Scotland
  'u21', 'u23', 'u19', 'u18', // Youth leagues
  'reserves', 'ii',    // Reserve teams
];

function isTargetLeague(leagueName) {
  if (!leagueName) return false;
  const name = leagueName.trim().toLowerCase();

  // Step 1: Reject known false-positive patterns first
  if (EXCLUDED_PATTERNS.some(p => name.includes(p))) return false;

  // Step 2: Italian Serie A — must be exact to avoid "Liga Pro Serie A" (Ecuador)
  if (name === 'serie a' || name === 'serie a tim') return true;

  // Step 3: Generic names — EXACT match only (prevents e.g. "Azerbaijan Premier League")
  if (EXACT_LEAGUES.has(name)) return true;

  // Step 4: Unique names — substring match is safe
  return INCLUDES_LEAGUES.some(l => name.includes(l));
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
