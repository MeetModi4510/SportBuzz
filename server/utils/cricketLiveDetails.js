import Ball from '../models/Ball.js';

export const computeCricketLiveDetails = async (match) => {
    try {
        if (match.status !== 'Live' || match.matchEnded || !match.currentInnings) return null;

        // Fetch all balls for the current innings
        const balls = await Ball.find({ match: match._id, inning: match.currentInnings }).sort({ over: 1, ball: 1, _id: 1 });

        if (!balls || balls.length === 0) return null;

        const lastBall = balls[balls.length - 1];
        if (lastBall.isCommentaryOnly && balls.length === 1) return null; // Only commentary so far
        
        // Find the last real ball for active players if last is commentary
        let effectiveLastBall = lastBall;
        for (let i = balls.length - 1; i >= 0; i--) {
            if (!balls[i].isCommentaryOnly && balls[i].batsman && balls[i].bowler) {
                effectiveLastBall = balls[i];
                break;
            }
        }

        const strikerName = effectiveLastBall.batsman;
        const nonStrikerName = effectiveLastBall.nonStriker;
        const bowlerName = effectiveLastBall.bowler;

        if (!strikerName) return null;

        const stats = {
            batsmanStriker: { batName: strikerName, runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 },
            batsmanNonStriker: nonStrikerName ? { batName: nonStrikerName, runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 } : null,
            bowlerStriker: { bowlName: bowlerName, overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 }
        };

        let bowlerLegalBalls = 0;
        
        balls.forEach(b => {
            if (b.isCommentaryOnly) return;
            
            const runs = b.runs || 0;
            const isWide = b.extraType === 'wide';

            // Batter stats
            if (b.batsman === strikerName) {
                stats.batsmanStriker.runs += runs;
                if (!isWide) stats.batsmanStriker.balls += 1;
                if (runs === 4) stats.batsmanStriker.fours += 1;
                if (runs === 6) stats.batsmanStriker.sixes += 1;
            } else if (nonStrikerName && b.batsman === nonStrikerName) {
                stats.batsmanNonStriker.runs += runs;
                if (!isWide) stats.batsmanNonStriker.balls += 1;
                if (runs === 4) stats.batsmanNonStriker.fours += 1;
                if (runs === 6) stats.batsmanNonStriker.sixes += 1;
            }

            // Bowler stats
            if (b.bowler === bowlerName) {
                const isLegalBowling = b.extraType === 'none' || b.extraType === 'bye' || b.extraType === 'legbye';
                if (isLegalBowling) bowlerLegalBalls += 1;
                
                if (b.extraType === 'wide' || b.extraType === 'noball') {
                    stats.bowlerStriker.runs += (runs + (b.extraRuns || 1));
                } else if (b.extraType !== 'bye' && b.extraType !== 'legbye') {
                    stats.bowlerStriker.runs += runs;
                }

                if (b.wicket && b.wicket.isWicket && b.wicket.type !== 'runout') {
                    stats.bowlerStriker.wickets += 1;
                }
            }
        });

        if (stats.batsmanStriker.balls > 0) {
            stats.batsmanStriker.strikeRate = ((stats.batsmanStriker.runs / stats.batsmanStriker.balls) * 100).toFixed(1);
        }
        if (stats.batsmanNonStriker && stats.batsmanNonStriker.balls > 0) {
            stats.batsmanNonStriker.strikeRate = ((stats.batsmanNonStriker.runs / stats.batsmanNonStriker.balls) * 100).toFixed(1);
        }

        const fullOvers = Math.floor(bowlerLegalBalls / 6);
        const remainder = bowlerLegalBalls % 6;
        stats.bowlerStriker.overs = parseFloat(`${fullOvers}.${remainder}`);

        if (bowlerLegalBalls > 0) {
            stats.bowlerStriker.economy = (stats.bowlerStriker.runs / (bowlerLegalBalls / 6)).toFixed(1);
        }

        return stats;
    } catch (err) {
        console.error("Error computing cricket live details:", err);
        return null;
    }
};
