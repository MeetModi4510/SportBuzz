import fs from 'fs';
const fotmobData = JSON.parse(fs.readFileSync('d:\\dev_scripts\\public\\data\\fotmob_cache\\player_30981.json', 'utf8'));

let goals = 0, matches = 0, assists = 0;

if (fotmobData.careerHistory && fotmobData.careerHistory.careerItems) {
    const items = fotmobData.careerHistory.careerItems;
    for (const item of items) {
        goals += parseInt(item.goals) || 0;
        matches += parseInt(item.appearances) || 0;
        if (item.assists && item.assists !== 'undefined') {
            assists += parseInt(item.assists) || 0;
        }
    }
}
console.log(`Career: ${matches} M, ${goals} G, ${assists} A`);
