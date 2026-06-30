const fs = require('fs');

const updates = [
  { id: 'anfield', capacity: 54074, est: 1884, city: 'Liverpool', country: 'England', loc: 'Liverpool, England' },
  { id: 'oldTrafford', capacity: 74140, est: 1910, city: 'Manchester', country: 'England', loc: 'Manchester, England' },
  { id: 'emiratesStadium', capacity: 60704, est: 2006, city: 'London', country: 'England', loc: 'London, England' },
  { id: 'stamfordBridge', capacity: 40341, est: 1877, city: 'London', country: 'England', loc: 'London, England' },
  { id: 'tottenhamHotspurStadium', capacity: 62850, est: 2019, city: 'London', country: 'England', loc: 'London, England' },
  { id: 'villaPark', capacity: 42785, est: 1897, city: 'Birmingham', country: 'England', loc: 'Birmingham, England' },
  { id: 'stJamesPark', capacity: 52305, est: 1892, city: 'Newcastle', country: 'England', loc: 'Newcastle, England' },
  { id: 'goodisonPark', capacity: 39414, est: 1892, city: 'Liverpool', country: 'England', loc: 'Liverpool, England' },
  { id: 'molineuxStadium', capacity: 32050, est: 1889, city: 'Wolverhampton', country: 'England', loc: 'Wolverhampton, England' },
  { id: 'ellandRoad', capacity: 37792, est: 1897, city: 'Leeds', country: 'England', loc: 'Leeds, England' },
  { id: 'cityGround', capacity: 30445, est: 1898, city: 'Nottingham', country: 'England', loc: 'Nottingham, England' }
];

const path = 'src/data/footballVenues.ts';
let code = fs.readFileSync(path, 'utf8');

updates.forEach(u => {
  const regex = new RegExp(`export const ${u.id}: VenueAnalysis = \\{[\\s\\S]*?recentMatches:`, 'g');
  code = code.replace(regex, (match) => {
    return match
      .replace(/city: "[^"]*"/g, `city: "${u.city}"`)
      .replace(/country: "[^"]*"/g, `country: "${u.country}"`)
      .replace(/capacity: \d+/g, `capacity: ${u.capacity}`)
      .replace(/established: \d+/g, `established: ${u.est}`)
      .replace(/locationText: "[^"]*"/g, `locationText: "${u.loc}"`);
  });
});

fs.writeFileSync(path, code);

// Etihad is in venueExtras.ts
const path2 = 'src/data/venueExtras.ts';
let code2 = fs.readFileSync(path2, 'utf8');
const et = { capacity: 53400, est: 2003, city: 'Manchester', country: 'England', loc: 'Manchester, England' };
const regex2 = new RegExp(`export const etihad: VenueAnalysis = \\{[\\s\\S]*?recentMatches:`, 'g');
code2 = code2.replace(regex2, (match) => {
    return match
      .replace(/city: "[^"]*"/g, `city: "${et.city}"`)
      .replace(/country: "[^"]*"/g, `country: "${et.country}"`)
      .replace(/capacity: \d+/g, `capacity: ${et.capacity}`)
      .replace(/established: \d+/g, `established: ${et.est}`)
      .replace(/locationText: "[^"]*"/g, `locationText: "${et.loc}"`);
});
fs.writeFileSync(path2, code2);
console.log('done');
