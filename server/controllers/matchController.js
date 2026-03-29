import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import asyncHandler from 'express-async-handler';
import Match from '../models/Match.js';
import Ball from '../models/Ball.js';
import Tournament from '../models/Tournament.js';
import PointsTable from '../models/PointsTable.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { emitScoreUpdate, getIO } from '../config/socket.js';

// Helper to broadcast notifications to tournament followers
async function triggerFollowerNotifications(match, { title, message, type }) {
    try {
        const tournamentId = match.tournament?._id || match.tournament;
        if (!tournamentId) return;

        const followers = await User.find({ followedTournaments: tournamentId });
        const notificationPromises = followers.map(async (user) => {
            const notification = await Notification.create({
                userId: user._id,
                title,
                message,
                type,
                relatedId: match._id
            });
            
            if (notification) {
                try {
                    const io = getIO();
                    io.to(user._id.toString()).emit('new_notification', notification);
                } catch (err) {
                    console.error('[SOCKET] Error emitting notification:', err);
                }
            }
        });
        await Promise.all(notificationPromises);
    } catch (err) {
        console.error('[NOTIFICATION] broadcast error:', err);
    }
}

// @desc    Create a new match
// @route   POST /api/matches
// @access  Private
export const createMatch = asyncHandler(async (req, res) => {
    const { tournament, homeTeam, awayTeam, venue, date, status, matchType } = req.body;

    const match = await Match.create({
        tournament,
        homeTeam,
        awayTeam,
        venue,
        date,
        status: status || 'Upcoming',
        matchType: matchType || 'League'
    });

    if (match) {
        // Trigger notification for followers
        try {
            const tournamentDoc = await Tournament.findById(tournament);
            const hId = homeTeam._id || homeTeam;
            const aId = awayTeam._id || awayTeam;
            const [teamA, teamB] = await Promise.all([Team.findById(hId), Team.findById(aId)]);

            await triggerFollowerNotifications(match, {
                title: 'New Match Scheduled',
                message: `${teamA?.name || 'Team A'} vs ${teamB?.name || 'Team B'} in ${tournamentDoc?.name || 'Tournament'}`,
                type: 'match_scheduled'
            });
        } catch (err) {
            console.error('[DEBUG] Notification trigger error:', err);
        }

        res.status(201).json({
            success: true,
            data: match
        });
    } else {
        res.status(400);
        throw new Error('Invalid match data');
    }
});

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
export const getMatches = asyncHandler(async (req, res) => {
    const { tournamentId } = req.query;
    const query = tournamentId ? { tournament: tournamentId } : {};

    const matches = await Match.find(query)
        .populate('homeTeam awayTeam tournament')
        .sort({ date: 1 });

    res.json({
        success: true,
        count: matches.length,
        data: matches
    });
});

// @desc    Get match by ID
// @route   GET /api/matches/:id
// @access  Public
export const getMatchById = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id)
        .populate('homeTeam awayTeam tournament');

    if (match) {
        res.json({
            success: true,
            data: match
        });
    } else {
        res.status(404);
        throw new Error('Match not found');
    }
});

// @desc    Update a match
// @route   PUT /api/matches/:id
// @access  Private
export const updateMatch = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    if (match) {
        const oldStatus = match.status;
        match.status = req.body.status || match.status;
        match.toss = req.body.toss || match.toss;
        match.currentInnings = req.body.currentInnings || match.currentInnings;
        match.score = req.body.score || match.score;
        match.result = req.body.result || match.result;

        if (req.body.testDay !== undefined) match.testDay = req.body.testDay;
        if (req.body.testSession !== undefined) match.testSession = req.body.testSession;
        if (req.body.impactPlayers !== undefined) match.impactPlayers = req.body.impactPlayers;
        if (req.body.homeLineup !== undefined) match.homeLineup = req.body.homeLineup;
        if (req.body.awayLineup !== undefined) match.awayLineup = req.body.awayLineup;

        const updatedMatch = await match.save();

        // Trigger Live notification
        if (oldStatus === 'Upcoming' && updatedMatch.status === 'Live') {
            try {
                const tournamentDoc = await Tournament.findById(updatedMatch.tournament);
                const teamA = await Team.findById(updatedMatch.homeTeam);
                const teamB = await Team.findById(updatedMatch.awayTeam);

                await triggerFollowerNotifications(updatedMatch, {
                    title: 'Match is Live!',
                    message: `The match between ${teamA?.name || 'Team A'} and ${teamB?.name || 'Team B'} is now live in ${tournamentDoc?.name || 'Tournament'}`,
                    type: 'match_live'
                });
            } catch (err) {
                console.error('Live notification error:', err);
            }
        }

        // Trigger Innings Change notification
        if (req.body.currentInnings === 2 && match.currentInnings === 1) {
            const teamB = await Team.findById(updatedMatch.awayTeam);
            await triggerFollowerNotifications(updatedMatch, {
                title: '2nd Innings Started',
                message: `${teamB?.name || 'Chasing team'} is coming out to bat. Target: ${updatedMatch.score.team1.runs + 1}`,
                type: 'match_live'
            });
        }

        // If match completed, we might want to update points table and player profiles
        if (updatedMatch.status === 'Completed' && oldStatus !== 'Completed') {
            try {
                const teamA = await Team.findById(updatedMatch.homeTeam);
                const teamB = await Team.findById(updatedMatch.awayTeam);
                const result = updatedMatch.result;
                let message = "Match has ended!";
                if (result.isTie) message = `Match Tied between ${teamA?.name} and ${teamB?.name}!`;
                else if (result.winnerName) message = `${result.winnerName} won by ${result.margin}!`;

                await triggerFollowerNotifications(updatedMatch, {
                    title: 'Match Completed! 🏆',
                    message,
                    type: 'match_completed'
                });
            } catch (err) {
                console.error('Completion notification error:', err);
            }

            if (updatedMatch.tournament) {
                await updatePointsTable(updatedMatch);

                // --- KNOCKOUT & TOURNAMENT COMPLETION LOGIC ---
                if (updatedMatch.matchType === 'Semi Final' || updatedMatch.matchType === 'Final') {
                    const tDoc = await Tournament.findById(updatedMatch.tournament);
                    if (tDoc) {
                        const res = updatedMatch.result;
                        if (res && res.winner) {
                            const wId = res.winner.toString();
                            const loserId = updatedMatch.homeTeam.toString() === wId 
                                ? updatedMatch.awayTeam.toString() 
                                : updatedMatch.homeTeam.toString();
                            
                            if (!tDoc.knockedOutTeams.includes(loserId)) {
                                tDoc.knockedOutTeams.push(loserId);
                            }
                        }
                        if (updatedMatch.matchType === 'Final') {
                            tDoc.status = 'Completed';
                        }
                        await tDoc.save();
                    }
                }
            }
            try {
                await syncPlayerMatchRatings(updatedMatch);
            } catch (err) {
                console.error('Failed to sync player ratings:', err);
            }
        }

        // Emit live update for status/toss/innings changes
        emitScoreUpdate(updatedMatch._id.toString(), {
            score: updatedMatch.score,
            currentInnings: updatedMatch.currentInnings,
            status: updatedMatch.status,
            toss: updatedMatch.toss,
            result: updatedMatch.result,
            testDay: updatedMatch.testDay,
            testSession: updatedMatch.testSession,
            impactPlayers: updatedMatch.impactPlayers
        });

        res.json({
            success: true,
            data: updatedMatch
        });
    } else {
        res.status(404);
        throw new Error('Match not found');
    }
});

