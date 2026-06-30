const fs = require('fs');

const updates = [
  // Italy
  { id: 'sanSiroGiuseppeMeazza', capacity: 75923, est: 1926, city: 'Milan', country: 'Italy', loc: 'Milan, Italy' },
  { id: 'allianzStadium', capacity: 41507, est: 2011, city: 'Turin', country: 'Italy', loc: 'Turin, Italy' },
  { id: 'stadioOlimpico', capacity: 70634, est: 1937, city: 'Rome', country: 'Italy', loc: 'Rome, Italy' },
  { id: 'diegoArmandoMaradonaStadium', capacity: 54726, est: 1959, city: 'Naples', country: 'Italy', loc: 'Naples, Italy' },
  { id: 'gewissStadium', capacity: 21300, est: 1928, city: 'Bergamo', country: 'Italy', loc: 'Bergamo, Italy' },
  { id: 'renatoDallAra', capacity: 38279, est: 1927, city: 'Bologna', country: 'Italy', loc: 'Bologna, Italy' },
  { id: 'artemioFranchi', capacity: 43147, est: 1931, city: 'Florence', country: 'Italy', loc: 'Florence, Italy' },
  { id: 'ennioTardini', capacity: 22352, est: 1923, city: 'Parma', country: 'Italy', loc: 'Parma, Italy' },
  { id: 'luigiFerraris', capacity: 36599, est: 1911, city: 'Genoa', country: 'Italy', loc: 'Genoa, Italy' },
  { id: 'stadioViaDelMare', capacity: 31533, est: 1966, city: 'Lecce', country: 'Italy', loc: 'Lecce, Italy' },
  
  // Germany
  { id: 'signalIdunaPark', capacity: 81365, est: 1974, city: 'Dortmund', country: 'Germany', loc: 'Dortmund, Germany' },
  { id: 'allianzArena', capacity: 75024, est: 2005, city: 'Munich', country: 'Germany', loc: 'Munich, Germany' },
  { id: 'redBullArena', capacity: 47069, est: 2004, city: 'Leipzig', country: 'Germany', loc: 'Leipzig, Germany' },
  { id: 'bayarena', capacity: 30210, est: 1958, city: 'Leverkusen', country: 'Germany', loc: 'Leverkusen, Germany' },
  { id: 'borussiaPark', capacity: 54057, est: 2004, city: 'Mönchengladbach', country: 'Germany', loc: 'Mönchengladbach, Germany' },
  { id: 'deutscheBankPark', capacity: 51500, est: 1925, city: 'Frankfurt', country: 'Germany', loc: 'Frankfurt, Germany' },
  { id: 'mhparena', capacity: 60441, est: 1933, city: 'Stuttgart', country: 'Germany', loc: 'Stuttgart, Germany' },
  { id: 'volkswagenArena', capacity: 30000, est: 2002, city: 'Wolfsburg', country: 'Germany', loc: 'Wolfsburg, Germany' },
  { id: 'weserstadion', capacity: 42100, est: 1926, city: 'Bremen', country: 'Germany', loc: 'Bremen, Germany' },
  { id: 'millerntorStadion', capacity: 29546, est: 1963, city: 'Hamburg', country: 'Germany', loc: 'Hamburg, Germany' },

  // France
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
      .replace(/capacity: \d+/g, `capacity: ${u.capacity}`)
      .replace(/established: \d+/g, `established: ${u.est}`)
      .replace(/locationText: "[^"]*"/g, `locationText: "${u.loc}"`);
  });
});

fs.writeFileSync(path, code);
console.log('done');
