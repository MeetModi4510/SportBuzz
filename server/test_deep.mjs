import { fetchPlayerDeepStats } from './services/cricbuzzScraperService.js';

async function test() {
    console.log("Fetching...");
    const data = await fetchPlayerDeepStats(11808, "Shubman Gill");
    console.log("Profile Info:");
    console.log(data.profileInfo);
}
test();
