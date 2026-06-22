import { gotScraping } from 'got-scraping';

async function test() {
  try {
    console.log("Testing .es ...");
    const res1 = await gotScraping({ 
      url: 'https://www.transfermarkt.es/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026',
    });
    console.log(".es status:", res1.statusCode);
  } catch (e) {
    console.log(".es error:", e.message || e);
  }
}

test();
