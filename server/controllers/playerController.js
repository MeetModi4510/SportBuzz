import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs';
import Ball from '../models/Ball.js';
import Match from '../models/Match.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import Player from '../models/Player.js';

const getMatchAwards = (mid, batInning, bowlInning) => {
    const awards = [];
    
    // 1. Boundary King
    if (batInning && (batInning.fours + batInning.sixes) >= 3) {
        awards.push({ id: 'boundary_king', title: 'Boundary King', icon: '👑', reason: `${batInning.fours + batInning.sixes} boundaries in an innings` });
    }
    
    // 2. Electric Striker
    if (batInning && batInning.ballsFaced >= 6 && (batInning.runs / batInning.ballsFaced * 100) >= 150) {
        awards.push({ id: 'electric_striker', title: 'Electric Striker', icon: '⚡', reason: `SR of ${(batInning.runs / batInning.ballsFaced * 100).toFixed(1)} (min 6 balls)` });
    }
    
    // 3. Anchor
    if (batInning && batInning.ballsFaced >= 15) {
        awards.push({ id: 'solid_anchor', title: 'Solid Anchor', icon: '⚓', reason: `Faced ${batInning.ballsFaced} balls in a single innings` });
    }

    // 4. Century Maker
    if (batInning && batInning.runs >= 100) {
        awards.push({ id: 'century_maker', title: 'Century Maker', icon: '💯', reason: `Scored a century (${batInning.runs} runs)` });
    }

    // 5. Fifty Machine
    if (batInning && batInning.runs >= 30) {
        awards.push({ id: 'fifty_machine', title: 'Impact Player', icon: '🏏', reason: `Scored ${batInning.runs} crucial runs` });
    }
    
    // 6. Bowling Maestro
    if (bowlInning && bowlInning.legalDeliveries >= 6 && (bowlInning.runsConceded / (bowlInning.legalDeliveries / 6)) <= 7.0) {
        awards.push({ id: 'bowling_maestro', title: 'Bowling Maestro', icon: '🪄', reason: `Economy of ${(bowlInning.runsConceded / (bowlInning.legalDeliveries / 6)).toFixed(1)} (min 1 over)` });
    }
    
    // 7. Wicket Machine
    if (bowlInning && bowlInning.wickets >= 2) {
        awards.push({ id: 'wicket_machine', title: 'Wicket Machine', icon: '🎯', reason: `Captured ${bowlInning.wickets} wickets in a match` });
    }

    return awards;
};

