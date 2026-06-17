import axios from 'axios';
import * as cheerio from 'cheerio';

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then(res => {
        const $ = cheerio.load(res.data);
        const scriptData = $('#__NEXT_DATA__').html();
        if (scriptData) {
            const data = JSON.parse(scriptData);
            console.log(Object.keys(data.props.pageProps));
            
            // Try to find where matches are stored
            const findMatches = (obj) => {
                let matches = [];
                JSON.stringify(obj, (key, value) => {
                    if (value && typeof value === 'object' && value.matchInfo && value.matchScore) {
                        matches.push(value);
                    }
                    return value;
                });
                return matches;
            }
            const matches = findMatches(data);
            console.log("Found matches with matchInfo and matchScore:", matches.length);
            if (matches.length > 0) {
                console.log(JSON.stringify(matches[0], null, 2));
            }
        }
    });
