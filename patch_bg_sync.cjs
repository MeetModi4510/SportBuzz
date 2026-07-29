const fs = require('fs');
let src = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8');

const targetStr = "  const team2Logo = cachedIsCompleted\n" +
"    ? (cachedListingMatch?.awayTeam?.logo || match?.awayTeam?.logo || '')\n" +
"    : ((dynamicTeam2?.imageId ? `/api/cricket/scraped/team-logo/${dynamicTeam2.imageId}` : '') || match?.awayTeam?.logo || '');";

const newStr = targetStr + "\n\n  // HT Commentary Background Sync\n" +
"  useEffect(() => {\n" +
"    if (htComm && activeTab === 'commentary' && commentarySyncTrigger) {\n" +
"      fetchHtData(true, team1Name || '', team2Name || '', match?.matchFormat || match?.matchType || '', match?.matchStartDate || match?.startDate || '');\n" +
"    }\n" +
"  }, [commentarySyncTrigger]);";

if(src.includes(targetStr)) {
    src = src.replace(targetStr, newStr);
    fs.writeFileSync('src/pages/MatchDetails.tsx', src);
    console.log("Successfully injected background sync!");
} else {
    console.log("Could not find target string.");
}
