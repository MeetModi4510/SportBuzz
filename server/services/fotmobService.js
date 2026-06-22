import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '../../public/data/fotmob_cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for squads
const PLAYER_CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour for player stats

class FotmobService {
  async fetchTeamId(teamName) {
    try {
      // 1. Fetch FotMob Suggest API
      const url = `https://apigw.fotmob.com/searchapi/suggest?term=${encodeURIComponent(teamName)}`;
      console.log(`[FotmobService] Searching for team: ${teamName} at ${url}`);
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      
      const teamSuggest = response.data.teamSuggest;
      if (!teamSuggest || teamSuggest.length === 0) {
        throw new Error("No team suggestions found.");
      }

      // The first result's options contain the best matches
      const options = teamSuggest[0].options;
      if (!options || options.length === 0) {
          throw new Error("No options found in team suggestion.");
      }

      // Find exact match (e.g., "Argentina|6706" => "Argentina")
      // If no exact match, just take the first one with the highest score
      const exactMatch = options.find(o => o.text.split('|')[0].toLowerCase() === teamName.toLowerCase());
      const selectedOption = exactMatch || options[0];
      
      const name = selectedOption.text.split('|')[0];
      const id = selectedOption.payload.id;
      
      console.log(`[FotmobService] Resolved ${teamName} to FotMob ID ${id} (${name})`);
      return { id, name };
    } catch (error) {
      console.error(`[FotmobService] Error fetching team ID for ${teamName}:`, error.message);
      return null;
    }
  }

  async resolvePlayerId(playerName) {
    try {
      const url = `https://apigw.fotmob.com/searchapi/suggest?term=${encodeURIComponent(playerName)}`;
      console.log(`[FotmobService] Searching for player: ${playerName} at ${url}`);
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const suggest = response.data.squadMemberSuggest;
      if (!suggest || suggest.length === 0) {
        throw new Error("No player suggestions found.");
      }

      const options = suggest[0].options;
      if (!options || options.length === 0) {
          throw new Error("No options found in player suggestion.");
      }

      // Try exact match or fallback to first
      const exactMatch = options.find(o => o.text.split('|')[0].toLowerCase() === playerName.toLowerCase());
      const selectedOption = exactMatch || options[0];
      
      const name = selectedOption.text.split('|')[0];
      const id = selectedOption.payload.id;
      
      console.log(`[FotmobService] Resolved ${playerName} to FotMob Player ID ${id} (${name})`);
      return { id, name };
    } catch (error) {
      console.error(`[FotmobService] Error fetching player ID for ${playerName}:`, error.message);
      return null;
    }
  }

