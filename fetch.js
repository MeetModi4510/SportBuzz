fetch('http://localhost:5000/api/matches').then(r => r.json()).then(d => {
    const fs = require('fs');
    fs.writeFileSync('data.json', JSON.stringify(d.data.find(m => m._id === '699c17c5fbb13e6817e8d529') || d.data[0], null, 2));
    console.log('done');
});
