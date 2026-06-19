const axios = require('axios');
const matchId = '129563';

async function testMcenter() {
    try {
        const url1 = `https://m.cricbuzz.com/mcenter/v1/${matchId}/comm`;
        console.log('Fetching', url1);
        const res1 = await axios.get(url1, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log('comm length:', res1.data.commentaryList ? res1.data.commentaryList.length : 0);
        if (res1.data.commentaryList && res1.data.commentaryList.length > 0) {
            console.log('First comm:', res1.data.commentaryList[0].commText.substring(0, 50));
            console.log('Last comm:', res1.data.commentaryList[res1.data.commentaryList.length - 1].commText.substring(0, 50));
        }

        const url2 = `https://m.cricbuzz.com/mcenter/v1/${matchId}/hcomm`;
        console.log('\nFetching', url2);
        const res2 = await axios.get(url2, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log('hcomm length:', res2.data.commentaryList ? res2.data.commentaryList.length : 0);
    } catch(e) {
        console.error(e.message);
    }
}
testMcenter();
