const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'routes', 'cricketRoutes.js');
let content = fs.readFileSync(filePath, 'utf8');

const updates = [
    { name: 'National Stadium, Karachi', cap: 34000, est: '1955' },
    { name: 'Gaddafi Stadium, Lahore', cap: 27000, est: '1959' },
    { name: 'Rawalpindi Cricket Stadium', cap: 15000, est: '1992' },
    { name: 'Multan Cricket Stadium', cap: 35000, est: '2001' },
    { name: 'Iqbal Stadium, Faisalabad', cap: 18000, est: '1979' },
    
    { name: 'Newlands Cricket Ground, Cape Town', cap: 25000, est: '1888' },
    { name: 'The Wanderers Stadium, Johannesburg', cap: 34000, est: '1956' },
    { name: 'Kingsmead, Durban', cap: 25000, est: '1923' },
    { name: 'SuperSport Park, Centurion', cap: 22000, est: '1986' },
    { name: "St George's Park, Gqeberha", cap: 19000, est: '1889' },
    { name: 'Diamond Oval, Kimberley', cap: 11000, est: '1973' },
    
    { name: 'R Premadasa Stadium, Colombo', cap: 40000, est: '1986' },
    { name: 'Sinhalese Sports Club Ground, Colombo', cap: 10000, est: '1952' },
    { name: 'Galle International Stadium', cap: 35000, est: '1876' },
    { name: 'Pallekele International Cricket Stadium', cap: 35000, est: '2009' },
    { name: 'Asgiriya Stadium, Kandy', cap: 10300, est: '1910' },
    { name: 'P Sara Oval, Colombo', cap: 15000, est: '1945' },
    { name: 'Rangiri Dambulla International Stadium', cap: 16800, est: '2001' }
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
