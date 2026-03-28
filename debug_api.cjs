const axios = require('axios');
const API_KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const BASE_URL = 'https://api.cricapi.com/v1';

async function debug() {
    try {
        console.log('Fetching Matches...');
        const res = await axios.get(BASE_URL + '/matches?apikey=' + API_KEY + '&offset=0');
        const matches = res.data.data;

        if (!matches || matches.length === 0) { console.log('No matches found'); return; }

        console.log(`Scanning up to 50 matches (Live/Completed/Upcoming) for ANY detailed data...`);

        let foundScorecard = false;
        let foundSquad = false;

        // Check first 50 matches
        const candidates = matches.slice(0, 50);

        for (const m of candidates) {
            // Optimization: skip if we found both examples already
            if (foundScorecard && foundSquad) break;

            try {
                const infoRes = await axios.get(BASE_URL + '/match_info?apikey=' + API_KEY + '&id=' + m.id);
                const info = infoRes.data.data;

                if (info) {
                    const hasScorecard = info.scorecard && info.scorecard.length > 0;
                    const hasPlayers = (info.players && info.players.length > 0) || (info.squad && info.squad.length > 0);

                    if (hasScorecard || hasPlayers) {
                        console.log(`\n✅ MATCH WITH DATA FOUND: ${m.name} (${m.id}) [${m.status}]`);
                        if (hasScorecard) {
                            console.log('  - Has Scorecard (Batting/Bowling tables)');
                            foundScorecard = true;
                        }
                        if (hasPlayers) {
                            console.log('  - Has Lineups/Squads');
                            foundSquad = true;
                        }
                    }
                }
            } catch (err) {
                // Ignore errors
            }
        }

        if (!foundScorecard && !foundSquad) {
            console.log('\n❌ Scanned 50 matches. NO Detailed Data (Scorecard/Lineups) found for ANY match.');
            console.log('   The API key/tier likely does not support detailed stats, or no major matches are currently searchable.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

debug();
