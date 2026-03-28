import axios from 'axios';

async function checkFeaturedMatches() {
    try {
        console.log("Fetching featured matches...");
        const response = await axios.get('http://localhost:5000/api/featured/matches');
        // console.log(JSON.stringify(response.data, null, 2)); // Original line, replaced by structured logging

        // Helper function to log match details
        const logMatch = (type, match) => {
            console.log(`  ${type} Match:`);
            console.log(`    ID: ${match.id}`);
            console.log(`    Name: ${match.name}`);
            console.log(`    Status: ${match.status}`);
            if (match.matchScore) {
                console.log(`    Score: ${match.matchScore.fullScore}`);
            }
            if (match.matchHeader) {
                console.log(`    Header: ${match.matchHeader.matchDescription}`);
            }
            // Add more details as needed
        };

        // Check all formats
        const { t20, odi, test } = response.data.data.cricket;

        const logFormat = (name, data) => {
            console.log(`\n=== ${name} MATCHES DATA ===`);
            if (data.liveMatch) logMatch("Live/Fallback", data.liveMatch);
            if (data.completedMatch) logMatch("Completed", data.completedMatch);
            if (data.upcomingMatch) logMatch("Upcoming", data.upcomingMatch);
        };

        logFormat("TEST", test);
        logFormat("ODI", odi);
        logFormat("T20", t20);

    } catch (error) {
        console.error("Error fetching matches:", error.message);
    }
}

checkFeaturedMatches();
