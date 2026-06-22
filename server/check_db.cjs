const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportbuzz').then(async () => {
    const db = mongoose.connection.db;
    const docs = await db.collection('footballtransfers').find({}).toArray();
    console.log(`Total priority transfers in DB: ${docs.length}`);
    console.log('Types:', [...new Set(docs.map(t => t.transferType))]);
    console.log('Fees:', [...new Set(docs.map(t => t.fee))]);
    
    const freeAgents = docs.filter(t => 
        (t.fromClub || '').toLowerCase().includes('free') || 
        (t.toClub || '').toLowerCase().includes('free') || 
        (t.fromClub || '').toLowerCase().includes('without') || 
        (t.toClub || '').toLowerCase().includes('without') || 
        (t.fromClub || '').toLowerCase().includes('retired') || 
        (t.toClub || '').toLowerCase().includes('retired') ||
        t.fromClubId === 2 || t.toClubId === 2
    );
    console.log('Free Agents Count:', freeAgents.length);
    if (freeAgents.length > 0) console.log(freeAgents[0]);
    
    const contracts = docs.filter(t => t.contractExtension || (t.transferType || '').toLowerCase().includes('contract'));
    console.log('Contracts Count:', contracts.length);
    if (contracts.length > 0) console.log(contracts[0]);
    
    process.exit(0);
}).catch(console.error);
