import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
dotenv.config({path:'.env'});

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const FotmobCache = (await import('./models/FotmobCache.js')).default;
        
        const url = `https://www.fotmob.com/leagues/77/stats/world-cup/players`;
        console.log(`[FotMob Scraper] Fetching ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const $ = cheerio.load(response.data);
        const nextData = $('#__NEXT_DATA__').html();
        
        const json = JSON.parse(nextData);
        const playersStats = json.props?.pageProps?.stats?.players;
        const teamsStats = json.props?.pageProps?.stats?.teams;
        
        console.log('Found players?', !!playersStats);
        console.log('Found teams?', !!teamsStats, teamsStats ? teamsStats.length : 0);
        
        const teamResults = [];
        if (teamsStats && Array.isArray(teamsStats)) {
            for (const statGroup of teamsStats.slice(0, 2)) {
                if (statGroup.fetchAllUrl) {
                    try {
                        const fetchUrl = statGroup.fetchAllUrl.startsWith('http') ? statGroup.fetchAllUrl : `https://data.fotmob.com${statGroup.fetchAllUrl}`;
                        const statRes = await axios.get(fetchUrl, {
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });
                        teamResults.push({
                            header: statGroup.header,
                            data: statRes.data?.TopLists?.[0]?.StatList || []
                        });
                        console.log('Fetched:', statGroup.header, statRes.data?.TopLists?.[0]?.StatList?.length);
                    } catch (e) {
                        console.warn('Failed:', statGroup.header, e.message);
                    }
                }
            }
        }
        
        console.log('Success test');
    } catch(e) {
        console.error('ERROR', e.message);
    } finally {
        process.exit(0);
    }
}
test();
