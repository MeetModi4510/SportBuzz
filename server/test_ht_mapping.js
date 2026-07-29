import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function testHTLiveScores() {
    console.log("Fetching HT live scores page...");
    try {
        const res = await axios.get('https://www.hindustantimes.com/cricket/live-score', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000
        });
        
        const html = res.data;
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        
        if (nextDataMatch) {
            const nextData = JSON.parse(nextDataMatch[1]);
            const liveData = nextData.props?.pageProps?.liveData || [];
            const upcomingData = nextData.props?.pageProps?.upcomingMatchData || [];
            const recentData = nextData.props?.pageProps?.keyUpcomingData || []; // Or similar
            
            console.log(`Found ${liveData.length} live matches, ${upcomingData.length} upcoming matches on HT.`);
            
            if (liveData.length > 0) {
                console.log("\nSample Live Match from HT:");
                const m = liveData[0];
                console.log(`Teams: ${m.teama_eng} vs ${m.teamb_eng}`);
                console.log(`HT matchId (slug): ${m.matchId}`);
                console.log(`Small matchId (for CDN): ${m.smallMatchId || 'Not found, let us check keys'}`);
                console.log('Keys:', Object.keys(m).join(', '));
                
                // Usually the smallMatchId is the last part of the matchId slug
                const smallIdMatch = m.matchId?.match(/\d+$/);
                const derivedSmallId = smallIdMatch ? smallIdMatch[0] : null;
                console.log(`Derived small ID: ${derivedSmallId}`);
            }
        } else {
            console.log("No __NEXT_DATA__ found.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testHTLiveScores();
