import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testVenueAPI() {
    const venueId = '37'; // Wankhede Stadium ID on Cricbuzz
    const host = 'cricbuzz-cricket.p.rapidapi.com';
    const key = process.env.CRICBUZZ_IMAGE_RAPIDAPI_KEY || process.env.CRICBUZZ_RAPIDAPI_KEY;
    
    try {
        // Test 1: Venue Stats
        console.log("Fetching Venue Stats for ID", venueId);
        const url = `https://${host}/stats/v1/venue/${venueId}`;
        const res = await axios.get(url, {
            headers: {
                'X-RapidAPI-Key': key,
                'X-RapidAPI-Host': host
            }
        });
        
        console.log("Keys in response:", Object.keys(res.data));
        console.log("Data:", JSON.stringify(res.data).substring(0, 500));
        
    } catch(e) {
        console.log("Error:", e.message);
        if (e.response) {
            console.log(e.response.status, e.response.data);
        }
    }
}
testVenueAPI();
