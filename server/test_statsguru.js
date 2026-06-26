import axios from 'axios';

async function testCricbuzzSearch() {
    try {
        const q = encodeURIComponent('VVS Laxman');
        // A common Cricbuzz search endpoint format (let's try their mobile API or web API)
        // Cricbuzz actually doesn't have an easily guessable public search API, but let's try their autocomplete
        const url = `https://www.cricbuzz.com/api/search/results?q=${q}`;
        const {data} = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(data);
    } catch (e) {
        console.log("Cricbuzz search failed", e.message);
    }
}
testCricbuzzSearch();
