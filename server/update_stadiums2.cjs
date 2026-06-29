const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'cricketRoutes.js');
let content = fs.readFileSync(filePath, 'utf8');

const updates = [
    { name: 'Melbourne Cricket Ground', cap: 100024, est: '1853' },
    { name: 'Sydney Cricket Ground', cap: 48000, est: '1848' },
    { name: 'The Gabba, Brisbane', cap: 42000, est: '1895' },
    { name: 'Adelaide Oval', cap: 53500, est: '1871' },
    { name: 'Optus Stadium, Perth', cap: 61266, est: '2018' },
    { name: 'WACA Ground, Perth', cap: 20000, est: '1893' },
    { name: 'Manuka Oval, Canberra', cap: 12000, est: '1929' },
    { name: 'Blundstone Arena, Hobart', cap: 20000, est: '1914' },
    
    { name: "Lord's Cricket Ground, London", cap: 31100, est: '1814' },
    { name: 'The Oval, London', cap: 27500, est: '1845' },
    { name: 'Old Trafford, Manchester', cap: 26000, est: '1857' },
    { name: 'Edgbaston, Birmingham', cap: 25000, est: '1882' },
    { name: 'Headingley, Leeds', cap: 18350, est: '1890' },
    { name: 'Trent Bridge, Nottingham', cap: 17500, est: '1841' },
    { name: 'Riverside Ground, Chester-le-Street', cap: 17000, est: '1995' },
    { name: 'The Rose Bowl, Southampton', cap: 25000, est: '2001' },
    { name: 'Sophia Gardens, Cardiff', cap: 15600, est: '1967' }
];

for (const update of updates) {
    const regex = new RegExp(`(name:\\s*['"]${update.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}['"]\\s*,[\\s\\S]*?capacity:\\s*)\\d+(,[\\s\\S]*?established:\\s*['"])[^'"]*(['"])`, 'i');
    
    if (regex.test(content)) {
        content = content.replace(regex, `$1${update.cap}$2${update.est}$3`);
        console.log(`Updated ${update.name}`);
    } else {
        console.log(`Could not find or match ${update.name}`);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
