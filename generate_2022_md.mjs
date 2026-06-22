import fs from 'fs';

const d = JSON.parse(fs.readFileSync('fotmob_messi_2022.json', 'utf8'));

let md = `# Lionel Messi - FIFA World Cup 2022/2023 Data Extraction\n\n`;

md += `## 1. Top Stats Overview\n\n`;
md += `| Metric | Value |\n|--------|-------|\n`;
if (d.topStatCard && d.topStatCard.items) {
    for (const item of d.topStatCard.items) {
        md += `| ${item.title} | ${item.statValue} |\n`;
    }
}

md += `\n## 2. Image Data (Shot Map Coordinates)\n\n\`\`\`json\n`;
if (d.shotmap) {
    const formattedShots = d.shotmap.map(s => ({
        id: s.id,
        eventType: s.eventType,
        shotType: s.shotType,
        situation: s.situation,
        x: parseFloat(s.x.toFixed(2)),
        y: parseFloat(s.y.toFixed(2)),
        min: s.min,
        isOnTarget: s.isOnTarget,
        expectedGoals: parseFloat(s.expectedGoals.toFixed(2)),
        expectedGoalsOnTarget: s.expectedGoalsOnTarget ? parseFloat(s.expectedGoalsOnTarget.toFixed(2)) : 0,
        box: s.box,
        goalCrossedY: s.goalCrossedY ? parseFloat(s.goalCrossedY.toFixed(2)) : undefined,
        goalCrossedZ: s.goalCrossedZ ? parseFloat(s.goalCrossedZ.toFixed(2)) : undefined
    }));
    md += JSON.stringify(formattedShots, null, 2);
} else {
    md += `[]`;
}
md += `\n\`\`\`\n\n`;

md += `## 3. Season Performance (Total & Per 90)\n\n`;
if (d.statsSection && d.statsSection.items) {
    for (const group of d.statsSection.items) {
        md += `### ${group.title}\n`;
        md += `| Metric | Total | Per 90 |\n|--------|-------|--------|\n`;
        for (const stat of group.items) {
            const per90 = stat.per90 ? parseFloat(stat.per90).toFixed(2) : '0.00';
            md += `| ${stat.title} | ${stat.statValue} | ${per90} |\n`;
        }
        md += `\n`;
    }
}

fs.writeFileSync('C:\\Users\\PRANSHU PATEL\\.gemini\\antigravity-ide\\brain\\4156fe94-7d51-4b15-8a9b-ec8e367216e8\\messi_world_cup_2022.md', md);
console.log("Written messi_world_cup_2022.md");
