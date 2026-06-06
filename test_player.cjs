const axios = require('axios');
const fs = require('fs');

async function test() {
  const apiKey = '85fb58db70msh50c5add33399bccp10e19ajsn6083f7bc3e30';
  const host = 'cricbuzz-cricket2.p.rapidapi.com';

  // Ben Duckett ID: 8095
  // Joe Root ID: 7825
  const players = [8095, 7825];

  for (const id of players) {
    try {
      const res = await axios.get(`https://${host}/stats/v1/player/${id}`, {
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': host }
      });
      console.log(`Player ${id}:`, res.data.name, 'faceImageId:', res.data.faceImageId);
    } catch (e) {
      console.error(e.message);
    }
  }
}

test();
