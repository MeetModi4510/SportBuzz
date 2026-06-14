import axios from 'axios';

async function checkPlayer(name) {
    const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`);
    console.log(`\n--- ${name} ---`);
    if (res.data?.player) {
         const p = res.data.player.find(x => x.strSport === 'Soccer');
         if (p) {
             console.log("Cutout:", p.strCutout);
             console.log("Thumb:", p.strThumb);
             console.log("Render:", p.strRender);
         } else {
             console.log("No soccer player found.");
         }
    } else {
         console.log("Not found.");
    }
}

async function run() {
    await checkPlayer("Suzuki");
    await checkPlayer("Watanabe");
    await checkPlayer("Kubo");
    await checkPlayer("Cody Gakpo");
}
run();
