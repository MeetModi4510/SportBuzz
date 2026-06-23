import fs from 'fs';
import path from 'path';
import axios from 'axios';

async function test() {
   try {
      const res = await axios.get('http://localhost:5000/api/football/fotmob-player-stats?id=30981&seasonId=0-0&tournamentId=130');
      const data = res.data.data;
      if (data.statsSection) {
         console.log(JSON.stringify(data.statsSection.items, null, 2));
      }
   } catch (e) {
      console.log(e.message);
   }
}
test();
