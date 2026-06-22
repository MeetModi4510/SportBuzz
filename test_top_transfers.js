import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

async function testScrape() {
  const url = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026&transferfenster=alle&land_id=&ausrichtung=&spielerposition_id=&altersklasse=&leihe=&art=';
  try {
    const response = await gotScraping({ url });
    const $ = cheerio.load(response.body);
    
    const rows = $('table.items > tbody > tr');
    
    if (rows.length > 0) {
      const el = rows.eq(0);
      const tds = el.find('> td');
      console.log('Columns count:', tds.length);
      tds.each((i, td) => {
        console.log(`Col ${i}:`, $(td).text().trim().replace(/\s+/g, ' '));
      });
    } else {
      console.log('No rows found in table.items');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testScrape();
