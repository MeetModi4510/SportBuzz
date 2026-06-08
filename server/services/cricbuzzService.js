import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES module hoisting: explicit .env loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Config ────────────────────────────────────────────────────────────────────
const RAPIDAPI_KEY = process.env.CRICBUZZ_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.VITE_RAPIDAPI_HOST || 'cricbuzz-cricket2.p.rapidapi.com';
const CB_BASE = `https://${RAPIDAPI_HOST}`;

const cbHeaders = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
};

// ─── Image Proxy Config ────────────────────────────────────────────────────────
const CB_IMAGE_KEY = process.env.CRICBUZZ_CRICKET_NEWS || process.env.CRICBUZZ_IMAGE_RAPIDAPI_KEY || process.env.FOOTBALL_RAPIDAPI_KEY;
const CB_IMAGE_HOST = 'cricbuzz-cricket.p.rapidapi.com';
const CB_IMAGE_BASE = `https://${CB_IMAGE_HOST}`;

const cbImageHeaders = {
    'x-rapidapi-key': CB_IMAGE_KEY,
    'x-rapidapi-host': CB_IMAGE_HOST
};

// Separate cache for player images (1 hour TTL)
const imageCache = new NodeCache({ stdTTL: 3600 });

if (!RAPIDAPI_KEY) {
    console.error('[CRICBUZZ] RapidAPI key is MISSING in environment variables!');
}

// ─── Cache ─────────────────────────────────────────────────────────────────────
const cache = new NodeCache({ stdTTL: 900 }); // Default 15 minutes

// ─── Helper: Normalize Cricbuzz overs notation ────────────────────────────────
// Cricbuzz sends overs as X.B where B is ball number (1-6).
// When B = 6, the over is complete: 19.6 → 20, 76.6 → 77, 57.4 → 57.4 (unchanged)
function normalizeOvers(overs) {
    if (overs === null || overs === undefined) return 0;
    const o = parseFloat(overs);
    if (isNaN(o)) return 0;
    const completed = Math.floor(o);
    const balls = Math.round((o - completed) * 10);
    if (balls >= 6) return completed + 1;
    return o;
}

// ─── Helper: Parse Cricbuzz matchScore into CricketData-like score array ────────
function mapCricbuzzScore(matchScore, team1Name, team2Name) {
    if (!matchScore) return [];
    const score = [];
    
    const t1s = matchScore.team1Score;
    const t2s = matchScore.team2Score;
    
    if (t1s) {
        if (t1s.inngs1) {
            score.push({
                inning: `${team1Name} 1st Innings`,
                r: t1s.inngs1.runs || 0,
                w: t1s.inngs1.wickets || 0,
                o: normalizeOvers(t1s.inngs1.overs)
            });
        }
        if (t1s.inngs2) {
            score.push({
                inning: `${team1Name} 2nd Innings`,
                r: t1s.inngs2.runs || 0,
                w: t1s.inngs2.wickets || 0,
                o: normalizeOvers(t1s.inngs2.overs)
            });
        }
    }
    
    if (t2s) {
        if (t2s.inngs1) {
            score.push({
                inning: `${team2Name} 1st Innings`,
                r: t2s.inngs1.runs || 0,
                w: t2s.inngs1.wickets || 0,
                o: normalizeOvers(t2s.inngs1.overs)
            });
        }
        if (t2s.inngs2) {
            score.push({
                inning: `${team2Name} 2nd Innings`,
                r: t2s.inngs2.runs || 0,
                w: t2s.inngs2.wickets || 0,
                o: normalizeOvers(t2s.inngs2.overs)
            });
        }
    }
    
    return score;
}

// ─── Helper: Map Cricbuzz match item to CricketData frontend schema ───────────
function mapCricbuzzMatch(cbMatch) {
    const info = cbMatch.matchInfo || cbMatch;
    const scoreObj = cbMatch.matchScore;
    
    const team1Name = info.team1?.teamName || 'Team 1';
    const team2Name = info.team2?.teamName || 'Team 2';
    const score = mapCricbuzzScore(scoreObj, team1Name, team2Name);
    
    const state = (info.state || '').toLowerCase();
    const matchStarted = state !== 'preview';
    const matchEnded = state === 'complete';
    const matchType = (info.matchFormat || 'T20').toLowerCase();
    
    return {
        id: String(info.matchId),
        name: `${team1Name} vs ${team2Name}`,
        matchType: matchType,
        status: info.status || (matchEnded ? 'Match Ended' : matchStarted ? 'Match Started' : 'Match Scheduled'),
        venue: info.venueInfo?.ground ? `${info.venueInfo.ground}, ${info.venueInfo.city}` : 'Unknown Venue',
        dateTimeGMT: info.startDate ? new Date(parseInt(info.startDate)).toISOString() : new Date().toISOString(),
        teams: [team1Name, team2Name],
        teamInfo: [
            { name: team1Name, shortname: info.team1?.teamSName || team1Name.substring(0,3).toUpperCase() },
            { name: team2Name, shortname: info.team2?.teamSName || team2Name.substring(0,3).toUpperCase() }
        ],
        matchStarted: matchStarted,
        matchEnded: matchEnded,
        score: score,
        series: info.seriesName || ''
    };
}

