import axios from 'axios';

const BASE_URL = 'https://freewebapi.com/api/matches';
const matchId = '112028'; // A recently known match ID or generic

async function debug() {
    try {
        console.log('--- FETCHING MATCH LIST ---');
        const listRes = await axios.get(`${BASE_URL}/list`);
        const matches = listRes.data?.matches || listRes.data?.data || [];
        console.log('Match List Sample:', JSON.stringify(matches.slice(0, 1), null, 2));

        if (matches.length > 0) {
            const id = matches[0].id || matches[0].match_id;
            console.log(`\n--- FETCHING DETAILS FOR ID: ${id} ---`);

            const [info, team, score, comms] = await Promise.all([
                axios.get(`${BASE_URL}/get-info`, { params: { matchId: id } }),
                axios.get(`${BASE_URL}/get-team`, { params: { matchId: id } }),
                axios.get(`${BASE_URL}/get-scorecard`, { params: { matchId: id } }),
                axios.get(`${BASE_URL}/get-commentaries`, { params: { matchId: id } })
            ]);

            console.log('\n--- INFO ---');
            console.log(JSON.stringify(info.data, null, 2));

            console.log('\n--- TEAM/SQUADS ---');
            console.log(JSON.stringify(team.data, null, 2));

            console.log('\n--- SCORECARD ---');
            console.log(JSON.stringify(score.data, null, 2));

            console.log('\n--- COMMENTARY ---');
            console.log(JSON.stringify(comms.data?.commentaries?.slice(0, 2), null, 2));
        }
    } catch (err) {
        console.error('Debug Error:', err.message);
        if (err.response) console.log('Response Data:', err.response.data);
    }
}

debug();
