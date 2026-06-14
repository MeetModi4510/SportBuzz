import axios from 'axios';

async function testTheSportsDB(playerName) {
    try {
        console.log(`\n--- Testing TheSportsDB for ${playerName} ---`);
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;
        const res = await axios.get(url, { timeout: 5000 });
        
        if (res.data && res.data.player && res.data.player.length > 0) {
            // Find the first soccer player
            const player = res.data.player.find(p => p.strSport === 'Soccer');
            if (player) {
                console.log(`[SUCCESS] Found ${player.strPlayer}`);
                console.log(`Image (Cutout): ${player.strCutout}`);
                console.log(`Image (Thumb): ${player.strThumb}`);
                return player.strCutout || player.strThumb;
            } else {
                console.log("[FAIL] Player found, but not a Soccer player.");
            }
        } else {
            console.log("[FAIL] No player found on TheSportsDB");
        }
    } catch (e) {
        console.log("[ERROR] TheSportsDB:", e.message);
    }
    return null;
}

async function testWikipedia(playerName) {
    try {
        console.log(`\n--- Testing Wikipedia for ${playerName} ---`);
        // Step 1: Search for the article
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName + ' footballer')}&utf8=&format=json`;
        const searchRes = await axios.get(searchUrl, { timeout: 5000 });
        
        if (searchRes.data?.query?.search?.length > 0) {
            const title = searchRes.data.query.search[0].title;
            console.log(`[FOUND ARTICLE] ${title}`);
            
            // Step 2: Get the main image of the article
            const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500`;
            const pageRes = await axios.get(pageUrl, { timeout: 5000 });
            
            const pages = pageRes.data?.query?.pages;
            if (pages) {
                const pageId = Object.keys(pages)[0];
                const imageUrl = pages[pageId]?.thumbnail?.source;
                if (imageUrl) {
                    console.log(`[SUCCESS] Image URL: ${imageUrl}`);
                    return imageUrl;
                } else {
                    console.log("[FAIL] Article has no main image.");
                }
            }
        } else {
            console.log("[FAIL] No Wikipedia article found.");
        }
    } catch (e) {
        console.log("[ERROR] Wikipedia:", e.message);
    }
    return null;
}

async function run() {
    await testTheSportsDB("Alisson Becker");
    await testWikipedia("Alisson Becker");
    
    await testTheSportsDB("Issa Diop");
    await testWikipedia("Issa Diop");
    
    await testTheSportsDB("Noussair Mazraoui");
    await testWikipedia("Noussair Mazraoui");
}

run();