// ─── Fetch Match List ──────────────────────────────────────────────────────────
async function fetchMatchesList(endpoint) {
    const cacheKey = `cb_list_${endpoint}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await axios.get(`${CB_BASE}/matches/v1/${endpoint}`, { headers: cbHeaders });
        const cbMatches = [];
        if (res.data?.typeMatches) {
            res.data.typeMatches.forEach(tm => {
                tm.seriesMatches?.forEach(sm => {
                    sm.seriesAdWrapper?.matches?.forEach(m => {
                        if (m.matchInfo) {
                            const mapped = mapCricbuzzMatch(m);
                            cbMatches.push(mapped);
                            
                            // Seed individual match cache for high performance
                            cache.set(`cb_match_${mapped.id}`, mapped, 900);
                        }
                    });
                });
            });
        }
        
        cache.set(cacheKey, cbMatches, 900); // Cache list for 15 minutes
        return cbMatches;
    } catch (err) {
        console.error(`[CRICBUZZ] Failed to fetch match list (${endpoint}):`, err.message);
        return [];
    }
}

// ─── Get Live Matches ─────────────────────────────────────────────────────────
async function getLiveMatches() {
    return await fetchMatchesList('live');
}

// ─── Get Upcoming Matches ─────────────────────────────────────────────────────
async function getUpcomingMatches() {
    return await fetchMatchesList('upcoming');
}

// ─── Get Recent/Completed Matches ─────────────────────────────────────────────
async function getRecentMatches() {
    return await fetchMatchesList('recent');
}

// ─── Get All Matches (Combined) ───────────────────────────────────────────────
async function getAllMatchesCombined() {
    const [live, upcoming, recent] = await Promise.all([
        getLiveMatches(),
        getUpcomingMatches(),
        getRecentMatches()
    ]);
    
    const all = [...live, ...upcoming, ...recent];
    const unique = all.filter((match, index, self) =>
        index === self.findIndex(m => m.id === match.id)
    );
    
    return unique;
}

// ─── Get Match Info (Detail) ──────────────────────────────────────────────────
async function getMatchInfo(cbId) {
    if (!cbId) return { data: null };

    // 1. Check individual match cache
    const cachedMatch = cache.get(`cb_match_${cbId}`);
    if (cachedMatch) return { status: 'success', data: cachedMatch };

    // 2. Cache miss: Fetch from live/recent/upcoming list
    const allMatches = await getAllMatchesCombined();
    const found = allMatches.find(m => m.id === String(cbId));
    if (found) {
        cache.set(`cb_match_${cbId}`, found, 900);
        return { status: 'success', data: found };
    }

    // 3. Fallback: Reconstruct from Scorecard endpoint
    try {
        const scardRes = await getScorecard(cbId);
        if (scardRes?.data) {
            const sc = scardRes.data;
            const teams = sc.innings.map(inn => inn.teamName);
            const teamInfo = sc.innings.map(inn => ({
                name: inn.teamName,
                shortname: inn.teamShortName
            }));
            
            const reconstructed = {
                id: String(cbId),
                name: teams.join(' vs ') || 'Cricket Match',
                matchType: 't20',
                status: sc.status || 'Match Started',
                venue: 'Unknown Venue',
                dateTimeGMT: new Date().toISOString(),
                teams: teams.length > 0 ? teams : ['Team 1', 'Team 2'],
                teamInfo: teamInfo.length > 0 ? teamInfo : [
                    { name: 'Team 1', shortname: 'T1' },
                    { name: 'Team 2', shortname: 'T2' }
                ],
                matchStarted: true,
                matchEnded: sc.isMatchComplete,
                score: sc.innings.map(inn => ({
                    inning: `${inn.teamName} Innings`,
                    r: inn.score,
                    w: inn.wickets,
                    o: inn.overs
                }))
            };
            
            cache.set(`cb_match_${cbId}`, reconstructed, 900);
            return { status: 'success', data: reconstructed };
        }
    } catch (err) {
        console.error(`[CRICBUZZ] getMatchInfo fallback failed for ${cbId}:`, err.message);
    }

    return { status: 'failed', reason: 'Match not found', data: null };
}

// ─── Player Extra Info (shared helper) ───────────────────────────────────────
// Uses NAME-based search (returns faceImageId directly, 24h cache)
// Avoids the expensive /stats/v1/player/{id} endpoint that causes 429
const playerExtraCache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache

async function getPlayerExtraInfoByName(playerName) {
    if (!playerName) return { faceImageId: null };
    const cacheKey = `cb_extra_name_${playerName.toLowerCase().replace(/\s+/g, '_')}`;
    const hit = playerExtraCache.get(cacheKey);
    if (hit) return hit;
    try {
        const res = await axios.get(`${CB_BASE}/stats/v1/player/search`, {
            headers: cbHeaders,
            params: { plrN: playerName },
        });
        const first = (res.data?.player || [])[0];
        const info = { faceImageId: first?.faceImageId ? String(first.faceImageId) : null };
        if (info.faceImageId) playerExtraCache.set(cacheKey, info);
        return info;
    } catch {
        return { faceImageId: null };
    }
}

// Kept for backward compat — now resolves by name internally
async function getPlayerExtraInfoGlobal(playerId, playerName) {
    if (playerName) return getPlayerExtraInfoByName(playerName);
    return { faceImageId: null };
}

// Batch resolver with concurrency limit (max 3 parallel to avoid 429)
async function batchResolvePlayerImages(players) {
    // players: array of { name, id }
    const CONCURRENCY = 3;
    const results = new Array(players.length).fill({ faceImageId: null });
    let i = 0;
    while (i < players.length) {
        const batch = players.slice(i, i + CONCURRENCY);
        const settled = await Promise.all(batch.map(p => getPlayerExtraInfoByName(p.name)));
        settled.forEach((info, j) => { results[i + j] = info; });
        i += CONCURRENCY;
    }
    return results;
}


// ─── Scorecard ─────────────────────────────────────────────────────────────────
async function getScorecard(cbId) {
    const cacheKey = `cb_scard_${cbId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/scard`, { headers: cbHeaders });
        const raw = res.data;

        if (!raw?.scorecard || !Array.isArray(raw.scorecard)) {
            return { error: 'No scorecard data from Cricbuzz', data: null };
        }


        const innings = raw.scorecard.map((inn, idx) => {
            const fowArray = Array.isArray(inn.fow) ? inn.fow : (inn.fow?.fow || []);

            return {
                inningsNum: idx + 1,
                teamName: inn.batteamname || `Team ${idx + 1}`,
                teamShortName: inn.batteamsname || '',
                score: inn.score ?? 0,
                wickets: inn.wickets ?? 0,
                overs: inn.overs ?? 0,
                runRate: inn.runrate || '0.00',
                isDeclared: inn.isdeclared || false,
                isFollowOn: inn.isfollowon || false,
                batsmen: (inn.batsman || []).map(b => {
                    const pid = b.id ? String(b.id) : null;
                    return {
                        name: b.name || b.nickname || 'Unknown',
                        id: pid,
                        faceImageId: null, // Resolved lazily on frontend one-by-one

                        runs: b.runs ?? 0,
                        balls: b.balls ?? 0,
                        fours: b.fours ?? 0,
                        sixes: b.sixes ?? 0,
                        strikeRate: b.strkrate || '0.00',
                        dismissal: b.outdec || 'not out',
                        isCaptain: b.iscaptain || false,
                        isKeeper: b.iskeeper || false,
                    };
                }),
                bowlers: (inn.bowler || []).map(b => {
                    const pid = b.id ? String(b.id) : null;
                    return {
                        name: b.name || b.nickname || 'Unknown',
                        id: pid,
                        faceImageId: null, // Resolved lazily on frontend one-by-one

                        overs: b.overs || '0',
                        maidens: b.maidens ?? 0,
                        runs: b.runs ?? 0,
                        wickets: b.wickets ?? 0,
                        economy: b.economy || '0.00',
                        isCaptain: b.iscaptain || false,
                        isKeeper: b.iskeeper || false,
                    };
                }),
                extras: inn.extras || {},
                fallOfWickets: fowArray.map((f, idx) => ({
                    batsmanName: f.batsmanname || f.batname || 'Unknown',
                    score: f.runs ?? f.score ?? 0,
                    wicketNum: f.wktnbr ?? f.wktNum ?? f.wktNbr ?? f.wicketNum ?? (idx + 1),
                    overs: f.overnbr ?? f.overs ?? 0,
                })),
            };
        });

        const isComplete = raw.ismatchcomplete || raw.status?.toLowerCase().includes('match ended');

        const result = {
            data: {
                innings,
                isMatchComplete: isComplete,
                status: raw.status || '',
            },
            error: null,
        };

        cache.set(cacheKey, result, 900); // Cache scorecard for 15 minutes
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Scorecard error for ${cbId}:`, err.message);
        cache.set(cacheKey, { error: 'Failed to fetch Cricbuzz scorecard', data: null }, 10);
        return { error: 'Failed to fetch Cricbuzz scorecard', data: null };
    }
}

