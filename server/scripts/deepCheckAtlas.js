import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const deepCheck = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Atlas\n');

        const db = mongoose.connection.db;

        // ── Users ──────────────────────────────────────────────
        const users = await db.collection('users').find({}).toArray();
        console.log(`👥 USERS (${users.length}):`);
        users.forEach(u => console.log(`   ${u.role?.padEnd(8)} | ${u.email} | ${u.fullName}`));

        // ── Tournaments (Cricket) ─────────────────────────────
        const tournaments = await db.collection('tournaments').find({}).toArray();
        console.log(`\n🏟️  CRICKET TOURNAMENTS (${tournaments.length}):`);
        tournaments.forEach(t => {
            console.log(`   [${t.status}] ${t.name}`);
            console.log(`     sport:${t.sport} | teams:${t.teams?.length||0} | matches:${t.matches?.length||0}`);
        });

        // ── Cricket Matches ──────────────────────────────────
        const matches = await db.collection('matches').find({}).toArray();
        console.log(`\n🏏 CRICKET MATCHES (${matches.length}):`);
        matches.forEach(m => {
            console.log(`   [${m.status}] ${m.homeTeam} vs ${m.awayTeam} | type:${m.matchType}`);
        });

        // ── Teams ────────────────────────────────────────────
        const teams = await db.collection('teams').find({}).toArray();
        console.log(`\n🤝 TEAMS (${teams.length}):`);
        teams.forEach(t => console.log(`   ${t.name} | players:${t.players?.length||0}`));

        // ── Players ──────────────────────────────────────────
        const players = await db.collection('players').find({}).toArray();
        console.log(`\n👤 PLAYERS (${players.length}):`);
        players.forEach(p => console.log(`   ${p.name||p.fullName} | role:${p.role}`));

        // ── Football Tournaments ──────────────────────────────
        const ftournaments = await db.collection('footballtournaments').find({}).toArray();
        console.log(`\n⚽ FOOTBALL TOURNAMENTS (${ftournaments.length}):`);
        ftournaments.forEach(t => console.log(`   [${t.status}] ${t.name} | teams:${t.teams?.length||0}`));

        // ── Football Matches ─────────────────────────────────
        const fmatches = await db.collection('footballmatches').find({}).toArray();
        console.log(`\n⚽ FOOTBALL MATCHES (${fmatches.length}):`);
        fmatches.forEach(m => console.log(`   [${m.status}] ${m.homeTeam} vs ${m.awayTeam}`));

        // ── Admin check ──────────────────────────────────────
        const admins = users.filter(u => u.role === 'admin');
        console.log(`\n👑 ADMINS: ${admins.length}`);
        admins.forEach(a => console.log(`   ${a.email}`));

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

deepCheck();
