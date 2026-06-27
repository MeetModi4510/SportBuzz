import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testIDs() {
    const host = 'cricbuzz-cricket.p.rapidapi.com';
    const key = process.env.CRICBUZZ_IMAGE_RAPIDAPI_KEY || process.env.CRICBUZZ_RAPIDAPI_KEY;
    
    // We can fetch live matches to get some IDs just in case, but we know 37 is Wankhede.
    // Let's test 58 and 59
    for (let id of [37, 58, 59, 14, 15, 16, 53]) {
        try {
            const url = `https://${host}/stats/v1/venue/${id}`;
            const res = await axios.get(url, { headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host } });
            console.log(`ID ${id} is valid! Has stats.`);
        } catch(e) {
            console.log(`ID ${id} failed:`, e.message);
        }
        await new Promise(r => setTimeout(r, 200));
    }
}
testIDs();
