import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const API_KEY = process.env.CRICKETDATA_KEY;
const BASE_URL = 'http://localhost:5000/api';

async function verifyFix() {
    console.log('Testing /featured/matches via local server...');
    try {
        const response = await axios.get(`${BASE_URL}/featured/matches`);
        const body = response.data;
        
        // Handle wrapping: body.data.cricket
        const cricketData = body.data?.cricket || body.cricket || body;
        
        console.log('Response body keys:', Object.keys(body));
        if (body.data) console.log('Found body.data, unwrapping...');
        if (body.data?.cricket) console.log('Found body.data.cricket, unwrapping...');

        Object.keys(cricketData).forEach(cat => {
            const matches = cricketData[cat];
            if (Array.isArray(matches)) {
                console.log(`- ${cat.toUpperCase()}: ${matches.length} matches`);
                matches.forEach(m => {
                    console.log(`  * [${m.matchType}] ${m.name} | Status: ${m.status}`);
                });
            } else {
                console.log(`- ${cat.toUpperCase()}: NOT AN ARRAY (type: ${typeof matches})`);
            }
        });

        // Specific search for PAK vs BAN
        const allMatches = [
            ...(cricketData.test || []),
            ...(cricketData.odi || []),
            ...(cricketData.t20 || [])
        ];
        
        const pakban = allMatches.filter(m => 
            m.name.toLowerCase().includes('pak') && 
            m.name.toLowerCase().includes('ban')
        );

        if (pakban.length > 0) {
            console.log('\n✅ SUCCESS: Found PAK vs BAN match(es)!');
            pakban.forEach(m => console.log(`  - ${m.name} | Status: ${m.status}`));
        } else {
            console.log('\n❌ FAILURE: Could not find PAK vs BAN match in featured output.');
        }

    } catch (err) {
        console.error('Error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.log('TIP: Ensure your backend server is running (npm start in server directory)');
        }
    }
}

verifyFix();
