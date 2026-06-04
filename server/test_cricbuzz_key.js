import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '.env');
console.log(`[DEBUG] Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const key = process.env.CRICBUZZ_RAPIDAPI_KEY;
// Use the NEW host from .env or hardcode to test
const host = 'cricbuzz-cricket2.p.rapidapi.com';

console.log(`[DEBUG] Key: ${key ? key.slice(0, 10) + '...' : 'UNDEFINED'}`);
console.log(`[DEBUG] Host: ${host}`);

const endpoints = ['matches/v1/recent', 'matches/v1/live', 'matches/v1/upcoming'];

async function testEndpoint(endpoint) {
    try {
        console.log(`\n[TEST] Testing endpoint: ${endpoint}`);
        const url = `https://${host}/${endpoint}`;
        const start = Date.now();
        const response = await axios.get(url, {
            headers: {
                'x-rapidapi-key': key,
                'x-rapidapi-host': host
            }
        });
        const duration = Date.now() - start;
        console.log(`[SUCCESS] ${endpoint} - Status: ${response.status} (${duration}ms)`);
        console.log(`[HEADERS] x-ratelimit-requests-remaining: ${response.headers['x-ratelimit-requests-remaining']}`);
    } catch (error) {
        if (error.response) {
            console.error(`[FAIL] ${endpoint} - Status: ${error.response.status}`);
            console.error(`[DATA]`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`[ERROR] ${endpoint} - ${error.message}`);
        }
    }
}

async function runTests() {
    for (const ep of endpoints) {
        await testEndpoint(ep);
    }
}

runTests();
