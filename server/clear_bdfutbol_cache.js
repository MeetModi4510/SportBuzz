import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;
console.log("Connecting to:", uri.replace(/:([^:@]{3,})@/, ':***@'));

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB Atlas.");
    const db = mongoose.connection.db;
    const result = await db.collection('bdfutbolcaches').deleteMany({});
    console.log(`Deleted ${result.deletedCount} cached documents from remote DB!`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    mongoose.disconnect();
  });
