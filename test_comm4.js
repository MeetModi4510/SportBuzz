import axios from 'axios';

async function testComm4() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=740966');
        const comm = res.data.commentary || [];
        const shots = comm.filter(c => c.play?.type?.text?.includes('Shot'));
        if (shots.length > 0) {
            console.log("Team object in play:", shots[0].play?.team);
        }
    } catch (e) {
        console.error(e.message);
    }
}

testComm4();
