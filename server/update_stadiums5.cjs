const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'cricketRoutes.js');
let content = fs.readFileSync(filePath, 'utf8');

const updates = [
    { name: 'Harare Sports Club', cap: 10000, est: '1900' },
    { name: 'Queens Sports Club, Bulawayo', cap: 13000, est: '1890' },
    
    { name: 'Eden Park, Auckland', cap: 50000, est: '1900' },
    { name: 'Basin Reserve, Wellington', cap: 13000, est: '1868' },
    { name: 'Hagley Oval, Christchurch', cap: 20000, est: '1867' },
    { name: 'Seddon Park, Hamilton', cap: 10000, est: '1950' },
    { name: 'McLean Park, Napier', cap: 19700, est: '1911' },
    { name: 'University Oval, Dunedin', cap: 3500, est: '1920' },
    
    { name: 'The Village, Dublin', cap: 11500, est: '1993' },
    { name: 'The Grange Cricket Club, Edinburgh', cap: 5000, est: '1832' }
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
