import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const FotmobCache = (await import('./models/FotmobCache.js')).default;
        
        console.log('Fetching period...');
        const periodRes = await axios.get('https://www.fotmob.com/api/data/fifarankings/period?gender=men', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const latestPeriodId = periodRes.data[0].periodId;
        console.log('Latest period:', latestPeriodId);
        
        const rankingRes = await axios.get(`https://www.fotmob.com/api/data/fifarankings/ranking?gender=men&periodId=${latestPeriodId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        console.log('Rankings fetched:', rankingRes.data.length);
        
        const cacheKey = '/fifa-rankings/men';
        console.log('Saving to DB...');
        await FotmobCache.findOneAndUpdate(
            { endpoint: cacheKey },
            {
                data: rankingRes.data,
                cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                lastFetched: new Date()
            },
            { upsert: true }
        );
        console.log('Saved successfully!');
    } catch(e) {
        console.error('ERROR', e);
    } finally {
        process.exit(0);
    }
}
test();
