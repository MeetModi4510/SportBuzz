import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test both locations
console.log("Checking server/.env...");
dotenv.config({ path: path.resolve(__dirname, 'server/.env') });
console.log("CRICKETDATA_KEY from server/.env:", process.env.CRICKETDATA_KEY);

const key = process.env.CRICKETDATA_KEY;

async function testKey() {
    try {
        const response = await axios.get('https://api.cricapi.com/v1/currentMatches', {
            params: { apikey: key }
        });
        console.log("Response Status:", response.data.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testKey();