const calculateTraits = (batBalls, bowlBalls, matchData, bowlerRolesMap, playerName) => {
    const traits = [];
    
    // 1. Phase Dominance
    const phases = {
        powerplay: { runs: 0, balls: 0, outs: 0 },
        middle: { runs: 0, balls: 0, outs: 0 },
        death: { runs: 0, balls: 0, outs: 0 }
    };

    const pNameLower = playerName.trim().toLowerCase();
    batBalls.forEach(b => {
        const over = b.over;
        let phase = 'middle';
        if (over < 6) phase = 'powerplay';
        else if (over >= 15) phase = 'death';

        if (b.extraType === 'none' || b.extraType === 'noball') phases[phase].runs += b.runs;
        if (b.extraType !== 'wide') phases[phase].balls += 1;
        const pOut = (b.wicket?.playerOut || '').trim().toLowerCase();
        const bName = (b.batsman || '').trim().toLowerCase();
        if (b.wicket?.isWicket && (pOut === pNameLower || bName === pNameLower)) {
            phases[phase].outs += 1;
        }
    });

    if (phases.powerplay.balls >= 3) {
        const sr = (phases.powerplay.runs / phases.powerplay.balls) * 100;
        if (sr >= 130) traits.push({ id: 'pp_king', title: 'Powerplay Aggressor', icon: '🔥', description: 'Attack-minded in the first 6 overs', type: 'strength' });
    }
    if (phases.death.balls >= 3) {
        const sr = (phases.death.runs / phases.death.balls) * 100;
        if (sr >= 160) traits.push({ id: 'death_finisher', title: 'Late-order Finisher', icon: '🧨', description: 'Highly explosive in the final overs', type: 'strength' });
    }
    if (phases.middle.balls >= 6) {
        const avg = phases.middle.outs > 0 ? (phases.middle.runs / phases.middle.outs) : phases.middle.runs;
        if (avg >= 35) traits.push({ id: 'middle_anchor', title: 'Reliable Anchor', icon: '⚓', description: 'Steady during the middle phase', type: 'strength' });
    }

    // 2. Matchup Insights (vs Bowler Style)
    const matchupStats = {
        pace: { runs: 0, balls: 0, outs: 0 },
        spin: { runs: 0, balls: 0, outs: 0 }
    };

    batBalls.forEach(b => {
        const bNameLower = (b.bowler || '').trim().toLowerCase();
        const role = (bowlerRolesMap[bNameLower] || '').toLowerCase();
        let type = null;
        if (role.includes('fast') || role.includes('pace') || role.includes('medium')) type = 'pace';
        else if (role.includes('spin') || role.includes('off') || role.includes('leg')) type = 'spin';

        if (type) {
            if (b.extraType === 'none' || b.extraType === 'noball') matchupStats[type].runs += b.runs;
            if (b.extraType !== 'wide') matchupStats[type].balls += 1;
            const pOut = (b.wicket?.playerOut || '').trim().toLowerCase();
            const batName = (b.batsman || '').trim().toLowerCase();
            if (b.wicket?.isWicket && (pOut === pNameLower || batName === pNameLower)) {
                matchupStats[type].outs += 1;
            }
        }
    });

    if (matchupStats.pace.balls >= 3) {
        const sr = (matchupStats.pace.runs / matchupStats.pace.balls) * 100;
        const avg = matchupStats.pace.outs > 0 ? (matchupStats.pace.runs / matchupStats.pace.outs) : matchupStats.pace.runs;
        if (sr >= 130 || avg >= 35) {
            traits.push({ id: 'pace_specialist', title: 'Pace Specialist', icon: '🏎️', description: 'Effective against fast bowlers', type: 'strength' });
        } else if (avg < 15 && matchupStats.pace.outs >= 1) {
            traits.push({ id: 'pace_struggle', title: 'Struggles vs Pace', icon: '⚠️', description: 'Low average against fast bowlers', type: 'weakness' });
        }
    }
    
    if (matchupStats.spin.balls >= 3) {
        const sr = (matchupStats.spin.runs / matchupStats.spin.balls) * 100;
        const avg = matchupStats.spin.outs > 0 ? (matchupStats.spin.runs / matchupStats.spin.outs) : matchupStats.spin.runs;
        if (sr >= 120 || avg >= 35) {
            traits.push({ id: 'spin_wizard', title: 'Spin Master', icon: '🌪️', description: 'Controls the game against spin', type: 'strength' });
        } else if (avg < 15 && matchupStats.spin.outs >= 1) {
            traits.push({ id: 'spin_struggle', title: 'Struggles vs Spin', icon: '⚠️', description: 'Finds it hard to score against spin', type: 'weakness' });
        }
    }

    // 3. Bowling Traits
    const bowlStats = { totals: { runs: 0, balls: 0, wickets: 0, dots: 0 }, phases: { pp: { runs: 0, balls: 0, wickets: 0 }, death: { runs: 0, balls: 0, wickets: 0 } } };
    bowlBalls.forEach(b => {
        const runs = b.totalBallRuns || 0;
        bowlStats.totals.runs += runs;
        if (b.extraType !== 'wide' && b.extraType !== 'noball') bowlStats.totals.balls += 1;
        if (runs === 0) bowlStats.totals.dots += 1;
        if (b.wicket?.isWicket && b.wicket.type !== 'runout') bowlStats.totals.wickets += 1;

        if (b.over < 6) {
            bowlStats.phases.pp.runs += runs;
            bowlStats.phases.pp.balls += 1;
            if (b.wicket?.isWicket && b.wicket.type !== 'runout') bowlStats.phases.pp.wickets += 1;
        } else if (b.over >= 15) {
            bowlStats.phases.death.runs += runs;
            bowlStats.phases.death.balls += 1;
            if (b.wicket?.isWicket && b.wicket.type !== 'runout') bowlStats.phases.death.wickets += 1;
        }
    });

    if (bowlStats.totals.balls >= 12) {
        const eco = (bowlStats.totals.runs / bowlStats.totals.balls) * 6;
        const wktRate = bowlStats.totals.balls / Math.max(1, bowlStats.totals.wickets);
        const dotPct = (bowlStats.totals.dots / bowlStats.totals.balls) * 100;

        if (eco < 7.5) traits.push({ id: 'miserly', title: 'Economic Force', icon: '📉', description: 'Consistently Keeps runs under control', type: 'strength' });
        if (wktRate < 15) traits.push({ id: 'wicket_taker', title: 'Wicket Magnet', icon: '🎯', description: 'Has a knack for regular breakthroughs', type: 'strength' });
        if (dotPct > 45) traits.push({ id: 'pressure_cooker', title: 'Pressure Cooker', icon: '😤', description: 'Builds immense pressure with dot balls', type: 'strength' });
    }

    if (bowlStats.phases.pp.balls >= 6 && (bowlStats.phases.pp.wickets >= 2 || (bowlStats.phases.pp.runs / bowlStats.phases.pp.balls * 6) < 6.5)) {
        traits.push({ id: 'pp_specialist', title: 'Early Breakthrough Opener', icon: '🆕', description: 'Dangerous with the new ball', type: 'strength' });
    }
    if (bowlStats.phases.death.balls >= 3 && (bowlStats.phases.death.runs / bowlStats.phases.death.balls * 6) < 8.5) {
        traits.push({ id: 'death_specialist', title: 'Death Over Specialist', icon: '🛡️', description: 'Ice-cool under pressure in final overs', type: 'strength' });
    }

    // 4. General Traits
    const batRuns = batBalls.reduce((s, b) => s + ((b.extraType === 'none' || b.extraType === 'noball') ? b.runs : 0), 0);
    const batBallsFaced = batBalls.filter(b => b.extraType !== 'wide').length;
    if (batBallsFaced >= 5) { // Lowered from 10
        const sr = (batRuns / batBallsFaced) * 100;
        if (sr >= 120) traits.push({ id: 'aggressive', title: 'Aggressive Intent', icon: '💥', description: 'Maintains a high strike rate across formats', type: 'strength' });
        const outs = batBalls.filter(b => b.wicket?.isWicket && (b.wicket.playerOut?.toLowerCase() === pNameLower || b.batsman?.toLowerCase() === pNameLower)).length;
        const avg = outs > 0 ? batRuns / outs : batRuns;
        if (avg >= 25) traits.push({ id: 'consistent', title: 'Reliable Run-getter', icon: '📈', description: 'Averages highly with the bat', type: 'strength' });
    }

    // 5. Wagon Wheel Zone Analysis
    const zoneBalls = batBalls.filter(b => b.shotDirection && (b.extraType === 'none' || b.extraType === 'noball'));
    if (zoneBalls.length >= 5) {
        const zoneMap = {};
        const ZONE_LABELS = {
            'cover': 'Cover', 'mid-off': 'Mid Off', 'mid-on': 'Mid On',
            'midwicket': 'Midwicket', 'square-leg': 'Square Leg', 'fine-leg': 'Fine Leg',
            'third-man': 'Third Man', 'point': 'Point', 'straight': 'Straight'
        };
        const OFFSIDE = ['cover', 'mid-off', 'point', 'third-man'];
        const LEGSIDE = ['midwicket', 'square-leg', 'fine-leg', 'mid-on'];

        zoneBalls.forEach(b => {
            const d = b.shotDirection;
            if (!zoneMap[d]) zoneMap[d] = { runs: 0, balls: 0, fours: 0, sixes: 0, boundaries: 0 };
            zoneMap[d].runs += b.runs;
            zoneMap[d].balls++;
            if (b.runs === 4) { zoneMap[d].fours++; zoneMap[d].boundaries++; }
            if (b.runs === 6) { zoneMap[d].sixes++; zoneMap[d].boundaries++; }
        });

        const totalZoneRuns = zoneBalls.reduce((s, b) => s + b.runs, 0);
        const zoneEntries = Object.entries(zoneMap).sort((a, b) => b[1].runs - a[1].runs);

        // (a) Dominant scoring zones — top 2 zones by runs
        if (zoneEntries.length >= 2) {
            const [topZone, topData] = zoneEntries[0];
            const topPct = totalZoneRuns > 0 ? ((topData.runs / totalZoneRuns) * 100).toFixed(0) : 0;
            const topLabel = ZONE_LABELS[topZone] || topZone;
            traits.push({
                id: 'zone_dominant_1',
                title: `${topLabel} Specialist`,
                icon: '🎯',
                description: `Scores ${topPct}% of runs through ${topLabel.toLowerCase()} (${topData.runs} runs off ${topData.balls} balls)`,
                type: 'strength'
            });

            const [secondZone, secondData] = zoneEntries[1];
            const secPct = totalZoneRuns > 0 ? ((secondData.runs / totalZoneRuns) * 100).toFixed(0) : 0;
            const secLabel = ZONE_LABELS[secondZone] || secondZone;
            if (Number(secPct) >= 15) {
                traits.push({
                    id: 'zone_dominant_2',
                    title: `Strong through ${secLabel}`,
                    icon: '💪',
                    description: `${secPct}% of runs come through ${secLabel.toLowerCase()} (${secondData.runs} runs, ${secondData.boundaries} boundaries)`,
                    type: 'strength'
                });
            }
        }

        // (b) Boundary-heavy zone
        const boundaryZones = zoneEntries.filter(([, d]) => d.boundaries >= 2).sort((a, b) => b[1].boundaries - a[1].boundaries);
        if (boundaryZones.length > 0) {
            const [bZone, bData] = boundaryZones[0];
            const bLabel = ZONE_LABELS[bZone] || bZone;
            traits.push({
                id: 'zone_boundary_king',
                title: `Boundary Zone: ${bLabel}`,
                icon: '🔥',
                description: `${bData.boundaries} boundaries (${bData.fours}×4, ${bData.sixes}×6) through ${bLabel.toLowerCase()} — prime attacking area`,
                type: 'strength'
            });
        }

        // (c) Off-side vs Leg-side preference
        let offRuns = 0, offBalls = 0, legRuns = 0, legBalls = 0;
        zoneBalls.forEach(b => {
            if (OFFSIDE.includes(b.shotDirection)) { offRuns += b.runs; offBalls++; }
            if (LEGSIDE.includes(b.shotDirection)) { legRuns += b.runs; legBalls++; }
        });
        const totalSidedRuns = offRuns + legRuns;
        if (totalSidedRuns > 0 && (offBalls + legBalls) >= 5) {
            const offPct = (offRuns / totalSidedRuns * 100).toFixed(0);
            const legPct = (legRuns / totalSidedRuns * 100).toFixed(0);
            if (Number(offPct) >= 65) {
                traits.push({ id: 'offside_heavy', title: 'Off-Side Dominant', icon: '➡️', description: `${offPct}% of runs scored through the off side — strong driving and cutting ability`, type: 'strength' });
                traits.push({ id: 'legside_weak', title: 'Limited Leg-Side Game', icon: '⚠️', description: `Only ${legPct}% of runs scored through the leg side — could be targeted with leg-stump bowling`, type: 'weakness' });
            } else if (Number(legPct) >= 65) {
                traits.push({ id: 'legside_heavy', title: 'Leg-Side Dominant', icon: '⬅️', description: `${legPct}% of runs scored through the leg side — strong pulling and flicking ability`, type: 'strength' });
                traits.push({ id: 'offside_weak', title: 'Limited Off-Side Game', icon: '⚠️', description: `Only ${offPct}% of runs scored through the off side — possibilities bowling outside off`, type: 'weakness' });
            } else {
                traits.push({ id: 'all_round_scorer', title: '360° Scorer', icon: '🎡', description: `Balanced scoring: ${offPct}% off-side, ${legPct}% leg-side — difficult to set fields for`, type: 'strength' });
            }
        }

        // (d) Weak/neglected zones — zones with 0 or minimal scoring
        const allZones = ['cover', 'mid-off', 'mid-on', 'midwicket', 'square-leg', 'fine-leg', 'third-man', 'point', 'straight'];
        const weakZones = allZones
            .filter(z => !zoneMap[z] || (zoneMap[z].balls >= 1 && zoneMap[z].runs === 0))
            .map(z => ZONE_LABELS[z]);
        if (weakZones.length >= 2 && weakZones.length <= 4) {
            traits.push({
                id: 'scoring_gaps',
                title: 'Scoring Blind Spots',
                icon: '🕳️',
                description: `Rarely scores through ${weakZones.join(', ')} — bowlers can exploit these gaps to build dot-ball pressure`,
                type: 'weakness'
            });
        }

        // (e) Over-reliance on single zone 
        if (zoneEntries.length >= 3 && totalZoneRuns > 0) {
            const topPct = (zoneEntries[0][1].runs / totalZoneRuns) * 100;
            if (topPct >= 45) {
                const label = ZONE_LABELS[zoneEntries[0][0]] || zoneEntries[0][0];
                traits.push({
                    id: 'zone_overreliance',
                    title: `Over-Reliant on ${label}`,
                    icon: '🚨',
                    description: `${topPct.toFixed(0)}% of all runs come from just one zone — predictable and can be countered with targeted field placement`,
                    type: 'weakness'
                });
            }
        }
    }

    return traits;
};

