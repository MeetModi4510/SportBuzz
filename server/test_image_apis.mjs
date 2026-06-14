import axios from 'axios';

async function testFotmob(playerName) {
    try {
        console.log(`\n--- Testing FotMob for ${playerName} ---`);
        // FotMob search API
        const searchUrl = `https://www.fotmob.com/api/searchData?term=${encodeURIComponent(playerName)}`;
        const res = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        // Find player in results
        const playersInfo = res.data?.suggest?.find(s => s.options && s.options.length > 0 && s.options[0].type === 'player');
        if (!playersInfo || playersInfo.options.length === 0) {
            console.log("No player found on FotMob");
            return null;
        }
        
        // Options structure: { text: "Alisson Becker|12345", ... } or similar?
        // Let's print out the first option to see the structure
        const firstOption = playersInfo.options[0];
        console.log("FotMob raw option:", firstOption);
        
        // Usually, the ID is in the payload or the id field
        const id = firstOption.payload?.id || firstOption.id;
        
        if (id) {
            const imageUrl = `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
            console.log(`FotMob Image URL: ${imageUrl}`);
            return imageUrl;
        } else {
             // If the ID is embedded in a string like "Alisson Becker|12345"
             const parts = firstOption.text.split('|');
             if(parts.length > 1 && !isNaN(parts[1])) {
                 const imageUrl = `https://images.fotmob.com/image_resources/playerimages/${parts[1]}.png`;
                 console.log(`FotMob Image URL (extracted): ${imageUrl}`);
                 return imageUrl;
             }
             console.log("Could not extract FotMob ID");
        }
    } catch (e) {
        console.log("FotMob Error:", e.message);
    }
    return null;
}

async function testSofascore(playerName) {
    try {
        console.log(`\n--- Testing Sofascore for ${playerName} ---`);
        const searchUrl = `https://api.sofascore.app/api/v1/search/all?q=${encodeURIComponent(playerName)}`;
        const res = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const results = res.data?.results || [];
        const players = results.filter(r => r.type === 'player');
        
        if (players.length === 0) {
             console.log("No player found on Sofascore");
             return null;
        }
        
        const player = players[0].entity; // Usually entity holds the real object
        console.log(`Found Sofascore player: ${player.name} (ID: ${player.id})`);
        
        const imageUrl = `https://api.sofascore.app/api/v1/player/${player.id}/image`;
        console.log(`Sofascore Image URL: ${imageUrl}`);
        return imageUrl;
        
    } catch (e) {
        console.log("Sofascore Error:", e.message);
    }
    return null;
}

async function run() {
    await testFotmob("Alisson Becker");
    await testSofascore("Alisson Becker");
    await testFotmob("Issa Diop");
    await testSofascore("Issa Diop");
}

run();
