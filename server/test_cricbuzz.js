import axios from 'axios';
import * as cheerio from 'cheerio';

axios.get('https://www.cricbuzz.com/live-cricket-scorecard/129563/match')
  .then(r => {
    const $ = cheerio.load(r.data);
    const divs = [];
    $('.scorecard-fow-grid, .scorecard-fow-grid-web').each((i, el) => {
        divs.push($(el).html());
    });
    console.log('HTML:', divs.join('\n---\n').substring(0,2000));
  })
  .catch(e => console.log(e.message));