// ─── Player Search by Name ─────────────────────────────────────────────────────
const playerSearchCache = new NodeCache({ stdTTL: 86400 }); // 24-hour cache
async function searchPlayerByName(name) {
    if (!name) return { data: [], error: null };
    const cacheKey = `cb_plrsearch_${name.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = playerSearchCache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await axios.get(`${CB_BASE}/stats/v1/player/search`, {
            headers: cbHeaders,
            params: { plrN: name },
        });
        const players = (res.data?.player || []).map(p => ({
            id: String(p.id),
            name: p.name,
            teamName: p.teamName || '',
            faceImageId: p.faceImageId ? String(p.faceImageId) : null,
            dob: p.dob || null,
        }));
        const result = { data: players, error: null };
        playerSearchCache.set(cacheKey, result);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Player search error for "${name}":`, err.message);
        return { data: [], error: err.message };
    }
}

// ─── Squads (Extracted from Scorecard + Player Info) ────────────────────────────
async function getSquads(cbId) {
    const cacheKey = `cb_squads_${cbId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/scard`, { headers: cbHeaders });
        const raw = res.data;

        if (!raw?.scorecard || raw.scorecard.length === 0) {
            return { error: 'No scorecard data to extract squads from', data: null };
        }

        const teams = {};

        raw.scorecard.forEach(inn => {
            const teamName = inn.batteamname || 'Unknown';
            if (!teams[teamName]) {
                teams[teamName] = {
                    teamName,
                    shortName: inn.batteamsname || '',
                    players: new Map(),
                };
            }

            (inn.batsman || []).forEach(b => {
                const name = b.name || b.nickname;
                if (!name) return;
                const existing = teams[teamName].players.get(name);
                if (existing) {
                    if (b.iscaptain) existing.isCaptain = true;
                    if (b.iskeeper) existing.isKeeper = true;
                } else {
                    teams[teamName].players.set(name, {
                        name,
                        id: b.id,
                        isCaptain: b.iscaptain || false,
                        isKeeper: b.iskeeper || false,
                    });
                }
            });
        });

        raw.scorecard.forEach(inn => {
            const batTeam = inn.batteamname || 'Unknown';
            const otherTeamName = Object.keys(teams).find(t => t !== batTeam);
            if (otherTeamName && teams[otherTeamName]) {
                (inn.bowler || []).forEach(b => {
                    const name = b.name || b.nickname;
                    if (!name) return;
                    const existing = teams[otherTeamName].players.get(name);
                    if (existing) {
                        if (b.iscaptain) existing.isCaptain = true;
                        if (b.iskeeper) existing.isKeeper = true;
                        if (!existing.id && b.id) existing.id = b.id;
                    } else {
                        teams[otherTeamName].players.set(name, {
                            name,
                            id: b.id,
                            isCaptain: b.iscaptain || false,
                            isKeeper: b.iskeeper || false,
                        });
                    }
                });
            }
        });

        const allPlayers = [];
        for (const t of Object.values(teams)) {
            for (const p of t.players.values()) {
                allPlayers.push(p);
            }
        }

        // faceImageId is resolved lazily on the frontend one-by-one

        const teamsArray = Object.values(teams).map(t => ({
            teamName: t.teamName,
            shortName: t.shortName,
            players: Array.from(t.players.values()).map(p => ({
                id: p.id ? String(p.id) : null,
                name: p.name,
                isCaptain: p.isCaptain,
                isKeeper: p.isKeeper,
                role: p.resolvedRole || 'Batsman',
                faceImageId: p.faceImageId || null
            })),
        }));

        const result = {
            data: { teams: teamsArray },
            error: null,
        };

        cache.set(cacheKey, result, 3600); // Squads don't change, cache for 1 hour
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Squads error for ${cbId}:`, err.message);
        return { error: 'Failed to fetch Cricbuzz squads', data: null };
    }
}

// ─── Commentary ────────────────────────────────────────────────────────────────
async function getCommentary(cbId) {
    const cacheKey = `cb_comm_${cbId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const cleanText = (txt) => {
        if (!txt) return '';
        return txt
            .replace(/B\d\$/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    };

    const extractItems = (comwrapper) => {
        if (!Array.isArray(comwrapper)) return [];
        return comwrapper
            .filter(c => c.commentary && c.commentary.commtxt)
            .map(c => {
                const comm = c.commentary;
                const text = cleanText(comm.commtxt);
                return {
                    text,
                    overNum: comm.overnum ?? null,
                    inningsId: comm.inningsid ?? 0,
                    timestamp: comm.timestamp || 0,
                    eventType: comm.eventtype || 'NONE',
                    ballNum: comm.ballnbr ?? 0,
                    batTeamScore: comm.batteamscore ?? 0,
                };
            })
            .filter(item => item.text.length > 0);
    };

    try {
        let items = [];
        let inningsId = 0;

        try {
            const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/comm`, { headers: cbHeaders });
            const raw = res.data;
            items = extractItems(raw?.comwrapper);
            inningsId = raw?.inningsid ?? 0;
        } catch (_) {
            // Ignore failure and let fallback handle
        }

        if (items.length === 0) {
            try {
                const res = await axios.get(`${CB_BASE}/mcenter/v1/${cbId}/hcomm`, { headers: cbHeaders });
                const raw = res.data;
                items = extractItems(raw?.comwrapper);
                inningsId = raw?.inningsid ?? 0;
            } catch (_) {
                // Ignore
            }
        }

        const result = {
            data: {
                commentary: items,
                inningsId,
            },
            error: null,
        };

        cache.set(cacheKey, result, 900); // Cache commentary for 15 minutes for real-time play
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Commentary error for ${cbId}:`, err.message);
        cache.set(cacheKey, { error: 'Failed to fetch Cricbuzz commentary', data: null }, 5);
        return { error: 'Failed to fetch Cricbuzz commentary', data: null };
    }
}

// ─── Get Player Details ─────────────────────────────────────────────────────────
async function getPlayerInfo(playerId) {
    if (!playerId) return { error: 'No player ID provided', data: null };

    const cacheKey = `cb_player_detail_${playerId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const res = await axios.get(`${CB_BASE}/stats/v1/player/${playerId}`, { headers: cbHeaders });
        const p = res.data;

        if (!p) {
            return { error: 'Player not found', data: null };
        }

        const result = {
            status: 'success',
            data: {
                id: String(playerId),
                name: p.name || 'Unknown Player',
                role: p.role || 'Batsman',
                battingStyle: p.batFace || 'Right-hand bat',
                bowlingStyle: p.bowlFace || 'Right-arm offbreak',
                placeOfBirth: p.birthPlace || '',
                country: p.intlTeam || '',
                bio: p.bio || '',
                dateOfBirth: p.dob || ''
            }
        };

        cache.set(cacheKey, result, 86400); // Player details rarely change, cache 24h
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Player details error for ${playerId}:`, err.message);
        return { error: 'Failed to fetch player details', data: null };
    }
}

