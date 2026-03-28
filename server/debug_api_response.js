/**
 * Debug: Show ONLY /currentMatches grouped by type with status analysis
 */
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.CRICKETDATA_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

async function debug() {
    const res = await axios.get(`${BASE_URL}/currentMatches`, {
        params: { apikey: API_KEY, offset: 0 }
    });

    const data = res.data?.data || [];
    console.log(`Total /currentMatches: ${data.length}\n`);

    // Classify each match
    data.forEach((m, i) => {
        const type = (m.matchType || '').toUpperCase();
        const status = m.status || '';
        let classification = 'UNKNOWN';
        if (m.matchStarted && !m.matchEnded) classification = 'LIVE';
        else if (m.matchEnded) classification = 'COMPLETED';
        else if (!m.matchStarted && !m.matchEnded) classification = 'UPCOMING';

        console.log(`[${i}] ${type} | ${classification} | ${m.name}`);
        console.log(`     status: "${status}"`);
        console.log(`     started=${m.matchStarted} ended=${m.matchEnded} date=${m.dateTimeGMT}`);
        if (m.score && m.score.length > 0) {
            m.score.forEach(s => console.log(`     score: ${s.inning} → ${s.r}/${s.w} (${s.o} ov)`));
        }
        console.log('');
    });
}

debug().catch(e => console.error(e.message));
