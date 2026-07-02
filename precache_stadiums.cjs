const axios = require('axios');
const fs = require('fs');

async function clearCacheAndPrecache() {
    console.log("=========================================");
    console.log("   SPORTSBUZZ STADIUM PRE-CACHE SCRIPT   ");
    console.log("=========================================\n");

    console.log("⚠️ Make sure your local backend (npm run server) is running on port 5000 before proceeding!\n");

    console.log("Step 1: Clearing previous stadium data via API...");
    try {
        const result = await axios.delete('http://localhost:5000/api/football/venue/bdfutbol/cache');
        console.log(`✅ Cleared ${result.data.deletedCount} old stadium records from the database.`);
    } catch (e) {
        console.error("❌ Failed to clear database cache. Is the server running?", e.message);
        process.exit(1);
    }

    console.log("\nStep 2: Extracting all BDFutbol IDs from the codebase...");
    
    // Read files
    const file1 = fs.readFileSync('src/data/footballVenues.ts', 'utf8');
    const file2 = fs.readFileSync('src/data/venueExtras.ts', 'utf8');
    
    // Extract bdfutbolId: "..."
    const regex = /bdfutbolId:\s*['"]([^'"]+)['"]/g;
    const ids = new Set();
    
    let match;
    while ((match = regex.exec(file1)) !== null) { ids.add(match[1]); }
    while ((match = regex.exec(file2)) !== null) { ids.add(match[1]); }
    
    const uniqueIds = Array.from(ids);
    console.log(`Found ${uniqueIds.length} unique stadium IDs to update.`);
    
    console.log("\nStep 3: Starting scraping process.");
    
    for (let i = 0; i < uniqueIds.length; i++) {
        const id = uniqueIds[i];
        console.log(`[${i+1}/${uniqueIds.length}] Scraping stadium ${id}...`);
        try {
            await axios.get(`http://localhost:5000/api/football/venue/bdfutbol/${id}`);
            console.log(`   ✅ Successfully updated ${id}`);
            
            // Add a 3-second delay between scrapes to avoid getting blocked by Cloudflare
            if (i < uniqueIds.length - 1) {
                console.log(`   ⏳ Waiting 3 seconds before next stadium...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (e) {
            console.error(`   ❌ Failed to update ${id}: ${e.message}`);
        }
    }
    
    console.log("\n🎉 All done! Your MongoDB Atlas database has been completely refreshed.");
    console.log("Your live site will now instantly serve the fresh data!");
}

clearCacheAndPrecache();
