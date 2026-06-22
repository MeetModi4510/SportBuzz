import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

async function testEs() {
  const url = 'https://www.transfermarkt.es/transfers/saisontransfers/statistik/top/plus/0/galerie/0?saison_id=2026';
  const response = await gotScraping({ url });
  const $ = cheerio.load(response.body);
  const rows = $('table.items > tbody > tr').slice(0, 5);
  
  rows.each((i, el) => {
    const tds = $(el).find('> td');
    const playerName = tds.eq(1).find('.hauptlink a').text().trim();
    const marketValue = tds.eq(3).text().trim();
    const joinedLeague = tds.eq(6).find('tr').eq(1).find('a').attr('title') || tds.eq(6).find('tr').eq(1).text().trim();
    const fee = tds.eq(7).find('a').text().trim() || tds.eq(7).text().trim();
    
    console.log({playerName, marketValue, joinedLeague, fee});
  });
}

testEs();
