import axios from 'axios';

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
};

// ESPN has a dedicated ball-by-ball commentary page - let's find the right matchId
// T20 WC 2024 Final: India vs South Africa

const ballByBallUrl = 'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/ball-by-ball-commentary';

try {
    const res = await axios.get(ballByBallUrl, { headers, timeout: 12000 });
    const d = res.data;
    console.log('Status:', res.status, 'Size:', d.length);
    
    // Look for actual ball text patterns
    const patterns = ['commText', 'commStr', 'event', 'short_text', 'play_desc', 'ball_desc', 'narrative', 'html', 'text'];
    patterns.forEach(p => console.log(`Has "${p}": ${d.includes(p)}`));
    
    // Is this a JS app? Look for __NEXT_DATA__ or window.props
    console.log('\nHas __NEXT_DATA__:', d.includes('__NEXT_DATA__'));
    console.log('Has window.props:', d.includes('window.props'));
    console.log('Has Apollo:', d.includes('apolloState') || d.includes('__APOLLO'));
    
    // Sample
    const idx = d.indexOf('__NEXT_DATA__');
    if (idx !== -1) {
        console.log('\n__NEXT_DATA__ snippet:', d.substring(idx, idx + 500));
    }
} catch(e) {
    console.log('ERROR:', e.response?.status || e.message);
}

// Also try the hs-consumer-api with different headers (mimick a browser)
console.log('\n=== Trying hs-consumer-api with browser headers ===');
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.espncricinfo.com',
    'Referer': 'https://www.espncricinfo.com/',
    'x-requested-with': 'XMLHttpRequest'
};

const apiUrl = 'https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=1411166&matchId=1415701&inningNumber=1&commentType=ALL&fromInningOver=-1';
try {
    const res = await axios.get(apiUrl, { headers: browserHeaders, timeout: 12000 });
    const d = JSON.stringify(res.data);
    console.log('Status:', res.status, 'Size:', d.length);
    console.log('Sample:', d.substring(0, 500));
} catch(e) {
    console.log('ERROR:', e.response?.status || e.message);
    if (e.response?.headers) console.log('Headers:', JSON.stringify(e.response.headers));
}