// Helper: generate ball-by-ball commentary with shot direction
function generateBallCommentary(bowler, batsman, runs, extraType, shotDirection, wicket, over, ball) {
    const overBall = `${over}.${ball}`;
    const dir = shotDirection ? shotDirection.replace('-', ' ') : null;
    const dirPhrase = dir ? `, to ${dir}` : '';

    // Wicket commentary
    if (wicket && wicket.isWicket) {
        const wType = wicket.type || 'bowled';
        const fielderStr = wicket.fielder ? ` by ${wicket.fielder}` : '';
        const templates = {
            bowled: [`OUT! ${bowler} knocks the stumps over! ${batsman} is bowled for a duck-like departure. The off-stump is sent cartwheeling!`, `BOWLED HIM! ${bowler} fires one through the gate and ${batsman} has to walk back. Timber!`, `CLEAN BOWLED! ${bowler} produces an unplayable delivery that crashes into the stumps. ${batsman} departs.`],
            caught: [`CAUGHT! ${batsman} goes for a big shot${dirPhrase} but finds ${wicket.fielder || 'the fielder'} perfectly positioned. ${bowler} gets the breakthrough!`, `OUT! ${batsman} edges one${dirPhrase} and ${wicket.fielder || 'the fielder'} takes a sharp catch. ${bowler} is pumped!`, `GONE! ${batsman} tries to play through${dirPhrase} but only manages to find ${wicket.fielder || 'the fielder'}. Excellent catch!`],
            'caught and bowled': [`CAUGHT AND BOWLED! ${bowler} takes a stunning return catch off ${batsman}'s bat. What reflexes!`, `C&B! ${bowler} dives to his right and plucks a brilliant catch off his own bowling. ${batsman} is gone!`],
            lbw: [`LBW! ${bowler} traps ${batsman} right in front. The umpire has no hesitation in raising the finger!`, `PLUMB LBW! ${bowler} nips one back into ${batsman}'s pads. That was hitting middle stump all day long.`],
            runout: [`RUN OUT! ${batsman} is caught short of the crease${fielderStr}. A brilliant piece of fielding results in ${batsman}'s dismissal!`, `RUN OUT! Disaster for ${batsman}! A terrible mix-up between the wickets and ${batsman} has to go.`],
            stumped: [`STUMPED! ${batsman} dances down the track to ${bowler} but misses, and ${wicket.fielder || 'the keeper'} whips the bails off in a flash!`, `STUMPED! Quick work behind the stumps${fielderStr}! ${batsman} was out of the crease and pays the price.`],
            hitwicket: [`HIT WICKET! ${batsman} clips the stumps with the back foot while trying to play ${bowler}. An unfortunate way to depart!`]
        };
        const pool = templates[wType] || [`OUT! ${batsman} is dismissed ${wType}${fielderStr}. ${bowler} strikes!`];
        return `${overBall} — ${pool[Math.floor(Math.random() * pool.length)]}`;
    }

    // Extras commentary
    if (extraType === 'wide') {
        const wideLines = [`Wide ball from ${bowler}, drifting down the leg side. The umpire signals wide and a run is added to the extras tally.`, `${bowler} strays too far outside off, the umpire stretches out both arms. Wide called.`, `Too wide from ${bowler}! That's well outside the reach of ${batsman}. Free run to the batting side.`];
        return `${overBall} — ${wideLines[Math.floor(Math.random() * wideLines.length)]}`;
    }
    if (extraType === 'noball') {
        const nbLines = [`No ball from ${bowler}! Overstepping the crease and ${batsman} scores ${runs} run${runs !== 1 ? 's' : ''} off it${dirPhrase}. Free hit coming up next.`, `${bowler} oversteps! No ball called. ${batsman} makes the most of the free delivery, collecting ${runs}${dirPhrase}.`];
        return `${overBall} — ${nbLines[Math.floor(Math.random() * nbLines.length)]}`;
    }
    if (extraType === 'bye') {
        return `${overBall} — ${bowler} to ${batsman}, beaten past the bat! ${runs} bye${runs !== 1 ? 's' : ''} taken as the ball evades the keeper's gloves.`;
    }
    if (extraType === 'legbye') {
        return `${overBall} — ${bowler} to ${batsman}, that strikes the pad and runs away${dirPhrase}. ${runs} leg bye${runs !== 1 ? 's' : ''} added to the total.`;
    }

    // Regular runs with direction
    if (runs === 0) {
        const dotLines = [
            `${overBall} — ${bowler} to ${batsman}, DOT BALL! Good tight delivery, ${batsman} defends solidly${dirPhrase}. No run scored.`,
            `${overBall} — ${bowler} to ${batsman}, nothing doing! Well bowled, keeping it tight on the off stump${dirPhrase}. ${batsman} can't find a gap.`,
            `${overBall} — ${bowler} to ${batsman}, beaten! A beauty from ${bowler} that just misses the outside edge. ${batsman} plays and misses.`,
            `${overBall} — ${bowler} to ${batsman}, defended back to the bowler. Solid technique on display but no run to show for it.`
        ];
        return dotLines[Math.floor(Math.random() * dotLines.length)];
    }
    if (runs === 1) {
        const singleLines = [
            `${overBall} — ${bowler} to ${batsman}, 1 run${dirPhrase}. Pushed into the gap and they scamper through for a quick single. Good running between the wickets.`,
            `${overBall} — ${bowler} to ${batsman}, single taken${dirPhrase}. ${batsman} nudges it and rotates the strike with ease.`,
            `${overBall} — ${bowler} to ${batsman}, 1 run${dirPhrase}. Worked away off the pads, smart cricket from ${batsman} to keep the scoreboard ticking.`
        ];
        return singleLines[Math.floor(Math.random() * singleLines.length)];
    }
    if (runs === 2) {
        const doubleLines = [
            `${overBall} — ${bowler} to ${batsman}, 2 runs${dirPhrase}. Placed neatly into the gap and they come back for a well-judged couple. Good placement from ${batsman}.`,
            `${overBall} — ${bowler} to ${batsman}, two runs${dirPhrase}. ${batsman} drives it firmly and the fielder has to chase hard. They complete two.`,
            `${overBall} — ${bowler} to ${batsman}, couple of runs${dirPhrase}. Smart batting, finding the gap in the field and pushing hard for the second.`
        ];
        return doubleLines[Math.floor(Math.random() * doubleLines.length)];
    }
    if (runs === 3) {
        const tripleLines = [
            `${overBall} — ${bowler} to ${batsman}, 3 runs${dirPhrase}. Driven into the deep and they run hard between the wickets. Excellent running to pick up three!`,
            `${overBall} — ${bowler} to ${batsman}, three runs${dirPhrase}. ${batsman} bisects the fielders and the batsmen sprint back for the third. Great effort!`
        ];
        return tripleLines[Math.floor(Math.random() * tripleLines.length)];
    }
    if (runs === 4) {
        const fourPool = dir ? {
            'cover': [`FOUR! A cracking drive through covers from ${batsman}! ${bowler} pitched it up and paid the price. That races away to the boundary fence!`, `FOUR! ${batsman} leans into a gorgeous cover drive off ${bowler}. Textbook shot, the ball screams past the fielder at cover.`],
            'mid off': [`FOUR! ${batsman} drives ${bowler} straight past mid-off! The ball hits the boundary board before the fielder can react. Beautifully timed!`, `FOUR! Lofted elegantly over mid-off by ${batsman}. ${bowler} overpitched and that's been dispatched with authority!`],
            'mid on': [`FOUR! ${batsman} flicks ${bowler} powerfully through mid-on! On-the-up shot and it races to the rope. Imperious batting!`, `FOUR! Driven handsomely through mid-on by ${batsman}. ${bowler} strays onto the pads and gets punished!`],
            'midwicket': [`FOUR! A powerful pull shot through midwicket by ${batsman}! ${bowler} bowled short and that's been put away with authority.`, `FOUR! ${batsman} unleashes a thunderous whip through midwicket off ${bowler}. That flew to the boundary like a bullet!`],
            'square leg': [`FOUR! ${batsman} pulls ${bowler} square! That's a ferocious shot through square leg, nobody is stopping that.`, `FOUR! Pulled away to square leg by ${batsman}. ${bowler} bowled on the hip and ${batsman} helped it on its way to the fence!`],
            'fine leg': [`FOUR! ${batsman} glances ${bowler} fine down the leg side! Delicate touch, the ball races past the keeper and fine leg has no chance.`, `FOUR! A fine tickle off the pads by ${batsman}, the ball scurries down to fine leg. ${bowler} erred in line and that's four more.`],
            'third man': [`FOUR! ${batsman} steers ${bowler} late past the slips and down to third man! Superb use of the angle, the ball speeds to the boundary.`, `FOUR! Late cut by ${batsman} off ${bowler}, slicing it past the gully region and away to the third man boundary. Classy!`],
            'point': [`FOUR! ${batsman} unleashes a square cut off ${bowler} through point! Short and wide, and ${batsman} didn't miss out. Cracking shot!`, `FOUR! Cut ferociously through point by ${batsman}! ${bowler} offered width and that's been smashed to the boundary.`],
            'straight': [`FOUR! ${batsman} drives ${bowler} straight back past the bowler's outstretched hand! Down the ground for four, that's a beautiful stroke.`, `FOUR! Lofted straight down the ground by ${batsman}! ${bowler} pitched up and ${batsman} took full toll. Stunning shot!`]
        } : null;
        const pool = (fourPool && fourPool[dir]) || [`FOUR! ${batsman} finds the boundary off ${bowler}${dirPhrase}! A well-timed shot that races away to the rope. Excellent batting!`, `FOUR! ${batsman} dispatches ${bowler} to the fence${dirPhrase}! No stopping that one, the fielders can only watch.`];
        return `${overBall} — ${pool[Math.floor(Math.random() * pool.length)]}`;
    }
    if (runs === 6) {
        const sixPool = dir ? {
            'cover': [`SIX! ${batsman} launches ${bowler} over cover for a massive six! That's sailed over the boundary with contemptuous ease!`, `SIX! An extraordinary loft over covers by ${batsman}! ${bowler} can't believe it as the ball disappears into the stands!`],
            'mid off': [`SIX! ${batsman} goes aerial over mid-off! ${bowler} pitched up and ${batsman} sent it soaring over the boundary. What power!`, `SIX! Magnificent! ${batsman} launches ${bowler} miles over mid-off. That ball has gone into orbit!`],
            'mid on': [`SIX! ${batsman} heaves ${bowler} high over mid-on for a massive six! The crowd erupts as the ball lands in the stands!`, `SIX! An effortless loft over mid-on by ${batsman}. ${bowler} shakes his head — there was nothing wrong with the delivery!`],
            'midwicket': [`SIX! ${batsman} sends ${bowler} sailing over midwicket! A monstrous pull shot that clears the rope with yards to spare!`, `SIX! Deposited over midwicket by ${batsman}! ${bowler} dropped it short and that's been dispatched into the second tier!`],
            'square leg': [`SIX! ${batsman} swivels and pulls ${bowler} over square leg for a towering six! That's gone deep into the crowd!`, `SIX! An audacious pull shot from ${batsman} sails over square leg! ${bowler} went short and that's been hammered out of the ground!`],
            'fine leg': [`SIX! ${batsman} helps ${bowler} over fine leg for a glorious six! Just a flick of the wrists and the ball sails over the rope!`, `SIX! Glanced over fine leg by ${batsman}! The ball flies over the boundary, incredible wrist work!`],
            'third man': [`SIX! ${batsman} uppercuts ${bowler} over third man for a stunning six! What audacity! That takes a special kind of skill.`, `SIX! Slapped over third man by ${batsman}! An outrageous shot off ${bowler}, the ball sails out of the ground!`],
            'point': [`SIX! ${batsman} clubs ${bowler} over point for a gigantic six! Short and wide and ${batsman} has absolutely murdered that!`, `SIX! Hammered over point by ${batsman}! ${bowler} will want to forget that delivery. It's gone way up and way out!`],
            'straight': [`SIX! ${batsman} sends ${bowler} soaring straight down the ground! That's a monstrous hit, the ball clears the sight screen with ease!`, `SIX! Lofted majestically down the ground by ${batsman}! ${bowler} pitched it up and ${batsman} went big. That's a monster six straight over the bowler's head!`]
        } : null;
        const pool = (sixPool && sixPool[dir]) || [`SIX! ${batsman} launches ${bowler} out of the ground${dirPhrase}! What a massive hit! The crowd is on its feet as the ball clears the boundary with plenty to spare!`, `SIX! ${batsman} goes downtown off ${bowler}${dirPhrase}! That's been hit with enormous power, disappearing into the stands!`];
        return `${overBall} — ${pool[Math.floor(Math.random() * pool.length)]}`;
    }

    // Fallback
    return `${overBall} — ${bowler} to ${batsman}, ${runs} run${runs !== 1 ? 's' : ''}${dirPhrase}.`;
}

