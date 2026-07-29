const axios = require('axios');
async function tryCommentary() {
    const ids = ['265590', '264864', '271827']; // Try HT's SL vs IND U19 ID (271827) on NDTV!
    for (const id of ids) {
        let url = `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/commentary_${id}_1.json`;
        try {
            const res = await axios.get(url);
            console.log(`Success on ${url}! Got ${res.data.commentary?.length} balls.`);
        } catch (e) {
            console.log(`Failed on ${url}: ${e.response?.status}`);
        }
        
        // Also try the HT format!
        try {
            const url2 = `https://sports.ndtv.com/static-content/10s/commentary_${id}_1.json`;
            const res2 = await axios.get(url2);
            console.log(`Success on ${url2}! Got ${res2.data.commentary?.length} balls.`);
        } catch (e) {
            // silent
        }
    }
}
tryCommentary();
