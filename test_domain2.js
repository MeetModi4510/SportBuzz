import { gotScraping } from 'got-scraping';

async function test() {
  try {
    console.log("Testing .co.in with EUR cookie ...");
    const res1 = await gotScraping({ 
      url: 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026',
      headers: {
        'Cookie': 'tm_currency=EUR'
      }
    });
    console.log(".co.in status:", res1.statusCode);
    console.log(".co.in preview:", res1.body.substring(0, 500));
    
    // Search for € or ₹ in the body
    if (res1.body.includes('€')) {
        console.log("Found Euro symbol!");
    }
    if (res1.body.includes('₹')) {
        console.log("Found Rupee symbol!");
    }
  } catch (e) {
    console.log(".co.in error:", e.message || e);
  }
}

test();
