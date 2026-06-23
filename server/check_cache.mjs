import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path:'.env'});

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const FotmobCache = (await import('./models/FotmobCache.js')).default;
        const cache = await FotmobCache.findOne({ endpoint: '/fotmob-stats/77' });
        
        if (!cache) {
            console.log('Cache is null');
        } else {
            console.log('Is array?', Array.isArray(cache.data));
            if (!Array.isArray(cache.data)) {
                console.log('Keys:', Object.keys(cache.data));
            }
        }
    } catch(e) {
        console.error('ERROR', e.message);
    } finally {
        process.exit(0);
    }
}
test();
