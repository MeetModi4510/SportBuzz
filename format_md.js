import fs from 'fs';

function inrToEur(str) {
    if (!str || typeof str !== 'string' || !str.includes('₹')) return str;
    
    const numMatch = str.match(/[\d.]+/);
    if (!numMatch) return str;
    
    const num = parseFloat(numMatch[0]);
    
    let eurValue = 0;
    if (str.includes('Cr')) {
        eurValue = num * 125000;
    } else if (str.includes('L')) {
        eurValue = num * 1250;
    } else if (str.includes('k')) {
        eurValue = num * 12.5;
    } else {
        eurValue = num / 80;
    }
    
    if (eurValue >= 1000000) {
        let mVal = eurValue / 1000000;
        return `€${mVal.toFixed(2).replace(/\.00$/, '')}m`;
    } else if (eurValue >= 1000) {
        let kVal = eurValue / 1000;
        return `€${kVal.toFixed(0)}k`;
    } else {
        return `€${eurValue.toFixed(0)}`;
    }
}

const data = JSON.parse(fs.readFileSync('latest_transfers.json', 'utf8'));

let md = '# Latest Transfers (Selected Leagues)\n\n';
md += '| Player | Age | Nationality | Left Club | Joined Club | Date | Market Value | Fee |\n';
md += '|---|---|---|---|---|---|---|---|\n';

data.forEach(t => {
  const mv = inrToEur(t.marketValue);
  const fee = inrToEur(t.fee);
  md += `| [${t.playerName}](${t.playerUrl}) | ${t.age} | ${t.nationality} | ${t.leftClub} | ${t.joinedClub} | ${t.date} | ${mv} | ${fee} |\n`;
});

fs.writeFileSync('latest_transfers.md', md);
console.log('Markdown generated.');