// @desc    Get detailed player stats from all recorded balls
// @route   GET /api/players/:name/stats
// @access  Public
export const getPlayerStats = asyncHandler(async (req, res) => {
    const playerName = decodeURIComponent(req.params.name);

    // Find all balls where this player was involved (case-insensitive and trimmed)
    const normalizedName = playerName.trim();
    const nameRegex = new RegExp(`^${normalizedName}$`, 'i');
    const logFile = path.join(process.cwd(), 'server_debug.log');
    const log = (msg) => {
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
        } catch (e) {
            console.error("LOGGING ERROR:", e);
        }
    };

    log(`FETCHING STATS FOR: ${playerName}`);
    log(`Normalized Name: ${normalizedName}`);
    log(`Regex: ${nameRegex}`);

    const totalBallsCount = await Ball.countDocuments({});
    log(`Total Balls in collection: ${totalBallsCount}`);

    const samples = await Ball.find({}).limit(5).lean();
    log(`Sample Batsmen: ${JSON.stringify(samples.map(s => s.batsman))}`);

    const [battingBalls, bowlingBalls] = await Promise.all([
        Ball.find({ batsman: { $regex: `^${normalizedName}$`, $options: 'i' } }).sort({ createdAt: 1 }),
        Ball.find({ bowler: { $regex: `^${normalizedName}$`, $options: 'i' } }).sort({ createdAt: 1 })
    ]);

    log(`Batting Balls found: ${battingBalls.length}`);
    log(`Bowling Balls found: ${bowlingBalls.length}`);

    // Get unique match IDs from both batting and bowling
    const matchIds = [...new Set([
        ...battingBalls.map(b => b.match?.toString()),
        ...bowlingBalls.map(b => b.match?.toString())
    ])].filter(Boolean);

    log(`Unique Match IDs: ${matchIds.length} - ${JSON.stringify(matchIds)}`);

    // Fetch match details for context (populate tournament to get matchType)
    const matches = await Match.find({ _id: { $in: matchIds } })
        .populate('homeTeam awayTeam tournament')
        .sort({ date: -1 });

    log(`Matched Documents found: ${matches.length}`);
    matches.forEach(m => log(`Match ${m._id}: Status=${m.status}, TournamentID=${m.tournament?._id || m.tournament}`));

    const calculateStats = async (batBalls, bowlBalls, formatMatches) => {
        // ════════════════════════════════════════════
        //  BATTING STATS
        // ════════════════════════════════════════════
        const battingByMatch = {};
        batBalls.forEach(b => {
            const mid = b.match.toString();
            if (!battingByMatch[mid]) {
                battingByMatch[mid] = { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null };
            }
            const entry = battingByMatch[mid];
            if (b.extraType === 'none' || b.extraType === 'noball') entry.runs += b.runs;
            if (b.extraType !== 'wide') entry.ballsFaced++;
            if (b.runs === 4 && b.extraType === 'none') entry.fours++;
            if (b.runs === 6 && b.extraType === 'none') entry.sixes++;
            if (b.wicket?.isWicket && (b.wicket.playerOut === playerName || b.batsman === playerName)) {
                entry.isOut = true;
                entry.dismissalType = b.wicket.type || 'unknown';
            }
        });

        const battingInnings = Object.values(battingByMatch);
        const totalBattingRuns = battingInnings.reduce((s, i) => s + i.runs, 0);
        const totalBallsFaced = battingInnings.reduce((s, i) => s + i.ballsFaced, 0);
        const totalFours = battingInnings.reduce((s, i) => s + i.fours, 0);
        const totalSixes = battingInnings.reduce((s, i) => s + i.sixes, 0);
        const dismissals = battingInnings.filter(i => i.isOut);
        const notOuts = battingInnings.filter(i => !i.isOut).length;
        const highestScore = battingInnings.length > 0 ? Math.max(...battingInnings.map(i => i.runs)) : 0;
        const fifties = battingInnings.filter(i => i.runs >= 50 && i.runs < 100).length;
        const hundreds = battingInnings.filter(i => i.runs >= 100).length;
        const thirties = battingInnings.filter(i => i.runs >= 30 && i.runs < 50).length;
        const ducks = battingInnings.filter(i => i.runs === 0 && i.isOut).length;
        const battingAverage = dismissals.length > 0 ? (totalBattingRuns / dismissals.length).toFixed(2) : totalBattingRuns > 0 ? 'N/A' : '0.00';
        const strikeRate = totalBallsFaced > 0 ? ((totalBattingRuns / totalBallsFaced) * 100).toFixed(2) : '0.00';

        const dismissalBreakdown = {};
        dismissals.forEach(i => {
            const type = i.dismissalType || 'unknown';
            dismissalBreakdown[type] = (dismissalBreakdown[type] || 0) + 1;
        });

        // ════════════════════════════════════════════
        //  BOWLING STATS
        // ════════════════════════════════════════════
        const bowlingByMatch = {};
        bowlBalls.forEach(b => {
            const mid = b.match.toString();
            if (!bowlingByMatch[mid]) {
                bowlingByMatch[mid] = { runsConceded: 0, legalDeliveries: 0, wickets: 0, wides: 0, noBalls: 0, maidenOvers: {}, dotBalls: 0 };
            }
            const entry = bowlingByMatch[mid];
            entry.runsConceded += b.totalBallRuns;
            if (b.extraType !== 'wide' && b.extraType !== 'noball') entry.legalDeliveries++;
            if (b.extraType === 'wide') entry.wides++;
            if (b.extraType === 'noball') entry.noBalls++;
            if (b.totalBallRuns === 0) entry.dotBalls++;
            if (b.wicket?.isWicket) entry.wickets++;

            const overKey = `${b.inning}-${b.over}`;
            if (!entry.maidenOvers[overKey]) entry.maidenOvers[overKey] = { runs: 0, legalBalls: 0 };
            entry.maidenOvers[overKey].runs += b.totalBallRuns;
            if (b.extraType !== 'wide' && b.extraType !== 'noball') entry.maidenOvers[overKey].legalBalls++;
        });

        const bowlingInnings = Object.values(bowlingByMatch);
        const totalRunsConceded = bowlingInnings.reduce((s, i) => s + i.runsConceded, 0);
        const totalLegalDeliveries = bowlingInnings.reduce((s, i) => s + i.legalDeliveries, 0);
        const totalWickets = bowlingInnings.reduce((s, i) => s + i.wickets, 0);
        const totalDotBalls = bowlingInnings.reduce((s, i) => s + i.dotBalls, 0);
        const totalWides = bowlingInnings.reduce((s, i) => s + i.wides, 0);
        const totalNoBalls = bowlingInnings.reduce((s, i) => s + i.noBalls, 0);

        let totalMaidens = 0;
        bowlingInnings.forEach(i => {
            Object.values(i.maidenOvers).forEach(ov => {
                if (ov.legalBalls === 6 && ov.runs === 0) totalMaidens++;
            });
        });

        const displayOvers = `${Math.floor(totalLegalDeliveries / 6)}.${totalLegalDeliveries % 6}`;
        const economy = totalLegalDeliveries > 0 ? (totalRunsConceded / (totalLegalDeliveries / 6)).toFixed(2) : '0.00';
        const bowlingAverage = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : 'N/A';
        const bowlingStrikeRate = totalWickets > 0 ? (totalLegalDeliveries / totalWickets).toFixed(1) : 'N/A';

        // Best Bowling Figures
        const bestBowling = { wickets: 0, runs: Infinity };
        Object.values(bowlingByMatch).forEach(i => {
            if (i.wickets > bestBowling.wickets || (i.wickets === bestBowling.wickets && i.runsConceded < bestBowling.runs)) {
                bestBowling.wickets = i.wickets;
                bestBowling.runs = i.runsConceded;
            }
        });
        if (bestBowling.runs === Infinity) bestBowling.runs = 0;

        // ════════════════════════════════════════════
        //  FIELDING STATS
        // ════════════════════════════════════════════
        let catches = 0;
        let stumpings = 0;
        let runouts = 0;

        // Need to find all balls where this player was the fielder in a wicket
        // We can't rely only on batBalls/bowlBalls as those are for when they bat/bowl.
        // We need to look through ALL balls in the matches the player played.
        const allMatchBalls = await Ball.find({ match: { $in: Object.keys(battingByMatch).concat(Object.keys(bowlingByMatch)) } }).lean();
        
        allMatchBalls.forEach(b => {
            if (b.wicket?.isWicket && (b.wicket.fielder || '').trim().toLowerCase() === playerName.trim().toLowerCase()) {
                if (b.wicket.type === 'caught' || b.wicket.type === 'caught and bowled') catches++;
                else if (b.wicket.type === 'stumped') stumpings++;
                else if (b.wicket.type === 'runout') runouts++;
            }
        });

        const recentPerformances = formatMatches.slice(0, 10).map(m => {
            const mid = m._id.toString();
            const batInning = battingByMatch[mid];
            const bowlInning = bowlingByMatch[mid];
            const opponent = m.homeTeam?.name && m.awayTeam?.name ? `${m.homeTeam.name} vs ${m.awayTeam.name}` : 'Unknown';

            let clutchPoints = 0;
            const pressureFactor = 1.0 + (Math.random() * 0.5); 

            if (batInning) {
                clutchPoints += batInning.runs * pressureFactor;
                if (batInning.ballsFaced > 0 && (batInning.runs / batInning.ballsFaced) > 1.5) {
                    clutchPoints += 15;
                }
            }
            if (bowlInning) {
                clutchPoints += bowlInning.wickets * 15 * pressureFactor;
                if (bowlInning.legalDeliveries > 0 && (bowlInning.runsConceded / (bowlInning.legalDeliveries / 6)) < 6.0) {
                    clutchPoints += 10;
                }
            }
            const clutchIndex = Math.min(100, Math.round(clutchPoints * 0.8));

            // Calculate awards for this specific match
            const matchAwards = getMatchAwards(mid, batInning, bowlInning);

            return {
                matchId: mid, date: m.date, venue: m.venue || '', opponent, status: m.status,
                clutchIndex,
                awards: matchAwards,
                batting: batInning ? {
                    runs: batInning.runs, balls: batInning.ballsFaced, fours: batInning.fours, sixes: batInning.sixes, isOut: batInning.isOut,
                    strikeRate: batInning.ballsFaced > 0 ? ((batInning.runs / batInning.ballsFaced) * 100).toFixed(1) : '0.0'
                } : null,
                bowling: bowlInning ? {
                    overs: `${Math.floor(bowlInning.legalDeliveries / 6)}.${bowlInning.legalDeliveries % 6}`,
                    runs: bowlInning.runsConceded, wickets: bowlInning.wickets,
                    economy: bowlInning.legalDeliveries > 0 ? (bowlInning.runsConceded / (bowlInning.legalDeliveries / 6)).toFixed(1) : '0.0'
                } : null,
            };
        });

        // ════════════════════════════════════════════
        //  AGGREGATE AWARDS
        // ════════════════════════════════════════════
        const allAwards = [];
        const awardsSummary = {};
        
        // Go through all matches for the player to find all awards won
        const allMatchIds = [...new Set([...Object.keys(battingByMatch), ...Object.keys(bowlingByMatch)])];
        allMatchIds.forEach(mid => {
            const batIdx = battingByMatch[mid];
            const bowlIdx = bowlingByMatch[mid];
            const mAwards = getMatchAwards(mid, batIdx, bowlIdx);
            
            mAwards.forEach(a => {
                allAwards.push({ ...a, matchId: mid });
                if (!awardsSummary[a.id]) {
                    awardsSummary[a.id] = { ...a, count: 0 };
                }
                awardsSummary[a.id].count++;
            });
        });

        

        return {
            matchesPlayed: formatMatches.length,
            awardsCount: allAwards.length,
            awardsList: Object.values(awardsSummary),
            allAwards: allAwards.slice(0, 20), // Last 20 awards
            batting: {
                innings: battingInnings.length, runs: totalBattingRuns, ballsFaced: totalBallsFaced,
                highestScore, average: battingAverage, strikeRate, fours: totalFours, sixes: totalSixes,
                fifties, hundreds, thirties, ducks, notOuts, dismissalBreakdown,
            },
            bowling: {
                innings: bowlingInnings.length, overs: displayOvers, runsConceded: totalRunsConceded,
                wickets: totalWickets, economy, average: bowlingAverage, strikeRate: bowlingStrikeRate,
                bestFigures: bestBowling.wickets >= 0 ? `${bestBowling.wickets}/${bestBowling.runs}` : '-',
                maidens: totalMaidens, dotBalls: totalDotBalls, wides: totalWides, noBalls: totalNoBalls,
            },
            fielding: {
                catches,
                stumpings,
                runouts,
                total: catches + stumpings + runouts
            },
            recentPerformances: recentPerformances,
            form: recentPerformances.slice(0, 5).map(p => {
                if (p.clutchIndex >= 60) return 'hot';
                if (p.clutchIndex >= 30) return 'stable';
                return 'cold';
            }),
            wagonWheel: batBalls
                .filter(b => b.shotDirection && !b.isCommentaryOnly)
                .map(b => ({ runs: b.runs, direction: b.shotDirection }))
        };
    };

    const uniqueBowlers = [...new Set(battingBalls.map(b => b.bowler))];
    const bowlerTeams = await Team.find({ "players.name": { $in: uniqueBowlers } }).lean();
    const bowlerRolesMap = {};
    bowlerTeams.forEach(team => {
        team.players.forEach(p => {
            if (uniqueBowlers.some(b => b.toLowerCase() === p.name.toLowerCase())) {
                // Prioritize bowlingStyle if available, otherwise fallback to role
                bowlerRolesMap[p.name.toLowerCase()] = p.bowlingStyle || p.role || 'Bowler';
            }
        });
    });

    const formatsData = {};
    const formats = ['All', 'T10', 'T20', 'ODI', 'Test'];

    for (const format of formats) {
        let fBat = battingBalls;
        let fBowl = bowlingBalls;
        let fMatches = matches;

        if (format !== 'All') {
            fMatches = matches.filter(m => m.tournament?.matchType === format);
            const formatMatchIds = new Set(fMatches.map(m => m._id.toString()));
            fBat = battingBalls.filter(b => formatMatchIds.has(b.match.toString()));
            fBowl = bowlingBalls.filter(b => formatMatchIds.has(b.match.toString()));
        }

        const stats = await calculateStats(fBat, fBowl, fMatches);
        // Inject traits
        stats.traits = calculateTraits(fBat, fBowl, fMatches, bowlerRolesMap, playerName);
        formatsData[format] = stats;
    }

    // Derive teams this player has played for from match data
    const teamsMap = {};
    matches.forEach(m => {
        const checkTeam = (team) => {
            if (!team || !team._id) return;
            const tid = team._id.toString();
            const hasPlayer = team.players?.some(p => {
                const pName = typeof p === 'string' ? p : p.name;
                return pName?.trim().toLowerCase() === normalizedName.toLowerCase();
            });
            if (hasPlayer) {
                if (!teamsMap[tid]) {
                    teamsMap[tid] = { _id: tid, name: team.name, logo: team.logo || null, color: team.color || '#3b82f6', acronym: team.acronym || team.name?.substring(0, 3).toUpperCase(), matchCount: 0 };
                }
                teamsMap[tid].matchCount++;
            }
        };
        checkTeam(m.homeTeam);
        checkTeam(m.awayTeam);
    });
    const teamsPlayedFor = Object.values(teamsMap);

    console.log("SENDING PLAYER STATS FOR:", playerName);
    // Retrieve comprehensive player metadata natively from global franchise records
    const playerInTeam = await Team.findOne({ 'players.name': { $regex: new RegExp(`^${playerName}$`, 'i') } }).lean();
    let playerInfo = {};
    if (playerInTeam && playerInTeam.players) {
        const p = playerInTeam.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (p) playerInfo = p;
    }

    res.json({
        success: true,
        data: {
            playerName,
            playerInfo,
            formats: formatsData,
            overall: formatsData['All'] || {},
            recentPerformances: formatsData['All']?.recentPerformances || [],
            teamsPlayedFor
        }
    });
});

