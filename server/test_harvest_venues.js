import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function harvestVenues() {
    const host = 'cricbuzz-cricket.p.rapidapi.com'; // or cricbuzz-cricket2
    // Use the main rapidapi key
    const key = process.env.CRICBUZZ_RAPIDAPI_KEY || process.env.CRICBUZZ_IMAGE_RAPIDAPI_KEY;
    
    const endpoints = ['recent', 'live', 'upcoming'];
    const venuesMap = new Map();
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Fetching ${endpoint} matches...`);
            const url = `https://${host}/matches/v1/${endpoint}`;
            const res = await axios.get(url, {
                headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host }
            });
            
            if (res.data?.typeMatches) {
                res.data.typeMatches.forEach(tm => {
                    tm.seriesMatches?.forEach(sm => {
                        sm.seriesAdWrapper?.matches?.forEach(m => {
                            if (m.matchInfo && m.matchInfo.venueInfo) {
                                const v = m.matchInfo.venueInfo;
                                if (v.id) {
                                    venuesMap.set(v.id, {
                                        id: v.id,
                                        ground: v.ground,
                                        city: v.city,
                                        timezone: v.timezone,
                                        country: tm.matchType // Just a guess, not actual country
                                    });
                                }
                            }
                        });
                    });
                });
            }
        } catch(e) {
            console.log(`Failed ${endpoint}:`, e.message);
        }
    }
    
    const venues = Array.from(venuesMap.values());
    console.log(`Harvested ${venues.length} unique venues!`);
    fs.writeFileSync('harvested_venues.json', JSON.stringify(venues, null, 2));
    console.log(venues.slice(0, 10)); // print first 10
}
harvestVenues();
