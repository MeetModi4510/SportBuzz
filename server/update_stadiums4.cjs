const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'cricketRoutes.js');
let content = fs.readFileSync(filePath, 'utf8');

const updates = [
    { name: 'Shere Bangla National Stadium, Dhaka', cap: 25000, est: '2004' },
    { name: 'Zahur Ahmed Chowdhury Stadium, Chittagong', cap: 22000, est: '2004' },
    { name: 'Sylhet International Cricket Stadium', cap: 18500, est: '2014' },
    
    { name: 'Kensington Oval, Bridgetown', cap: 28000, est: '1871' },
    { name: "Queen's Park Oval, Port of Spain", cap: 20000, est: '1896' },
    { name: 'Sabina Park, Kingston', cap: 20000, est: '1930' },
    { name: 'Sir Vivian Richards Stadium, Antigua', cap: 10000, est: '2007' },
    { name: 'Providence Stadium, Guyana', cap: 15000, est: '2006' },
    { name: 'National Cricket Stadium, Grenada', cap: 20000, est: '1999' },
    { name: 'Windsor Park, Dominica', cap: 12000, est: '2007' },
    { name: 'Daren Sammy Cricket Ground, St Lucia', cap: 15000, est: '2002' },
    { name: 'Brian Lara Cricket Academy, Tarouba', cap: 15000, est: '2017' },
    
    { name: 'Dubai International Cricket Stadium', cap: 25000, est: '2009' },
    { name: 'Sheikh Zayed Stadium, Abu Dhabi', cap: 20000, est: '2004' },
    { name: 'Sharjah Cricket Stadium', cap: 16000, est: '1982' }
];

for (const update of updates) {
    const regex = new RegExp(`(name:\\s*['"]${update.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}['"]\\s*,[\\s\\S]*?capacity:\\s*)\\d+(,[\\s\\S]*?established:\\s*['"])[^'"]*(['"])`, 'gi');
    
    if (regex.test(content)) {
        content = content.replace(regex, `$1${update.cap}$2${update.est}$3`);
        console.log(`Updated ${update.name}`);
    } else {
        console.log(`Could not find or match ${update.name}`);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