// @desc    Get historical head-to-head matchup stats between a batsman and bowler
// @route   GET /api/players/matchup/:batsman/:bowler
// @access  Public
export const getPlayerMatchup = asyncHandler(async (req, res) => {
    const batsmanName = decodeURIComponent(req.params.batsman).trim();
    const bowlerName = decodeURIComponent(req.params.bowler).trim();

    const batRegex = new RegExp(`^${batsmanName}$`, 'i');
    const bowlRegex = new RegExp(`^${bowlerName}$`, 'i');

    const matchupBalls = await Ball.find({
        batsman: batRegex,
        bowler: bowlRegex,
        isCommentaryOnly: { $ne: true }
    });

    if (!matchupBalls.length) {
        return res.json({
            success: true,
            data: {
                batsman: batsmanName,
                bowler: bowlerName,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                outs: 0,
                strikeRate: '0.0',
                economy: '0.00'
            }
        });
    }

    let runs = 0;
    let balls = 0;
    let fours = 0;
    let sixes = 0;
    let outs = 0;
    let totalConceded = 0; // for economy calculation (runs + wides + noballs)

    matchupBalls.forEach(b => {
        // Batsman stats
        if (b.extraType === 'none' || b.extraType === 'noball') {
            runs += b.runs;
            if (b.runs === 4 && b.extraType === 'none') fours++;
            if (b.runs === 6 && b.extraType === 'none') sixes++;
        }
        
        if (b.extraType !== 'wide') {
            balls++;
        }

        if (b.wicket?.isWicket && (b.wicket.playerOut?.match(batRegex) || b.batsman.match(batRegex))) {
            // Check if it's a bowler's wicket (exclude runouts, retired)
            const wType = b.wicket.type;
            if (['caught', 'bowled', 'lbw', 'stumped', 'caught and bowled', 'hitwicket'].includes(wType)) {
                outs++;
            }
        }

        // Bowler stats
        totalConceded += b.totalBallRuns;
    });

    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
    const economy = balls > 0 ? (totalConceded / (balls / 6)).toFixed(2) : '0.00';

    res.json({
        success: true,
        data: {
            batsman: batsmanName,
            bowler: bowlerName,
            runs,
            balls,
            fours,
            sixes,
            outs,
            strikeRate,
            economy
        }
    });
});

