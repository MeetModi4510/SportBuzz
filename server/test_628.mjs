import axios from 'axios';

async function testLogo() {
    try {
        const res = await axios.head('https://a.espncdn.com/i/teamlogos/soccer/500/628.png');
        console.log("628.png status:", res.status);
    } catch (err) {
        console.log("628.png fail:", err.message);
    }
}
testLogo();
