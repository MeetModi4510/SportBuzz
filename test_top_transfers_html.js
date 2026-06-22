import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

async function testScrapeHtml() {
  const url = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026&transferfenster=alle&land_id=&ausrichtung=&spielerposition_id=&altersklasse=&leihe=&art=';
  try {
    const response = await gotScraping({ url });
    const $ = cheerio.load(response.body);
    
    const rows = $('table.items > tbody > tr');
    
    if (rows.length > 0) {
      const el = rows.eq(0);
      const tds = el.find('> td');
      
      console.log('Player name HTML:', tds.eq(1).html());
      console.log('Left Club HTML:', tds.eq(4).html());
      console.log('Joined Club HTML:', tds.eq(5).html());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testScrapeHtml();
