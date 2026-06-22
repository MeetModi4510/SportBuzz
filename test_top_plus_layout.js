import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

async function testTopPlus() {
  const url = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/1/galerie/0?saison_id=2026&transferfenster=alle&land_id=&ausrichtung=&spielerposition_id=&altersklasse=&leihe=&art=';
  const response = await gotScraping({ url });
  const $ = cheerio.load(response.body);
  const row = $('table.items > tbody > tr').first();
  
  const tds = row.find('> td');
  console.log("tds length:", tds.length);
  
  tds.each((i, el) => {
    console.log(`--- td ${i} html ---`);
    console.log($(el).html());
  });
}

testTopPlus();
