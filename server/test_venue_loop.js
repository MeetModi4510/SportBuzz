import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function discoverVenues() {
    const host = 'cricbuzz-cricket.p.rapidapi.com';
    const key = process.env.CRICBUZZ_IMAGE_RAPIDAPI_KEY || process.env.CRICBUZZ_RAPIDAPI_KEY;
    
    const venues = [];
    
    // We will scan IDs from 1 to 100
    // Actually just 1 to 80 should cover the most historic venues in the world!
    for (let id = 1; id <= 80; id++) {
        try {
            const url = `https://${host}/stats/v1/venue/${id}`;
            const res = await axios.get(url, {
                headers: {
                    'X-RapidAPI-Key': key,
                    'X-RapidAPI-Host': host
                },
                // Add a small timeout to not hang
                timeout: 5000
            });
            
            // If valid, the API usually returns some data or at least doesn't 404
            // But we can't get the NAME from /stats/v1/venue/{id}!
            // Wait, does /stats/v1/venue/{id} return the venue name?
            // The previous test output was:
            // {"venueStats":[{"key":"Total Matches","value":"8"},{"key":"Matches won batting first","value":"5"}...
            // IT DOES NOT RETURN THE VENUE NAME!
            console.log(`ID ${id} is valid, but we don't know its name!`);
        } catch(e) {
            // Ignore
        }
        await new Promise(r => setTimeout(r, 200));
    }
}
discoverVenues();