// @desc    Record a ball
// @route   POST /api/matches/:id/balls
// @access  Private
export const recordBall = asyncHandler(async (req, res) => {
    const {
        inning, over, ball, batsman, bowler, nonStriker,
        runs, extraType, extraRuns, wicket, isCommentaryOnly, commentaryMessage,
        isDroppedCatch, droppedFielder, shotDirection
    } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    const totalBallRuns = isCommentaryOnly ? 0 : (runs + (extraRuns || 0));

    // Generate ball-by-ball commentary with direction
    let autoCommentary = commentaryMessage;
    if (!isCommentaryOnly && !commentaryMessage) {
        autoCommentary = generateBallCommentary(bowler, batsman, runs, extraType || 'none', shotDirection, wicket, over, ball);
    }

    const newBall = await Ball.create({
        match: match._id,
        inning,
        over,
        ball,
        batsman: batsman || "Commentary",
        bowler: bowler || "Commentary",
        nonStriker,
        runs,
        extraType: extraType || 'none',
        extraRuns: extraRuns || 0,
        wicket: wicket || { isWicket: false },
        totalBallRuns: totalBallRuns,
        isCommentaryOnly: isCommentaryOnly || false,
        commentaryMessage: autoCommentary,
        isDroppedCatch: isDroppedCatch || false,
        droppedFielder: droppedFielder,
        shotDirection: shotDirection || null
    });

    // Update match score ONLY if it's a real delivery
    if (!isCommentaryOnly) {
        const teamKey = match.currentInnings === 1 ? 'team1' : 'team2';
        match.score[teamKey].runs += totalBallRuns;
        if (wicket && wicket.isWicket) {
            match.score[teamKey].wickets += 1;
        }

        // Update overs (cricket notation: 1.1, 1.2, ..., 1.6 -> 2.0)
        // Wide and No-Balls do not count towards completed balls in the over
        const isLegalBall = extraType === 'none' || extraType === 'bye' || extraType === 'legbye';
        if (isLegalBall) {
            if (ball >= 6) {
                match.score[teamKey].overs = over + 1.0;
            } else {
                match.score[teamKey].overs = over + (ball / 10);
            }
        }

        // ── Accurate Winner Identification ──
        let winnerId = null;
        let winnerName = 'None';
        let margin = '';
        let isTie = false;

        const team1Id = match.homeTeam._id.toString();
        const team2Id = match.awayTeam._id.toString();
        const team1Name = match.homeTeam.name;
        const team2Name = match.awayTeam.name;

        const runs1 = match.score.team1.runs;
        const runs2 = match.score.team2.runs;
        const wkts1 = match.score.team1.wickets;
        const wkts2 = match.score.team2.wickets;

        const totalOvers = (match.tournament && match.tournament.overs) || 20; // Assuming tournament is populated or has default
        const oversDoneTeam1 = match.score.team1.overs >= totalOvers || wkts1 >= 10;
        const oversDoneTeam2 = match.score.team2.overs >= totalOvers || wkts2 >= 10;

        if (match.currentInnings === 2) {
            const target = runs1 + 1;
            if (runs2 >= target) { // Team 2 wins by chasing
                winnerId = match.awayTeam._id;
                winnerName = team2Name;
                margin = `${10 - wkts2} wickets`;
            } else if (oversDoneTeam2 || wkts2 >= 10) { // Team 2 all out or overs completed, and couldn't chase
                if (runs2 < runs1) { // Team 1 wins by runs
                    winnerId = match.homeTeam._id;
                    winnerName = team1Name;
                    margin = `${runs1 - runs2} runs`;
                } else if (runs2 === runs1) { // Match Tied
                    isTie = true;
                    margin = 'Match Tied';
                }
            }
        } else if (match.currentInnings === 1 && oversDoneTeam1) {
            // If 1st innings completed, and it's a 1-innings game (e.g., T20),
            // and there's no 2nd innings, then the match might be decided here
            // (e.g., if target is set and 2nd innings is not played due to rain, etc.)
            // For now, we assume 2 innings for T20, so this block might not trigger a 'Completed' status.
            // This is more for multi-innings formats or if a match is abandoned after 1st innings.
            // For T20, match completion is primarily handled after 2nd innings.
        }

        if (winnerId || isTie) {
            match.status = 'Completed';
            match.result = {
                winner: winnerId,
                winnerName: winnerName,
                margin: margin,
                isTie: isTie
            };

            await updatePointsTable(match);

            // --- KNOCKOUT & TOURNAMENT COMPLETION LOGIC ---
            if (match.tournament && (match.matchType === 'Semi Final' || match.matchType === 'Final')) {
                const tDoc = await Tournament.findById(match.tournament);
                if (tDoc) {
                    if (winnerId) {
                        const wId = winnerId.toString();
                        const loserId = match.homeTeam.toString() === wId 
                            ? match.awayTeam.toString() 
                            : match.homeTeam.toString();
                        
                        if (!tDoc.knockedOutTeams.includes(loserId)) {
                            tDoc.knockedOutTeams.push(loserId);
                        }
                    }
                    if (match.matchType === 'Final') {
                        tDoc.status = 'Completed';
                    }
                    await tDoc.save();
                }
            }

            try {
                await syncPlayerMatchRatings(match);
            } catch (err) {
                console.error('Failed to sync player ratings:', err);
            }

            // Trigger Completion Notification
            try {
                const teamA = await Team.findById(match.homeTeam);
                const teamB = await Team.findById(match.awayTeam);
                let message = "Match has ended!";
                if (match.result.isTie) message = `Match Tied between ${teamA?.name} and ${teamB?.name}!`;
                else if (match.result.winnerName) message = `${match.result.winnerName} won by ${match.result.margin}!`;

                await triggerFollowerNotifications(match, {
                    title: 'Match Completed! 🏆',
                    message,
                    type: 'match_completed'
                });
            } catch (err) {
                console.error('Completion notification error:', err);
            }
        }

        await match.save();

        // ── MATCH INTELLIGENCE TRIGGER ──────────────────────────────
        // We run this after saving the ball so it has history to look at
        try {
            const insight = await generateMatchIntelligence(match._id, {
                inning, over, ball, batsman, bowler, runs, totalBallRuns
            });

            // If it's a "Trend" or something really interesting, notify followers
            if (insight && (insight.type === 'Trend' || insight.type === 'Efficiency')) {
                await triggerFollowerNotifications(match, {
                    title: `Match Insight: ${insight.type}`,
                    message: insight.commentaryMessage,
                    type: 'system'
                });
            }

            // --- Milestone Detection ---
            if (runs > 0 || (wicket && wicket.isWicket)) {
                const inningBalls = await Ball.find({ match: match._id, inning, isCommentaryOnly: false });
                
                // Batsman Milestones
                const batBalls = inningBalls.filter(b => b.batsman.trim().toLowerCase() === batsman.trim().toLowerCase());
                const totalRuns = batBalls.reduce((sum, b) => sum + (b.runs || 0), 0);
                const prevRuns = totalRuns - (runs || 0);

                if (runs > 0) {
                    const notifyMilestone = async (threshold, title, message) => {
                        if (prevRuns < threshold && totalRuns >= threshold) {
                            await triggerFollowerNotifications(match, {
                                title,
                                message,
                                type: 'system'
                            });
                        }
                    };

                    const bName = batsman.trim();
                    
                    // --- Dynamic Catchy & Unique Lines ---
                    const milestones = [
                        { 
                            val: 50, near: 45, label: 'Half-Century', emoji: '🏏', 
                            reachMsg: [
                                `BOOM! 🚀 ${bName} blasts his way to a spectacular 50! What a show!`, 
                                `THE MASTER AT WORK! ${bName} cements his class with a brilliant half-ton!`,
                                `Raising the roof! 🏟️ ${bName} smashes a fifty that will be talked about for days!`,
                                `Fifty and Fabulous! ${bName} is putting on a clinical batting display!`,
                                `CLUTCH! ${bName} steps up when it matters, reaching a hard-fought 50!`
                            ], 
                            nearMsg: [
                                `HE'S ON FIRE! 🔥 ${bName} is on 45* and a half-century is within breathing distance!`, 
                                `HOLD YOUR BREATH! 50 is just a heartbeat away for ${bName} at ${totalRuns}*!`,
                                `The Countdown Begins! ⏳ ${bName} moves to ${totalRuns}* - 50 is calling!`,
                                `Nervous 40s? Not for ${bName}! Cruising at ${totalRuns}* towards that 50!`,
                                `Eyes on the Prize! 👀 ${bName} is just 5 runs away from glory at ${totalRuns}*!`
                            ] 
                        },
                        { 
                            val: 100, near: 95, label: 'Century', emoji: '💯', 
                            reachMsg: [
                                `PURE MAGIC! 🎩 ${bName} reaches the magical 100! A legendary performance!`, 
                                `HISTORY IN THE MAKING! ${bName} hits a century that defines the game!`,
                                `ABSOLUTE SCENES! 💯 ${bName} enters the history books with a stunning 100!`,
                                `THE CENTURION! ${bName} takes a bow after a world-class hundred!`,
                                `DREAM INNINGS! ${bName} converts the start into a glorious 100!`
                            ], 
                            nearMsg: [
                                `HEART RATES ARE SOARING! ❤️ ${bName} is at ${totalRuns}*, closing in on a legendary ton!`, 
                                `STADIUM ON ITS FEET! 🏟️ ${bName} is just ${100 - totalRuns} away from a historic 100!`,
                                `The Final Stretch! ${bName} reaches ${totalRuns}* - the triple digits are calling!`,
                                `Can he hold his nerve? ${bName} is on ${totalRuns}*, flirting with a century!`,
                                `On the Verge of Greatness! 🌟 ${bName} is just moments away from a 100!`
                            ] 
                        },
                        { 
                            val: 150, near: 145, label: '150 runs', emoji: '🎖️', 
                            reachMsg: [
                                `THE INCREDIBLE 150! 🎖️ ${bName} is batting on a different planet today!`, 
                                `MARATHON MAN! 🏃 ${bName} crosses the 150 mark with sheer dominance!`,
                                `UNSTOPPABLE! ${bName} reaches 150 and is looking for even more!`,
                                `Masterclass Alert! 📢 ${bName} has just reached a monumental 150!`
                            ], 
                            nearMsg: [
                                `Beyond 140! ${bName} is hunting for that 150 mark at ${totalRuns}*!`,
                                `The grind is real! ${bName} is closing in on a massive 150 at ${totalRuns}*!`
                            ] 
                        },
                        { 
                            val: 200, near: 195, label: 'Double Century', emoji: '👑', 
                            reachMsg: [
                                `DOUBLE CENTURY DELIGHT! 👑 ${bName} joins the elite with a breathtaking 200!`, 
                                `THE DOUBLE HUNDRED! ${bName} writes his name in stars with a 200!`,
                                `KING OF THE CREASE! 👑 ${bName} has just hit a mind-blowing double century!`,
                                `LEGENDARY STATUS! ${bName} reaches 200 in a display of pure batting genius!`
                            ], 
                            nearMsg: [
                                `HISTORY AWAITS! 📜 ${bName} is just strokes away from a 200 at ${totalRuns}*!`,
                                `Is this happening? ${bName} is at ${totalRuns}*, nearing a historic 200!`
                            ] 
                        },
                        { 
                            val: 250, near: 245, label: '250 runs', emoji: '🏰', 
                            reachMsg: [
                                `THE TITAN RETURNS! 🏰 ${bName} has scaled the 250 peaks! Incredible!`, 
                                `A MONUMENTAL FEAT! 250 runs for ${bName}, a truly timeless innings!`,
                                `ELITE ENDURANCE! ${bName} reaches 250 and still looks hungry!`
                            ], 
                            nearMsg: [
                                `Almost at the Quarter-Thousand! ${bName} is on ${totalRuns}*, nearing 250!`,
                                `The wall is breaking! ${bName} is at ${totalRuns}*, closing in on 250!`
                            ] 
                        },
                        { 
                            val: 300, near: 295, label: 'Triple Century', emoji: '🛡️', 
                            reachMsg: [
                                `THE TRIPLE TON TRIUMPH! 🛡️ ${bName} enters the pantheon of gods with 300!`, 
                                `IMMORTALIZED! ${bName} hits the triple century! A day for the history books!`,
                                `THE HOLY GRAIL! 300 for ${bName}! Absolute, unadulterated greatness.`
                            ], 
                            nearMsg: [
                                `THE MOUNTAIN TOP! 🏔️ ${bName} is just ${300 - totalRuns} away from a 300!`,
                                `History is holding its breath! ${bName} is at ${totalRuns}*, nearing 300!`
                            ] 
                        }
                    ];

                    for (const m of milestones) {
                        const randomReach = m.reachMsg[Math.floor(Math.random() * m.reachMsg.length)];
                        const randomNear = m.nearMsg[Math.floor(Math.random() * m.nearMsg.length)];
                        
                        await notifyMilestone(m.near, `Nearing ${m.label}! ${m.emoji}`, randomNear);
                        await notifyMilestone(m.val, `${m.label}! ${m.emoji}`, randomReach);
                    }
                }

                // Bowler Milestones
                if (wicket && wicket.isWicket && wicket.type !== 'runout') {
                    const bowlBalls = inningBalls.filter(b => b.bowler === bowler);
                    const totalWickets = bowlBalls.filter(b => b.wicket?.isWicket && b.wicket.type !== 'runout').length;
                    
                    if (totalWickets === 3) {
                        await triggerFollowerNotifications(match, {
                            title: 'Bowling On Fire! 🔥',
                            message: `${bowler} has picked up 3 wickets! Incredible spell.`,
                            type: 'system'
                        });
                    } else if (totalWickets === 5) {
                        await triggerFollowerNotifications(match, {
                            title: 'Five-Wicket Haul! 🖐️',
                            message: `${bowler} has taken a 5-wicket haul! Absolute dominance.`,
                            type: 'system'
                        });
                    } else if (totalWickets === 7) {
                        await triggerFollowerNotifications(match, {
                            title: 'Seven-Wicket Masterclass! 🎯',
                            message: `${bowler} has destroyed the lineup with 7 wickets!`,
                            type: 'system'
                        });
                    } else if (totalWickets === 10) {
                        await triggerFollowerNotifications(match, {
                            title: 'ALL TEN! 💎',
                            message: `${bowler} has taken all 10 wickets in the innings! A miracle performance.`,
                            type: 'system'
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Match Intelligence Error:", err);
        }
    }

    // Emit live update
    emitScoreUpdate(match._id.toString(), {
        score: match.score,
        lastBall: newBall,
        currentInnings: match.currentInnings
    });

    res.status(201).json({
        success: true,
        data: newBall
    });
});

// @desc    Get match balls
// @route   GET /api/matches/:id/balls
// @access  Public
export const getMatchBalls = asyncHandler(async (req, res) => {
    const balls = await Ball.find({ match: req.params.id }).sort({ inning: 1, over: 1, ball: 1 });
    res.json({
        success: true,
        data: balls
    });
});

// @desc    Undo the last recorded ball
// @route   DELETE /api/matches/:id/balls/last
// @access  Private
export const undoLastBall = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    // Find and delete the last ball for the current innings
    const lastBall = await Ball.findOne({ match: match._id, inning: match.currentInnings })
        .sort({ over: -1, ball: -1, _id: -1 });

    if (!lastBall) {
        res.status(400);
        throw new Error('No balls to undo');
    }

    await Ball.findByIdAndDelete(lastBall._id);

    // Recalculate score from remaining balls for THIS innings
    const remainingBalls = await Ball.find({ match: match._id, inning: match.currentInnings })
        .sort({ inning: 1, over: 1, ball: 1 });

    const teamKey = match.currentInnings === 1 ? 'team1' : 'team2';
    let runs = 0;
    let wickets = 0;
    let legalBalls = 0;

    for (const b of remainingBalls) {
        if (b.isCommentaryOnly) continue;
        runs += b.totalBallRuns || (b.runs + (b.extraRuns || 0));
        if (b.wicket && b.wicket.isWicket) { wickets++; }
        if (b.extraType !== 'wide' && b.extraType !== 'noball') {
            legalBalls++;
        }
    }

    const completedOvers = Math.floor(legalBalls / 6);
    const remainingBallsInOver = legalBalls % 6;

    match.score[teamKey].runs = runs;
    match.score[teamKey].wickets = wickets;
    match.score[teamKey].overs = completedOvers + (remainingBallsInOver / 10);

    await match.save();

    // Emit undo event so viewer refreshes
    emitScoreUpdate(match._id.toString(), {
        score: match.score,
        currentInnings: match.currentInnings
    });

    // Also emit specific undo event
    const { getIO } = await import('../config/socket.js');
    try {
        const io = getIO();
        io.to(match._id.toString()).emit('score_undo', { matchId: match._id.toString() });
    } catch { /* socket not initialized */ }

    res.json({
        success: true,
        data: {
            removedBall: lastBall,
            updatedScore: match.score,
            remainingBalls
        }
    });
});

// @desc    Delete a match
// @route   DELETE /api/matches/:id
// @access  Private
export const deleteMatch = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id);

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    // Delete all balls associated with this match
    await Ball.deleteMany({ match: match._id });

    // Delete the match itself
    await match.deleteOne();

    res.json({
        success: true,
        message: 'Match and associated data removed'
    });
});

