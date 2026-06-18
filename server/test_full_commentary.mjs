import { scrapeFullCommentary } from './services/cricbuzzScraperService.js';

console.log('=== Testing ENG vs NZ 2nd Test ===');
const result = await scrapeFullCommentary(
  '129563',
  'eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026'
);

if (!result) {
  console.log('RESULT: null (no data)');
} else {
  console.log('matchId:', result.matchId);
  console.log('totalPages:', result.totalPages);
  console.log('inningsCount:', result.inningsCount);
  console.log('Total commentary items:', result.commentary?.length);
  
  if (result.commentary && result.commentary.length > 0) {
    console.log('\nFirst 5 items:');
    result.commentary.slice(0, 5).forEach((item, i) => {
      console.log(`[${i}] InningsId=${item.inningsId} Ov=${item.overNum} Ball=${item.ballNbr} Event=${item.event}`);
      console.log(`     Batsman: ${item.batsman} | Bowler: ${item.bowler}`);
      console.log(`     Text: ${item.commText.substring(0, 100)}...`);
      console.log();
    });
    
    console.log('\nLast 3 items:');
    result.commentary.slice(-3).forEach((item, i) => {
      console.log(`[${i}] InningsId=${item.inningsId} Ov=${item.overNum} Event=${item.event}`);
      console.log(`     Text: ${item.commText.substring(0, 120)}`);
    });
  }
}

console.log('\n=== Testing IND vs AFG 2nd ODI ===');
const result2 = await scrapeFullCommentary(
  '148404',
  'ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026'
);

if (!result2) {
  console.log('RESULT: null (no data)');
} else {
  console.log('matchId:', result2.matchId);
  console.log('Total commentary items:', result2.commentary?.length);
  if (result2.commentary?.length > 0) {
    console.log('First item:');
    const first = result2.commentary[0];
    console.log(`  Event=${first.event} | Text: ${first.commText.substring(0, 120)}`);
  }
}
