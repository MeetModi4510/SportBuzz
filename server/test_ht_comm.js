import axios from 'axios';
import fs from 'fs';

const url = 'https://www.hindustantimes.com/cricket/commentary-live-sl-u19-vs-ind-u19-ind-u19-in-sl-2-youth-tests-2026-2nd-youth-test-sri-lanka-under-19-vs-india-under-19-youth-test-sluinu07202026271827';

async function scrapeHindustanTimes() {
    console.log('Fetching Hindustan Times commentary page...');
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.google.com/'
            },
            timeout: 12000
        });

        const html = res.data;
        console.log(`Status: ${res.status} | Size: ${(html.length / 1024).toFixed(0)}KB`);

        // Save for inspection
        fs.writeFileSync('ht_comm.html', html);
        console.log('Saved to ht_comm.html');

        // Check architecture
        const isNextJs = html.includes('__NEXT_DATA__') || html.includes('_next/static');
        const hasWindowInitState = html.includes('window.__INITIAL_STATE__');
        console.log(`Is Next.js: ${isNextJs}`);
        console.log(`Has window.__INITIAL_STATE__: ${hasWindowInitState}`);
        console.log(`Has commentary text: ${html.includes('commentary')}`);
        console.log(`Has commText: ${html.includes('commText')}`);
        console.log(`Has "over": ${html.includes('over')}`);

        if (isNextJs) {
            // Extract __NEXT_DATA__
            const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
            if (nextDataMatch) {
                console.log('\nFound __NEXT_DATA__! Parsing...');
                const nextData = JSON.parse(nextDataMatch[1]);
                fs.writeFileSync('ht_next_data.json', JSON.stringify(nextData, null, 2));
                console.log('Saved to ht_next_data.json');
                console.log('Top-level keys:', Object.keys(nextData));
                console.log('props keys:', Object.keys(nextData.props || {}));
            }
        }

        // Look for RSC chunks
        const rscMatches = html.match(/self\.__next_f\.push/g);
        if (rscMatches) {
            console.log(`\nFound ${rscMatches.length} RSC chunks (newer Next.js)`);
        }

        // Look for commentary-specific patterns
        const patterns = ['commText', 'commentaryList', 'ballCommentary', 'over_num', 'ball_num', 'run_scored', '"text":', '"description":'];
        for (const p of patterns) {
            const count = (html.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            if (count > 0) console.log(`Found "${p}": ${count} times`);
        }

    } catch(e) {
        console.error(`FAILED: ${e.response?.status || e.message}`);
        if (e.response?.data) {
            console.log('Response preview:', String(e.response.data).substring(0, 200));
        }
    }
}

scrapeHindustanTimes();
