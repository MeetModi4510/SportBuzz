import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const FootballTransfer = (await import('./models/FootballTransfer.js')).default;
        await FootballTransfer.deleteMany({});
        console.log("Deleted all transfers to force cache flush.");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
