import fs from 'fs';
import path from 'path';

const fotmobData = JSON.parse(fs.readFileSync('d:\\dev_scripts\\public\\data\\fotmob_cache\\player_30981.json', 'utf8'));

if (fotmobData.careerHistory) {
    if (fotmobData.careerHistory.careerData) {
        console.log("careerData:", Object.keys(fotmobData.careerHistory.careerData));
    }
}
if (fotmobData.stats) {
    console.log("stats:", JSON.stringify(fotmobData.stats, null, 2));
}
if (fotmobData.statSeasons) {
    console.log("statSeasons[0].tournaments[0]:", JSON.stringify(fotmobData.statSeasons[0].tournaments[0], null, 2));
}
