const axios = require('axios');

async function getH2H(teamName, teamId, opponentName) {
    try {
        const url = `https://www.cricbuzz.com/cricket-team/${teamName}/${teamId}/results`;
        const res = await axios.get(url);
        const jsonMatch = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        
        if (jsonMatch && jsonMatch[1]) {
            const nextData = JSON.parse(jsonMatch[1]);
            const matches = nextData.props.pageProps.initialState.team.results.matchList;
            
            // Filter matches where the match description or team names contain the opponent
            const h2hMatches = matches.filter(match => {
                const title = (match.matchInfo.team1.teamName + ' vs ' + match.matchInfo.team2.teamName).toLowerCase();
                return title.includes(opponentName.toLowerCase());
            });
            
            console.log(`--- Recent H2H Matches: ${teamName.toUpperCase()} vs ${opponentName.toUpperCase()} ---`);
            h2hMatches.slice(0, 5).forEach((match, i) => {
                console.log(`${i+1}. ${match.matchInfo.matchDesc} - ${match.matchInfo.status}`);
            });
            if(h2hMatches.length === 0) console.log('No recent H2H matches found in this page.');
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

getH2H('india', '2', 'afghanistan');
