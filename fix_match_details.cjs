const fs = require('fs');
let content = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf-8');

const target1 = `const tossWinner = cbInfo?.matchInfo?.tossResults?.tossWinnerName || cbSummary?.matchHeader?.matchInfo?.tossResults?.tossWinnerName || cbSummary?.matchInfo?.tossResults?.tossWinnerName;
                            const tossChoice = cbInfo?.matchInfo?.tossResults?.decision || cbSummary?.matchHeader?.matchInfo?.tossResults?.decision || cbSummary?.matchInfo?.tossResults?.decision;`;

const replacement1 = `const tossObj = cbInfo?.tossResults || cbSummary?.tossResults || cbInfo?.matchInfo?.tossResults || cbSummary?.matchInfo?.tossResults;
                            const tossWinner = tossObj?.tossWinnerName;
                            const tossChoice = tossObj?.decision;
                            
                            const u1 = cbInfo?.umpire1 || cbSummary?.umpire1 || cbInfo?.matchInfo?.umpire1 || cbSummary?.matchInfo?.umpire1;
                            const u2 = cbInfo?.umpire2 || cbSummary?.umpire2 || cbInfo?.matchInfo?.umpire2 || cbSummary?.matchInfo?.umpire2;
                            const ref = cbInfo?.referee || cbSummary?.referee || cbInfo?.matchInfo?.referee || cbSummary?.matchInfo?.referee;`;

content = content.replace(target1, replacement1);

const target2 = `{cbInfo?.matchInfo?.umpire1?.name ? \`\${cbInfo.matchInfo.umpire1.name}, \${cbInfo.matchInfo.umpire2?.name || ''}\` : "To be announced"}`;
const replacement2 = `{u1?.name ? \`\${u1.name}\${u2?.name ? ", " + u2.name : ''}\` : "To be announced"}`;

content = content.replace(target2, replacement2);

const target3 = `{cbInfo?.matchInfo?.referee?.name || "To be announced"}`;
const replacement3 = `{ref?.name || "To be announced"}`;

content = content.replace(target3, replacement3);

// Replace Venue Guide
const target4 = `const venueInfo = dynamicMatchInfo?.venueInfo ? \`\${dynamicMatchInfo.venueInfo.ground}, \${dynamicMatchInfo.venueInfo.city}\` : match?.venue?.name || "Unknown Venue";`;
const replacement4 = `const vg = cbInfo?.venueGuide || cbSummary?.venueGuide || dynamicMatchInfo?.venueInfo;
  const venueInfo = vg?.stadium ? \`\${vg.stadium}, \${vg.city}\` : (dynamicMatchInfo?.venueInfo ? \`\${dynamicMatchInfo.venueInfo.ground}, \${dynamicMatchInfo.venueInfo.city}\` : match?.venue?.name || "Unknown Venue");`;

content = content.replace(target4, replacement4);

fs.writeFileSync('src/pages/MatchDetails.tsx', content);
console.log('Replaced umpires and toss render blocks');