// @desc    Search players across all teams
// @route   GET /api/players/search?q=query
// @access  Public
export const searchPlayers = asyncHandler(async (req, res) => {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 2) {
        return res.json({ success: true, data: [] });
    }

    const [teams, tournaments, globalPlayers] = await Promise.all([
        Team.find({}).lean(),
        Tournament.find({}).populate('teams', '_id').lean(),
        Player.find({ 
            $or: [
                { name: { $regex: q, $options: 'i' } }
            ]
        }).limit(5).lean()
    ]);

    // Build team→tournament lookup
    const teamTournamentMap = {};
    tournaments.forEach(t => {
        (t.teams || []).forEach(team => {
            const tid = team._id?.toString() || team.toString();
            if (!teamTournamentMap[tid]) {
                teamTournamentMap[tid] = { _id: t._id, name: t.name };
            }
        });
    });

    const playerMap = new Map();

    // Add global players first (they are authoritative)
    globalPlayers.forEach(p => {
        playerMap.set(p.name.trim().toLowerCase(), {
            ...p,
            isGlobal: true
        });
    });

    teams.forEach(team => {
        (team.players || []).forEach(p => {
            const name = typeof p === 'string' ? p : p?.name;
            if (!name) return;
            const key = name.trim().toLowerCase();
            if (key.includes(q) && !playerMap.has(key)) {
                const teamId = team._id.toString();
                playerMap.set(key, {
                    name: name.trim(),
                    role: (typeof p === 'object' ? p.role : null) || 'Batsman',
                    battingStyle: (typeof p === 'object' ? p.battingStyle : null) || 'Right-hand Bat',
                    bowlingStyle: (typeof p === 'object' ? p.bowlingStyle : null) || 'None',
                    photo: (typeof p === 'object' ? p.photo : null) || null,
                    team: { _id: team._id, name: team.name, color: team.color },
                    tournament: teamTournamentMap[teamId] || null
                });
            }
        });
    });

    const results = Array.from(playerMap.values()).slice(0, 10);
    res.json({ success: true, data: results });
});

