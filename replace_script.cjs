const fs = require('fs');
const file = 'c:/Users/PRANSHU PATEL/OneDrive/Desktop/dev_scripts/src/components/football/FotmobPlayerCard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { usePlayerRecentMatches } from '../../hooks/football/usePlayerRecentMatches';`,
  `import { usePlayerRecentMatches } from '../../hooks/football/usePlayerRecentMatches';\nimport { useFotmobPlayerTournamentStats } from '../../hooks/useFootballSquads';`
);

content = content.replace(
  /  const isPrimaryTournament = [^\n]+;\n/,
  `  const isPrimaryTournamentFallback = selectedTournament?.tournamentId === statSeasons?.[0]?.tournaments?.[0]?.tournamentId && selectedTournament?.seasonName === statSeasons?.[0]?.seasonName;
  const { data: fetchedTournamentStats, isLoading: isStatsLoading } = useFotmobPlayerTournamentStats(
    profile?.id || null,
    selectedTournament?.entryId || null,
    selectedTournament?.tournamentId || null
  );
  const currentStats = fetchedTournamentStats || (isPrimaryTournamentFallback ? firstSeasonStats : null);
  const hasDeepStats = !!currentStats?.statsSection?.items?.length;\n`
);

content = content.replace(
  /const items = firstSeasonStats\?\.topStatCard\?\.items \|\| \[\];/g,
  `const items = currentStats?.topStatCard?.items || [];`
);

content = content.replace(
  /const categories = firstSeasonStats\?\.statsSection\?\.items \|\| \[\];/g,
  `const categories = currentStats?.statsSection?.items || [];`
);

const originalExtractStatIf = `    if (!applyFilter || statFilter === 'Total' || !rawValue || rawValue === '-') return rawValue;

    if (!String(rawValue).includes('%') && !statTitle.toLowerCase().includes('accuracy') && !statTitle.toLowerCase().includes('rate') && statTitle !== 'Rating' && statTitle !== 'Yellow cards' && statTitle !== 'Red cards' && statTitle !== 'Clean sheets' && statTitle !== 'Matches played' && statTitle !== 'Started' && statTitle !== 'Minutes played') {`;

const newExtractStatIf = `    if (!applyFilter || statFilter === 'Total' || !rawValue || rawValue === '-') return rawValue;

    if (statFilter === 'Per 90' && item?.per90 !== undefined) {
      return parseFloat(item.per90).toFixed(2);
    }

    if (!String(rawValue).includes('%') && !statTitle.toLowerCase().includes('accuracy') && !statTitle.toLowerCase().includes('rate') && statTitle !== 'Rating' && statTitle !== 'Yellow cards' && statTitle !== 'Red cards' && statTitle !== 'Clean sheets' && statTitle !== 'Matches played' && statTitle !== 'Started' && statTitle !== 'Minutes played') {`;

content = content.replace(originalExtractStatIf, newExtractStatIf);

content = content.replace(/isPrimaryTournament/g, 'hasDeepStats');

fs.writeFileSync(file, content);
console.log('Replaced successfully');
