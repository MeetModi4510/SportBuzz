import axios from 'axios';

async function test() {
    try {
        console.log("Fetching match list...");
        const list = await axios.get('https://freewebapi.com/api/matches/list');
        // console.log("List Response:", JSON.stringify(list.data, null, 2));

        if (list.data && list.data.data && list.data.data.length > 0) {
            // Updated based on likely 'data' wrapper common in APIs, will verify
            // Actually let's just dump the structure first
            console.log("Root Keys:", Object.keys(list.data));

            // Assuming data is in .data or directly array?
            // Let's print the first item if array
            let firstMatch = null;
            if (Array.isArray(list.data)) firstMatch = list.data[0];
            else if (Array.isArray(list.data.data)) firstMatch = list.data.data[0];
            else if (list.data.matches) firstMatch = list.data.matches[0];

            if (firstMatch) {
                console.log("First Match ID:", firstMatch.id);
                const matchId = firstMatch.id;

                console.log(`Fetching info for match ID: ${matchId}`);
                const info = await axios.get(`https://freewebapi.com/api/matches/get-info?matchId=${matchId}`);
                console.log("Info Response Keys:", Object.keys(info.data));

                console.log(`Fetching lineups for match ID: ${matchId}`);
                const lineups = await axios.get(`https://freewebapi.com/api/matches/get-team?matchId=${matchId}`);
                console.log("Lineups Response Keys:", Object.keys(lineups.data));

                console.log(`Fetching commentary for match ID: ${matchId}`);
                const comms = await axios.get(`https://freewebapi.com/api/matches/get-commentaries?matchId=${matchId}`);
                console.log("Comms Response Keys:", Object.keys(comms.data));

            } else {
                console.log("No matches found in list.");
                console.log("Structure:", JSON.stringify(list.data, null, 2).substring(0, 500));
            }
        } else {
            console.log("List data empty or structure unknown.");
            console.log("Structure:", JSON.stringify(list.data, null, 2).substring(0, 500));
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
