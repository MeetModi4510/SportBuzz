import { scrapeESPNVenue } from './services/espnStatsguruScraper.js';

(async () => {
    console.log("Scraping Eden Gardens (292) for All...");
    const stats = await scrapeESPNVenue(292, 'All', 'Eden Gardens');
    console.log(stats);
})();