// Helper function to update points table
async function updatePointsTable(match) {
    if (!match.tournament || !match.result || !match.result.winner && !match.result.isTie) return;

    const tournamentId = match.tournament;
    const { winner, isTie } = match.result;

    // Helper: convert cricket overs notation (e.g., 9.4 = 9 overs + 4 balls) to decimal overs
    const oversToDecimal = (ov) => {
        if (!ov || ov === 0) return 0;
        const full = Math.floor(ov);
        const balls = Math.round((ov - full) * 10);
        return full + (balls / 6);
    };

    // Get tournament for max overs (used when a team is all out)
    const tournament = await Tournament.findById(tournamentId);
    const maxOvers = tournament ? tournament.overs : 20;

    if (isTie) {
        await PointsTable.updateMany(
            { tournament: tournamentId, team: { $in: [match.homeTeam, match.awayTeam] } },
            { $inc: { played: 1, tied: 1, points: tournament?.pointsRule?.tie || 1 } }
        );
    } else if (winner) {
        const loser = winner.toString() === match.homeTeam.toString() ? match.awayTeam : match.homeTeam;

        await PointsTable.findOneAndUpdate(
            { tournament: tournamentId, team: winner },
            { $inc: { played: 1, won: 1, points: tournament?.pointsRule?.win || 2 } }
        );

        await PointsTable.findOneAndUpdate(
            { tournament: tournamentId, team: loser },
            { $inc: { played: 1, lost: 1 } }
        );
    }

    // ── NRR Calculation ──────────────────────────────────────────
    const score1 = match.score?.team1 || { runs: 0, overs: 0, wickets: 0 };
    const score2 = match.score?.team2 || { runs: 0, overs: 0, wickets: 0 };

    // If a team is all-out (10 wickets) or innings is complete, they used the full allotted overs
    let overs1 = oversToDecimal(score1.overs);
    let overs2 = oversToDecimal(score2.overs);
    if (score1.wickets >= 10 || overs1 >= maxOvers) overs1 = maxOvers;
    if (score2.wickets >= 10 || overs2 >= maxOvers) overs2 = maxOvers;

    // Skip NRR update if no overs were bowled
    if (overs1 <= 0 || overs2 <= 0) return;

    // HomeTeam (team1) batted first: scored score1.runs in overs1, conceded score2.runs in overs2
    const homeEntry = await PointsTable.findOne({ tournament: tournamentId, team: match.homeTeam });
    if (homeEntry) {
        homeEntry.runsScored += score1.runs;
        homeEntry.oversFaced += overs1;
        homeEntry.runsConceded += score2.runs;
        homeEntry.oversBowled += overs2;
        // NRR = (total runs scored / total overs faced) - (total runs conceded / total overs bowled)
        homeEntry.nrr = homeEntry.oversFaced > 0 && homeEntry.oversBowled > 0
            ? (homeEntry.runsScored / homeEntry.oversFaced) - (homeEntry.runsConceded / homeEntry.oversBowled)
            : 0;
        await homeEntry.save();
    }

    // AwayTeam (team2) batted second: scored score2.runs in overs2, conceded score1.runs in overs1
    const awayEntry = await PointsTable.findOne({ tournament: tournamentId, team: match.awayTeam });
    if (awayEntry) {
        awayEntry.runsScored += score2.runs;
        awayEntry.oversFaced += overs2;
        awayEntry.runsConceded += score1.runs;
        awayEntry.oversBowled += overs1;
        awayEntry.nrr = awayEntry.oversFaced > 0 && awayEntry.oversBowled > 0
            ? (awayEntry.runsScored / awayEntry.oversFaced) - (awayEntry.runsConceded / awayEntry.oversBowled)
            : 0;
        await awayEntry.save();
    }
}
async function syncPlayerMatchRatings(match) {
    const balls = await Ball.find({ match: match._id });
    if (balls.length === 0) return;

    // 1. Calculate stats for each player
    const stats = {}; // { playerName: { runs, balls, wickets, runsConceded, legalBalls, catches } }
    balls.forEach(b => {
        if (b.isCommentaryOnly) return;

        // Batsman
        if (b.batsman) {
            if (!stats[b.batsman]) stats[b.batsman] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0, catches: 0 };
            if (b.extraType === 'none' || b.extraType === 'noball') stats[b.batsman].runs += b.runs;
            if (b.extraType !== 'wide') stats[b.batsman].balls++;
        }

        // Bowler
        if (b.bowler) {
            if (!stats[b.bowler]) stats[b.bowler] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0, catches: 0 };
            // Byes and Leg-byes are not attributed to the bowler's runs conceded
            if (b.extraType !== 'bye' && b.extraType !== 'legbye') {
                stats[b.bowler].runsConceded += (b.totalBallRuns || (b.runs + (b.extraRuns || 0)));
            }
            if (b.extraType !== 'wide' && b.extraType !== 'noball') stats[b.bowler].legalBalls++;
            if (b.wicket?.isWicket && b.wicket.type !== 'runout') {
                stats[b.bowler].wickets++;
            }
        }

        // Fielder
        if (b.wicket?.isWicket && b.wicket.fielder && b.wicket.type === 'caught') {
            const f = b.wicket.fielder;
            if (!stats[f]) stats[f] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0, catches: 0, drops: 0 };
            stats[f].catches++;
        }

        // Dropped Catch
        if (b.isDroppedCatch && b.droppedFielder) {
            const f = b.droppedFielder;
            if (!stats[f]) stats[f] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0, catches: 0, drops: 0 };
            stats[f].drops = (stats[f].drops || 0) + 1;
        }
    });

    // 2. Load Profiles
    let playerProfiles = [];
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const profilePath = path.resolve(currentDir, '..', 'data', 'playerProfiles.json');

    try {
        if (fs.existsSync(profilePath)) {
            playerProfiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        } else {
            console.warn(`[SYNC] Profile path not found: ${profilePath}`);
            return;
        }
    } catch (err) {
        console.error('Error loading profiles for sync:', err);
        return;
    }

    // 3. Update Profiles
    let updatedCount = 0;
    Object.entries(stats).forEach(([name, s]) => {
        const profile = playerProfiles.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (!profile) return;

        // Calculate Match Rating (0-10)
        let rating = 5.0; // participation baseline

        // Batting impact
        if (s.balls > 0) {
            const batImpact = (s.runs / 15) + ((s.runs / s.balls) * 1.5);
            rating += Math.min(4.0, batImpact);
        }

        // Bowling impact
        if (s.legalBalls > 0) {
            const overs = s.legalBalls / 6;
            const economy = s.runsConceded / overs;
            const bowlImpact = (s.wickets * 1.5) + (overs > 0 ? (Math.max(0, 6 - economy) * 0.5) : 0);
            rating += Math.min(4.0, bowlImpact);
        }

        // Fielding
        rating += (s.catches * 0.5);
        rating -= ((s.drops || 0) * 1.5); // Penalty for dropped catches

        // Normalize
        rating = Math.min(10.0, Math.max(1.0, rating));

        rating = Math.min(10.0, Math.max(1.0, rating));
        const rating100 = Math.round(rating * 10);

        // Update formTrend (0-100 scale)
        if (!profile.formTrend) profile.formTrend = [];
        profile.formTrend.push(rating100);
        if (profile.formTrend.length > 10) profile.formTrend.shift();

        // Update Overall Rating (average of formTrend)
        const sum = profile.formTrend.reduce((a, b) => a + b, 0);
        profile.overallRating = Math.round(sum / profile.formTrend.length);

        updatedCount++;
    });

    // 4. Save Profiles
    if (updatedCount > 0) {
        try {
            fs.writeFileSync(profilePath, JSON.stringify(playerProfiles, null, 4));
            console.log(`[SYNC] Automated player ratings synced for ${updatedCount} players in match ${match._id}.`);
        } catch (err) {
            console.error('Error saving synced profiles:', err);
        }
    }
}

