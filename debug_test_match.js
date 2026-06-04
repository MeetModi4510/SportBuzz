import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const API_KEY = process.env.CRICKETDATA_KEY || process.env.VITE_CRICKETDATA_API_KEY;

async function checkTestMatches() {
    try {
        console.log('Fetching /matches to find a Test/First-Class match...');
        const res = await axios.get(`https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`);
        const matches = res.data.data || [];

        // Filter for Test or First Class
        const testMatch = matches.find(m =>
            (m.matchType || '').toLowerCase().includes('test') ||
            (m.matchType || '').toLowerCase().includes('class') || // First Class
            (m.series_id || '').toLowerCase().includes('test')
        );

        if (!testMatch) {
            console.log('No Test/First Class match found in recent list.');
            return;
        }

        console.log(`Found Match: ${testMatch.name} (${testMatch.matchType}) [ID: ${testMatch.id}]`);

        // Fetch detailed scorecard/info
        console.log(`Fetching match_info for ${testMatch.id}...`);
        const infoRes = await axios.get(`https://api.cricapi.com/v1/match_info?apikey=${API_KEY}&id=${testMatch.id}`);
        // console.log(JSON.stringify(infoRes.data, null, 2));

        // Attempt to find stumps data in response
        const data = infoRes.data.data || {};

        console.log('Keys in Match Info:', Object.keys(data));

        if (data.score) console.log('Score:', JSON.stringify(data.score, null, 2));
        if (data.status) console.log('Status:', data.status);

        // Check for specific fields that might hold daily info
        console.log('Fetching match_scorecard for ' + testMatch.id + '...');
        const scRes = await axios.get(`https://api.cricapi.com/v1/match_scorecard?apikey=${API_KEY}&id=${testMatch.id}`);
        const scData = scRes.data.data || {};

        console.log('Keys in Scorecard Data:', Object.keys(scData));

        // Inspect the 'scorecard' array/object inside data
        if (scData.scorecard) {
            console.log('Scorecard Field Type:', typeof scData.scorecard);
            if (Array.isArray(scData.scorecard)) {
                console.log('Scorecard Array Length:', scData.scorecard.length);
                console.log('Scorecard [0] Keys:', Object.keys(scData.scorecard[0]));
                // Check inside first inning
                console.log('Scorecard [0] Sample:', JSON.stringify(scData.scorecard[0], null, 2).substring(0, 500));
            }
        }

        // Check if there's any 'notes' field
        if (scData.notes) console.log('Notes:', scData.notes);


    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTestMatches();
