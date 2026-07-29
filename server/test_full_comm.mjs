import { scrapeFullCommentary } from './services/cricbuzzScraperService.js';

async function test() {
    try {
        const matchId = '114175'; // example completed match ID
        const result = await scrapeFullCommentary(matchId, null, true);
        console.log(JSON.stringify(result, null, 2).substring(0, 500));
        console.log("...");
        console.log("Commentary length:", result?.commentary?.length);
    } catch (e) {
        console.error(e);
    }
}

test();
