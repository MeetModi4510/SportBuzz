import axios from 'axios';
import * as cheerio from 'cheerio';

async function searchDDG(query) {
    console.log(`Searching DDG for: ${query}`);
    try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await axios.get(ddgUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 15000
        });

        const $ = cheerio.load(res.data);
        const results = [];
        
        $('.result__url').each((i, el) => {
            const url = $(el).text().trim();
            if (url) results.push('https://' + url);
        });
        
        console.log(`Found ${results.length} results:`);
        results.slice(0, 5).forEach(r => console.log(r));
        
        return results;
    } catch (e) {
        console.error("DDG Search Error:", e.message);
        return [];
    }
}

async function testJitDDG() {
    // Example: "Hong Kong, China Women vs Tanzania Women"
    const query = `site:hindustantimes.com/cricket/commentary-live "Hong Kong" "Tanzania" Women`;
    await searchDDG(query);
    
    // Example: "India Under-19 vs Sri Lanka Under-19 2nd Youth Test"
    const query2 = `site:hindustantimes.com/cricket/commentary-live "India Under-19" "Sri Lanka Under-19" 2026`;
    await searchDDG(query2);
}

testJitDDG();
