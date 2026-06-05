/**
 * Test Sofascore API - Round 2
 * Test match details, upcoming/scheduled events correctly
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
        console.log(`URL: ${BASE}${path}`, params);
        const res = await axios.get(`${BASE}${path}`, { headers, params, timeout: 20000 });
        const data = res.data;
        console.log('Status:', res.status, '| Top-level keys:', Object.keys(data));
        if (data.events && Array.isArray(data.events)) {
            console.log(`events count: ${data.events.length}`);
            if (data.events.length > 0) {
                const e = data.events[0];
                console.log('First event id:', e.id, '| status:', JSON.stringify(e.status));
                console.log('teams:', e.homeTeam?.name, 'vs', e.awayTeam?.name);
                console.log('score:', e.homeScore?.current, '-', e.awayScore?.current);
                console.log('startTimestamp:', e.startTimestamp, new Date(e.startTimestamp * 1000).toISOString());
                console.log('tournament:', e.tournament?.name);
                console.log('venue:', e.venue?.name || e.venue?.stadium?.name || 'N/A');
            }
        } else {
            const str = JSON.stringify(data);
            console.log('Raw (600 chars):', str.substring(0, 600));
        }
    } catch (err) {
        console.error(`FAIL ${label}:`, err.response?.status, JSON.stringify(err.response?.data || err.message).substring(0, 200));
    }
}

// Get a valid matchId from live events to test match-specific endpoints
async function getLiveMatchId() {
    try {
        const res = await axios.get(`${BASE}/tournaments/get-live-events`, { headers, params: { sport: 'football' }, timeout: 15000 });
        const events = res.data?.events || [];
        if (events.length > 0) {
            console.log(`\nGot ${events.length} live events. First: id=${events[0].id} | ${events[0].homeTeam?.name} vs ${events[0].awayTeam?.name}`);
            return events[0].id;
        }
    } catch (e) {
        console.error('Failed to get live events:', e.message);
    }
    // Use a known recent PL match id from last test
    return 12696143; // Ipswich vs Brentford (from previous test)
}

async function main() {
    const matchId = await getLiveMatchId();
    console.log(`\nUsing matchId: ${matchId}`);

    // Match detail
    await test('Match Detail', '/matches/detail', { matchId });

    // Match lineups
    await test('Match Lineups', '/matches/get-lineups', { matchId });

    // Match statistics (scoreboard)
    await test('Match Statistics', '/matches/get-statistics', { matchId });

    // Match incidents (commentary)
    await test('Match Incidents', '/matches/get-incidents', { matchId });

    // Match graph (momentum)
    await test('Match Graph', '/matches/get-graph', { matchId });

    // Today's scheduled events — use sport=football and date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await test('Scheduled Events Today (sport/football)', `/sports/get-schedule`, { sport: 'football', date: today });

    // Try /events/list with date
    await test('Events By Date', `/events/list`, { date: today, sport: 'football' });

    // Team detail (using a known teamId from test — Brentford id)
    await test('Team Detail (Brentford)', '/teams/detail', { teamId: '8673' });

    // Team logo
    await test('Team Logo URL check', '/teams/get-logo', { teamId: '8673' });
}

main();
