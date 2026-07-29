import fs from 'fs';

const nextData = JSON.parse(fs.readFileSync('ht_next_data.json', 'utf8'));

// We found it! pageProps.currTeamCommentary.commentary has 245 items!
const commentary = nextData.props.pageProps.currTeamCommentary.commentary;

console.log(`Total commentary items: ${commentary.length}`);

// Show first and last
const first = commentary[commentary.length - 1]; // array is in reverse order (latest first)
const last = commentary[0];

console.log(`\nFirst ball (oldest):`);
console.log(`  Over ${first.Over_No}.${first.Ball}: ${first.Commentary}`);
console.log(`  Batsman: ${first.Batsman_Name}, Bowler: ${first.Bowler_Name}, Runs: ${first.Runs}`);

console.log(`\nLast ball (most recent):`);
console.log(`  Over ${last.Over_No}.${last.Ball}: ${last.Commentary}`);
console.log(`  Batsman: ${last.Batsman_Name}, Bowler: ${last.Bowler_Name}, Runs: ${last.Runs}`);

// Print the first 10 items to verify
console.log('\n\n=== FIRST 10 COMMENTARY ITEMS ===');
const sorted = [...commentary].reverse(); // oldest first
sorted.slice(0, 10).forEach((item, i) => {
    const milestone = item.Milestone?.length > 0 ? ` [${item.Milestone.map(m => m.Type).join(', ')}]` : '';
    console.log(`${i + 1}. Over ${item.Over_No}.${item.Ball} | ${item.Batsman_Name} vs ${item.Bowler_Name} | ${item.Runs}R${milestone}`);
    console.log(`   ${item.Commentary}`);
});

// Check if this is the full innings or just part of it
console.log(`\n\n=== INNING COVERAGE ===`);
const overNums = commentary.map(c => parseInt(c.Over_No)).filter(n => !isNaN(n));
const minOver = Math.min(...overNums);
const maxOver = Math.max(...overNums);
console.log(`Over range: ${minOver} to ${maxOver}`);
console.log(`Is this the FULL innings? (Expected 105 overs based on match data): ${(maxOver - minOver) > 50 ? 'YES - Huge coverage!' : 'NO - Partial only'}`);

// Also check if there's pagination data
const matchData = nextData.props.pageProps.matchData;
console.log('\nTotal commentary in matchData.commentary:', matchData.commentary?.length);
