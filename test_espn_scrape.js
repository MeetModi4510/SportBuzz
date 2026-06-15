import axios from 'axios';

async function scrapePlayer() {
    try {
        const id = 16306; // Let's guess this is some player, or 45843 for Messi
        const url = `https://www.espn.in/football/player/_/id/45843`;
        console.log("Fetching:", url);
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        const match = html.match(/window\['__INITIAL_STATE__'\]\s*=\s*(\{.*?\});/);
        if (match) {
            const data = JSON.parse(match[1]);
            const athlete = data.page.content.player.uid ? data.page.content.player : null; // guess
            console.log("Scraped data keys:", Object.keys(data));
        } else {
            console.log("No __INITIAL_STATE__ found");
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

scrapePlayer();
