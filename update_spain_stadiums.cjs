const fs = require('fs');

const updates = [
  { id: 'santiagoBernabU', capacity: 83168, est: 1947, city: 'Madrid', country: 'Spain', loc: 'Madrid, Spain' },
  { id: 'riyadhAirMetropolitano', capacity: 68456, est: 2017, city: 'Madrid', country: 'Spain', loc: 'Madrid, Spain' },
  { id: 'mestalla', capacity: 49430, est: 1923, city: 'Valencia', country: 'Spain', loc: 'Valencia, Spain' },
  { id: 'sanMamS', capacity: 53289, est: 2013, city: 'Bilbao', country: 'Spain', loc: 'Bilbao, Spain' },
  { id: 'benitoVillamarN', capacity: 60720, est: 1929, city: 'Seville', country: 'Spain', loc: 'Seville, Spain' },
  { id: 'ramNSNchezPizjuN', capacity: 43883, est: 1958, city: 'Seville', country: 'Spain', loc: 'Seville, Spain' },
  { id: 'realeArena', capacity: 39500, est: 1993, city: 'San Sebastián', country: 'Spain', loc: 'San Sebastián, Spain' },
  { id: 'estadioDeLaCerMica', capacity: 23500, est: 1923, city: 'Villarreal', country: 'Spain', loc: 'Villarreal, Spain' },
  { id: 'rcdeStadium', capacity: 40000, est: 2009, city: 'Barcelona (Cornellà-El Prat)', country: 'Spain', loc: 'Barcelona (Cornellà-El Prat), Spain' }
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

// Camp Nou is in venueExtras.ts
const path2 = 'src/data/venueExtras.ts';
let code2 = fs.readFileSync(path2, 'utf8');
const cn = { capacity: 99354, est: 1957, city: 'Barcelona', country: 'Spain', loc: 'Barcelona, Spain' };
const regex2 = new RegExp(`export const campNou: VenueAnalysis = \\{[\\s\\S]*?recentMatches:`, 'g');
code2 = code2.replace(regex2, (match) => {
    return match
      .replace(/city: "[^"]*"/g, `city: "${cn.city}"`)
      .replace(/country: "[^"]*"/g, `country: "${cn.country}"`)
      .replace(/capacity: \d+/g, `capacity: ${cn.capacity}`)
      .replace(/established: \d+/g, `established: ${cn.est}`)
      .replace(/locationText: "[^"]*"/g, `locationText: "${cn.loc}"`);
});
fs.writeFileSync(path2, code2);
console.log('done');
