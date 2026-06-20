const fs = require('fs');
const svg = fs.readFileSync('chart.svg', 'utf8');
const indMatch = svg.match(/<path[^>]*name="IND"[^>]*d="([^"]*)"/i);
const afgMatch = svg.match(/<path[^>]*name="AFG"[^>]*d="([^"]*)"/i);

if (indMatch) {
    const d = indMatch[1];
    console.log("IND Path length:", d.length);
    const coords = [];
    const parts = d.replace(/[A-Z]/gi, ' ').split(/[\s,]+/).filter(p => p.trim());
    for(let i=0; i<Math.min(parts.length, 40); i+=2) {
        const x = parseFloat(parts[i]);
        const y = parseFloat(parts[i+1]);
        coords.push(y);
    }
    console.log("IND Y coords:", coords);
}
if (afgMatch) {
    const d = afgMatch[1];
    const coords = [];
    const parts = d.replace(/[A-Z]/gi, ' ').split(/[\s,]+/).filter(p => p.trim());
    for(let i=0; i<Math.min(parts.length, 40); i+=2) {
        const y = parseFloat(parts[i+1]);
        coords.push(y);
    }
    console.log("AFG Y coords:", coords);
}
