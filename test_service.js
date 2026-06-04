import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'server/.env') });

const API_KEY = process.env.CRICKETDATA_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

async function testServiceDirectly() {
    console.log('Testing getActiveSeriesMatches service logic directly...');
    
    try {
        // Mocking the behavior of getActiveSeriesMatches with logs
        console.log('[DEBUG] Starting discovery...');
        
        let allSeries = [];
        for (let i = 0; i < 3; i++) {
            const seriesRes = await axios.get(`${BASE_URL}/series`, { params: { apikey: API_KEY, offset: i * 25 }});
            const data = seriesRes.data;
            console.log(`[DEBUG] Page ${i+1} Status: ${data.status} | Total: ${data.data?.length || 0}`);
            if (data.status !== 'success') {
                console.log(`[DEBUG] Reason: ${data.reason}`);
            }
            const page = data.data || [];
            allSeries = allSeries.concat(page);
        }
        console.log(`[DEBUG] Total series fetched: ${allSeries.length}`);

        const today = new Date('2026-03-13'); // Forced date for consistency with metadata
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(today.getDate() + 7);
        
        const PRIORITY_KEYWORDS = ['pakistan', 'bangladesh', 'india', 'australia', 'england', 'south africa', 'west indies', 'sri lanka', 'afghanistan', 'world cup', 't20 world cup', 'trophy'];

        const targetSeries = allSeries.filter(s => {
            const name = (s.name || '').toLowerCase();
            const isPriority = PRIORITY_KEYWORDS.some(k => name.includes(k));
            
            const start = new Date(s.startDate);
            const end = new Date(s.endDate || s.startDate);
            
            const isRecent = (start <= oneWeekFromNow && end >= oneWeekAgo);
            
            if (name.includes('pak') || name.includes('ban')) {
                console.log(`[DEBUG] Check Series: "${s.name}" | start: ${s.startDate}, end: ${s.endDate} | isPriority: ${isPriority}, isRecent: ${isRecent}`);
            }
            
            return isPriority && isRecent;
        });

        console.log(`[DEBUG] Found ${targetSeries.length} target series.`);

        for (const s of targetSeries) {
            console.log(`\n--- Matches for: ${s.name} (ID: ${s.id}) ---`);
            const res = await axios.get(`${BASE_URL}/series_info`, { params: { apikey: API_KEY, id: s.id }});
            const matches = res.data.data?.matchList || [];
            console.log(`Found ${matches.length} matches.`);
            
            matches.forEach(m => {
                const mDate = new Date(m.date);
                const diffDays = Math.abs((mDate - today) / (1000 * 60 * 60 * 24));
                const inWindow = diffDays <= 3;
                console.log(`  * ${m.name} | Date: ${m.date} | diffDays: ${diffDays.toFixed(2)} | inWindow: ${inWindow}`);
            });
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

testServiceDirectly();
