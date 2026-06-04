import axios from 'axios';

const API_KEY = '3609207a-ed09-4b47-9c3b-4adcd8e25176';
const API_URL = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

const checkTeamInfo = async () => {
    console.log("Fetching matches to check teamInfo structure...\n");
    try {
        const response = await axios.get(API_URL);
        const matches = response.data.data || [];

        console.log(`Found ${matches.length} matches\n`);

        // Show first 5 matches with their teamInfo
        matches.slice(0, 5).forEach((match, idx) => {
            console.log(`--- Match ${idx + 1}: ${match.name} ---`);
            console.log(`  Type: ${match.matchType}`);
            console.log(`  Teams: ${match.teams?.join(' vs ')}`);

            if (match.teamInfo && match.teamInfo.length > 0) {
                console.log(`  Team Info:`);
                match.teamInfo.forEach((team, i) => {
                    console.log(`    [${i}] Name: ${team.name}`);
                    console.log(`        Short: ${team.shortname}`);
                    console.log(`        Image: ${team.img || 'NO IMAGE'}`);
                });
            } else {
                console.log(`  Team Info: NOT AVAILABLE`);
            }
            console.log('');
        });

    } catch (error) {
        console.error("Error:", error.message);
    }
};

checkTeamInfo();
