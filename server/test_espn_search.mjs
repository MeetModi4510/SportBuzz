import { scrapeESPNVenue } from './services/espnStatsguruScraper.js';

// Narendra Modi Stadium (Ahmedabad) = ESPN ground ID 263
// Verified manually: https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=263;template=results;type=batting
const stats = await scrapeESPNVenue(263, 'Test', 'Narendra Modi Stadium');
console.log("Matches:", stats.matchesHosted, "Avg 1st:", stats.avgFirstInningsScore);
