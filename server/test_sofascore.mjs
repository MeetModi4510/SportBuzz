/**
 * Test Sofascore RapidAPI endpoints
 */
import axios from 'axios';

const RAPIDAPI_KEY = 'ea08b9a9d5msh0ce1b811a3294e7p19b61bjsnb06b82498cf2';
const RAPIDAPI_HOST = 'sofascore.p.rapidapi.com';
const BASE = 'https://sofascore.p.rapidapi.com';

const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
};

async function test(label, path, params = {}) {
    try {
        console.log(`\n=== ${label} ===`);
        const res = await axios.get(`${BASE}${path}`, { headers, params, timeout: 15000 });
        const data = res.data;
        console.log('Status:', res.status);
        console.log('Top-level keys:', Object.keys(data));
        // Show first match if it's an array
        if (data.events && Array.isArray(data.events)) {
            console.log(`events count: ${data.events.length}`);
            if (data.events.length > 0) {
                const e = data.events[0];
                console.log('Sample event keys:', Object.keys(e));
                console.log('Sample homeTeam:', JSON.stringify(e.homeTeam, null, 2).substring(0, 300));
                console.log('Sample awayTeam:', JSON.stringify(e.awayTeam, null, 2).substring(0, 300));
                console.log('Sample tournament:', JSON.stringify(e.tournament, null, 2).substring(0, 300));
                console.log('Sample status:', JSON.stringify(e.status, null, 2));
                console.log('Sample homeScore:', JSON.stringify(e.homeScore, null, 2));
                console.log('Sample awayScore:', JSON.stringify(e.awayScore, null, 2));
                console.log('Sample startTimestamp:', e.startTimestamp);
                console.log('Sample venue:', JSON.stringify(e.venue, null, 2));
            }
        } else {
            // print up to 800 chars
            console.log('Raw:', JSON.stringify(data).substring(0, 800));
        }
    } catch (err) {
        console.error(`FAIL ${label}:`, err.response?.status, err.response?.data || err.message);
    }
}

async function main() {
    // 1. Live events
    await test('Live Football Events', '/tournaments/get-live-events', { sport: 'football' });

    // 2. Scheduled events — need a categoryId; 1 is Football
    await test('Scheduled Events (categoryId=1)', '/tournaments/get-scheduled-events', { categoryId: '1' });

    // 3. Next matches for a popular tournament (Premier League = 17)
    await test('Next Matches (tournamentId=17)', '/tournaments/get-next-matches', { tournamentId: '17' });

    // 4. Last matches for Premier League season (current season)
    await test('Last Matches (tournamentId=17, seasonId=61627)', '/tournaments/get-last-matches', { tournamentId: '17', seasonId: '61627' });
}

main();