// ─── Player Image Proxy ────────────────────────────────────────────────────────
// Returns a boolean indicating image availability, cached for 1 hour.
async function checkPlayerImageExists(playerId) {
    if (!playerId) return false;
    const cacheKey = `cb_img_exists_${playerId}`;
    const cached = imageCache.get(cacheKey);
    if (cached !== undefined) return cached;

    try {
        const https = await import('https');
        return await new Promise((resolve) => {
            const req = https.default.request({
                method: 'HEAD',
                hostname: CB_IMAGE_HOST,
                path: `/img/v1/192x192/i1/c${playerId}/i.jpg`,
                headers: cbImageHeaders
            }, (res) => {
                const exists = res.statusCode === 200;
                imageCache.set(cacheKey, exists, 3600);
                resolve(exists);
            });
            req.on('error', () => { imageCache.set(cacheKey, false, 3600); resolve(false); });
            req.end();
        });
    } catch {
        imageCache.set(cacheKey, false, 3600);
        return false;
    }
}

// Stream the player image from Cricbuzz to the frontend (via backend proxy)
async function streamPlayerImage(playerId, res) {
    if (!playerId) { res.status(404).end(); return; }
    const cacheKey = `cb_img_exists_${playerId}`;
    const cached = imageCache.get(cacheKey);
    if (cached === false) { res.status(204).end(); return; }

    try {
        const https = await import('https');
        const req = https.default.request({
            method: 'GET',
            hostname: CB_IMAGE_HOST,
            path: `/img/v1/i1/c${playerId}/i.jpg`,
            headers: cbImageHeaders
        }, (imgRes) => {
            if (imgRes.statusCode !== 200) {
                imageCache.set(cacheKey, false, 3600);
                res.status(204).end();
                return;
            }
            imageCache.set(cacheKey, true, 3600);
            res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            imgRes.pipe(res);
        });
        req.on('error', () => res.status(204).end());
        req.end();
    } catch {
        res.status(204).end();
    }
}

