import fs from 'fs';
const html = fs.readFileSync('ht_live_score.html', 'utf8');

// Find all matches based on <a href=
const links = html.match(/href="([^"]+)"/g) || [];
const uniqueLinks = [...new Set(links)];

console.log("All unique links containing 'cricket':");
uniqueLinks.filter(l => l.includes('cricket') && (l.includes('-vs-') || l.includes('match') || l.includes('score'))).slice(0, 20).forEach(l => console.log(l));

// Are there any JSON embedded configs?
const scripts = html.match(/<script.*?>(.*?)<\/script>/g) || [];
console.log(`\nFound ${scripts.length} script tags.`);
for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].includes('match') || scripts[i].includes('commentary')) {
        console.log(`Script ${i} length: ${scripts[i].length}. Snippet: ${scripts[i].substring(0, 100)}...`);
    }
}
