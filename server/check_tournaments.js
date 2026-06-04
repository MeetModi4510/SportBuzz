import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const tournamentSchema = new mongoose.Schema({}, { strict: false });
const Tournament = mongoose.model('Tournament', tournamentSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const ts = await Tournament.find({}).sort({ _id: -1 }).limit(3);
    console.log(ts.map(t => ({ name: t.name, matchType: t.matchType, overs: t.overs, testDays: t.testDays, oversPerSession: t.oversPerSession })));
    process.exit(0);
}
check();
