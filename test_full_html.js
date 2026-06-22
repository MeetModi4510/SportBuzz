import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

async function fullHtml() {
  const url = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026&transferfenster=alle&land_id=&ausrichtung=&spielerposition_id=&altersklasse=&leihe=&art=';
  try {
    const response = await gotScraping({ url });
    const $ = cheerio.load(response.body);
    const rows = $('table.items > tbody > tr');
    if (rows.length > 0) {
      console.log(rows.eq(0).html());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fullHtml();
