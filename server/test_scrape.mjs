import { fetchPlayerDeepStats } from './services/cricbuzzScraperService.js';
async function test() {
    try {
        const stats = await fetchPlayerDeepStats('1413', 'virat-kohli');
        console.log(JSON.stringify(stats.stats.batting.all, null, 2));
    } catch (e) {
        console.error("Error:", e.message, e.stack);
    }
}
test();