// @desc    Create a new player profile
// @route   POST /api/players
// @access  Private/Admin
export const createPlayer = asyncHandler(async (req, res) => {
    const { name, role, battingStyle, bowlingStyle, photo, country } = req.body;

    const playerExists = await Player.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (playerExists) {
        res.status(400);
        throw new Error('Player profile already exists');
    }

    const player = await Player.create({
        name,
        role,
        battingStyle,
        bowlingStyle,
        photo,
        country
    });

    res.status(201).json({
        success: true,
        data: player
    });
});

// @desc    Check if player already exists in another team in the same tournament
// @route   GET /api/players/check-tournament?name=...&tournamentId=...
// @access  Public
export const checkPlayerInTournament = asyncHandler(async (req, res) => {
    const { name, tournamentId } = req.query;
    if (!name || !tournamentId) {
        return res.json({ success: true, data: { conflict: false } });
    }

    const tournament = await Tournament.findById(tournamentId).populate('teams');
    if (!tournament) {
        return res.json({ success: true, data: { conflict: false } });
    }

    const normalizedName = name.trim().toLowerCase();
    for (const team of tournament.teams) {
        const hasPlayer = (team.players || []).some(p => {
            const pName = typeof p === 'string' ? p : p?.name;
            return pName?.trim().toLowerCase() === normalizedName;
        });
        if (hasPlayer) {
            return res.json({
                success: true,
                data: { conflict: true, teamName: team.name, teamId: team._id }
            });
        }
    }

    res.json({ success: true, data: { conflict: false } });
});

