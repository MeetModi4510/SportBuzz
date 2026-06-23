import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { scrapeFotmobTransfers } from './services/fotmobTransfersScraper.js';
import FootballTransfer from './models/FootballTransfer.js';

dotenv.config({ path: './.env' });

async function populateDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Atlas DB');

        console.log('Scraping transfers...');
        const allTransfers = await scrapeFotmobTransfers();
        console.log(`Scraped ${allTransfers.length} transfers.`);

        const now = new Date();
        const cacheExpiry = new Date(now.getTime() + 10 * 60000); // +10 minutes

        const docs = allTransfers.map(t => {
            const isPop = t.isPopular || false;
            return {
                transferId: `${t.playerId}_${t.transferDate}`,
                playerId: t.playerId,
                playerName: t.name,
                playerImage: t.playerImage,
                position: t.position?.label || t.position?.key || '',
                fromClub: t.fromClub,
                fromClubFullName: t.fromClubFullName,
                fromClubId: t.fromClubId,
                fromClubLogo: t.fromClubLogo,
                toClub: t.toClub,
                toClubFullName: t.toClubFullName,
                toClubId: t.toClubId,
                toClubLogo: t.toClubLogo,
                transferDate: t.transferDate,
                fee: t.fee,
                feeValue: t.feeValue,
                transferType: t.transferType,
                marketValue: t.marketValue || 0,
                leagueId: t.leagueId,
                onLoan: t.onLoan || false,
                contractExtension: t.contractExtension || false,
                isPopular: isPop,
                cacheExpiry,
                lastFetched: now,
            };
        });

        console.log('Clearing old footballtransfers...');
        await FootballTransfer.deleteMany({});
        
        console.log('Inserting docs...');
        await FootballTransfer.insertMany(docs);
        
        const popularCount = docs.filter(d => d.isPopular).length;
        console.log(`Done! Saved ${docs.length} transfers to DB (${popularCount} popular).`);
        
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

populateDB();
