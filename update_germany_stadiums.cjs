const fs = require('fs');

const updates = [
  { id: 'signalIdunaPark', capacity: 81365, est: 1974, city: 'Dortmund', country: 'Germany', loc: 'Dortmund, Germany' },
  { id: 'allianzArena', capacity: 75024, est: 2005, city: 'Munich', country: 'Germany', loc: 'Munich, Germany' },
  { id: 'redBullArena', capacity: 47069, est: 2004, city: 'Leipzig', country: 'Germany', loc: 'Leipzig, Germany' },
  { id: 'bayarena', capacity: 30210, est: 1958, city: 'Leverkusen', country: 'Germany', loc: 'Leverkusen, Germany' },
  { id: 'borussiaPark', capacity: 54057, est: 2004, city: 'Mönchengladbach', country: 'Germany', loc: 'Mönchengladbach, Germany' },
  { id: 'deutscheBankPark', capacity: 51500, est: 1925, city: 'Frankfurt', country: 'Germany', loc: 'Frankfurt, Germany' },
  { id: 'mhparena', capacity: 60441, est: 1933, city: 'Stuttgart', country: 'Germany', loc: 'Stuttgart, Germany' },
  { id: 'volkswagenArena', capacity: 30000, est: 2002, city: 'Wolfsburg', country: 'Germany', loc: 'Wolfsburg, Germany' },
  { id: 'weserstadion', capacity: 42100, est: 1926, city: 'Bremen', country: 'Germany', loc: 'Bremen, Germany' },
  { id: 'millerntorStadion', capacity: 29546, est: 1963, city: 'Hamburg', country: 'Germany', loc: 'Hamburg, Germany' }
];

const path = 'src/data/footballVenues.ts';
let code = fs.readFileSync(path, 'utf8');

updates.forEach(u => {
  const regex = new RegExp(`export const ${u.id}: VenueAnalysis = \\{[\\s\\S]*?recentMatches:`, 'g');
  code = code.replace(regex, (match) => {
    return match
      .replace(/city: "[^"]*"/g, `city: "${u.city}"`)
      .replace(/country: "[^"]*"/g, `country: "${u.country}"`)
      .replace(/capacity: \\d+/g, `capacity: ${u.capacity}`)
      .replace(/established: \\d+/g, `established: ${u.est}`)
      .replace(/locationText: "[^"]*"/g, `locationText: "${u.loc}"`);
  });
});

fs.writeFileSync(path, code);
console.log('done');
