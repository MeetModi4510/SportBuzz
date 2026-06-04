import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const RAPIDAPI_KEY = process.env.CRICBUZZ_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'cricbuzz-cricket2.p.rapidapi.com';
const CB_BASE = `https://${RAPIDAPI_HOST}`;
const cbHeaders = { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': RAPIDAPI_HOST };

const CRICKETDATA_KEY = process.env.CRICKETDATA_KEY;
const CD_BASE = 'https://api.cricapi.com/v1';

const AUS_ZIM_ID = '9148b8df-145f-4319-b33f-6674b69cdbb3';

async function debugMapping() {
    console.log('=== DEBUGGING CRICBUZZ MAPPING FOR AUS vs ZIM ===\n');
    console.log('RapidAPI Key present:', !!RAPIDAPI_KEY);
    console.log('CricketData Key present:', !!CRICKETDATA_KEY);

    // Step 1: Get CricketData.org match info
    console.log('\n--- Step 1: CricketData.org /match_info ---');
    try {
        const cdRes = await axios.get(`${CD_BASE}/match_info?apikey=${CRICKETDATA_KEY}&id=${AUS_ZIM_ID}`);
        const cdMatch = cdRes.data?.data;
        console.log('Teams:', cdMatch?.teams);
        console.log('Status:', cdMatch?.status);
        console.log('matchStarted:', cdMatch?.matchStarted);
        console.log('matchEnded:', cdMatch?.matchEnded);
        console.log('dateTimeGMT:', cdMatch?.dateTimeGMT);
    } catch (e) {
        console.error('CricketData error:', e.message);
    }

    // Step 2: Check all 3 Cricbuzz endpoints for AUS vs ZIM
    for (const endpoint of ['recent', 'live', 'upcoming']) {
        console.log(`\n--- Step 2: Cricbuzz /${endpoint} ---`);
        try {
            const res = await axios.get(`${CB_BASE}/matches/v1/${endpoint}`, { headers: cbHeaders });
            const allMatches = [];
            if (res.data?.typeMatches) {
                res.data.typeMatches.forEach(tm => {
                    tm.seriesMatches?.forEach(sm => {
                        sm.seriesAdWrapper?.matches?.forEach(m => {
                            if (m.matchInfo) allMatches.push(m.matchInfo);
                        });
                    });
                });
            }
            console.log(`Total matches in /${endpoint}: ${allMatches.length}`);

            // Search for AUS vs ZIM
            const ausZim = allMatches.filter(m => {
                const t1 = (m.team1?.teamName || '').toLowerCase();
                const t2 = (m.team2?.teamName || '').toLowerCase();
                return (t1.includes('australia') || t1.includes('zimbabwe')) &&
                    (t2.includes('australia') || t2.includes('zimbabwe'));
            });

            if (ausZim.length > 0) {
                console.log(`*** FOUND ${ausZim.length} AUS/ZIM match(es)! ***`);
                ausZim.forEach(m => {
                    console.log(`  Cricbuzz ID: ${m.matchId}`);
                    console.log(`  ${m.team1?.teamName} vs ${m.team2?.teamName}`);
                    console.log(`  Status: ${m.status}`);
                    console.log(`  State: ${m.state}`);
                    console.log(`  startDate: ${m.startDate}`);
                    console.log(`  seriesName: ${m.seriesName}`);
                });
            } else {
                console.log('No AUS/ZIM match found in this endpoint.');
                // Show a few sample matches for reference
                const sample = allMatches.slice(0, 3);
                sample.forEach(m => {
                    console.log(`  Sample: ${m.team1?.teamName} vs ${m.team2?.teamName} (ID: ${m.matchId})`);
                });
            }
        } catch (e) {
            console.error(`Cricbuzz ${endpoint} error:`, e.message);
        }
    }
}

debugMapping().catch(e => console.error(e));
