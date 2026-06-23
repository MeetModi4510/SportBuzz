import fs from 'fs';
const fotmobData = JSON.parse(fs.readFileSync('d:\\dev_scripts\\public\\data\\fotmob_cache\\player_30981.json', 'utf8'));

if (fotmobData.careerHistory) {
    console.log(typeof fotmobData.careerHistory.careerItems);
    console.log(Object.keys(fotmobData.careerHistory.careerItems));
}
