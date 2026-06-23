/**
 * seed-atlas.js
 * Run this LOCALLY to scrape Transfermarkt and push data to your Atlas MongoDB.
 * Render's IP is blocked by Transfermarkt — your local IP works fine.
 *
 * Usage:  node seed-atlas.js
 */

import mongoose from 'mongoose';
import { scrapeLatestTransfers, scrapeTopTransfers } from './services/transfermarktScraper.js';
import FootballTransfer from './models/FootballTransfer.js';

const ATLAS_URI = 'mongodb+srv://meetmodi45:MeetModi-45@sportbuzz.bfrawfb.mongodb.net/SportBuzz?appName=SportBuzz';

// 30-day cache so Atlas TTL index (which fires 1hr after expiry) doesn't wipe data
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function run() {
  console.log('🔌 Connecting to Atlas MongoDB...');
  await mongoose.connect(ATLAS_URI);
  console.log('✅ Connected to Atlas!\n');

  // ── Scrape latest transfers ───────────────────────────
  console.log('📡 Scraping latest transfers from Transfermarkt (15 pages)...');
  let latestTransfers = [];
  try {
    latestTransfers = await scrapeLatestTransfers(15);
    console.log(`   ✅ Found ${latestTransfers.length} latest transfers`);
  } catch (err) {
    console.error('   ❌ Latest transfers scrape failed:', err.message);
  }

  // ── Scrape top transfers ──────────────────────────────
  console.log('\n📡 Scraping top transfers from Transfermarkt...');
  let topTransfers = [];
  try {
    topTransfers = await scrapeTopTransfers(3);
    console.log(`   ✅ Found ${topTransfers.length} top transfers`);
  } catch (err) {
    console.error('   ❌ Top transfers scrape failed:', err.message);
  }

  const combined = [...latestTransfers, ...topTransfers];

  if (combined.length === 0) {
    console.error('\n❌ No transfers scraped at all. Keeping existing Atlas data unchanged.\n');
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── Deduplicate ───────────────────────────────────────
  const seen = new Set();
  const uniqueTransfers = [];
  for (const t of combined) {
    if (!t || !t.playerId || !t.transferDate) continue;
    const key = `${t.playerId}_${t.transferDate}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTransfers.push(t);
    }
  }

  console.log(`\n📦 Unique transfers to store: ${uniqueTransfers.length}`);

  const cacheExpiry = new Date(Date.now() + CACHE_TTL_MS); // 30 days
  const now = new Date();

  // Mark which ones are top transfers
  const topIds = new Set(topTransfers.map(t => `${t.playerId}_${t.transferDate}`));

  const docs = uniqueTransfers.map(t => ({
    transferId:        `${t.playerId}_${t.transferDate}`,
    playerId:          t.playerId,
    playerName:        t.name || '',          // scraper uses 'name', DB stores as 'playerName'
    playerImage:       t.playerImage || '',
    position:          t.position?.label || t.position?.key || t.position || '',
    fromClub:          t.fromClub || t.fromClubFullName || '',
    fromClubId:        t.fromClubId || 0,
    fromClubLogo:      t.fromClubLogo || '',
    toClub:            t.toClub || t.toClubFullName || '',
    toClubId:          t.toClubId || 0,
    toClubLogo:        t.toClubLogo || '',
    transferDate:      new Date(t.transferDate || now),
    fee:               t.fee || '',
    feeValue:          t.feeValue || 0,
    transferType:      t.transferType || '',
    marketValue:       t.marketValue || 0,
    leagueId:          t.leagueId || '',
    onLoan:            t.onLoan || false,
    contractExtension: t.contractExtension || false,
    isTopTransfer:     topIds.has(`${t.playerId}_${t.transferDate}`),
    cacheExpiry,       // 30 days — Atlas TTL won't auto-delete for 30+ days
    lastFetched:       now,
  }));

  // ── Write to Atlas ────────────────────────────────────
  // Only clear AFTER confirming we have new data
  console.log('\n🗑️  Clearing old transfers from Atlas...');
  await FootballTransfer.deleteMany({});

  console.log('💾 Inserting new transfers...');
  const result = await FootballTransfer.insertMany(docs, { ordered: false });
  console.log(`\n✅ Successfully stored ${result.length} transfers in Atlas MongoDB!`);
  console.log(`   Cache expires: ${cacheExpiry.toLocaleDateString()} (30 days)\n`);

  // Sample output
  console.log('Sample transfers:');
  result.slice(0, 8).forEach(t => {
    console.log(`  • ${t.playerName} | ${t.fromClub} → ${t.toClub} | ${t.leagueId} | ${t.feeValue ? '€' + (t.feeValue/1e6).toFixed(1) + 'M' : t.fee || 'N/A'}`);
  });

  await mongoose.disconnect();
  console.log('\n🔌 Disconnected. Done! Your friend can now see transfers on Vercel.');
}

run().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
