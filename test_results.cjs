const axios = require('axios');

async function scrapeTeamResults(teamName, teamId) {
    try {
        const url = `https://www.cricbuzz.com/cricket-team/${teamName}/${teamId}/results`;
        const res = await axios.get(url);
        
        const nextDataMatch = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (nextDataMatch) {
            const data = JSON.parse(nextDataMatch[1]);
            
            // Navigate the Next.js props structure. This is typical for Cricbuzz.
            const matches = data.props.pageProps.initialState.team.results.matchList;
            
            if (matches && matches.length > 0) {
                console.log(`Last 3 matches for ${teamName.toUpperCase()}:`);
                const lastThree = matches.slice(0, 3);
                lastThree.forEach((match, idx) => {
                    const status = match.status; // "India won by ..."
                    const mDesc = match.matchDesc; // "3rd ODI"
                    console.log(`${idx + 1}. [${mDesc}] ${status}`);
                });
            } else {
                console.log("No matches found.");
            }
        }
    } catch (e) {
        console.log("Failed to parse", e.message);
    }
}

scrapeTeamResults('india', '2');
