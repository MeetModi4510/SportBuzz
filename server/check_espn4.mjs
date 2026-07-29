import axios from 'axios';

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const res = await axios.get(
    'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/ball-by-ball-commentary',
    { headers, timeout: 12000 }
);
const d = res.data;

const nextDataMatch = d.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
const nextData = JSON.parse(nextDataMatch[1]);

// Navigate to the content
const appPageProps = nextData.props?.appPageProps;
console.log('appPageProps keys:', Object.keys(appPageProps || {}));

// Find commentary
const str = JSON.stringify(appPageProps);
const commIdx = str.indexOf('"comments"');
if (commIdx !== -1) {
    const sample = str.substring(commIdx, commIdx + 800);
    console.log('\nComments sample:');
    console.log(sample);
    
    // Try to parse the actual comments array
    const fullData = appPageProps;
    function findComments(obj, depth=0) {
        if (depth > 10) return;
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            if (obj.length > 0 && obj[0]?.overNumber !== undefined) {
                console.log('\n🎯 FOUND COMMENTS ARRAY! Length:', obj.length);
                console.log('First comment:', JSON.stringify(obj[0], null, 2));
                console.log('Last comment:', JSON.stringify(obj[obj.length-1], null, 2));
                return;
            }
            obj.forEach(i => findComments(i, depth+1));
        } else {
            Object.keys(obj).forEach(k => {
                if (k === 'comments' && Array.isArray(obj[k])) {
                    console.log('\n🎯 FOUND comments key! Length:', obj[k].length);
                    if (obj[k].length > 0) {
                        console.log('First item:', JSON.stringify(obj[k][0], null, 2));
                    }
                }
                findComments(obj[k], depth+1);
            });
        }
    }
    findComments(fullData);
}
