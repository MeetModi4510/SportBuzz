import axios from 'axios';
import fs from 'fs';

async function findNextActionHash() {
    const matchId = 129480; 
    const url = `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/match`;
    
    try {
        console.log(`Fetching HTML from: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = response.data;
        
        // Next.js server actions usually have IDs that are 32 or 40 character hex strings
        // Or they look like specific strings inside the JS bundles.
        // Let's write the HTML to a file so we can inspect it manually using grep
        fs.writeFileSync('cricbuzz_html_dump.html', html);
        console.log("Dumped HTML to cricbuzz_html_dump.html. Length:", html.length);
        
        // Try to find signs of Next.js server actions
        // In Next.js, actions are sometimes embedded like: $$id:"..." or action={"id":"..."}
        let actionMatches = html.match(/"[a-f0-9]{40}"/g); // looking for git-like hashes
        if (actionMatches) {
            console.log("Found potential action hashes:", [...new Set(actionMatches)]);
        } else {
            console.log("No 40-char hex hashes found.");
        }
        
    } catch (err) {
        console.error("Failed:", err.message);
    }
}

findNextActionHash();
