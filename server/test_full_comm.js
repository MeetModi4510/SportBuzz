const cheerio = require('cheerio');

async function testFullComm() {
    const res = await fetch('https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026');
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text());

    // Find Next.js payload
    const nextDataStr = $('#__NEXT_DATA__').html();
    if (nextDataStr) {
        console.log('Found __NEXT_DATA__');
        const data = JSON.parse(nextDataStr);
        console.log('Keys:', Object.keys(data));
        if (data.props && data.props.pageProps) {
            console.log('pageProps keys:', Object.keys(data.props.pageProps));
        }
    } else {
        console.log('No __NEXT_DATA__ found');
        
        // Find self.__next_f.push
        const scripts = $('script').toArray();
        let found = false;
        for (const script of scripts) {
            const content = $(script).html() || '';
            if (content.includes('self.__next_f.push')) {
                console.log('Found self.__next_f.push script of length', content.length);
                found = true;
            }
        }
        if (!found) console.log('No Next.js payload found at all.');
    }
}

testFullComm();
