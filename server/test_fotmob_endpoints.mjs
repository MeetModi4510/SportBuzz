import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function test() {
    const urls = [
        'https://fotmob-api.p.rapidapi.com/api/v1/news/detail?id=ftbpro_01kthd9tykc9',
        'https://fotmob-api.p.rapidapi.com/api/v1/news?id=ftbpro_01kthd9tykc9',
        'https://fotmob-api.p.rapidapi.com/api/v1/news/article?id=ftbpro_01kthd9tykc9'
    ];

    for (const url of urls) {
        try {
            console.log(`Trying ${url}...`);
            const res = await axios.get(url, {
                headers: {
                    'x-rapidapi-key': process.env.football_news,
                    'x-rapidapi-host': 'fotmob-api.p.rapidapi.com'
                }
            });
            console.log('SUCCESS for', url);
            console.log(Object.keys(res.data));
            if (res.data.content) console.log('Has content field!');
        } catch (e) {
            console.log(`FAILED for ${url}: ${e.response?.status} ${e.response?.statusText}`);
        }
    }
}

test();
