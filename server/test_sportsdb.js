import axios from 'axios';

async function testSportsDB() {
    const names = ['Hardik Pandya', 'Rohit Sharma', 'Ishant Sharma', 'Arshdeep Singh'];
    
    for (const name of names) {
        try {
            const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`;
            const res = await axios.get(url);
            const players = res.data.player;
            
            if (players) {
                // Filter for cricket
                const cricketPlayers = players.filter(p => p.strSport === 'Cricket');
                
                if (cricketPlayers.length > 0) {
                    const p = cricketPlayers[0];
                    console.log(`${name}: Found in Cricket! Cutout: ${p.strCutout ? 'YES' : 'NO'} (${p.strCutout})`);
                } else {
                    console.log(`${name}: Found, but NOT in Cricket.`);
                }
            } else {
                console.log(`${name}: Not found in SportsDB.`);
            }
        } catch(e) {
            console.log(`Error for ${name}: ${e.message}`);
        }
    }
}
testSportsDB();
