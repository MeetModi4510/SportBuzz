import axios from 'axios';

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

const res = await axios.get(
    'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/ball-by-ball-commentary',
    { headers, timeout: 12000 }
);
const d = res.data;
const nextDataMatch = d.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
const nextData = JSON.parse(nextDataMatch[1]);

function findInObj(obj, key, depth = 0) {
    if (depth > 15 || !obj || typeof obj !== 'object') return null;
    if (obj[key] !== undefined) return obj[key];
    for (const k of Object.keys(obj)) {
        const result = findInObj(obj[k], key, depth + 1);
        if (result !== null) return result;
    }
    return null;
}

const comments = findInObj(nextData.props, 'comments');
const firstBall = comments.find(c => c.overNumber !== undefined && !Array.isArray(c.balls));

// Inspect commentTextItems - that's the key!
console.log('commentTextItems:', JSON.stringify(firstBall.commentTextItems, null, 2));
console.log('\ncommentPreTextItems:', JSON.stringify(firstBall.commentPreTextItems, null, 2));
console.log('\ncommentPostTextItems:', JSON.stringify(firstBall.commentPostTextItems, null, 2));
console.log('\ntitle:', firstBall.title);
console.log('\ndismissalText:', firstBall.dismissalText);

// Show all 11 ball comments with their text
console.log('\n\n=== ALL BALL COMMENTARY ===');
const ballComments = comments.filter(c => c.overNumber !== undefined && !Array.isArray(c.balls));
ballComments.forEach((c) => {
    const textItems = c.commentTextItems || [];
    const preItems = c.commentPreTextItems || [];
    const postItems = c.commentPostTextItems || [];
    
    const preText = preItems.map(i => i.text || i.html || '').join(' ');
    const mainText = textItems.map(i => i.text || i.html || '').join(' ');
    const postText = postItems.map(i => i.text || i.html || '').join(' ');
    
    const fullComm = [preText, mainText, postText].filter(Boolean).join(' | ');
    console.log(`\nOver ${c.overNumber}.${c.ballNumber}: ${c.batsmanRuns}R, 4=${c.isFour}, 6=${c.isSix}, W=${c.isWicket}`);
    console.log(`  Commentary: "${fullComm}"`);
    console.log(`  Title: "${c.title || ''}"`);
});
