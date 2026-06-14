import axios from 'axios';
import fs from 'fs';

async function deepResearchESPN() {
    try {
        console.log("Fetching EPL scoreboard to find a recent match...");
        // Use a date that definitely had matches to guarantee data
        const sbRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20240519');
        const events = sbRes.data.events || [];
        
        if (events.length === 0) {
            console.log("No events found. Trying default scoreboard...");
            const defaultRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
            if (defaultRes.data.events && defaultRes.data.events.length > 0) {
                events.push(...defaultRes.data.events);
            } else {
                 return;
            }
        }
        
        const matchId = events[0].id;
        console.log(`\nFetching Deep Summary for Match ID: ${matchId}`);
        
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${matchId}`;
        const sumRes = await axios.get(summaryUrl);
        const data = sumRes.data;
        
        console.log("\n=== SUMMARY DATA SHAPE ===");
        
        // 1. Match Summary (Header)
        console.log("\n--- 1. MATCH SUMMARY ---");
        console.log("Available:", !!data.header);
        if (data.header) {
            console.log("Home Team:", data.header.competitions[0].competitors.find(c => c.homeAway === 'home').team.name);
            console.log("Away Team:", data.header.competitions[0].competitors.find(c => c.homeAway === 'away').team.name);
            console.log("Score Home:", data.header.competitions[0].competitors.find(c => c.homeAway === 'home').score);
            console.log("Score Away:", data.header.competitions[0].competitors.find(c => c.homeAway === 'away').score);
            console.log("Status:", data.header.competitions[0].status.type.detail);
        }
        
        // 2. Key Events
        console.log("\n--- 2. KEY EVENTS ---");
        console.log("Available:", !!data.keyEvents);
        if (data.keyEvents && data.keyEvents.length > 0) {
            console.log(`Total Events: ${data.keyEvents.length}`);
            console.log("Sample Event:", JSON.stringify(data.keyEvents[0], null, 2));
        }
        
        // 3. Stats
        console.log("\n--- 3. TEAM STATS ---");
        console.log("Available:", !!data.boxscore?.teams);
        if (data.boxscore?.teams && data.boxscore.teams.length > 0) {
            const stats = data.boxscore.teams[0].statistics;
            console.log(`Available Stats Count: ${stats?.length}`);
            console.log("Sample Stats:", stats?.slice(0, 3).map(s => `${s.name}: ${s.displayValue}`));
        }
        
        // 4. Lineups & Player Photos
        console.log("\n--- 4. LINEUPS & PHOTOS ---");
        console.log("Available:", !!data.rosters);
        if (data.rosters && data.rosters.length > 0) {
            const homeRoster = data.rosters[0].roster;
            console.log(`Total Players on Home Roster: ${homeRoster?.length}`);
            
            const samplePlayer = homeRoster[0];
            console.log("\nSample Player Object:");
            console.log(JSON.stringify(samplePlayer.athlete, null, 2));
            
            console.log("\nSubstitute details:");
            console.log("Starter:", samplePlayer.starter);
            console.log("Position:", samplePlayer.position?.name);
            console.log("Jersey:", samplePlayer.jersey);
            
            if (samplePlayer.athlete?.id) {
                const photoUrl = `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${samplePlayer.athlete.id}.png`;
                console.log(`\nConstructed Photo URL: ${photoUrl}`);
            }
        }
        
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}

deepResearchESPN();
