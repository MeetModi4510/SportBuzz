import axios from 'axios';

async function checkTeams() {
    try {
        const response = await axios.get('http://localhost:5000/api/cricket/matches');
        const matches = response.data.data || [];

        console.log(`Checking ${matches.length} matches...`);

        let foundIssue = false;
        matches.forEach(m => {
            if (m.teams && Array.isArray(m.teams)) {
                if (m.teams[0] && m.teams[0].startsWith('http')) {
                    console.log(`[ISSUE] Match ${m.name} (${m.id}) has URL in teams[0]: ${m.teams[0]}`);
                    foundIssue = true;
                }
                if (m.teams[1] && m.teams[1].startsWith('http')) {
                    console.log(`[ISSUE] Match ${m.name} (${m.id}) has URL in teams[1]: ${m.teams[1]}`);
                    foundIssue = true;
                }
            }

            if (m.teamInfo && Array.isArray(m.teamInfo)) {
                if (m.teamInfo[0] && m.teamInfo[0].name && m.teamInfo[0].name.startsWith('http')) {
                    console.log(`[ISSUE] Match ${m.name} (${m.id}) has URL in teamInfo[0].name: ${m.teamInfo[0].name}`);
                    foundIssue = true;
                }
            }
        });

        if (!foundIssue) {
            console.log("No matches found with URLs in team names.");
            // Print the first match's teams just to be sure
            if (matches.length > 0) {
                console.log("Sample match teams:", matches[0].teams);
                console.log("Sample match teamInfo:", matches[0].teamInfo);
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkTeams();
