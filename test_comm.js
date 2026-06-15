import axios from 'axios';

async function testComm() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=740966');
        const comm = res.data.commentary || [];
        console.log("Total commentaries:", comm.length);
        if (comm.length > 0) {
            console.log("Sample:", comm[0].text, comm[0].play?.type?.text);
        }
    } catch (e) {
        console.error(e.message);
    }
}

testComm();