// @desc    Get match forecast (Proper version with reputation scoring)
export const getMatchForecast = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id)
        .populate('homeTeam awayTeam tournament');

    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }

    // Load Player Profiles for Reputation Data
    let playerProfiles = [];
    try {
        const currentFile = fileURLToPath(import.meta.url);
        const currentDir = path.dirname(currentFile);
        const profilePath = path.resolve(currentDir, '..', 'data', 'playerProfiles.json');

        if (fs.existsSync(profilePath)) {
            const data = fs.readFileSync(profilePath, 'utf8');
            playerProfiles = JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading player profiles:', err);
    }

    const extractPlayers = (team) => {
        if (!team) return [];
        const players = team.players || [];
        const rawPlayers = Array.isArray(players) ? players : [];

        return rawPlayers.map(p => {
            const name = (typeof p === 'string' ? p : p?.name) || '';
            let role = (typeof p === 'object' ? p?.role : 'Batter') || 'Batter';

            // Normalize role for cricket (Batter, Bowler, All-Rounder, Wicketkeeper)
            const r = role.toLowerCase();
            if (r.includes('bat') || r.includes('keeper')) role = 'Batter';
            else if (r.includes('bowl')) role = 'Bowler';
            else if (r.includes('all')) role = 'All-Rounder';
            else role = 'Batter'; // Default

            return { name: name.trim(), role: role };
        }).filter(p => p.name.length > 0 && p.name !== '...');
    };

    const homeSquad = extractPlayers(match.homeTeam);
    const awaySquad = extractPlayers(match.awayTeam);
    const homeNames = homeSquad.map(p => p.name);
    const allSquadPlayers = [...homeSquad, ...awaySquad];

    console.log(`[FORECAST] Found ${homeSquad.length} home and ${awaySquad.length} away players for match ${req.params.id}`);

    // Fetch tournament history for current form
    const tournamentMatches = await Match.find({ tournament: match.tournament?._id || match.tournament }).distinct('_id');
    const [batStats, bowlStats] = await Promise.all([
        Ball.aggregate([
            { $match: { match: { $in: tournamentMatches }, batsman: { $in: [...new Set(allSquadPlayers.map(p => p.name))] } } },
            { $group: { _id: "$batsman", runs: { $sum: "$runs" }, outs: { $sum: { $cond: [{ $eq: ["$wicket.isWicket", true] }, 1, 0] } } } }
        ]),
        Ball.aggregate([
            { $match: { match: { $in: tournamentMatches }, bowler: { $in: [...new Set(allSquadPlayers.map(p => p.name))] } } },
            { $group: { _id: "$bowler", wickets: { $sum: { $cond: [{ $eq: ["$wicket.isWicket", true] }, 1, 0] } } } }
        ])
    ]);

    const analyzedPlayers = allSquadPlayers.map(player => {
        const name = player.name;
        const profile = playerProfiles.find(p => p.name.toLowerCase() === name.toLowerCase());
        const profileRating = profile ? profile.overallRating : 75;

        const bat = batStats.find(s => s._id === name) || { runs: 0, outs: 0 };
        const bowl = bowlStats.find(s => s._id === name) || { wickets: 0 };

        // Tournament Form Score (0-100)
        let formScore = 70; // Baseline
        if (bat.runs > 0 || bowl.wickets > 0) {
            formScore = Math.min(100, 70 + (bat.runs * 0.2) + (bowl.wickets * 10));
        }

        const aggregateScore = Math.round((profileRating * 0.7) + (formScore * 0.3));

        let finalRole = profile?.role || player.role || 'Batter';
        if (bowl.wickets > 1) finalRole = 'Bowler';

        return {
            name,
            role: finalRole,
            score: aggregateScore,
            profileRating,
            isHome: homeNames.includes(name)
        };
    });

    // Deduplicate
    const uniqueAnalyzed = Array.from(new Map(analyzedPlayers.map(p => [p.name, p])).values());

    // Sizzling Hot & Under Pressure
    const sorted = [...uniqueAnalyzed].sort((a, b) => b.score - a.score);
    const inForm = sorted.length > 0 ? sorted.slice(0, 4).map(p => ({
        name: p.name,
        team: p.isHome ? match.homeTeam?.name : match.awayTeam?.name,
        reason: `${p.role} with ${p.score} Impact`,
        trend: 'rising'
    })) : [];

    const outForm = uniqueAnalyzed.length > 5 ? sorted.slice(-3).map(p => ({
        name: p.name,
        team: p.isHome ? match.homeTeam?.name : match.awayTeam?.name,
        reason: 'Finding tournament rhythm',
        trend: 'falling'
    })) : (uniqueAnalyzed.length > 0 ? [sorted[sorted.length - 1]].map(p => ({
        name: p.name,
        team: p.isHome ? match.homeTeam?.name : match.awayTeam?.name,
        reason: 'Consistency needed',
        trend: 'falling'
    })) : []);

    // Key Matchup
    const homeBatters = uniqueAnalyzed.filter(p => p.isHome && (p.role === 'Batter' || p.role === 'All-Rounder'));
    const awayBowlers = uniqueAnalyzed.filter(p => !p.isHome && (p.role === 'Bowler' || p.role === 'All-Rounder'));

    let keyMatchup = {
        title: "TEAM BATTLE",
        description: "Squad depth will be tested in this crucial fixture.",
        players: [homeSquad[0]?.name || "...", awaySquad[0]?.name || "..."]
    };

    if (homeBatters.length > 0 && awayBowlers.length > 0) {
        const bestBat = homeBatters.sort((a, b) => b.score - a.score)[0];
        const bestBowl = awayBowlers.sort((a, b) => b.score - a.score)[0];
        keyMatchup = {
            title: "STAR RIVALRY",
            description: `${bestBat.name} looks to lead the charge while ${bestBowl.name} aims for clinical breakthroughs.`,
            players: [bestBat.name, bestBowl.name]
        };
    } else if (uniqueAnalyzed.length >= 2) {
        const bestHome = uniqueAnalyzed.filter(p => p.isHome).sort((a, b) => b.score - a.score)[0];
        const bestAway = uniqueAnalyzed.filter(p => !p.isHome).sort((a, b) => b.score - a.score)[0];
        if (bestHome && bestAway) {
            keyMatchup = {
                title: "KEY PLAYERS",
                description: `Impact performance expected from ${bestHome.name} and ${bestAway.name}.`,
                players: [bestHome.name, bestAway.name]
            };
        }
    }

    // Win Probability
    const homePower = uniqueAnalyzed.filter(p => p.isHome).reduce((acc, p) => acc + p.score, 0);
    const awayPower = uniqueAnalyzed.filter(p => !p.isHome).reduce((acc, p) => acc + p.score, 0);
    const totalPower = homePower + awayPower || 1;
    const homeProb = Math.min(85, Math.max(15, Math.round((homePower / totalPower) * 100)));

    // Tournament Context
    let tournamentContext = null;
    try {
        if (match.tournament) {
            const pt = await PointsTable.findOne({ tournament: match.tournament._id || match.tournament }).populate('entries.team');
            if (pt && pt.entries.length > 0) {
                const sorted = [...pt.entries].sort((a, b) => b.points - a.points || b.nrr - a.nrr);
                const homeId = (match.homeTeam?._id || match.homeTeam).toString();
                const awayId = (match.awayTeam?._id || match.awayTeam).toString();

                const homeEntry = sorted.find(e => e.team._id.toString() === homeId);
                const awayEntry = sorted.find(e => e.team._id.toString() === awayId);

                if (homeEntry && awayEntry) {
                    const diff = Math.abs(homeEntry.nrr - awayEntry.nrr);
                    const isTight = diff < 1.0;

                    tournamentContext = {
                        title: "QUALIFICATION STAKES",
                        description: isTight
                            ? `Only ${diff.toFixed(3)} NRR separates these teams. A dominant win today could cause a massive shift in the points table.`
                            : `A steep NRR gap of ${diff.toFixed(3)}. The trailing team needs a colossal victory to flip the Net Run Rate equation.`,
                        stats: [
                            {
                                label: match.homeTeam?.acronym || "HT",
                                points: homeEntry.points,
                                nrr: homeEntry.nrr > 0 ? `+${homeEntry.nrr.toFixed(3)}` : homeEntry.nrr.toFixed(3),
                                raw: {
                                    runsScored: homeEntry.runsScored,
                                    oversFaced: homeEntry.oversFaced,
                                    runsConceded: homeEntry.runsConceded,
                                    oversBowled: homeEntry.oversBowled
                                }
                            },
                            {
                                label: match.awayTeam?.acronym || "AT",
                                points: awayEntry.points,
                                nrr: awayEntry.nrr > 0 ? `+${awayEntry.nrr.toFixed(3)}` : awayEntry.nrr.toFixed(3),
                                raw: {
                                    runsScored: awayEntry.runsScored,
                                    oversFaced: awayEntry.oversFaced,
                                    runsConceded: awayEntry.runsConceded,
                                    oversBowled: awayEntry.oversBowled
                                }
                            }
                        ]
                    };
                }
            }
        }
    } catch (err) {
        console.error("Match context calculation error:", err);
    }

    res.json({
        success: true,
        data: {
            winProb: { home: homeProb, away: 100 - homeProb },
            keyMatchup,
            inForm,
            outForm,
            tournamentContext,
            venueInsight: {
                pitch: match.venue?.pitchType || "Balanced",
                batting: "Expected to be a good surface for stroke play.",
                bowling: "Early help for pacers, spinners later.",
                score: "270-290"
            }
        }
    });
});

