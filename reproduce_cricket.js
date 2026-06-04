
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: './server/.env' });

const RAPID_API_KEY = process.env.RAPIDAPI_KEY;
const RAPID_API_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

console.log('Testing Cricket API with Key:', RAPID_API_KEY ? '******' + RAPID_API_KEY.slice(-4) : 'NOT FOUND');

const testMatches = async () => {
    try {
        console.log('Fetching live matches...');
        const response = await axios.get(`https://${RAPID_API_HOST}/matches/v1/live`, {
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });

        console.log('Status:', response.status);
        console.log('Data Type:', typeof response.data);
        console.log('Data Preview:', JSON.stringify(response.data).slice(0, 200));

        console.log('\nFetching upcoming matches...');
        const upcomingRes = await axios.get(`https://${RAPID_API_HOST}/matches/v1/upcoming`, {
            headers: {
                'X-RapidAPI-Key': RAPID_API_KEY,
                'X-RapidAPI-Host': RAPID_API_HOST
            }
        });
        console.log('Upcoming Status:', upcomingRes.status);
        console.log('Upcoming Data Preview:', JSON.stringify(upcomingRes.data).slice(0, 200));

    } catch (error) {
        console.error('❌ API Error:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 403) {
            console.error('⚠️ Suggestion: Check if the API Key is valid and subscribed to the API.');
        }
    }
};

testMatches();