// @desc    Update player photo
// @route   PUT /api/players/:idOrName/photo
// @access  Public (or Private if auth is needed)
export const updatePlayerPhoto = asyncHandler(async (req, res) => {
    const { idOrName } = req.params;
    const playerName = decodeURIComponent(idOrName);

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Determine the public path for the photo
    // We save it to public/images/players/ (which is in the root)
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const publicDir = path.join(process.cwd(), '..', 'public', 'images', 'players');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const photoUrl = `/images/players/${fileName}`;

    // Update the database if the player exists
    const team = await Team.findOne({ 
        $or: [
            { 'players._id': idOrName.length === 24 ? idOrName : null },
            { 'players.name': { $regex: new RegExp(`^${playerName}$`, 'i') } }
        ]
    });

    let updatedPlayer = null;
    if (team) {
        const playerIndex = team.players.findIndex(p => 
            (p._id && p._id.toString() === idOrName) || 
            (p.name && p.name.toLowerCase() === playerName.toLowerCase())
        );

        if (playerIndex !== -1) {
            team.players[playerIndex].photo = photoUrl;
            await team.save();
            updatedPlayer = team.players[playerIndex];
        }
    }

    res.json({
        success: true,
        message: 'Photo updated successfully',
        data: updatedPlayer || { name: playerName, photo: photoUrl }
    });
});
