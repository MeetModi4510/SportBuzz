import { getRecentMatches, getUpcomingMatches } from './espnService.js';

async function test() {
    console.log("Fetching recent matches...");
    const recent = await getRecentMatches();
    console.log(`Recent matches count: ${recent.length}`);
    if (recent.length > 0) {
        console.log(recent[0].homeTeam.name, "vs", recent[0].awayTeam.name);
    }
    
    console.log("\nFetching upcoming matches...");
    const upcoming = await getUpcomingMatches();
    console.log(`Upcoming matches count: ${upcoming.length}`);
    if (upcoming.length > 0) {
        console.log(upcoming[0].homeTeam.name, "vs", upcoming[0].awayTeam.name);
    }
}

test();
