import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const API_KEY = process.env.CRICKETDATA_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

async function debugMatches() {
    console.log('Using API Key:', API_KEY.slice(-4));
    
    // Step 1: Check Series (Multiple Pages)
    console.log('\n=== Searching for Specific Series ===');
    let allSeries = [];
    try {
        for (let i = 0; i < 6; i++) {
            const response = await axios.get(`${BASE_URL}/series`, {
                params: { apikey: API_KEY, offset: i * 25 }
            });
            allSeries = allSeries.concat(response.data.data || []);
        }
        
        const targets = [
            'world cup',
            'afghanistan',
            'sri lanka',
            'pakistan',
            'bangladesh'
        ];
        
        const matches = allSeries.filter(s => 
            targets.some(t => s.name.toLowerCase().includes(t))
        );
        
        console.log('Found series:');
        matches.forEach(s => console.log(`- ${s.name} | ID: ${s.id} | Start: ${s.startDate} | End: ${s.endDate}`));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

debugMatches();
