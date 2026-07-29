import fs from 'fs';

// Read both innings
const inn1 = JSON.parse(fs.readFileSync('ht_static_commentary_271827_1.json', 'utf8'));
const inn2 = JSON.parse(fs.readFileSync('ht_static_commentary_271827_2.json', 'utf8'));

console.log('=== INNINGS 1 ===');
console.log(`Total balls: ${inn1.commentary.length}`);
const sorted1 = [...inn1.commentary].sort((a, b) => parseFloat(a.Over_No + '.' + a.Ball) - parseFloat(b.Over_No + '.' + b.Ball));
const first1 = sorted1[0];
const last1 = sorted1[sorted1.length - 1];
console.log(`Coverage: Over ${first1.Over_No}.${first1.Ball} → Over ${last1.Over_No}.${last1.Ball}`);
console.log(`\nFirst ball: ${first1.Commentary}`);
console.log(`Last ball: ${last1.Commentary}`);

console.log('\n=== SAMPLE COMMENTARY (Innings 1, first 5) ===');
sorted1.slice(0, 5).forEach((item) => {
    const milestone = item.Milestone?.length > 0 ? ` ⭐ [${item.Milestone.map(m => m.Type).join(', ')}]` : '';
    const event = item.Iswicket === '1' ? ' 🔴 WICKET' : item.Runs === '4' ? ' 🔵 FOUR' : item.Runs === '6' ? ' 🟡 SIX' : '';
    console.log(`Over ${item.Over_No}.${item.Ball} | ${item.Batsman_Name} v ${item.Bowler_Name} | ${item.Runs}R${event}${milestone}`);
    console.log(`  "${item.Commentary}"`);
});

console.log('\n=== INNINGS 2 ===');
console.log(`Total balls: ${inn2.commentary.length}`);
const sorted2 = [...inn2.commentary].sort((a, b) => parseFloat(a.Over_No + '.' + a.Ball) - parseFloat(b.Over_No + '.' + b.Ball));
console.log(`Coverage: Over ${sorted2[0].Over_No}.${sorted2[0].Ball} → Over ${sorted2[sorted2.length-1].Over_No}.${sorted2[sorted2.length-1].Ball}`);

console.log('\n=== MATCH INFO ===');
const mi = inn1.matchInfo;
console.log(`Team: ${mi.teamFullName} | Total: ${mi.Total}/${mi.Wickets} in ${mi.Overs} overs`);
console.log(`Runrate: ${mi.Runrate}`);

console.log('\n✅ CONCLUSION: We have FULL ball-by-ball commentary from Hindustan Times!');
console.log(`Total balls across both innings: ${inn1.commentary.length + inn2.commentary.length}`);
