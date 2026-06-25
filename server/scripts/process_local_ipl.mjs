import fs from 'fs';
import path from 'path';

const inputDir = 'd:\\dev_scripts\\ipl_json';
// We will put it in server/data as requested
const outputFile = path.join('d:\\dev_scripts\\server\\data', 'ipl_local_data.json');

console.log(`Reading files from ${inputDir}...`);

let files;
try {
    files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
} catch (e) {
    console.error(`Error reading ${inputDir}:`, e);
    process.exit(1);
}

const dataBySeason = {};

function initSeason(season) {
    if (!dataBySeason[season]) {
        dataBySeason[season] = {
            seasonStr: season.toString(),
            matches: [],
            standings: {},
            squads: {},
            stats: {
                batting: {}, // playerId -> { name, runs, balls, innings, notOuts }
                bowling: {}  // playerId -> { name, wickets, runsConceded, ballsBowled, innings }
            }
        };
    }
}

function initTeamStanding(season, team) {
    if (!dataBySeason[season].standings[team]) {
        dataBySeason[season].standings[team] = {
            teamName: team,
            matches: 0,
            won: 0,
            lost: 0,
            tied: 0,
            noResult: 0,
            points: 0,
            nrr: 0,
            runsScored: 0,
            oversFaced: 0,
            runsConceded: 0,
            oversBowled: 0
        };
    }
}

function initTeamSquad(season, team) {
    if (!dataBySeason[season].squads[team]) {
        dataBySeason[season].squads[team] = new Set();
    }
}

