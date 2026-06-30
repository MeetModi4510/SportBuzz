import { scrapeBDFutbolVenue } from './services/bdfutbolScraperService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sportbuzz").then(async () => {
    try {
        const data = await scrapeBDFutbolVenue('2013');
        console.log("SUCCESS");
    } catch(e) {
        console.error("ERROR:", e);
    }
    mongoose.disconnect();
});
