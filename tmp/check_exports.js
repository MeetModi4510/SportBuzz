const fs = require('fs');

const files = [
    'd:/GATE MEET/SportBuzz/SportBuzz/src/hooks/useCricketMatches.ts',
    'd:/GATE MEET/SportBuzz/SportBuzz/src/services/api.ts'
];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`Checking ${file}:`);
    console.log(`  mapApiMatchToModel export: ${content.includes('export function mapApiMatchToModel') || content.includes('export { mapApiMatchToModel')}`);
    console.log(`  footballApi export: ${content.includes('export const footballApi')}`);
});
