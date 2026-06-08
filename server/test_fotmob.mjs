import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

async function test() {
    try {
        const res = await axios.get('https://fotmob-api.p.rapidapi.com/api/v1/news/trending?ccode3=USA', {
            headers: {
                'x-rapidapi-key': process.env.football_news,
                'x-rapidapi-host': 'fotmob-api.p.rapidapi.com'
            }
        });
        
        console.log('--- First Article in Trending ---');
        const first = res.data?.items?.[0];
        console.log(JSON.stringify(first, null, 2));

        if (first && first.page?.url) {
            console.log('\n--- Checking if there is a detail endpoint for this URL or ID ---');
            console.log(`Page URL: ${first.page.url}`);
        }
    } catch (err) {
        console.error(err.message);
    }
}

test();
