const fs = require('fs');
const svg = fs.readFileSync('chart.svg', 'utf8');
const paths = svg.match(/<path[^>]*d="[^"]*"[^>]*>/gi) || [];
paths.forEach(p => console.log(p.substring(0, 100) + "..."));
