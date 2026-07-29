import fs from 'fs';
const html = fs.readFileSync('ht_comm.html', 'utf8');

// Find all API-like URLs embedded in the HTML
const urlMatches = html.match(/https?:\/\/[^"'\s<>]{10,}/g) || [];
const unique = [...new Set(urlMatches)];

// Filter for cricket/commentary/sports related
const relevant = unique.filter(u => 
    u.includes('cricket') || 
    u.includes('commentary') ||
    u.includes('sport') ||
    u.includes('api') ||
    u.includes('match') ||
    u.includes('score')
);

console.log(`Found ${relevant.length} relevant URLs:\n`);
relevant.slice(0, 30).forEach(u => console.log(u));

// Also look for the vendor API they might be using
// HT typically uses HT Sports API or vendor like CricketAPI
const vendors = html.match(/(?:cricketapi|sportsdataapi|cricapi|ndtvsports|sportskeeda|cricbuzz)\.[^\s"'<>]*/gi) || [];
console.log('\nVendor mentions:', [...new Set(vendors)]);
