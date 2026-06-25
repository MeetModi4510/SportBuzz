const fs = require('fs');
const html = fs.readFileSync('matches.html', 'utf8');

const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
if (scriptMatches) {
    scriptMatches.forEach(script => {
        if (script.includes('window.__INITIAL_STATE__') || script.includes('matches')) {
            console.log("Found script of length:", script.length);
            if (script.includes('matches')) {
                console.log(script.substring(0, 200));
            }
        }
    });
}
