const scraper = require('./services/cricbuzzScraperService.js');
async function test() {
    try {
        const stats = await scraper.scrapePlayerProfile('1413', 'virat-kohli');
        console.log(stats.stats.batting.all);
    } catch (e) {
        console.error("Error:", e.message, e.stack);
    }
}
test();
