import axios from 'axios';

async function verify() {
    try {
        const res = await axios.get('http://localhost:5001/api/players/Virat%20Kohli/stats');
        const fullRes = res.data;
        console.log("Full Response Structure:", Object.keys(fullRes));
        
        if (fullRes.success && fullRes.data) {
            const data = fullRes.data;
            console.log("Player:", data.playerName);
            console.log("Global recentPerformances length:", data.recentPerformances?.length || 0);
            
            const allStats = data.formats.All;
            if (allStats) {
                console.log("Matches Played:", allStats.matchesPlayed);
                console.log("Form:", JSON.stringify(allStats.form));
                console.log("Strike Rate:", allStats.batting.strikeRate);
                
                if (data.recentPerformances?.length > 0 && allStats.form?.length > 0) {
                    console.log("VERIFICATION SUCCESSFUL");
                } else {
                    console.log("VERIFICATION: Data present but might be empty if no past matches found.");
                }
            } else {
                console.log("VERIFICATION FAILED: 'All' format missing");
            }
        } else {
            console.log("VERIFICATION FAILED: success=false or data missing");
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

verify();
