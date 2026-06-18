import { scrapeFullCommentary } from './services/cricbuzzScraperService.js';

console.log('Testing full commentary extraction for IND vs AFG...');

scrapeFullCommentary('148404', 'ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026')
  .then(res => {
    if (!res) {
        console.log('Result is null');
        return;
    }
    console.log(JSON.stringify(res, null, 2));
  })
  .catch(console.error);
