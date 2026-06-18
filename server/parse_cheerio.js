import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('cb_live_scores.html', 'utf8');
const $ = cheerio.load(html);

const commentary = [];

// Balls are usually in divs with text like "76.6" which matches \d+\.\d+
// So let's find all divs that have a class containing min-w-[1.5rem] or similar
// Or simply loop over all `div.font-bold` that contain a ball number
$('div.font-bold').each((i, el) => {
    const text = $(el).text().trim();
    if (/^\d+\.\d+$/.test(text)) {
        // We found a ball!
        const ballNbr = text;
        
        // The text is in the next sibling of the parent container
        // Structure:
        // <div class="flex gap-4...">
        //    <div class="flex flex-col..."><div class="font-bold">76.6</div>...</div>
        //    <div>Jacob Bethell to Kyle Jamieson, no run...</div>
        // </div>
        
        const parentCol = $(el).parent();
        const commentaryNode = parentCol.next();
        let commText = commentaryNode.text().trim();
        
        // Check for W wickets or boundaries
        const isWicket = commText.includes('OUT') || commText.includes('Wicket') || $(el).parent().find('span').text().includes('W');
        const isFour = commText.includes('FOUR') || $(el).parent().find('span').text().includes('4');
        const isSix = commText.includes('SIX') || $(el).parent().find('span').text().includes('6');
        
        // If the text has a bold part like <b>That is Stumps</b>
        
        commentary.push({
            overNum: ballNbr.split('.')[0],
            ballNbr: ballNbr.split('.')[1],
            text: commText,
            eventType: isWicket ? 'WICKET' : isSix ? 'SIX' : isFour ? 'FOUR' : 'NONE'
        });
    }
});

console.log(`Found ${commentary.length} balls!`);
console.log(commentary.slice(0, 5));

// Now for Overs summaries:
$('div.text-gray-800.font-bold').each((i, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('Over')) {
        const over = text.replace('Over', '').trim();
        const scoreNode = $(el).next('.border-l');
        const score = scoreNode.text().trim();
        // console.log(`Over Summary: ${over} | Score: ${score}`);
    }
});
