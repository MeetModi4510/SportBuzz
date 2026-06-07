import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_KEY = process.env.FOOTBALL_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;

async function testTransfers() {
  try {
    console.log("Testing transfers API with key:", API_KEY?.substring(0, 5) + '...');
    const res = await axios.get('https://v3.football.api-sports.io/transfers', {
      headers: {
        'x-apisports-key': API_KEY,
        'x-rapidapi-key': API_KEY
      },
      params: { team: 541 } // Real Madrid
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}

testTransfers();
