import { scrapeESPNVenue } from './services/espnStatsguruScraper.js';

(async () => {
    console.log("Scraping Eden Gardens (292) for ODI...");
    const stats = await scrapeESPNVenue(292, 'ODI', 'Eden Gardens');
    console.log("Result Core Stats:");
    console.log({
        matchesHosted: stats.matchesHosted,
        avgFirst: stats.avgFirstInningsScore,
        avgSecond: stats.avgSecondInningsScore,
        avgRunRate: stats.avgRunRate,
        battingLeaders: stats.battingLeaders.length,
        bowlingLeaders: stats.bowlingLeaders.length,
        highestTotal: stats.highestTotal,
        lowestTotal: stats.lowestTotal,
    });
})();
