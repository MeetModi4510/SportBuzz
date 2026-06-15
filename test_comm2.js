import axios from 'axios';

async function testComm2() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=740966');
        const comm = res.data.commentary || [];
        const types = new Set(comm.map(c => c.play?.type?.text).filter(Boolean));
        console.log("Play types in commentary:", Array.from(types));
    } catch (e) {
        console.error(e.message);
    }
}

testComm2();
