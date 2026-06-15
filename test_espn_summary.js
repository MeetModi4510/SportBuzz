import axios from 'axios';

async function testSummary() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=748515');
        const header = res.data.header;
        console.log("Header keys:", Object.keys(header));
        console.log("League:", header.league?.id, header.league?.slug);
        console.log("Season:", header.season?.id, header.season?.type, header.season?.slug);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

testSummary();
