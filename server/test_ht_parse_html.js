import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function parseHTLiveScores() {
    console.log("=== Parsing HT Live Scores HTML ===");
    
    // We already saved the HTML in ht_live_score.html
    const html = fs.readFileSync('ht_live_score.html', 'utf8');
    const $ = cheerio.load(html);
    
    const matches = [];
    
    // In HT, matches are usually wrapped in some container.
    // Let's look at all links that have commentary-live in them
    $('a[href*="/cricket/commentary-live-"]').each((i, el) => {
        const href = $(el).attr('href');
        // Example href: /cricket/commentary-live-hk-w-vs-tan-w-womens-t20i-quadrangular-series-in-namibia-2026-match-4-hong-kong-china-women-vs-tanzania-women-t20-hkwtnw04242026260787
        
        // Let's try to extract team names if they are nearby, or from the URL slug
        const container = $(el).closest('.matchCard, .matchBox, li, div'); // guess container class
        
        // Let's just collect all these unique URLs first
        if (href && !matches.includes(href)) {
            matches.push(href);
        }
    });
    
    console.log(`Found ${matches.length} commentary links.`);
    matches.slice(0, 10).forEach(m => console.log(m));
    
    // Also, try parsing the DOM for team names
    // HT seems to use <strong class="teamNameLong">
    console.log("\n--- DOM Parsing ---");
    // Wait, the HTML structure might have changed. Let's find common team containers
    const teamContainers = $('.teamNameLong');
    console.log(`Found ${teamContainers.length} team name containers.`);
    if (teamContainers.length > 0) {
        console.log("Sample Teams:");
        teamContainers.slice(0, 4).each((i, el) => {
            console.log($(el).text().trim());
        });
    }
    
    // Let's try to find a broader match container
    // Let's look for any div containing a commentary link
    const matchContainers = $('a[href*="/cricket/commentary-live-"]').parent().parent();
    console.log(`\nMatch Containers found: ${matchContainers.length}`);
}

parseHTLiveScores();
