import { gotScraping } from 'got-scraping';

async function test() {
  try {
    console.log("Testing .co.in ...");
    const res1 = await gotScraping({ url: 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026' });
    console.log(".co.in status:", res1.statusCode);
  } catch (e) {
    console.log(".co.in error:", e.message || e);
  }

  try {
    console.log("Testing .com ...");
    const res2 = await gotScraping({ url: 'https://www.transfermarkt.com/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026' });
    console.log(".com status:", res2.statusCode);
  } catch (e) {
    console.log(".com error:", e.message || e);
  }
}

test();
