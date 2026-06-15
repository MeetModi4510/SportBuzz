import axios from 'axios';
import NodeCache from 'node-cache';

// Cache images for 24 hours (86400 seconds) so we rarely hit the API repeatedly
const cache = new NodeCache({ stdTTL: 86400 });

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

export async function getTeamBadge(teamName) {
    if (!teamName) return null;
    
    const cacheKey = `tsdb_team_${teamName.toLowerCase()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`;
        const res = await axios.get(url, { timeout: 5000 });
        
        if (res.data && res.data.teams && res.data.teams.length > 0) {
            // Find the soccer team, prioritizing exact matches
            const team = res.data.teams.find(t => 
                t.strSport === 'Soccer' && 
                (t.strCountry?.toLowerCase() === teamName.toLowerCase() || t.strTeam?.toLowerCase() === teamName.toLowerCase())
            );
            
            if (team && team.strBadge) {
                cache.set(cacheKey, team.strBadge);
                return team.strBadge;
            }
        }
        
        // If not found, cache null so we don't spam the API for teams that don't exist
        cache.set(cacheKey, null);
        return null;
    } catch (error) {
        console.error(`Error fetching TheSportsDB badge for ${teamName}:`, error.message);
        return null;
    }
}

export async function getPlayerCutout(playerName) {
    if (!playerName) return null;

    const cacheKey = `tsdb_player_${playerName.toLowerCase()}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    try {
        const url = `${BASE_URL}/searchplayers.php?p=${encodeURIComponent(playerName)}`;
        const res = await axios.get(url, { timeout: 5000 });
        
        if (res.data && res.data.player && res.data.player.length > 0) {
            // Find the first soccer player
            const player = res.data.player.find(p => p.strSport === 'Soccer');
            
            if (player) {
                // Prefer the transparent cutout, fallback to thumb or render
                const imgUrl = player.strCutout || player.strThumb || player.strRender;
                if (imgUrl) {
                    cache.set(cacheKey, imgUrl);
                    return imgUrl;
                }
            }
        }
        
        // If not found, cache null
        cache.set(cacheKey, null);
        return null;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            // Rate limit hit - gracefully return null without logging a scary error, 
            // the frontend will instantly fallback to the ESPN headshot.
            return null;
        }
        console.error(`Error fetching TheSportsDB player for ${playerName}:`, error.message);
        return null;
    }
}
