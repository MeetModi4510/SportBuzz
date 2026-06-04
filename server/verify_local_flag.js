import axios from 'axios';

const verifyLocalFlag = async () => {
    console.log("=== VERIFYING LOCAL FLAG SERVING ===\n");
    try {
        // 1. Check if flag file exists and is served
        try {
            const flagRes = await axios.head('http://localhost:5000/flags/wi.png');
            console.log(`✅ Local flag accessible: ${flagRes.status} ${flagRes.statusText}`);
            console.log(`   Type: ${flagRes.headers['content-type']}`);
            console.log(`   Length: ${flagRes.headers['content-length']}`);
        } catch (err) {
            console.error(`❌ Failed to access local flag: ${err.message}`);
        }

        // 2. Check API response uses local URL
        const response = await axios.get('http://localhost:5000/api/featured/matches');
        const t20 = response.data?.data?.cricket?.t20;

        if (t20.completedMatch) {
            console.log("\n=== COMPLETED MATCH DATA ===");
            console.log("Match:", t20.completedMatch.name);
            const team1Flag = t20.completedMatch.team1Flag;
            const team2Flag = t20.completedMatch.team2Flag;

            console.log("Team1 Flag:", team1Flag);
            if (team1Flag?.includes('localhost') && team1Flag?.includes('wi.png')) {
                console.log("✅ West Indies using LOCAL URL");
            } else if (team2Flag?.includes('localhost') && team2Flag?.includes('wi.png')) {
                console.log("✅ West Indies using LOCAL URL (as Team 2)");
            } else {
                console.log("❌ West Indies NOT using local URL");
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
};

verifyLocalFlag();
