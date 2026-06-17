import axios from 'axios';
import * as cheerio from 'cheerio';

axios.get('https://www.cricbuzz.com/profiles/1413/virat-kohli').then(r => {
    const $ = cheerio.load(r.data);
    $('table').each((i, t) => {
        const context = $(t).prev('div').text().trim();
        if (context.includes('Bowling Career Summary')) {
            $(t).find('tbody tr').each((j, tr) => {
                console.log($(tr).find('td').first().text().trim());
            });
        }
    });
});
