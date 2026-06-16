import FirecrawlApp from '@mendable/firecrawl-js';

async function testFirecrawl() {
    try {
        const app = new FirecrawlApp({ apiKey: "fc-9134858be86a4924b99872d22adfdc58" });

        console.log("Starting Firecrawl scrape of ESPNcricinfo Statsguru...");
        
        // Scraping the main Statsguru URL the user provided
        const scrapeResult = await app.scrapeUrl('https://stats.espncricinfo.com/ci/engine/stats/index.html', {
            formats: ['markdown']
        });

        if (!scrapeResult.success) {
            console.error("Scrape failed:", scrapeResult.error);
            return;
        }

        console.log("===============================");
        console.log("Scrape Success! Extracted Content:");
        console.log("===============================");
        console.log(scrapeResult.markdown.substring(0, 1500));
        
    } catch (e) {
        console.error("Error running Firecrawl:", e.message);
    }
}

testFirecrawl();