/**
 * Helper to generate Match Intelligence insights during a live match.
 * Scans recent ball history to identify trends, streaks, and matchups.
 */
async function generateMatchIntelligence(matchId, current) {
    // 1. Fetch recent history
    const recentBalls = await Ball.find({
        match: matchId,
        inning: current.inning
    }).sort({ over: -1, ball: -1, _id: -1 }).limit(40);

    const realBalls = recentBalls.filter(b => !b.isCommentaryOnly);
    
    // --- PERSISTENT COOLDOWN & DEDUPLICATION CHECK ---
    const lastAIInsight = await Ball.findOne({
        match: matchId,
        isCommentaryOnly: true,
        insightType: { $ne: 'None' }
    }).sort({ createdAt: -1 });

    let tooFrequent = false;
    if (lastAIInsight) {
        // Calculate absolute ball gap if possible, or use a time/count heuristic
        const aiIndex = recentBalls.findIndex(b => b._id.toString() === lastAIInsight._id.toString());
        // If the last insight is within the last 12 balls of recent history, it's too frequent
        if (aiIndex !== -1 && aiIndex < 12) {
            tooFrequent = true;
        }
    }

    let insight = null;

    // --- TRIGGER 1: Spell Efficiency ---
    if (current.ball >= 6 && !tooFrequent) {
        const overBalls = realBalls.filter(b => b.over === current.over);
        const overRuns = overBalls.reduce((sum, b) => sum + b.totalBallRuns, 0);
        const wickets = overBalls.filter(b => b.wicket?.isWicket).length;

        const bowlerBalls = (await Ball.find({ match: matchId, bowler: current.bowler, inning: current.inning, isCommentaryOnly: false }));
        const bRuns = bowlerBalls.reduce((sum, b) => sum + b.totalBallRuns, 0);
        const bWickets = bowlerBalls.filter(b => b.wicket?.isWicket).length;
        const bOvers = Math.floor(bowlerBalls.length / 6);

        if (overRuns <= 2 && wickets >= 1 && Math.random() < 0.3) {
            insight = {
                type: 'Efficiency',
                message: `CLUTCH OVER: ${current.bowler} just delivered an absolute peach of an over. Only ${overRuns} runs and a wicket! The pressure is sky-high.`,
                metadata: { overRuns, wickets }
            };
        } else if (bOvers >= 2 && bRuns / bOvers < 5 && !insight && Math.random() < 0.2) {
            insight = {
                type: 'Efficiency',
                message: `STIFLING SPELL: ${current.bowler} is operating at an economy of ${(bRuns / bOvers).toFixed(1)}. The batsmen are struggling to find any gaps.`,
                metadata: { eco: bRuns / bOvers }
            };
        }
    }

    // --- TRIGGER 2: Boundary Streak (3 boundaries in row) ---
    if (!insight && current.runs >= 4 && !tooFrequent) {
        const last3 = realBalls.slice(0, 3);
        if (last3.length === 3 && last3.every(b => b.runs >= 4)) {
            insight = {
                type: 'Trend',
                message: `HATTRICK OF BOUNDARIES! ${current.batsman} is in a destructive mood! The fielders are mere spectators right now.`,
                metadata: { streak: 3, player: current.batsman }
            };
        }
    }

    // --- TRIGGER 3: Pressure / Dot Buildup (4 dots in row) ---
    if (!insight && current.runs === 0 && !tooFrequent) {
        let dots = 0;
        for (const b of realBalls) {
            if (b.totalBallRuns === 0) dots++;
            else break;
        }
        if (dots >= 4 && Math.random() < 0.4) {
            insight = {
                type: 'Pressure',
                message: `PRESSURE INDEX: ${dots} consecutive dot balls. ${current.batsman} is feeling the heat as the required rate climbs.`,
                metadata: { dots, player: current.batsman }
            };
        }
    }

    // --- TRIGGER 4: Partnership Milestones (Priority) ---
    const inningBallsTotal = await Ball.find({ match: matchId, inning: current.inning, isCommentaryOnly: false });
    let pRuns = 0;
    for (let i = inningBallsTotal.length - 1; i >= 0; i--) {
        const b = inningBallsTotal[i];
        if (b.wicket?.isWicket) break;
        pRuns += (b.runs + (b.extraRuns || 0));
    }
    // Only check if we haven't already reported THIS specific milestone
    if (!insight && [25, 50, 75, 100].includes(pRuns) && current.runs > 0) {
        const alreadyReported = lastAIInsight && lastAIInsight.insightMetadata?.milestone === pRuns;
        if (!alreadyReported) {
            insight = {
                type: 'Trend',
                message: `MILESTONE ALERT: This partnership has just reached ${pRuns} runs! They are building a solid foundation here.`,
                metadata: { milestone: pRuns }
            };
        }
    }

    // --- TRIGGER 5: Strike Rate Trend (Low SR in T20) ---
    if (!insight && current.ball >= 12 && Math.random() < 0.15 && !tooFrequent) {
        const batBalls = realBalls.filter(b => b.batsman === current.batsman);
        const batRuns = batBalls.reduce((sum, b) => sum + b.runs, 0);
        const batCount = batBalls.length;
        const sr = batCount > 0 ? (batRuns / batCount) * 100 : 0;

        if (sr < 80 && batCount >= 10) {
            insight = {
                type: 'Pressure',
                message: `STRIKE RATE ALERT: ${current.batsman} is currently scoring at a strike rate of ${sr.toFixed(1)}. They need to find boundaries to keep the scoreboard ticking.`,
                metadata: { sr, player: current.batsman }
            };
        }
    }

    // --- TRIGGER 6: Real-time Trend & Momentum ---
    if (!insight && realBalls.length >= 12 && !tooFrequent && Math.random() < 0.15) {
        const last12 = realBalls.slice(0, 12);
        const runsLast12 = last12.reduce((sum, b) => sum + (b.totalBallRuns || 0), 0);
        const legalLast12 = last12.filter(b => b.extraType !== 'wide' && b.extraType !== 'noball').length;
        const oversAnalyzed = (Math.floor(legalLast12 / 6) + (legalLast12 % 6) / 10).toFixed(1);
        
        if (runsLast12 <= 6 && legalLast12 >= 6) {
            insight = {
                type: 'Trend',
                message: `TREND: The bowlers are dominating. Only ${runsLast12} runs have come off the last ${oversAnalyzed} overs. The pressure is mounting.`,
                metadata: { runs: runsLast12, overs: oversAnalyzed }
            };
        } else if (runsLast12 >= 20) {
            insight = {
                type: 'Trend',
                message: `MOMENTUM: A scoring surge! ${runsLast12} runs have been hammered in the last ${oversAnalyzed} overs. The fielding side needs a wicket.`,
                metadata: { runs: runsLast12, overs: oversAnalyzed }
            };
        }
    }

    // --- TRIGGER 7: Near Milestone Fact ---
    if (!insight && !tooFrequent && Math.random() < 0.2) {
        const batBalls = inningBallsTotal.filter(b => b.batsman === current.batsman);
        const currentTotalRuns = batBalls.reduce((sum, b) => sum + b.runs, 0);
        const targets = [50, 100, 150, 200];
        const nextTarget = targets.find(t => t > currentTotalRuns);
        if (nextTarget && (nextTarget - currentTotalRuns) <= 5) {
            insight = {
                type: 'Matchup',
                message: `FACT: ${current.batsman} is just ${nextTarget - currentTotalRuns} runs away from a brilliant ${nextTarget}. The crowd is on their feet!`,
                metadata: { currentRuns: currentTotalRuns, nextTarget }
            };
        }
    }

    // --- FINAL REPETITION CHECK ---
    if (insight && lastAIInsight && lastAIInsight.commentaryMessage === insight.message) {
        insight = null; // Absolute final block against exact repetition
    }

    // 3. If insight found, record as an Intelligence Ball
    if (insight) {
        const intelBall = await Ball.create({
            match: matchId,
            inning: current.inning,
            over: current.over,
            ball: current.ball,
            batsman: current.batsman,
            bowler: current.bowler,
            totalBallRuns: 0,
            isCommentaryOnly: true,
            commentaryMessage: insight.message,
            insightType: insight.type,
            insightMetadata: insight.metadata
        });

        // Emit specifically for intelligence to trigger UI animations
        try {
            const { getIO } = await import('../config/socket.js');
            const io = getIO();
            io.to(matchId.toString()).emit('match_intelligence', {
                matchId: matchId.toString(),
                insight: intelBall
            });
        } catch { /* socket not init */ }

        return intelBall;
    }
    return null;
}
