import axios from 'axios';

async function testComm3() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=740966');
        const comm = res.data.commentary || [];
        const shots = comm.filter(c => c.play?.type?.text?.includes('Shot'));
        console.log("Sample Shot:", JSON.stringify(shots[0], null, 2));
    } catch (e) {
        console.error(e.message);
    }
}

testComm3();
