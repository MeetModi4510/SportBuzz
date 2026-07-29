const axios = require('axios');
async function test() {
    const res = await axios.get('https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/matches.json');
    const matches = res.data;
    console.log("Total entries in matches.json:", Object.keys(matches).length);
    const keys = Object.keys(matches);
    console.log("First entry:", keys[0]);
    // check if it's an object of objects
    console.log(matches[keys[0]]);
}
test();
