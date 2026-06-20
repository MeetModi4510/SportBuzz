const fs = require('fs');
let c = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8');

c = c.replace(
  /const \{ squads, squadsLoading, squadsError \} = useCricbuzzSquads\(cleanMatchId, activeTab === 'squads'\);/g,
  `const { squads, squadsLoading, squadsError } = useCricbuzzSquads(cleanMatchId, activeTab === 'squads' || activeTab === 'scoreboard' || activeTab === 'performance');

  const getPlayerImageId = (playerName: string) => {
    if (!squads || !playerName) return undefined;
    const allPlayers = [...(squads.team1?.players || []), ...(squads.team2?.players || [])];
    const match = allPlayers.find((p: any) => p.name.toLowerCase().includes(playerName.toLowerCase()) || playerName.toLowerCase().includes(p.name.toLowerCase()));
    return match?.faceImageId || undefined;
  };`
);

c = c.replace(/playerId=\{undefined\} playerName=\{p1\.name\}/g, 'playerId={getPlayerImageId(p1.name)} playerName={p1.name}');
c = c.replace(/playerId=\{undefined\} playerName=\{p2\.name\}/g, 'playerId={getPlayerImageId(p2.name)} playerName={p2.name}');
c = c.replace(/playerId=\{undefined\} \/\/ Force name-based resolution to get proper headshots/g, 'playerId={getPlayerImageId(b.name)}');
c = c.replace(/playerId=\{undefined\} \/\/ Force name-based resolution/g, 'playerId={getPlayerImageId(b.name)}');

fs.writeFileSync('src/pages/MatchDetails.tsx', c);
