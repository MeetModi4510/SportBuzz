import axios from 'axios';

const KEY = '030c75b4d4mshfdaef69329cdd7ap1943adjsn3edfcf4a96b1';
const HOST = 'sofascore.p.rapidapi.com';

async function testSofascoreSearch() {
    try {
        console.log(`\nTesting Sofascore search...`);
        const res = await axios.get(`https://${HOST}/players/search`, {
            params: { name: 'Raul Jimenez' },
            headers: {
                'x-rapidapi-key': KEY,
                'x-rapidapi-host': HOST
            }
        });
        console.log("Search Status:", res.status);
        console.log("Result:", JSON.stringify(res.data, null, 2).substring(0, 500));
    } catch(e) {
        console.log("Error Search:", e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
    }
}

async function testSofascoreImage(id) {
    try {
        console.log(`\nTesting Sofascore image for id ${id}...`);
        const res = await axios.get(`https://${HOST}/players/get-image`, {
            params: { playerId: id },
            headers: {
                'x-rapidapi-key': KEY,
                'x-rapidapi-host': HOST
            }
        });
        console.log("Image Status:", res.status);
    } catch(e) {
         console.log("Error Image:", e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
    }
}

async function run() {
    await testSofascoreSearch();
}

run();
