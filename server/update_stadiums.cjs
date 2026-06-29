const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'cricketRoutes.js');
let content = fs.readFileSync(filePath, 'utf8');

const updates = [
    { name: 'Wankhede Stadium, Mumbai', cap: 33000, est: '1974' },
    { name: 'Eden Gardens, Kolkata', cap: 68000, est: '1864' },
    { name: 'MA Chidambaram Stadium, Chennai', cap: 38000, est: '1916' },
    { name: 'Arun Jaitley Stadium, Delhi', cap: 41820, est: '1883' },
    { name: 'M. Chinnaswamy Stadium, Bengaluru', cap: 40000, est: '1969' },
    { name: 'Narendra Modi Stadium, Ahmedabad', cap: 132000, est: '1982 (renovated 2020)' },
    { name: 'Rajiv Gandhi International Stadium, Hyderabad', cap: 55000, est: '2004' },
    { name: 'HPCA Stadium, Dharamsala', cap: 23000, est: '2003' },
    { name: 'VCA Stadium, Nagpur', cap: 45000, est: '2008' },
    { name: 'Sawai Mansingh Stadium, Jaipur', cap: 30000, est: '1969' },
    { name: 'Barabati Stadium, Cuttack', cap: 45000, est: '1958' },
    { name: 'Green Park, Kanpur', cap: 32000, est: '1945' },
    { name: 'Saurashtra Cricket Association Stadium, Rajkot', cap: 28000, est: '2008' },
    { name: 'IS Bindra Stadium, Mohali', cap: 26000, est: '1993' },
    { name: 'Ekana Cricket Stadium, Lucknow', cap: 50000, est: '2017' },
    { name: 'Barsapara Cricket Stadium, Guwahati', cap: 40000, est: '2017' },
    { name: 'ACA-VDCA Stadium, Visakhapatnam', cap: 27500, est: '2003' },
    { name: 'Maharaja Yadavindra Singh International Stadium, Mullanpur', cap: 38000, est: '2023' },
    { name: 'Holkar Cricket Stadium, Indore', cap: 30000, est: '1990' },
    { name: 'MCA International Stadium, Pune', cap: 42700, est: '2012' },
    { name: 'JSCA International Stadium Complex, Ranchi', cap: 50000, est: '2013' },
    { name: 'Greenfield International Stadium, Thiruvananthapuram', cap: 55000, est: '2015' }
];

for (const update of updates) {
    const regex = new RegExp(`(name:\\s*['"]${update.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}['"]\\s*,[\\s\\S]*?capacity:\\s*)\\d+(,[\\s\\S]*?established:\\s*['"])[^'"]*(['"])`, 'i');
    
    // Test if match exists
    if (regex.test(content)) {
        content = content.replace(regex, `$1${update.cap}$2${update.est}$3`);
        console.log(`Updated ${update.name}`);
    } else {
        console.log(`Could not find or match ${update.name}`);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
