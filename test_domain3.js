import { gotScraping } from 'got-scraping';

async function test() {
  try {
    console.log("Testing .co.in with query string ...");
    const res1 = await gotScraping({ 
      url: 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026',
      searchParams: { currency: 'EUR' }
    });
    
    // Search for € or ₹ in the body
    if (res1.body.includes('€')) {
        console.log("Found Euro symbol!");
    } else if (res1.body.includes('₹')) {
        console.log("Found Rupee symbol!");
    }
  } catch (e) {
    console.log(".co.in error:", e.message || e);
  }
}

test();
