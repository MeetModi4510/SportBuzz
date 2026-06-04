import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const KEY = process.env.CRICKETDATA_KEY;
const CD = 'https://api.cricapi.com/v1';

async function crossCheck() {
    console.log('============================================================');
    console.log(' CROSS-CHECK: TEST & ODI — Raw API vs Featured Output');
    console.log('============================================================\n');

    // ── 1. Fetch raw data from all 3 API sources ─────────────────────
    console.log('--- STEP 1: Fetching raw API data from all 3 sources ---\n');

    const [currentRes, matchesRes, wcRes] = await Promise.all([
        axios.get(`${CD}/currentMatches?apikey=${KEY}&offset=0`).catch(e => ({ data: { data: [] } })),
        axios.get(`${CD}/matches?apikey=${KEY}&offset=0`).catch(e => ({ data: { data: [] } })),
        axios.get(`${CD}/series_info?apikey=${KEY}&id=0cdf6736-ad9b-4e95-a647-5ee3a99c5510`).catch(e => ({ data: { data: { matchList: [] } } }))
    ]);

    const currentMatches = currentRes.data?.data || [];
    const allMatchesRaw = matchesRes.data?.data || [];
    const wcMatches = wcRes.data?.data?.matchList || [];

    // Merge & dedup (same logic as featuredController.js)
    const matchMap = new Map();
    allMatchesRaw.forEach(m => matchMap.set(m.id, m));
    wcMatches.forEach(m => { if (m.id) matchMap.set(m.id, m); });
    currentMatches.forEach(m => matchMap.set(m.id, m));
    const allMerged = Array.from(matchMap.values());

    // Categorize
    const testMatches = allMerged.filter(m => (m.matchType || '').toLowerCase().includes('test'));
    const odiMatches = allMerged.filter(m => (m.matchType || '').toLowerCase().includes('odi'));

    // ── Classification helpers (same as featuredController.js) ───────
    const resultKeywords = ['won by', 'won at', 'draw', 'drawn', 'tied', 'no result', 'abandoned', 'match ended', 'completed', 'stumps - day 5'];
    const liveKeywords = ['live', 'innings break', 'stumps', 'tea', 'lunch', 'rain', 'delay', 'need', 'trail', 'require', 'lead', 'day 1', 'day 2', 'day 3', 'day 4', 'day 5', 'in progress'];

    const VALID_SERIES_KEYWORDS = [
        'icc', 'world cup', 'world t20', 't20 world cup', 'cwc', 'champions trophy',
        'ranji', 'trophy', 'premier league', 'ipl', 'bpl', 'psl', 'bbl', 'cpl',
        'shield', 'cup', 'one-day', 'ford trophy', 'marsh', 'domestic',
        'csa', 'four-day', 'division', 'lions', 'titans', 'dolphins', 'warriors',
        'knights', 'cobras', 'boland', 'north west', 'kwazulu', 'western province',
        'eastern cape', 'free state', 'south western',
        'asia cup', 'ashes', 'border-gavaskar',
        'test match', 'test series', 'odi series', 't20i series', 'bilateral',
        'tour', 'tri-series', 'quadrangular', 'warm up', 'warmup', 'warm-up',
        'india', 'england', 'australia', 'pakistan', 'south africa', 'new zealand',
        'west indies', 'sri lanka', 'bangladesh', 'afghanistan', 'zimbabwe',
        'ireland', 'netherlands', 'scotland', 'nepal', 'uae', 'oman', 'usa', 'canada',
        'namibia', 'kenya', 'hong kong', 'italy', 'united arab emirates',
        'international', 'inter-cup', 'quarter-final', 'semi-final', 'final'
    ];

    const isValidSeries = (m) => {
        const combined = `${(m.name || '')} ${(m.series || m.seriesName || '')}`.toLowerCase();
        return VALID_SERIES_KEYWORDS.some(k => combined.includes(k));
    };

    const classify = (m) => {
        const status = (m.status || '').toLowerCase();
        const hasResult = resultKeywords.some(k => status.includes(k));
        if (hasResult || m.matchEnded === true) return 'COMPLETED';
        const isLiveByKeyword = liveKeywords.some(k => status.includes(k));
        const isLiveByFlags = m.matchStarted && !m.matchEnded;
        if (isLiveByKeyword || isLiveByFlags) return 'LIVE';
        return 'UPCOMING';
    };

    const getStartTime = (m) => {
        let s = m.dateTimeGMT || m.start_time || m.date;
        if (s && typeof s === 'string' && !s.endsWith('Z') && s.includes('T')) s += 'Z';
        return new Date(s);
    };

    // ── Analyze a format ──────────────────────────────────────────────
    function analyzeFormat(formatName, matches) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(` ${formatName} FORMAT — RAW API DATA`);
        console.log(`${'='.repeat(60)}`);

        const valid = matches.filter(isValidSeries);
        const invalid = matches.filter(m => !isValidSeries(m));

        console.log(`Total ${formatName} matches in API: ${matches.length}`);
        console.log(`Valid (pass keyword filter): ${valid.length}`);
        console.log(`Filtered out: ${invalid.length}`);

        if (invalid.length > 0) {
            console.log(`  Filtered out matches:`);
            invalid.forEach(m => console.log(`    ❌ "${m.name}" (series: "${m.series || m.seriesName || 'N/A'}")`));
        }

        const livePool = [];
        const completedPool = [];
        const upcomingPool = [];

        valid.forEach(m => {
            const cls = classify(m);
            if (cls === 'LIVE') livePool.push(m);
            else if (cls === 'COMPLETED') completedPool.push(m);
            else upcomingPool.push(m);
        });

        // Sort same as featuredController.js
        livePool.sort((a, b) => getStartTime(b) - getStartTime(a));
        completedPool.sort((a, b) => getStartTime(b) - getStartTime(a));
        upcomingPool.sort((a, b) => getStartTime(a) - getStartTime(b));

        console.log(`\nPools → Live: ${livePool.length}, Completed: ${completedPool.length}, Upcoming: ${upcomingPool.length}`);

        if (livePool.length > 0) {
            console.log(`\n  🟢 LIVE (sorted desc by dateTimeGMT):`);
            livePool.forEach((m, i) => console.log(`    ${i + 1}. "${m.name}" | Status: "${m.status}" | dateTimeGMT: ${m.dateTimeGMT} | Score: ${JSON.stringify(m.score)}`));
        }
        if (completedPool.length > 0) {
            console.log(`\n  ✅ COMPLETED (sorted desc by dateTimeGMT — top 5):`);
            completedPool.slice(0, 5).forEach((m, i) => console.log(`    ${i + 1}. "${m.name}" | Status: "${m.status}" | dateTimeGMT: ${m.dateTimeGMT}`));
            if (completedPool.length > 5) console.log(`    ... and ${completedPool.length - 5} more`);
        }
        if (upcomingPool.length > 0) {
            console.log(`\n  ⏳ UPCOMING (sorted asc by dateTimeGMT — top 5):`);
            upcomingPool.slice(0, 5).forEach((m, i) => console.log(`    ${i + 1}. "${m.name}" | Status: "${m.status}" | dateTimeGMT: ${m.dateTimeGMT}`));
            if (upcomingPool.length > 5) console.log(`    ... and ${upcomingPool.length - 5} more`);
        }

        // ── Determine which rule fires ────────────────────────────────
        let expectedRule, expectedPicks = [];
        if (livePool.length > 0) {
            expectedRule = 'Rule 1: 1 Live + 1 Upcoming + 1 Completed';
            if (livePool[0]) expectedPicks.push({ role: 'LIVE', match: livePool[0] });
            if (upcomingPool[0]) expectedPicks.push({ role: 'UPCOMING', match: upcomingPool[0] });
            if (completedPool[0]) expectedPicks.push({ role: 'COMPLETED', match: completedPool[0] });
        } else if (upcomingPool.length > 0) {
            expectedRule = 'Rule 2: 2 Completed + 1 Upcoming';
            if (completedPool[0]) expectedPicks.push({ role: 'COMPLETED', match: completedPool[0] });
            if (completedPool[1]) expectedPicks.push({ role: 'COMPLETED', match: completedPool[1] });
            if (upcomingPool[0]) expectedPicks.push({ role: 'UPCOMING', match: upcomingPool[0] });
        } else {
            expectedRule = 'Rule 3: 2 Completed only';
            if (completedPool[0]) expectedPicks.push({ role: 'COMPLETED', match: completedPool[0] });
            if (completedPool[1]) expectedPicks.push({ role: 'COMPLETED', match: completedPool[1] });
        }

        console.log(`\n  📋 EXPECTED RULE: ${expectedRule}`);
        console.log(`  📋 EXPECTED PICKS:`);
        expectedPicks.forEach((p, i) => console.log(`    ${i + 1}. [${p.role}] "${p.match.name}" | dateTimeGMT: ${p.match.dateTimeGMT}`));

        return { livePool, completedPool, upcomingPool, expectedRule, expectedPicks };
    }

    const testAnalysis = analyzeFormat('TEST', testMatches);
    const odiAnalysis = analyzeFormat('ODI', odiMatches);

    // ── 2. Fetch featured output from our server ─────────────────────
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(' STEP 2: OUR FEATURED OUTPUT (from /api/featured/matches)');
    console.log(`${'='.repeat(60)}\n`);

    try {
        const featuredRes = await axios.get('http://localhost:5000/api/featured/matches');
        const cricket = featuredRes.data?.data?.cricket;

        function showFeatured(formatName, matches, analysis) {
            console.log(`--- ${formatName} FEATURED OUTPUT ---`);
            console.log(`Count: ${(matches || []).length}`);
            (matches || []).forEach((m, i) => {
                const cls = classify(m);
                console.log(`  ${i + 1}. "${m.name}" | Status: "${m.status}" | Classification: ${cls} | dateTimeGMT: ${m.dateTimeGMT}`);
            });

            // Cross-check
            const actualNames = (matches || []).map(m => m.name);
            const expectedNames = analysis.expectedPicks.map(p => p.match.name);
            const allMatch = expectedNames.every(n => actualNames.includes(n)) && actualNames.length === expectedNames.length;

            if (allMatch) {
                console.log(`  ✅ RESULT: CORRECT — Matches expected picks exactly.`);
            } else {
                console.log(`  ❌ RESULT: MISMATCH!`);
                console.log(`    Expected: ${expectedNames.join(' | ')}`);
                console.log(`    Got:      ${actualNames.join(' | ')}`);
            }
            console.log('');
        }

        showFeatured('TEST', cricket?.test, testAnalysis);
        showFeatured('ODI', cricket?.odi, odiAnalysis);

    } catch (e) {
        console.error('Failed to fetch featured output:', e.message);
    }
}

crossCheck().catch(e => console.error(e));
