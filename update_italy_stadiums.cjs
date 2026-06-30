const fs = require('fs');

const updates = [
  { id: 'sanSiroGiuseppeMeazza', capacity: 75923, est: 1926, city: 'Milan', country: 'Italy', loc: 'Milan, Italy' },
  { id: 'allianzStadium', capacity: 41507, est: 2011, city: 'Turin', country: 'Italy', loc: 'Turin, Italy' },
  { id: 'stadioOlimpico', capacity: 70634, est: 1937, city: 'Rome', country: 'Italy', loc: 'Rome, Italy' },
  { id: 'diegoArmandoMaradonaStadium', capacity: 54726, est: 1959, city: 'Naples', country: 'Italy', loc: 'Naples, Italy' },
  { id: 'gewissStadium', capacity: 21300, est: 1928, city: 'Bergamo', country: 'Italy', loc: 'Bergamo, Italy' },
  { id: 'renatoDallAra', capacity: 38279, est: 1927, city: 'Bologna', country: 'Italy', loc: 'Bologna, Italy' },
  { id: 'artemioFranchi', capacity: 43147, est: 1931, city: 'Florence', country: 'Italy', loc: 'Florence, Italy' },
  { id: 'ennioTardini', capacity: 22352, est: 1923, city: 'Parma', country: 'Italy', loc: 'Parma, Italy' },
  { id: 'luigiFerraris', capacity: 36599, est: 1911, city: 'Genoa', country: 'Italy', loc: 'Genoa, Italy' },
  { id: 'stadioViaDelMare', capacity: 31533, est: 1966, city: 'Lecce', country: 'Italy', loc: 'Lecce, Italy' }
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
