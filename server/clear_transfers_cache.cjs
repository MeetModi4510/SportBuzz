const mongoose = require('mongoose');

async function clearCache() {
  await mongoose.connect(process.env.ALLSPORTS_MONGO_URI || 'mongodb://localhost:27017/sportbuzz');
  const db = mongoose.connection;
  await db.collection('footballtransfers').deleteMany({});
  console.log('Transfers cache cleared!');
  mongoose.disconnect();
}

clearCache().catch(console.error);
