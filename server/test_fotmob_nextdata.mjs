import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
async function fetch() {
  const { data } = await axios.get('https://www.fotmob.com/transfers');
  fs.writeFileSync('fotmob_transfers.html', data);
  const $ = cheerio.load(data);
  const nextData = $('#__NEXT_DATA__').html();
  if (nextData) {
      fs.writeFileSync('fotmob_nextdata.json', nextData);
      console.log('Saved NEXT_DATA');
  } else {
      console.log('No NEXT_DATA');
  }
}
fetch().catch(console.error);
