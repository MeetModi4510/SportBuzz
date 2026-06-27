import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testRapidAPI() {
    try {
        const query = 'Arshdeep Singh';
        const url = `https://cricbuzz-cricket.p.rapidapi.com/stats/v1/player/search?plrN=${encodeURIComponent(query)}`;
        const res = await axios.get(url, {
            headers: {
                'X-RapidAPI-Key': process.env.CRICBUZZ_IMAGE_RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com'
            }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch(e) {
        console.log("Failed:", e.message);
    }
}
testRapidAPI();