let count = 0;
for (const file of files) {
    count++;
    if (count % 100 === 0) console.log(`Processed ${count} files...`);
    const filePath = path.join(inputDir, file);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const matchData = JSON.parse(raw);

        if (!matchData.info || !matchData.info.season) continue;
        
        let season = matchData.info.season;
        if (typeof season !== 'string') season = season.toString();
        
        initSeason(season);

        const info = matchData.info;
        const teams = info.teams;
        if (!teams || teams.length !== 2) continue;

        const team1 = teams[0];
        const team2 = teams[1];
        
        initTeamStanding(season, team1);
        initTeamStanding(season, team2);
        initTeamSquad(season, team1);
        initTeamSquad(season, team2);

        // -- Matches --
        const matchSummary = {
            id: file.replace('.json', ''),
            date: info.dates && info.dates[0] ? info.dates[0] : 'Unknown',
            teamNames: `${team1} vs ${team2}`,
            team1,
            team2,
            team1Score: '',
            team2Score: '',
            venue: info.venue || 'Unknown',
            city: info.city || '',
            toss: info.toss ? `${info.toss.winner} won the toss and decided to ${info.toss.decision}` : '',
            result: '',
            stage: info.event && info.event.stage ? info.event.stage : (info.event && typeof info.event.match_number === 'string' ? info.event.match_number : null)
        };

        if (info.outcome) {
            if (info.outcome.winner) {
                const by = info.outcome.by;
                const byStr = by && by.runs ? `${by.runs} runs` : (by && by.wickets ? `${by.wickets} wickets` : '');
                matchSummary.result = `${info.outcome.winner} won` + (byStr ? ` by ${byStr}` : '');
            } else if (info.outcome.eliminator) {
                matchSummary.result = `${info.outcome.eliminator} won after Super Over`;
            } else if (info.outcome.result) {
                matchSummary.result = `Match ${info.outcome.result}`;
            }
        }

        dataBySeason[season].matches.push(matchSummary);

        const matchNumber = info.event && info.event.match_number;
        const matchStage = info.event && info.event.stage;
        let isKnockout = false;
        if (typeof matchNumber === 'string') {
            const lower = matchNumber.toLowerCase();
            if (lower.includes('final') || lower.includes('qualifier') || lower.includes('eliminator') || lower.includes('semi')) {
                isKnockout = true;
            }
        }
        if (typeof matchStage === 'string') {
            const lower = matchStage.toLowerCase();
            if (lower.includes('final') || lower.includes('qualifier') || lower.includes('eliminator') || lower.includes('semi')) {
                isKnockout = true;
            }
        }

        // -- Squads --
        if (info.players) {
            if (info.players[team1]) info.players[team1].forEach(p => dataBySeason[season].squads[team1].add(p));
            if (info.players[team2]) info.players[team2].forEach(p => dataBySeason[season].squads[team2].add(p));
        }

        // -- Standings --
        if (!isKnockout) {
            const s1 = dataBySeason[season].standings[team1];
            const s2 = dataBySeason[season].standings[team2];

            const winner = info.outcome ? (info.outcome.winner || info.outcome.eliminator) : null;

            if (winner) {
                s1.matches++;
                s2.matches++;
                if (winner === team1) {
                    s1.won++; s1.points += 2;
                    s2.lost++;
                } else {
                    s2.won++; s2.points += 2;
                    s1.lost++;
                }
            } else if (info.outcome && info.outcome.result === 'tie') {
                s1.matches++; s2.matches++;
                s1.tied++; s1.points += 1;
                s2.tied++; s2.points += 1;
            } else if (info.outcome && info.outcome.result === 'no result') {
                s1.matches++; s2.matches++;
                s1.noResult++; s1.points += 1;
                s2.noResult++; s2.points += 1;
            }
        }

        // -- Stats & NRR --
        let t1Runs = 0, t1Wickets = 0, t1Balls = 0;
        let t2Runs = 0, t2Wickets = 0, t2Balls = 0;

        if (matchData.innings && Array.isArray(matchData.innings)) {
            matchData.innings.forEach(inning => {
                const battingTeam = inning.team;
                const bowlingTeam = battingTeam === team1 ? team2 : team1;
                
                let teamRuns = 0;
                let teamWickets = 0;
                let teamBalls = 0;

                if (inning.overs && Array.isArray(inning.overs)) {
                    inning.overs.forEach(over => {
                        if (over.deliveries && Array.isArray(over.deliveries)) {
                            over.deliveries.forEach(ball => {
                                const batter = ball.batter;
                                const bowler = ball.bowler;
                                const runs = ball.runs;
                                
                                teamRuns += runs.total;
                                const isWideOrNoBall = ball.extras && (ball.extras.wides > 0 || ball.extras.noballs > 0);
                                if (!isWideOrNoBall) teamBalls++;

                                if (!dataBySeason[season].stats.batting[batter]) {
                                    dataBySeason[season].stats.batting[batter] = { name: batter, runs: 0, balls: 0 };
                                }
                                dataBySeason[season].stats.batting[batter].runs += runs.batter;
                                if (!ball.extras || !ball.extras.wides) {
                                    dataBySeason[season].stats.batting[batter].balls++;
                                }

                                if (!dataBySeason[season].stats.bowling[bowler]) {
                                    dataBySeason[season].stats.bowling[bowler] = { name: bowler, wickets: 0, runsConceded: 0, ballsBowled: 0 };
                                }
                                let runsConceded = runs.total;
                                if (ball.extras && (ball.extras.byes > 0 || ball.extras.legbyes > 0 || ball.extras.penalty > 0)) {
                                    runsConceded -= (ball.extras.byes || 0) + (ball.extras.legbyes || 0) + (ball.extras.penalty || 0);
                                }
                                dataBySeason[season].stats.bowling[bowler].runsConceded += runsConceded;
                                
                                if (!isWideOrNoBall) {
                                    dataBySeason[season].stats.bowling[bowler].ballsBowled++;
                                }

                                if (ball.wickets && Array.isArray(ball.wickets)) {
                                    teamWickets += ball.wickets.length;
                                    ball.wickets.forEach(w => {
                                        if (w.kind !== 'run out' && w.kind !== 'retired hurt' && w.kind !== 'retired out' && w.kind !== 'obstructing the field') {
                                            dataBySeason[season].stats.bowling[bowler].wickets++;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                
                if (battingTeam === team1) {
                    t1Runs += teamRuns;
                    t1Wickets += teamWickets;
                    t1Balls += teamBalls;
                } else if (battingTeam === team2) {
                    t2Runs += teamRuns;
                    t2Wickets += teamWickets;
                    t2Balls += teamBalls;
                }
                
                if (!isKnockout) {
                    const batS = dataBySeason[season].standings[battingTeam];
                    const bowlS = dataBySeason[season].standings[bowlingTeam];
                    if (batS) {
                        batS.runsScored += teamRuns;
                        batS.oversFaced += (teamBalls / 6);
                    }
                    if (bowlS) {
                        bowlS.runsConceded += teamRuns;
                        bowlS.oversBowled += (teamBalls / 6);
                    }
                }
            });
            
            const formatOvers = (balls) => {
                const overs = Math.floor(balls / 6);
                const rem = balls % 6;
                return `${overs}.${rem}`;
            };
            
            if (t1Balls > 0) matchSummary.team1Score = `${t1Runs}/${t1Wickets} (${formatOvers(t1Balls)})`;
            if (t2Balls > 0) matchSummary.team2Score = `${t2Runs}/${t2Wickets} (${formatOvers(t2Balls)})`;
        }
    } catch (err) {
        console.error(`Error processing file ${file}:`, err);
    }
}

for (const season in dataBySeason) {
    const sData = dataBySeason[season];
    
    for (const team in sData.squads) {
        sData.squads[team] = Array.from(sData.squads[team]);
    }
    
    const stArr = Object.values(sData.standings);
    stArr.forEach(team => {
        const rsr = team.oversFaced > 0 ? (team.runsScored / team.oversFaced) : 0;
        const rcr = team.oversBowled > 0 ? (team.runsConceded / team.oversBowled) : 0;
        team.nrr = (rsr - rcr).toFixed(3);
    });
    stArr.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return parseFloat(b.nrr) - parseFloat(a.nrr);
    });
    sData.standings = stArr;
    
    sData.matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const batArr = Object.values(sData.stats.batting)
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 100);
    const bowlArr = Object.values(sData.stats.bowling)
        .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
        .slice(0, 100);
        
    sData.stats = {
        topRunScorers: batArr,
        topWicketTakers: bowlArr
    };
}

const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(dataBySeason, null, 2));
console.log(`Successfully processed data into ${outputFile}`);