// ─── Cricket News ───────────────────────────────────────────────────────────────
const newsCache = new NodeCache({ stdTTL: 1800 }); // 30-minute cache

function formatNewsTimestamp(pubTimestamp) {
    if (!pubTimestamp) return 'Just now';
    const pub = new Date(parseInt(pubTimestamp));
    const diff = Date.now() - pub.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

async function getCricketNews() {
    const cacheKey = 'cb_news_index';
    const cached = newsCache.get(cacheKey);
    if (cached) return cached;

    const newsApiKey = process.env.CRICBUZZ_CRICKET_NEWS || RAPIDAPI_KEY;
    const newsHost = 'cricbuzz-cricket2.p.rapidapi.com';

    try {
        const res = await axios.get(`https://${newsHost}/news/v1/index`, {
            headers: {
                'x-rapidapi-key': newsApiKey,
                'x-rapidapi-host': newsHost,
            }
        });

        const storyList = res.data?.storyList || [];
        const articles = storyList
            .filter(item => item.story)
            .map(item => {
                const s = item.story;
                return {
                    id: String(s.id),
                    title: s.seoHeadline || s.hline || 'Cricket News',
                    headline: s.hline || s.seoHeadline || 'Cricket News',
                    snippet: s.intro || '',
                    timestamp: formatNewsTimestamp(s.pubTime),
                    context: s.context || '',
                    imageId: s.coverImage?.id || s.imageId || null,
                    source: s.source || 'Cricbuzz',
                    sport: 'cricket',
                };
            });

        const result = { data: articles, error: null };
        newsCache.set(cacheKey, result, 1800); // 30 min
        return result;
    } catch (err) {
        console.error('[CRICBUZZ] News fetch error:', err.message);
        newsCache.set(cacheKey, { data: [], error: 'Failed to fetch news' }, 60);
        return { data: [], error: 'Failed to fetch news' };
    }
}

async function getCricketNewsDetail(storyId) {
    if (!storyId) return { error: 'Missing storyId', data: null };

    const cacheKey = `cb_news_detail_${storyId}`;
    const cached = newsCache.get(cacheKey);
    if (cached) return cached;

    const newsApiKey = process.env.CRICBUZZ_CRICKET_NEWS || RAPIDAPI_KEY;
    const newsHost = 'cricbuzz-cricket2.p.rapidapi.com';

    try {
        const res = await axios.get(`https://${newsHost}/news/v1/detail/${storyId}`, {
            headers: {
                'x-rapidapi-key': newsApiKey,
                'x-rapidapi-host': newsHost,
            }
        });

        const contentArray = res.data?.content || [];
        // Extract paragraphs
        const paragraphs = contentArray
            .filter(item => item.content && item.content.contentType === 'text')
            .map(item => {
                // Strip strange tags from Cricbuzz text (e.g. @L0$, @Bo$)
                let text = item.content.contentValue || '';
                text = text.replace(/@[A-Za-z0-9]+\$/g, '');
                return text;
            });

        const result = { data: paragraphs, error: null };
        newsCache.set(cacheKey, result, 86400); // 24 hours, news detail doesn't change
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] News detail fetch error for ${storyId}:`, err.message);
        return { data: [], error: 'Failed to fetch news detail' };
    }
}

// ─── ICC Team Rankings ───────────────────────────────────────────────────────────
const rankingsCache = new NodeCache({ stdTTL: 604800 }); // 1 week default TTL

// Cricbuzz imageId → ISO 3166-1 alpha-2 country code (for flagcdn)
const CB_IMAGE_TO_FLAG = {
    '776162': 'in',  // India
    '776202': 'au',  // Australia
    '776237': 'gb-eng', // England
    '776287': 'za',  // South Africa
    '776247': 'nz',  // New Zealand
    '776257': 'pk',  // Pakistan
    '776222': 'lk',  // Sri Lanka
    '776167': 'bd',  // Bangladesh
    '776227': 'wi',  // West Indies
    '776232': 'zw',  // Zimbabwe
    '776242': 'af',  // Afghanistan
    '776312': 'ie',  // Ireland
    '776307': 'nl',  // Netherlands
    '776302': 'sc',  // Scotland
    '776297': 'zw',  // Zimbabwe alt
    '776292': 'na',  // Namibia
    '776317': 'us',  // USA
    '776322': 'ug',  // Uganda
    '776172': 'np',  // Nepal
    '776327': 'oman', // Oman — fallback to text
    '776332': 'pa',  // Papua New Guinea
    '776337': 'kw',  // Kuwait
    '776342': 'sg',  // Singapore
    '776347': 'hk',  // Hong Kong
    '776352': 'ke',  // Kenya
    '776357': 'tz',  // Tanzania
    '776362': 'ca',  // Canada
};
const TEAM_NAME_TO_FLAG = {
    'india': 'in',
    'australia': 'au',
    'england': 'gb-eng',
    'south africa': 'za',
    'new zealand': 'nz',
    'pakistan': 'pk',
    'sri lanka': 'lk',
    'bangladesh': 'bd',
    'west indies': 'wi',
    'zimbabwe': 'zw',
    'afghanistan': 'af',
    'ireland': 'ie',
    'netherlands': 'nl',
    'scotland': 'sc',
    'namibia': 'na',
    'usa': 'us',
    'uganda': 'ug',
    'nepal': 'np',
    'oman': 'oman',
    'papua new guinea': 'pa',
    'kuwait': 'kw',
    'singapore': 'sg',
    'hong kong': 'hk',
    'kenya': 'ke',
    'tanzania': 'tz',
    'canada': 'ca'
};

function shouldRefreshRankings(format) {
    // Force refresh on Wednesday (day 3 in JS Date, 0=Sun) at or after 6 PM (18:00)
    const now = new Date();
    const isWednesday = now.getDay() === 3 && now.getHours() >= 18;
    if (!isWednesday) return false;

    const cacheKey = `rankings_v4_${format}`;
    const meta = rankingsCache.get(`${cacheKey}_meta`);
    if (!meta) return true;

    // If already refreshed today (Wednesday), don't re-fetch
    const lastRefreshDate = new Date(meta.refreshedAt).toDateString();
    return lastRefreshDate !== now.toDateString();
}


async function getTeamRankings(format) {
    const cacheKey = `rankings_v4_${format}`;
    const cached = rankingsCache.get(cacheKey);

    // Return cache unless it's Wednesday refresh time
    if (cached && !shouldRefreshRankings(format)) return cached;

    const newsApiKey = process.env.CRICBUZZ_CRICKET_NEWS || RAPIDAPI_KEY;
    const rankHost = 'cricbuzz-cricket2.p.rapidapi.com';

    try {
        const res = await axios.get(
            `https://${rankHost}/stats/v1/rankings/teams?isWomen=0&formatType=${format}`,
            { headers: { 'x-rapidapi-key': newsApiKey, 'x-rapidapi-host': rankHost } }
        );

        let raw = res.data?.rank || [];
        
        // Limit to top 15 teams for T20 format only
        if (format === 't20') {
            raw = raw.slice(0, 15);
        }

        const hasMatches = raw.length > 0 && raw[0].matches != null && raw[0].matches !== '';

        const teams = raw.map(t => {
            const teamNameLower = (t.name || '').toLowerCase();
            const isLocal = LOCAL_FLAG_COUNTRIES.has(teamNameLower);
            const localPath = LOCAL_FLAG_PATH[teamNameLower] || null;
            const standardFlagCode = TEAM_NAME_TO_FLAG[teamNameLower] || CB_IMAGE_TO_FLAG[t.imageId] || null;
            
            return {
                rank: parseInt(t.rank),
                id: t.id,
                name: t.name,
                rating: parseInt(t.rating) || 0,
                points: parseInt(t.points) || 0,
                matches: hasMatches ? (parseInt(t.matches) || 0) : null,
                flagCode: isLocal ? localPath : standardFlagCode,
                lastUpdatedOn: t.lastUpdatedOn || null,
            };
        });

        const result = {
            data: teams,
            hasMatches,
            lastUpdatedOn: teams[0]?.lastUpdatedOn || null,
            error: null,
        };

        rankingsCache.set(cacheKey, result, 604800); // 1 week
        rankingsCache.set(`${cacheKey}_meta`, { refreshedAt: Date.now() }, 604800);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Rankings fetch error (${format}):`, err.message);
        if (cached) return cached; // serve stale on error
        return { data: [], hasMatches: false, lastUpdatedOn: null, error: 'Failed to fetch rankings' };
    }
}

// ─── ICC Player Rankings ─────────────────────────────────────────────────────────
const playerRankingsCache = new NodeCache({ stdTTL: 604800 }); // 1 week

// Country name → ISO code for flagcdn
const COUNTRY_NAME_TO_FLAG = {
    'india': 'in',
    'australia': 'au',
    'england': 'gb-eng',
    'south africa': 'za',
    'new zealand': 'nz',
    'pakistan': 'pk',
    'sri lanka': 'lk',
    'bangladesh': 'bd',
    'west indies': 'wi',
    'zimbabwe': 'zw',
    'afghanistan': 'af',
    'ireland': 'ie',
    'netherlands': 'nl',
    'scotland': 'sc',
    'namibia': 'na',
    'usa': 'us',
    'united states of america': 'us',
    'uganda': 'ug',
    'nepal': 'np',
    'oman': 'om',
    'papua new guinea': 'pg',
    'kuwait': 'kw',
    'singapore': 'sg',
    'hong kong': 'hk',
    'kenya': 'ke',
    'tanzania': 'tz',
    'canada': 'ca',
    'united arab emirates': 'ae',
    'uae': 'ae',
    'sri lanka': 'lk',
};

// Countries that use locally stored flag images (public/flags/*.png)
const LOCAL_FLAG_COUNTRIES = new Set([
    'west indies',
    'sri lanka',
    'england',
    'usa',
    'united states of america',
    'scotland',
    'united arab emirates',
    'uae',
    'oman',
]);

// Local flag paths for countries with saved images
const LOCAL_FLAG_PATH = {
    'west indies': '/flags/westindies.png',
    'sri lanka': '/flags/srilanka.png',
    'england': '/flags/england.png',
    'usa': '/flags/usa.png',
    'united states of america': '/flags/usa.png',
    'scotland': '/flags/scotland.png',
    'united arab emirates': '/flags/unitedarabemirates.png',
    'uae': '/flags/unitedarabemirates.png',
    'oman': '/flags/oman.png',
};

function shouldRefreshPlayerRankings(cacheKey) {
    const now = new Date();
    const isWednesdayAfter6PM = now.getDay() === 3 && now.getHours() >= 18;
    if (!isWednesdayAfter6PM) return false;
    const meta = playerRankingsCache.get(`${cacheKey}_meta`);
    if (!meta) return true;
    const lastRefreshDate = new Date(meta.refreshedAt).toDateString();
    return lastRefreshDate !== now.toDateString();
}

async function getPlayerRankings(category, format) {
    // category: 'batsmen' | 'bowlers' | 'allrounders'
    // format:   'odi' | 'test' | 't20'
    const cacheKey = `player_rankings_v1_${category}_${format}`;
    const cached = playerRankingsCache.get(cacheKey);
    if (cached && !shouldRefreshPlayerRankings(cacheKey)) return cached;

    const apiKey = process.env.CRICBUZZ_CRICKET_NEWS || RAPIDAPI_KEY;
    const host = 'cricbuzz-cricket2.p.rapidapi.com';

    try {
        const res = await axios.get(
            `https://${host}/stats/v1/rankings/${category}?isWomen=0&formatType=${format}`,
            { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host } }
        );

        const rawList = (res.data?.rank || []).slice(0, 15);

        const players = rawList.map(p => {
            const countryLower = (p.country || '').toLowerCase();
            const isLocal = LOCAL_FLAG_COUNTRIES.has(countryLower);
            const localPath = LOCAL_FLAG_PATH[countryLower] || null;
            const flagCode = COUNTRY_NAME_TO_FLAG[countryLower] || null;
            return {
                rank: parseInt(p.rank),
                id: p.id,
                name: p.name,
                country: p.country,
                flagCode: isLocal ? null : flagCode,
                flagLocal: isLocal ? localPath : null,
                faceImageId: p.faceImageId || null,
                rating: parseInt(p.rating) || 0,
                points: parseInt(p.points) || 0,
                trend: p.trend || 'Flat',
                lastUpdatedOn: p.lastUpdatedOn || null,
            };
        });

        const result = {
            data: players,
            lastUpdatedOn: players[0]?.lastUpdatedOn || null,
            error: null,
        };

        playerRankingsCache.set(cacheKey, result, 604800);
        playerRankingsCache.set(`${cacheKey}_meta`, { refreshedAt: Date.now() }, 604800);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Player rankings error (${category}/${format}):`, err.message);
        if (cached) return cached;
        return { data: [], lastUpdatedOn: null, error: 'Failed to fetch player rankings' };
    }
}

// ─── Trending Players ─────────────────────────────────────────────────────────
const trendingCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

async function getTrendingPlayers() {
    const cacheKey = 'trending_players_v1';
    const cached = trendingCache.get(cacheKey);
    if (cached) return cached;

    // Use the CRICBUZZ_CRICKET_NEWS key (new key provided by user)
    const apiKey = process.env.CRICBUZZ_CRICKET_NEWS || process.env.FOOTBALL_RAPIDAPI_KEY || RAPIDAPI_KEY;
    const host = 'cricbuzz-cricket2.p.rapidapi.com';

    try {
        const res = await axios.get(
            `https://${host}/stats/v1/player/trending`,
            { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host } }
        );

        const rawPlayers = res.data?.player || [];
        const players = rawPlayers.map((p, idx) => {
            const teamLower = (p.teamName || '').toLowerCase();
            const isLocal = LOCAL_FLAG_COUNTRIES.has(teamLower);
            const localPath = LOCAL_FLAG_PATH[teamLower] || null;
            const flagCode = COUNTRY_NAME_TO_FLAG[teamLower] || null;
            return {
                rank: idx + 1,
                id: p.id,
                name: p.name,
                teamName: p.teamName || '',
                faceImageId: p.faceImageId || null,
                flagCode: isLocal ? null : flagCode,
                flagLocal: isLocal ? localPath : null,
            };
        });

        const result = {
            data: players,
            lastUpdatedOn: new Date().toISOString(),
            error: null,
        };

        trendingCache.set(cacheKey, result, 86400);
        return result;
    } catch (err) {
        console.error('[CRICBUZZ] Trending players error:', err.message);
        if (cached) return cached;
        return { data: [], lastUpdatedOn: null, error: 'Failed to fetch trending players' };
    }
}

