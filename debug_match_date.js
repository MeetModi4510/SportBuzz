import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const API_KEY = process.env.CRICKETDATA_KEY || process.env.VITE_CRICKETDATA_API_KEY;
console.log('Using API Key:', API_KEY ? '***' + API_KEY.slice(-4) : 'MISSING');

async function checkMatchData() {
    try {
        const matchesToCheck = [];

        // 1. Fetch Current Matches
        console.log('Fetching /currentMatches...');
        try {
            const resCurrent = await axios.get(`https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`);
            if (resCurrent.data.data) matchesToCheck.push(...resCurrent.data.data);
        } catch (e) { console.error('Current matches failed', e.message); }

        // 2. Fetch Recent Matches (Page 0 and 1)
        console.log('Fetching /matches (Page 0)...');
        const resMatches0 = await axios.get(`https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`);
        if (resMatches0.data.data) matchesToCheck.push(...resMatches0.data.data);

        console.log('Fetching /matches (Page 1)...');
        const resMatches1 = await axios.get(`https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=25`);
        if (resMatches1.data.data) matchesToCheck.push(...resMatches1.data.data);

        console.log(`Total matches to check: ${matchesToCheck.length}`);

        // Find match: Victoria vs Queensland
        const targetMatches = matchesToCheck.filter(m =>
            (m.name && m.name.includes('Victoria') && m.name.includes('Queensland')) ||
            (m.t1 && m.t1.includes('Victoria') && m.t2 && m.t2.includes('Queensland')) ||
            (m.t2 && m.t2.includes('Victoria') && m.t1 && m.t1.includes('Queensland'))
        );

        if (targetMatches.length > 0) {
            console.log(`--- FOUND ${targetMatches.length} MATCHES ---`);
            targetMatches.forEach((m, i) => {
                console.log(`[Match ${i + 1}] ID: ${m.id}`);
                console.log('Name:', m.name);
                console.log('Status:', m.status);
                console.log('dateTimeGMT:', m.dateTimeGMT);
                console.log('date:', m.date);
                console.log('startDate:', m.startDate);
                console.log('startTime:', m.startTime);
                console.log('start_time:', m.start_time); // Snake case
                console.log('matchStarted:', m.matchStarted);
                console.log('matchEnded:', m.matchEnded);
                console.log('-----------------------------------');
            });
        } else {
            console.log('Target match (Victoria vs Queensland) NOT FOUND in searched batch.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkMatchData();
