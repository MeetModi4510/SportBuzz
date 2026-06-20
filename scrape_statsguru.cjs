const axios = require('axios');

async function scrapeH2H() {
    try {
        const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;opposition=40;team=6;template=results;type=team;view=results';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        
        const match = html.match(/<caption>Match results<\/caption>([\s\S]*?)<\/table>/);
        if (match) {
            const tableHtml = match[1];
            const rows = tableHtml.match(/<tr class="data1">([\s\S]*?)<\/tr>/g);
            if (rows) {
                console.log(`Found ${rows.length} Total Matches on ESPNCricinfo Statsguru:`);
                // Print all rows
                rows.forEach((row, i) => {
                    const cols = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
                    const cleanCols = cols.map(c => c.replace(/<[^>]*>/g, '').trim());
                    // 1: Result, 2: Margin, 7: Ground, 8: Start Date
                    const result = cleanCols[1] || '-';
                    const margin = cleanCols[2] || '-';
                    const formatDesc = cleanCols[7] || '';
                    const ground = cleanCols[8] || '';
                    const matchDate = cleanCols[9] || '';
                    console.log(`${i+1}. Date: ${matchDate} | Ground: ${ground} | Format: ${formatDesc} | Result: India ${result} by ${margin}`);
                });
            } else {
                console.log("No data rows found.");
            }
        } else {
            console.log("Table not found.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
scrapeH2H();