// ─── Cricbuzz Player Info (click-triggered) ───────────────────────────────────
const playerInfoCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

async function getCricbuzzPlayerInfo(playerId) {
    const cacheKey = `playerProfile:${playerId}`;
    const cached = playerInfoCache.get(cacheKey);
    if (cached) return cached;

    // Use the CRICBUZZ_CRICKET_NEWS key (new key provided by user)
    const apiKey = process.env.CRICBUZZ_CRICKET_NEWS || process.env.FOOTBALL_RAPIDAPI_KEY || RAPIDAPI_KEY;
    const host = 'cricbuzz-cricket2.p.rapidapi.com';

    try {
        const res = await axios.get(
            `https://${host}/stats/v1/player/${playerId}`,
            { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host } }
        );

        const d = res.data;
        const countryLower = (d.country || '').toLowerCase();
        const isLocal = LOCAL_FLAG_COUNTRIES.has(countryLower);
        const localPath = LOCAL_FLAG_PATH[countryLower] || null;
        const flagCode = COUNTRY_NAME_TO_FLAG[countryLower] || null;

        const result = {
            data: {
                id: playerId,
                name: d.name || '',
                country: d.country || '',
                flagCode: isLocal ? null : flagCode,
                flagLocal: isLocal ? localPath : null,
                role: d.role || '',
                battingStyle: d.battingStyle || '',
                bowlingStyle: d.bowlingStyle || '',
                faceImageId: d.faceImageId || null,
                bio: d.bio || '',
                dateOfBirth: d.dateOfBirth || '',
                rankings: {
                    test: d.rankings?.bat?.test || d.rankings?.bowl?.test || null,
                    odi: d.rankings?.bat?.odi || d.rankings?.bowl?.odi || null,
                    t20: d.rankings?.bat?.t20i || d.rankings?.bowl?.t20i || null,
                },
                teams: d.teams || [],
            },
            error: null,
        };

        playerInfoCache.set(cacheKey, result, 86400);
        return result;
    } catch (err) {
        console.error(`[CRICBUZZ] Player info error (${playerId}):`, err.message);
        if (cached) return cached;
        return { data: null, error: 'Failed to fetch player info' };
    }
}

// ─── Export ────────────────────────────────────────────────────────────────────
export const cricbuzzService = {
    getLiveMatches,
    getUpcomingMatches,
    getRecentMatches,
    getAllMatches: getAllMatchesCombined,
    getMatchInfo,
    getScorecard,
    getSquads,
    getCommentary,
    getPlayerInfo,
    searchPlayerByName,
    checkPlayerImageExists,
    streamPlayerImage,
    getCricketNews,
    getCricketNewsDetail,
    getTeamRankings,
    getPlayerRankings,
    getTrendingPlayers,
    getCricbuzzPlayerInfo,
};

export default cricbuzzService;
