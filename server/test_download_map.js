import fs from 'fs';
import axios from 'axios';

async function downloadSourceMaps() {
    try {
        const html = fs.readFileSync('cricbuzz_html_dump.html', 'utf8');
        
        // Find JS chunks
        const jsMatches = html.match(/\/_next\/static\/chunks\/[^"']+\.js/g);
        if (!jsMatches) return;
        const uniqueJs = [...new Set(jsMatches)];
        
        let foundAny = false;
        for (let i = 0; i < uniqueJs.length; i++) {
            const jsUrl = `https://www.cricbuzz.com${uniqueJs[i]}`;
            const mapUrl = `${jsUrl}.map`;
            
            try {
                const res = await axios.get(mapUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000
                });
                
                if (res.status === 200 && res.data && res.data.sources) {
                    console.log(`\nFound Source Map: ${uniqueJs[i]}`);
                    foundAny = true;
                    
                    const sources = res.data.sources;
                    const sourcesContent = res.data.sourcesContent;
                    
                    if (!sourcesContent) {
                        console.log("No source content included.");
                        continue;
                    }
                    
                    for (let j = 0; j < sources.length; j++) {
                        const path = sources[j];
                        const content = sourcesContent[j];
                        
                        if (content && (content.toLowerCase().includes('load more') || content.includes('commentaryList'))) {
                            console.log(`- Interesting file found: ${path}`);
                        }
                    }
                }
            } catch (err) {
                // Ignore 404s
            }
        }
        if (!foundAny) console.log("No useful source maps found.");
        console.log("Done checking all maps.");
    } catch (e) {
        console.error(e);
    }
}

downloadSourceMaps();