  async fetchSquadData(teamName) {
    try {
      const cachePath = path.join(CACHE_DIR, `${teamName.toLowerCase().replace(/\s+/g, '_')}_squad.json`);

      // 1. Check cache
      if (fs.existsSync(cachePath)) {
        const stats = fs.statSync(cachePath);
        if (Date.now() - stats.mtimeMs < CACHE_TTL_MS) {
          console.log(`[FotmobService] Returning cached squad for ${teamName}`);
          return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
      }

      // 2. Resolve Team ID
      const teamInfo = await this.fetchTeamId(teamName);
      if (!teamInfo) {
        throw new Error(`Could not resolve FotMob Team ID for ${teamName}`);
      }

      const { id } = teamInfo;
      // fotmob team URL slug (usually lowercase name)
      const slug = teamName.toLowerCase().replace(/\s+/g, '-');
      
      // 3. Fetch Squad HTML
      const squadUrl = `https://www.fotmob.com/teams/${id}/squad/${slug}`;
      console.log(`[FotmobService] Fetching squad for ${teamName} at ${squadUrl}`);
      
      const response = await axios.get(squadUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });

      const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) {
        throw new Error(`Could not find __NEXT_DATA__ in squad page for ${teamName}.`);
      }

      const nextData = JSON.parse(match[1]);
      
      // Navigate to squad array
      const teamFallbackKey = Object.keys(nextData.props.pageProps.fallback || {}).find(k => k.includes('team-'));
      let squadArray = [];
      
      if (teamFallbackKey) {
         const teamData = nextData.props.pageProps.fallback[teamFallbackKey];
         const squadSection = teamData?.squad?.squad || teamData?.squad; // handle if it's nested or direct
         // usually squadSection is an array of categories [ {title: 'attackers', members: [...]}, ... ]
         if (Array.isArray(squadSection)) {
            squadSection.forEach(category => {
               if (category.members && Array.isArray(category.members)) {
                   category.members.forEach(member => {
                       squadArray.push({
                           id: member.id,
                           name: member.name,
                           position: category.title, // Goalkeepers, Defenders, Midfielders, Attackers
                           photo: `https://images.fotmob.com/image_resources/playerimages/${member.id}.png`,
                           cname: member.cname,
                           ccode: member.ccode,
                           role: member.role
                       });
                   });
               }
            });
         }
      }

      if (squadArray.length === 0) {
          throw new Error(`Could not parse squad members from HTML for ${teamName}`);
      }

      // 4. Save to cache
      fs.writeFileSync(cachePath, JSON.stringify(squadArray, null, 2), 'utf8');
      console.log(`[FotmobService] Cached ${squadArray.length} players for ${teamName}`);

      return squadArray;
    } catch (error) {
      console.error(`[FotmobService] Error fetching squad for ${teamName}:`, error.message);
      return [];
    }
  }

  async fetchPlayerData(playerId) {
    try {
      const cachePath = path.join(CACHE_DIR, `player_${playerId}.json`);

      // 1. Check cache
      if (fs.existsSync(cachePath)) {
        const stats = fs.statSync(cachePath);
        if (Date.now() - stats.mtimeMs < PLAYER_CACHE_TTL_MS) {
          console.log(`[FotmobService] Returning cached player data for ID ${playerId}`);
          return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
      }

      // 2. Fetch Player HTML
      const playerUrl = `https://www.fotmob.com/players/${playerId}/player`;
      console.log(`[FotmobService] Fetching player data for ID ${playerId} at ${playerUrl}`);
      
      const response = await axios.get(playerUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });

      const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) {
        throw new Error(`Could not find __NEXT_DATA__ in player page for ID ${playerId}.`);
      }

      const nextData = JSON.parse(match[1]);
      
      // 3. Navigate to player data
      const playerData = nextData?.props?.pageProps?.fallback?.[`player:${playerId}`];
      
      if (!playerData) {
          throw new Error(`Could not parse player data from HTML for ID ${playerId}`);
      }

      // 4. Save to cache
      fs.writeFileSync(cachePath, JSON.stringify(playerData, null, 2), 'utf8');
      console.log(`[FotmobService] Cached player data for ID ${playerId}`);

      return playerData;
    } catch (error) {
      console.error(`[FotmobService] Error fetching player data for ID ${playerId}:`, error.message);
      return null;
    }
  }

  async fetchMatchDetails(matchId) {
    try {
      const cachePath = path.join(CACHE_DIR, `match_${matchId}.json`);

      // 1. Check cache (5 min TTL for match details)
      if (fs.existsSync(cachePath)) {
        const stats = fs.statSync(cachePath);
        if (Date.now() - stats.mtimeMs < 5 * 60 * 1000) {
          console.log(`[FotmobService] Returning cached match data for ID ${matchId}`);
          return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        }
      }

      // 2. Use the direct Fotmob JSON API (no puppeteer needed)
      const apiUrl = `https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`;
      console.log(`[FotmobService] Fetching from Fotmob API: ${apiUrl}`);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.fotmob.com/',
        },
        timeout: 15000
      });

      const matchData = response.data;
      
      if (!matchData || !matchData.content) {
        throw new Error(`No valid match data returned for ID ${matchId}`);
      }

      // 3. Cache and return
      fs.writeFileSync(cachePath, JSON.stringify(matchData, null, 2), 'utf8');
      console.log(`[FotmobService] Cached match data for ID ${matchId}`);

      return matchData;
    } catch (error) {
      console.error(`[FotmobService] Error fetching match data for ID ${matchId}:`, error.message);
      return null;
    }
  }
}

export const fotmobService = new FotmobService();
