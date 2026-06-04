import axios from 'axios';

const LOCAL_URL = 'http://localhost:5000/api/stateMatches';

const testStateMatches = async () => {
    console.log("Testing /api/stateMatches endpoint...\n");
    try {
        const response = await axios.get(LOCAL_URL);
        const data = response.data;

        if (data.success) {
            console.log("✅ Endpoint returned success!\n");
            console.log(`Total State Matches Found: ${data.data.totalStateMatches}`);
            console.log(`Has Live Match: ${data.data.hasLiveMatch}\n`);

            if (data.data.liveMatch) {
                console.log("=== LIVE/FALLBACK MATCH ===");
                console.log(`  Name: ${data.data.liveMatch.name}`);
                console.log(`  Status: ${data.data.liveMatch.status}`);
                console.log(`  Teams:`);
                data.data.liveMatch.teams.forEach(t => {
                    console.log(`    - ${t.name} (flag: ${t.flag})`);
                });
                console.log(`  Score: ${data.data.liveMatch.score}`);
                console.log(`  Venue: ${data.data.liveMatch.venue}`);
            } else {
                console.log("No live/fallback match found.");
            }

            console.log("");

            if (data.data.completedMatch) {
                console.log("=== COMPLETED MATCH ===");
                console.log(`  Name: ${data.data.completedMatch.name}`);
                console.log(`  Status: ${data.data.completedMatch.status}`);
                console.log(`  Teams:`);
                data.data.completedMatch.teams.forEach(t => {
                    console.log(`    - ${t.name} (flag: ${t.flag})`);
                });
                console.log(`  Score: ${data.data.completedMatch.score}`);
                console.log(`  Venue: ${data.data.completedMatch.venue}`);
            } else {
                console.log("No completed match found.");
            }
        } else {
            console.error("❌ Endpoint returned failure:", data);
        }

    } catch (error) {
        console.error("❌ Error calling endpoint:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("   Is the server running on port 5000?");
        }
    }
};

testStateMatches();
