import axios from 'axios';

// ESPN has __NEXT_DATA__ - let's check if commentary is embedded in it
const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const res = await axios.get(
    'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/ball-by-ball-commentary',
    { headers, timeout: 12000 }
);
const d = res.data;

// Extract __NEXT_DATA__
const nextDataMatch = d.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (nextDataMatch) {
    const nextData = JSON.parse(nextDataMatch[1]);
    const str = JSON.stringify(nextData);
    
    console.log('__NEXT_DATA__ keys at top level:', Object.keys(nextData));
    console.log('Props keys:', Object.keys(nextData.props || {}));
    
    // Look for commentary data
    const commIdx = str.indexOf('commentar');
    if (commIdx !== -1) {
        console.log('\nCommentary snippet:', str.substring(Math.max(0, commIdx-50), commIdx + 400));
    }
    
    // Check page props
    if (nextData.props?.pageProps) {
        console.log('\nPageProps keys:', Object.keys(nextData.props.pageProps));
    }
    
    // Also search for ball-specific data
    ['shortText', 'ballText', 'commText', 'overNum', 'ballNum'].forEach(k => {
        console.log(`Has "${k}": ${str.includes(k)}`);
    });
} else {
    console.log('No __NEXT_DATA__ found!');
}
