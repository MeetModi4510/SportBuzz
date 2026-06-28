const cheerio = require('cheerio');

async function run() {
    const html = await (await fetch('https://www.espncricinfo.com/cricket-grounds/country/india-6', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const $ = cheerio.load(html);
    const n = $('#__NEXT_DATA__').html();
    if (n) {
        const j = JSON.parse(n);
        const d = j.props.appPageProps.data.data;
        if (d.content.grounds) {
            console.log('Grounds count:', d.content.grounds.results.length);
            console.log('Sample grounds:', d.content.grounds.results.map(g => g.slug).slice(0, 10));
        }
    }
}
run();
