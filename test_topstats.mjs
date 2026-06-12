import axios from 'axios';

const LIVES_HOST = 'livescore6.p.rapidapi.com';
const LIVES_KEY = '8ff59ea88amshe58afcab9114126p143f30jsn45de62fd85e0';

async function testLivescore(path) {
    try {
        console.log(`\nTesting Livescore: ${path}`);
        const res = await axios.get(`https://${LIVES_HOST}${path}`, {
            headers: {
                'x-rapidapi-key': LIVES_KEY,
                'x-rapidapi-host': LIVES_HOST
            }
        });
        console.log("Status:", res.status);
        console.log(JSON.stringify(res.data, null, 2).substring(0, 1500));
    } catch(e) {
        console.log("Error:", e.message);
    }
}

async function run() {
    await testLivescore('/competitions/get-player-stats?CompId=734');
    await testLivescore('/competitions/get-team-stats?CompId=734');
}

run();
