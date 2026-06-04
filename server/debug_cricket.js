
import axios from 'axios';

const API_KEY = '3609207a-ed09-4b47-9c3b-4adcd8e25176';
const URL = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

const categorizeMatches = (matches) => {
    const categories = { test: [], odi: [], t20: [] };
    matches.forEach(match => {
        const type = match.matchType ? match.matchType.toLowerCase() : '';
        if (type.includes('test')) categories.test.push(match);
        else if (type.includes('odi')) categories.odi.push(match);
        else if (type.includes('t20')) categories.t20.push(match);
    });
    return categories;
};

const run = async () => {
    try {
        console.log("Fetching matches from:", URL);
        const response = await axios.get(URL);
        const data = response.data;

        if (data.status !== 'success') {
            console.error("API Error:", data.status);
            if (data.reason) console.error("Reason:", data.reason);
            return;
        }

        const matches = data.data || [];
        console.log(`Fetched ${matches.length} matches.`);

        console.log("\n--- Active Series IDs ---");
        const seriesMap = new Map();

        matches.forEach(m => {
            const type = m.matchType ? m.matchType.toUpperCase() : 'UNKNOWN';
            if (m.series_id) {
                if (!seriesMap.has(m.series_id)) seriesMap.set(m.series_id, { name: m.name, type });
            }
        });

        seriesMap.forEach((val, key) => {
            console.log(`Series ID: ${key} [${val.type}] - Match: ${val.name}`);
        });

    } catch (error) {
        console.error("Script Error:", error.message);
    }
};

run();
