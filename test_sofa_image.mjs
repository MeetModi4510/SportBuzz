import { scrapeSofascorePlayerImage } from './server/services/sofascoreImageScraper.js';
import fs from 'fs';

(async () => {
    try {
        // Fetch Lionel Messi (12994)
        console.log("Scraping Messi image from Sofascore...");
        const image = await scrapeSofascorePlayerImage(12994);
        
        fs.writeFileSync('messi_sofascore.png', image.buffer);
        console.log(`Success! Saved messi_sofascore.png (${image.buffer.length} bytes, type: ${image.contentType})`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
