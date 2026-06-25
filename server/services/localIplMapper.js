import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iplJsonDir = path.join(__dirname, '..', '..', 'ipl_json');

function getLocalMatchData(id) {
    const filePath = path.join(iplJsonDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`Error reading local IPL match ${id}:`, e);
        return null;
    }
}

export async function getLocalMatchInfo(id) {
    const matchData = getLocalMatchData(id);
    if (!matchData) return null;

    const info = matchData.info;
    const team1 = info.teams[0];
    const team2 = info.teams[1];

    let resultStatus = 'Match Completed';
    if (info.outcome) {
        if (info.outcome.winner) {
            const byStr = info.outcome.by?.runs ? `${info.outcome.by.runs} runs` : (info.outcome.by?.wickets ? `${info.outcome.by.wickets} wickets` : '');
            resultStatus = `${info.outcome.winner} won${byStr ? ' by ' + byStr : ''}`;
        } else if (info.outcome.eliminator) {
            resultStatus = `${info.outcome.eliminator} won after Super Over`;
        } else if (info.outcome.result) {
            resultStatus = `Match ${info.outcome.result}`;
        }
    }

    return {
        matchInfo: {
            matchId: id,
            matchDescription: info.event?.stage || 'League Match',
            matchFormat: info.match_type || 'T20',
            matchType: info.match_type || 'T20',
            year: info.season,
            state: 'Complete',
            status: resultStatus,
            team1: { teamId: 1, teamName: team1, teamSName: team1 },
            team2: { teamId: 2, teamName: team2, teamSName: team2 },
            venueInfo: {
                ground: info.venue,
                city: info.city || ''
            },
            matchStartTimestamp: new Date(info.dates && info.dates[0] ? info.dates[0] : Date.now()).getTime() / 1000,
            tossResults: {
                tossWinnerName: info.toss?.winner || '',
                decision: info.toss?.decision || ''
            },
            umpire1: { name: info.officials?.umpires?.[0] || 'Unknown' },
            umpire2: { name: info.officials?.umpires?.[1] || 'Unknown' },
            referee: { name: info.officials?.match_referees?.[0] || 'Unknown' }
        },
        venueInfo: {
            ground: info.venue,
            city: info.city || ''
        },
        extraInfo: {
            Match: `${team1} vs ${team2}, Match ${id}`,
            Date: info.dates && info.dates[0] ? info.dates[0] : 'Unknown Date',
            Time: 'Unknown Time',
            Stadium: info.venue,
            City: info.city || '',
            Toss: info.toss ? `${info.toss.winner} won the toss and chose to ${info.toss.decision}` : 'Toss unknown',
            Umpires: (info.officials?.umpires || []).join(', '),
            Referee: info.officials?.match_referees?.[0] || 'TBA'
        }
    };
}

