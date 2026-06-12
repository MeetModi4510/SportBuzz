import axios from 'axios';

const LIVES_HOST = 'livescore6.p.rapidapi.com';
const LIVES_KEY = '8ff59ea88amshe58afcab9114126p143f30jsn45de62fd85e0';

async function dumpTypes() {
    try {
        const res = await axios.get(`https://${LIVES_HOST}/competitions/get-player-stats?CompId=734`, {
            headers: {
                'x-rapidapi-key': LIVES_KEY,
                'x-rapidapi-host': LIVES_HOST
            }
        });
        const types = res.data.Stat.map(s => ({
            Typ: s.Typ,
            FirstPlayer: s.Plrs[0]?.Pnm,
            Score: s.Plrs[0]?.Scrs
        }));
        console.log("Player Types:", JSON.stringify(types, null, 2));
    } catch(e) {
        console.log("Error:", e.message);
    }
}

async function testSofascore(playerName) {
    try {
        console.log(`\nTesting Sofascore search for: ${playerName}`);
        const res = await axios.get(`https://sofascore.p.rapidapi.com/search`, {
            params: { query: playerName },
            headers: {
                'x-rapidapi-key': '030c75b4d4mshfdaef69329cdd7ap1943adjsn3edfcf4a96b1',
                'x-rapidapi-host': 'sofascore.p.rapidapi.com'
            }
        });
        const player = res.data.results?.find(r => r.type === 'player' || r.entity?.type === 'player');
        console.log("Found Player:", JSON.stringify(player, null, 2));
    } catch(e) {
        console.log("Error Sofascore:", e.message);
    }
}

async function run() {
    await dumpTypes();
    await testSofascore('Raúl Jiménez');
}

run();
