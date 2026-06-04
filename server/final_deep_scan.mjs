import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function finalDeepSearch() {
    console.log('Final broad scan (100 matches) for AUS vs ZIM...');

    try {
        let found = false;
        // Check offsets 0, 25, 50, 75
        for (let offset of [0, 25, 50, 75]) {
            const { data } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=${offset}`);
            const matches = data.data || [];

            for (const m of matches) {
                const teams = (m.teams || []).join(',').toLowerCase();
                const name = (m.name || '').toLowerCase();

                // Match logic: Must have "australia" AND "zimbabwe"
                if ((name.includes('australia') && name.includes('zimbabwe')) ||
                    (teams.includes('australia') && teams.includes('zimbabwe'))) {

                    console.log(`\n*** FOUND AUS vs ZIM ***`);
                    console.log(`Name: ${m.name}`);
                    console.log(`ID: ${m.id}`);
                    console.log(`Status: ${m.status}`);
                    console.log(`Match Started: ${m.matchStarted}`);
                    console.log(`Match Ended: ${m.matchEnded}`);
                    console.log(`Score:`, JSON.stringify(m.score, null, 2));

                    // Also check match_info
                    console.log(`Fetching match_info details...`);
                    const infoRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${m.id}`);
                    console.log(`Score (match_info):`, JSON.stringify(infoRes.data.data?.score, null, 2));

                    found = true;
                }
            }
        }

        if (!found) {
            console.log('Checking specifically for "Australia v Zimbabwe" in series...');
            // One last check: "Australia v Zimbabwe" series
            const sRes = await axios.get(`${BASE}/series?apikey=${KEY}&search=Australia%20Zimbabwe`); // Try combined search
            const sList = sRes.data.data || [];
            console.log(`Found ${sList.length} relevant series.`);

            for (const s of sList) {
                console.log(`Checking: ${s.name} (${s.id})`);
                const iRes = await axios.get(`${BASE}/series_info?apikey=${KEY}&id=${s.id}`);
                const matches = iRes.data.data?.matchList || [];
                const match = matches.find(m => m.name.toLowerCase().includes('zimbabwe'));
                if (match) {
                    console.log(`Found match in series: ${match.name} | ID: ${match.id}`);
                    console.log(`Score:`, JSON.stringify(match.score, null, 2));
                }
            }
        }

        if (!found && sList.length === 0) {
            console.log('Conclusion: Matches involving AUS vs ZIM do not exist in the first 100 results or specific series search for this API key.');
        }

    } catch (err) {
        console.error('API Error:', err.message);
    }
}

finalDeepSearch();
