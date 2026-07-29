const axios = require('axios');
async function test() {
    const id = 'ksvklr08192025265590';
    const numId = '265590';
    const urls = [
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/${id}.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/matches/${id}.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/commentary_${numId}.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/commentary_${numId}_1.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/${id}_commentary.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/commentary/${id}.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/commentary/${numId}.json`,
        `https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/${numId}.json`
    ];
    
    for (const u of urls) {
        try {
            const res = await axios.get(u, { timeout: 3000 });
            console.log("SUCCESS:", u);
            console.log(Object.keys(res.data));
        } catch (e) {
            // console.log("FAILED:", u);
        }
    }
}
test();
