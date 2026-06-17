const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:3000/api/cricket/players/311158');
        console.log(JSON.stringify(res.data.stats.batting.all, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
test();
