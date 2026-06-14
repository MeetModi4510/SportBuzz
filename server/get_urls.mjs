import axios from 'axios';

async function getImageUrl(playerName) {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
        const res = await axios.get(url, { timeout: 5000 });
        
        if (res.data && res.data.player && res.data.player.length > 0) {
            const player = res.data.player[0];
            const img = player.strCutout || player.strThumb || player.strRender;
            console.log(`[SUCCESS] ${playerName} -> ${img}`);
            return img;
        } else {
            console.log(`[FAIL] No player found for ${playerName}`);
        }
    } catch (e) {
        console.log(`[ERROR] ${playerName}:`, e.message);
    }
}

async function run() {
    await getImageUrl("Alisson Becker");
    await getImageUrl("Issa Diop");
    await getImageUrl("Patrick Beach"); // testing Patrick Beach
}

run();
