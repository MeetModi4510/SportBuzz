const fs = require('fs');
const html = fs.readFileSync('temp_puppeteer.html', 'utf8');
const matches = [...html.matchAll(/<option[^>]*value=\"(\d+)\"[^>]*>([^<]+)<\/option>/g)];
const teams = matches.map(m => m[1] + ' : ' + m[2]).filter(m => 
    m.includes('Chennai') || m.includes('Mumbai') || m.includes('Royal Challengers') || 
    m.includes('Kolkata') || m.includes('Sunrisers') || m.includes('Delhi') || 
    m.includes('Rajasthan') || m.includes('Punjab') || m.includes('Gujarat') || 
    m.includes('Lucknow') || m.includes('Deccan') || m.includes('Pune') || m.includes('Kochi')
);
console.log(teams.join('\n'));
