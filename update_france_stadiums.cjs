const fs = require('fs');

const updates = [
  { id: 'parcDesPrinces', capacity: 47929, est: 1897, city: 'Paris', country: 'France', loc: 'Paris, France' },
  { id: 'orangeVLodrome', capacity: 67394, est: 1937, city: 'Marseille', country: 'France', loc: 'Marseille, France' },
  { id: 'groupamaStadium', capacity: 59186, est: 2016, city: 'Lyon', country: 'France', loc: 'Lyon, France' },
  { id: 'stadePierreMauroy', capacity: 50186, est: 2012, city: 'Lille', country: 'France', loc: 'Lille, France' },
  { id: 'stadeLouisIi', capacity: 16360, est: 1939, city: 'Monaco', country: 'Monaco', loc: 'Monaco' },
  { id: 'allianzRiviera', capacity: 36178, est: 2013, city: 'Nice', country: 'France', loc: 'Nice, France' },
  { id: 'stadeBollaertDelelis', capacity: 38223, est: 1933, city: 'Lens', country: 'France', loc: 'Lens, France' },
  { id: 'stadeDeLaMeinau', capacity: 32300, est: 1914, city: 'Strasbourg', country: 'France', loc: 'Strasbourg, France' }
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
