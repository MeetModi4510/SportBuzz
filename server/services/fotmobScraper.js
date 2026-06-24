import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../cache/fotmob_teams.json');

// Ensure cache directory exists
if (!fs.existsSync(path.dirname(CACHE_FILE))) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

// In-memory cache
let teamsCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    teamsCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading fotmob cache", e);
  }
}

const LEAGUES_CACHE_FILE = path.join(__dirname, '../cache/fotmob_leagues.json');
let leaguesCache = {};
if (fs.existsSync(LEAGUES_CACHE_FILE)) {
  try {
    leaguesCache = JSON.parse(fs.readFileSync(LEAGUES_CACHE_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading fotmob leagues cache", e);
  }
}

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Queue State
let isQueueRunning = false;
let isPausedForPriority = false;
let queueIndex = 0;
let isScraping = false;

export const targetTeams = {
  "France": 6723, "England": 8491, "Belgium": 8263, "Netherlands": 6708, "Portugal": 8361,
  "Spain": 6720, "Italy": 8204, "Croatia": 10155, "Germany": 8570, "Switzerland": 6717,
  "Denmark": 8238, "Serbia": 8205, "Poland": 8568, "Scotland": 8498, "Wales": 5790,
  "Sweden": 8520, "Argentina": 6706, "Brazil": 8256, "Uruguay": 5796, "Colombia": 8258,
  "Ecuador": 6707, "Chile": 9762, "Peru": 5798, "Venezuela": 5800, "Paraguay": 6724,
  "USA": 6713, "Mexico": 6710, "Canada": 5810, "Costa Rica": 6705, "Panama": 5922,
  "Jamaica": 5806, "Morocco": 6262, "Senegal": 6395, "Egypt": 10255, "Nigeria": 6346,
  "Cameroon": 6629, "Algeria": 6317, "Ghana": 6714, "Ivory Coast": 6709, "South Africa": 6316,
  "Japan": 6715, "Iran": 6711, "South Korea": 7804, "Australia": 6716, "Saudi Arabia": 7795,
  "Qatar": 5902, "Uzbekistan": 8700, "UAE": 5789, "New Zealand": 5820
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function scrapeTeam(teamId, isOnDemand = false) {
  if (!isOnDemand) {
    while (isScraping) {
      await delay(500);
    }
    isScraping = true;
  }
  let browser = null;
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    try {
      await page.goto(`https://www.fotmob.com/teams/${teamId}/overview/team`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (e) {
      console.warn(`[Warning] goto timeout for team ${teamId}, but will try to read data anyway.`);
    }
    
    // Wait for the __NEXT_DATA__ element explicitly
    await page.waitForSelector('#__NEXT_DATA__', { timeout: 15000 }).catch(() => {});
    
    const nextDataJson = await page.evaluate(() => {
      const script = document.getElementById('__NEXT_DATA__');
      return script ? script.innerText : null;
    });

    if (nextDataJson) {
      const data = JSON.parse(nextDataJson);
      const teamData = data.props?.pageProps?.fallback[`team-${teamId}`];
      if (teamData) {
        teamsCache[teamId] = {
          data: teamData,
          timestamp: Date.now()
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(teamsCache, null, 2));
        return teamData;
      }
    }
  } catch (error) {
    console.error(`Error scraping team ${teamId}:`, error.message);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error(`Failed to gracefully close browser for ${teamId}:`, e.message);
      }
    }
    if (!isOnDemand) {
      isScraping = false;
    }
  }
  return null;
}

// Background Queue Processor
async function processBackgroundQueue() {
  if (isQueueRunning) return;
  isQueueRunning = true;

  const teamIds = Object.values(targetTeams);
  
  while (true) {
    if (isPausedForPriority) {
      await delay(1000);
      continue;
    }

    const teamId = teamIds[queueIndex];
    const cached = teamsCache[teamId];
    
    if (!cached || (Date.now() - cached.timestamp > CACHE_TTL)) {
      console.log(`[Background] Scraping team ${teamId}...`);
      await scrapeTeam(teamId);
      const waitTime = Math.floor(Math.random() * 4000) + 4000;
      await delay(waitTime);
    }

    queueIndex++;
    if (queueIndex >= teamIds.length) {
      queueIndex = 0;
      await delay(60 * 1000); 
    }
  }
}

export async function getFotmobTeam(teamId) {
  const cached = teamsCache[teamId];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  console.log(`[Priority Override] Fetching team ${teamId} on-demand...`);
  isPausedForPriority = true;
  
  try {
    const data = await scrapeTeam(teamId, true);
    return data;
  } finally {
    await delay(2000);
    isPausedForPriority = false;
  }
}

export async function getFotmobLeague(leagueId) {
  const cached = leaguesCache[leagueId];
  // TEMPORARILY IGNORE CACHE TO FETCH NEW STRUCTURE
  if (false && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  console.log(`[League Scraper] Fetching league ${leagueId} on-demand...`);
  let browser = null;
  try {
    browser = await puppeteer.launch({ 
      headless: "new", 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    await page.goto(`https://www.fotmob.com/leagues/${leagueId}/overview/league`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    
    // Wait for the __NEXT_DATA__ element explicitly
    await page.waitForSelector('#__NEXT_DATA__', { timeout: 15000 }).catch(() => {});
    
    const nextDataJson = await page.evaluate(() => {
      const script = document.getElementById('__NEXT_DATA__');
      return script ? script.innerText : null;
    });

    if (nextDataJson) {
      const data = JSON.parse(nextDataJson);
      const props = data.props?.pageProps;
      
      if (props) {
        const leagueData = { 
          tabs: props.tabs,
          details: props.details,
          table: props.table,
          transfers: props.transfers,
          overview: props.overview,
          stats: props.stats,
          fixtures: props.fixtures,
          playoff: props.playoff,
          seasons: props.seasons,
          teams: [] // backward compatibility
        };

        // backward compatibility for old format: extract basic teams info if table exists
        if (props.table && props.table[0] && props.table[0].data && props.table[0].data.table) {
          leagueData.teams = props.table[0].data.table.all.map(row => ({
            id: row.id,
            name: row.name,
            played: row.played,
            points: row.pts
          }));
        }

        leaguesCache[leagueId] = {
          data: leagueData,
          timestamp: Date.now()
        };
        fs.writeFileSync(LEAGUES_CACHE_FILE, JSON.stringify(leaguesCache, null, 2));
        return leagueData;
      }
    }
  } catch (error) {
    console.error(`Error scraping league ${leagueId}:`, error.message);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error(`Failed to gracefully close browser for league ${leagueId}:`, e.message);
      }
    }
  }
  return null;
}

// Start queue
processBackgroundQueue();
