const fs = require('fs');

let extras = fs.readFileSync('src/data/venueExtras.ts', 'utf8');
let analysis = fs.readFileSync('src/data/venueAnalysisData.ts', 'utf8');

// If etihad is in analysis, move it
const etihadMatch = analysis.match(/const etihad: VenueAnalysis = \{[\s\S]*?\} as BDFutbolVenueStats,[\s\S]*?\n\};/);
if (etihadMatch) {
    let etihadCode = etihadMatch[0].replace('const etihad: VenueAnalysis', 'export const etihad: VenueAnalysis');
    extras += '\n' + etihadCode + '\n';
    fs.writeFileSync('src/data/venueExtras.ts', extras);
    
    analysis = analysis.replace(etihadMatch[0], '');
    fs.writeFileSync('src/data/venueAnalysisData.ts', analysis);
    console.log('Moved etihad');
} else {
    console.log('etihad not found');
}
