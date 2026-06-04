/**
 * One-time migration script to assign all existing tournaments to a specific user.
 * 
 * Usage:
 *   node server/migrate_tournament_owner.js <userId>
 * 
 * Example:
 *   node server/migrate_tournament_owner.js 65f1a23b4c5d6e7f8a9b0c1d
 * 
 * This will set the `createdBy` field on all tournaments that don't already have one.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Tournament from './models/Tournament.js';

const userId = process.argv[2];

if (!userId) {
    console.error('❌ Please provide a user ID as argument.');
    console.error('   Usage: node server/migrate_tournament_owner.js <userId>');
    process.exit(1);
}

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const result = await Tournament.updateMany(
            { $or: [{ createdBy: null }, { createdBy: { $exists: false } }] },
            { $set: { createdBy: new mongoose.Types.ObjectId(userId) } }
        );

        console.log(`✅ Migration complete: ${result.modifiedCount} tournaments assigned to user ${userId}`);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