export async function getLocalMatchScorecard(id) {
    const matchData = getLocalMatchData(id);
    if (!matchData || !matchData.innings) return null;

    const innings = [];

    matchData.innings.forEach((inn, index) => {
        const teamName = inn.team;
        let totalRuns = 0;
        let totalWickets = 0;
        let totalBalls = 0;
        let extras = { total: 0, byes: 0, legByes: 0, wides: 0, noBalls: 0, penalty: 0 };

        const battingStats = {};
        const bowlingStats = {};

        if (inn.overs) {
            inn.overs.forEach(over => {
                over.deliveries.forEach(ball => {
                    const batter = ball.batter;
                    const bowler = ball.bowler;
                    const runs = ball.runs;

                    totalRuns += runs.total;

                    const isWideOrNoBall = ball.extras && (ball.extras.wides > 0 || ball.extras.noballs > 0);
                    if (!isWideOrNoBall) totalBalls++;

                    // Extras
                    if (ball.extras) {
                        extras.total += (runs.total - runs.batter);
                        if (ball.extras.wides) extras.wides += ball.extras.wides;
                        if (ball.extras.noballs) extras.noBalls += ball.extras.noballs;
                        if (ball.extras.byes) extras.byes += ball.extras.byes;
                        if (ball.extras.legbyes) extras.legByes += ball.extras.legbyes;
                        if (ball.extras.penalty) extras.penalty += ball.extras.penalty;
                    }

                    // Batting
                    if (!battingStats[batter]) battingStats[batter] = { batName: batter, runs: 0, balls: 0, fours: 0, sixes: 0, outDesc: 'not out' };
                    battingStats[batter].runs += runs.batter;
                    if (!ball.extras || !ball.extras.wides) battingStats[batter].balls++;
                    if (runs.batter === 4) battingStats[batter].fours++;
                    if (runs.batter === 6) battingStats[batter].sixes++;

                    // Bowling
                    if (!bowlingStats[bowler]) bowlingStats[bowler] = { bowlName: bowler, overs: 0, maidens: 0, runs: 0, wickets: 0, balls: 0 };
                    let runsConceded = runs.total;
                    if (ball.extras && (ball.extras.byes > 0 || ball.extras.legbyes > 0 || ball.extras.penalty > 0)) {
                        runsConceded -= (ball.extras.byes || 0) + (ball.extras.legbyes || 0) + (ball.extras.penalty || 0);
                    }
                    bowlingStats[bowler].runs += runsConceded;
                    if (!isWideOrNoBall) bowlingStats[bowler].balls++;

                    // Wickets
                    if (ball.wickets) {
                        totalWickets += ball.wickets.length;
                        ball.wickets.forEach(w => {
                            if (w.kind !== 'run out' && w.kind !== 'retired hurt' && w.kind !== 'retired out' && w.kind !== 'obstructing the field') {
                                bowlingStats[bowler].wickets++;
                            }
                            if (battingStats[w.player_out]) {
                                let outStr = w.kind;
                                if (w.fielders) outStr = `c ${w.fielders[0].name} b ${bowler}`;
                                else if (w.kind === 'bowled') outStr = `b ${bowler}`;
                                else if (w.kind === 'lbw') outStr = `lbw b ${bowler}`;
                                battingStats[w.player_out].outDesc = outStr;
                            }
                        });
                    }
                });
            });
        }

        const oversFormatted = `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;

        const batting = Object.values(battingStats).map(b => ({
            ...b,
            strikeRate: b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00'
        }));

        const bowling = Object.values(bowlingStats).map(b => ({
            ...b,
            overs: `${Math.floor(b.balls / 6)}.${b.balls % 6}`,
            economy: b.balls > 0 ? ((b.runs / (b.balls / 6))).toFixed(2) : '0.00'
        }));

        innings.push({
            teamName: teamName,
            scoreDetails: {
                runs: totalRuns,
                wickets: totalWickets,
                overs: oversFormatted
            },
            batting: batting,
            bowling: bowling,
            extrasData: {
                total: extras.total,
                byes: extras.byes,
                legByes: extras.legByes,
                wides: extras.wides,
                noBalls: extras.noBalls,
                penalty: extras.penalty
            }
        });
    });

    return { innings };
}



export async function getLocalMatchSummary(id) {
    const infoData = await getLocalMatchInfo(id);
    const scorecardData = await getLocalMatchScorecard(id);

    if (!infoData) return null;

    let matchScore = null;
    if (scorecardData && scorecardData.innings && scorecardData.innings.length > 0) {
        matchScore = { team1Score: {}, team2Score: {} };
        const inn1 = scorecardData.innings[0];
        const inn2 = scorecardData.innings.length > 1 ? scorecardData.innings[1] : null;

        if (inn1) {
            matchScore.team1Score.inngs1 = {
                runs: inn1.scoreDetails.runs,
                wickets: inn1.scoreDetails.wickets,
                overs: inn1.scoreDetails.overs
            };
        }
        if (inn2) {
            matchScore.team2Score.inngs1 = {
                runs: inn2.scoreDetails.runs,
                wickets: inn2.scoreDetails.wickets,
                overs: inn2.scoreDetails.overs
            };
        }
    }

    return {
        matchInfo: infoData.matchInfo,
        matchScore: matchScore
    };
}

export async function getLocalMatchCommentary(id) {
    const matchData = getLocalMatchData(id);
    if (!matchData || !matchData.innings) return null;

    const commentary = [];

    // Reverse iterate so the latest balls are first
    for (let i = matchData.innings.length - 1; i >= 0; i--) {
        const inn = matchData.innings[i];
        if (!inn.overs) continue;

        let totalRuns = 0;
        let totalWickets = 0;

        // Calculate total score sequentially to assign to each ball
        const balls = [];
        inn.overs.forEach((over, overIdx) => {
            over.deliveries.forEach((ball, ballIdx) => {
                totalRuns += ball.runs.total;
                if (ball.wickets) {
                    totalWickets += ball.wickets.length;
                }
                balls.push({ overNum: over.over, overData: over, ball: ball, currentRuns: totalRuns, currentWkts: totalWickets, ballIdx: ballIdx + 1 });
            });
        });

        // Add balls in reverse order
        for (let j = balls.length - 1; j >= 0; j--) {
            const b = balls[j];
            let commText = `${b.ball.bowler} to ${b.ball.batter}, `;
            
            let ballResult = '';
            if (b.ball.wickets) {
                ballResult = 'OUT';
                commText += `**OUT!** ${b.ball.wickets[0].kind}. `;
            } else if (b.ball.runs.batter === 4) {
                ballResult = 'FOUR';
                commText += `**FOUR!**`;
            } else if (b.ball.runs.batter === 6) {
                ballResult = 'SIX';
                commText += `**SIX!**`;
            } else if (b.ball.runs.total === 0) {
                ballResult = 'no run';
                commText += `no run`;
            } else {
                ballResult = `${b.ball.runs.total} run${b.ball.runs.total > 1 ? 's' : ''}`;
                commText += `${b.ball.runs.total} run${b.ball.runs.total > 1 ? 's' : ''}`;
            }

            if (b.ball.extras) {
                const extras = Object.keys(b.ball.extras).filter(k => b.ball.extras[k] > 0).join(', ');
                commText += ` (extras: ${extras})`;
            }

            commentary.push({
                overNum: b.overNum,
                ballNbr: b.ballIdx,
                commText: commText,
                batTeamName: inn.team,
                bowlerName: b.ball.bowler,
                batsmanName: b.ball.batter,
                runs: b.ball.runs.total,
                batTeamScore: b.currentRuns,
                batTeamWkts: b.currentWkts,
                event: ballResult === 'OUT' ? 'WICKET' : (ballResult === 'FOUR' ? 'FOUR' : (ballResult === 'SIX' ? 'SIX' : 'NONE'))
            });
        }
    }

    return { commentary };
}

export async function getLocalMatchSquads(id) {
    const matchData = getLocalMatchData(id);
    if (!matchData || !matchData.info || !matchData.info.players) return null;

    const info = matchData.info;
    const team1Name = info.teams[0];
    const team2Name = info.teams[1];

    const formatSquad = (teamName) => {
        const players = info.players[teamName] || [];
        return {
            teamName: teamName,
            teamId: teamName === team1Name ? 1 : 2,
            'playing XI': players.map((p, idx) => ({
                id: `${teamName}-${idx}`,
                name: p,
                role: 'Player',
                captain: info.registry?.people?.[p] ? false : false // Can add captain logic later if available
            }))
        };
    };

    return {
        team1: formatSquad(team1Name),
        team2: formatSquad(team2Name)
    };
}
