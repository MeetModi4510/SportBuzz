import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all keys from server/.env
const envContent = fs.readFileSync(path.join(__dirname, 'server/.env'), 'utf8');
const keys = envContent.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) || [];
const uniqueKeys = Array.from(new Set(keys));

const BASE_URL = 'https://api.cricapi.com/v1';

async function testKeys() {
    console.log(`Found ${uniqueKeys.length} potential keys to test.`);
    
    for (const key of uniqueKeys) {
        console.log(`\n--- Testing Key: ...${key.slice(-4)} ---`);
        try {
            const res = await axios.get(`${BASE_URL}/currentMatches`, {
                params: { apikey: key, offset: 0 }
            });
            
            const data = res.data;
            if (data.status === 'success') {
                const matches = data.data || [];
                console.log(`Success! Found ${matches.length} current matches.`);
                matches.forEach(m => {
                    console.log(`- [${m.matchType}] ${m.name} | Status: ${m.status}`);
                    if (m.name.toLowerCase().includes('pak') || m.name.toLowerCase().includes('ban')) {
                        console.log('>>> FOUND THE MATCH! <<<');
                    }
                });
            } else {
                console.log(`Failed: ${data.reason || 'Unknown reason'}`);
            }
        } catch (err) {
            console.log(`Error: ${err.message}`);
        }
    }
}

testKeys();
