import axios from 'axios';
import * as cheerio from 'cheerio';

async function testJitSearch() {
    console.log("=== Testing JIT HT Match Search ===");
    
    // Simulate frontend inputs
    const teamA = "India Under-19";
    const teamB = "Sri Lanka Under-19";
    
    console.log(`Searching for: ${teamA} vs ${teamB}`);
    
    try {
        // Strategy 1: Check HT Cricket Homepage
        console.log("\n--- Strategy 1: Fetching HT Cricket Homepage ---");
        const res = await axios.get('https://www.hindustantimes.com/cricket', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const html = res.data;
        const matchIds = [];
        
        // Look for links that match commentary
        const $ = cheerio.load(html);
        $('a[href*="/cricket/commentary-live-"]').each((i, el) => {
            const href = $(el).attr('href');
            matchIds.push(href);
        });
        
        console.log(`Found ${matchIds.length} commentary links on homepage.`);
        if (matchIds.length > 0) {
            console.log("Sample links:");
            matchIds.slice(0, 3).forEach(l => console.log(l));
        }
        
        // Find if our teams are mentioned
        if (html.toLowerCase().includes('india') && html.toLowerCase().includes('lanka')) {
            console.log(`Found mention of teams in homepage!`);
            // Can we extract the match id?
            const slugRegex = new RegExp(`href="(/cricket/commentary-live-[^"]*india[^"]*lanka[^"]*)"`, 'i');
            const match = html.match(slugRegex);
            if (match) {
                console.log(`Found exact match link: ${match[1]}`);
            } else {
                console.log(`Could not extract exact link using regex.`);
            }
        }
        
        // Strategy 2: Check HT API for schedule or matches
        // HT seems to use something like:
        // https://www.hindustantimes.com/ht-cricket/schedule
        console.log("\n--- Strategy 2: Checking Schedule Page ---");
        const schedRes = await axios.get('https://www.hindustantimes.com/cricket/schedule', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const schedHtml = schedRes.data;
        console.log(`Schedule page size: ${schedHtml.length}`);
        
        const sched$ = cheerio.load(schedHtml);
        let foundSched = false;
        sched$('a[href*="/cricket/commentary-live-"]').each((i, el) => {
            const href = sched$(el).attr('href');
            if (href.toLowerCase().includes('india') && href.toLowerCase().includes('lanka')) {
                console.log(`Found match in schedule: ${href}`);
                foundSched = true;
            }
        });
        if (!foundSched) console.log("Not found in schedule links.");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testJitSearch();
