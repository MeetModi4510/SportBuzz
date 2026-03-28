import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.CRICKETDATA_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

async function testMatchInfo(id) {
    try {
        console.log(`Fetching match info for ${id}...`);
        const response = await axios.get(`${BASE_URL}/match_info`, {
            params: {
                apikey: API_KEY,
                id: id
            }
        });

        const data = response.data;
        if (data.status !== 'success') {
            console.error('API Error:', data.reason);
            return;
        }

        const match = data.data;
        console.log('\n=== MATCH INFO ===');
        console.log('ID:', match.id);
        console.log('Name:', match.name);
        console.log('Status:', match.status);
        console.log('Score Array:', JSON.stringify(match.score, null, 2));

        // Check for scorecard or innings
        if (match.scorecard) {
            console.log('\nScorecard found! Innings count:', match.scorecard.length);
        } else {
            console.log('\nNo scorecard found in top-level.');
        }

    } catch (err) {
        console.error('Network Error:', err.message);
    }
}

// Use an ID from the earlier debug output
testMatchInfo('d0a8d739-c9e8-4ed1-9680-e4505a8abdc1'); // Ranji match
