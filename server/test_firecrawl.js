import FirecrawlApp from '@mendable/firecrawl-js';

async function testFirecrawl() {
    try {
        const app = new FirecrawlApp({ apiKey: 'fc-6a2c27b0c3d441118fa10b9f1d0a5e78' }); // I will try without API key or a placeholder. Actually it needs a valid one. Let me try without passing apiKey, it might pick up from env.
        
        const response = await app.search('site:espncricinfo.com/cricketers "Hardik Pandya"');
        console.log(response);
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testFirecrawl();
