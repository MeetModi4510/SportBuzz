import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { scrapeFotmobTransfers } from './services/fotmobTransfersScraper.js';
import FootballTransfer from './models/FootballTransfer.js';

async function update() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const combined = await scrapeFotmobTransfers();
  console.log('Scraped total:', combined.length);
  
  const populars = combined.filter(t => t.isPopular);
  console.log('Scraped popular:', populars.length);
  
  for (const t of combined) {
      await FootballTransfer.updateOne(
          { transferId: `${t.playerId}_${t.transferDate}` },
          { $set: { isPopular: t.isPopular || false, feeValue: t.feeValue || 0, marketValue: t.marketValue || 0 } }
      );
  }
  
  console.log('Database updated manually for testing.');
  process.exit(0);
}
update();
