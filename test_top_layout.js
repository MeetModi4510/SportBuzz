import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

async function testTop() {
  const url = 'https://www.transfermarkt.co.in/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026';
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

testTop();
