import { gotScraping } from 'got-scraping';

/**
 * Scrapes a player image from Sofascore by bypassing Cloudflare 403 blocks using got-scraping TLS fingerprinting.
 * @param {string|number} playerId - The Sofascore player ID (e.g., 12994 for Messi)
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function scrapeSofascorePlayerImage(playerId) {
    const url = `https://api.sofascore.app/api/v1/player/${playerId}/image`;
    console.log(`[Sofascore Scraper] Fetching image from: ${url}`);
    
    try {
        const response = await gotScraping({
            url,
            responseType: 'buffer',
            headerGeneratorOptions: {
                browsers: [{name: 'chrome', minVersion: 110, maxVersion: 125}],
                devices: ['desktop'],
                locales: ['en-US'],
                operatingSystems: ['windows']
            }
        });

        const buffer = response.body;
        const contentType = response.headers['content-type'] || 'image/png';
        
        return { buffer, contentType };
    } catch (error) {
        console.error('[Sofascore Scraper Error]', error.message);
        throw error;
    }
}
