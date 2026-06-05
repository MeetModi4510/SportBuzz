/**
 * Test Sofascore API - Round 3
 * Test completed match detail and find correct upcoming endpoint
 */
import axios from 'axios';

const RAPIDAPI_KEY = 'ea08b9a9d5msh0ce1b811a3294e7p19b61bjsnb06b82498cf2';
const RAPIDAPI_HOST = 'sofascore.p.rapidapi.com';
const BASE = 'https://sofascore.p.rapidapi.com';
const headers = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };

async function test(label, path, params = {}) {
    try {
        const res = await axios.get(`${BASE}${path}`, { headers, params, timeout: 15000 });
        const data = res.data;
        const str = JSON.stringify(data);
        console.log(`\n✅ ${label}:`);
        console.log('  Keys:', Object.keys(data));
        if (data.events) console.log('  Events count:', data.events.length);
        console.log('  Preview:', str.substring(0, 400));
    } catch (err) {
        console.log(`\n❌ ${label}: ${err.response?.status} ${JSON.stringify(err.response?.data || err.message).substring(0,200)}`);
    }
}

async function main() {
    // Completed match detail (Ipswich 0-1 Brentford from PL)
    const completedMatchId = 12696143;
    await test('Completed Match Detail', '/matches/detail', { matchId: completedMatchId });
    await test('Completed Match Lineups', '/matches/get-lineups', { matchId: completedMatchId });
    await test('Completed Match Stats', '/matches/get-statistics', { matchId: completedMatchId });
    await test('Completed Match Incidents', '/matches/get-incidents', { matchId: completedMatchId });
    await test('Completed Match Graph', '/matches/get-graph', { matchId: completedMatchId });
    await test('Completed Player Stats', '/matches/get-player-statistics', { matchId: completedMatchId });

    // Find upcoming via next matches for CL, La Liga, Bundesliga
    await test('Next Matches CL (tournamentId=7)', '/tournaments/get-next-matches', { tournamentId: '7' });
    await test('Next Matches La Liga (tournamentId=8)', '/tournaments/get-next-matches', { tournamentId: '8' });
    await test('Next Matches Bundesliga (tournamentId=35)', '/tournaments/get-next-matches', { tournamentId: '35' });

    // Try last matches for CL — need to find seasonId
    // Try Serie A last matches
    await test('Last Matches Serie A (tournamentId=23)', '/tournaments/get-last-matches', { tournamentId: '23', seasonId: '63515' });

    // Check if there's a get-seasons endpoint
    await test('Get Seasons PL', '/tournaments/get-seasons', { tournamentId: '17' });
}

main();
