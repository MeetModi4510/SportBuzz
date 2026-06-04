import { useState, useMemo } from "react";
import { Match, Ball } from "@/data/scoringTypes";
import { calculateWinProbability } from "@/services/cricketMapper";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
    ScatterChart, Scatter, ZAxis, ReferenceLine,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Line
} from "recharts";
import { Activity, TrendingUp, Target, Zap, Users, Award, Layers, Crosshair, Swords, BarChart3, TrendingDown, Combine, AlertTriangle, ShieldOff, Eraser, Flame, Star, User } from "lucide-react";

const TEAM1_COLOR = "#3b82f6";
const TEAM2_COLOR = "#ef4444";
const EXTRAS_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ec4899"];
const TOOLTIP_STYLE = {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#e2e8f0",
};

interface LabProps {
    match: Match;
    balls: Ball[];
}

interface OverStats {
    over: number;
    runs: number;
    wickets: number;
    runRate: number;
    cumRuns: number;
    cumWickets: number;
    team: string;
}

interface BatsmanStats {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    sr: number;
    out: boolean;
}

interface BowlerStats {
    name: string;
    balls: number;
    runs: number;
    wickets: number;
    overs: string;
    economy: number;
}

const SectionCard = ({ icon, title, subtitle, children }: {
    icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode;
}) => (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-800/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">{icon}</div>
            <div>
                <h3 className="font-semibold text-sm text-white">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
            </div>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const formatOvers = (balls: number) => {
    const compOvers = Math.floor(balls / 6);
    const rem = balls % 6;
    return rem === 0 ? `${compOvers}` : `${compOvers}.${rem}`;
};

export const TournamentCricketLab = ({ match, balls }: LabProps) => {
    const [activeInnings, setActiveInnings] = useState<1 | 2>(1);

    const team1Name = match.homeTeam?.name || "Team 1";
    const team2Name = match.awayTeam?.name || "Team 2";

    // ── Separate balls by inning ──────────────────────────────────
    const inn1Balls = useMemo(() => balls.filter(b => b.inning === 1), [balls]);
    const inn2Balls = useMemo(() => balls.filter(b => b.inning === 2), [balls]);
    const activeBalls = activeInnings === 1 ? inn1Balls : inn2Balls;
    const activeTeamName = activeInnings === 1 ? team1Name : team2Name;
    const bowlingTeamName = activeInnings === 1 ? team2Name : team1Name;

    // ── Over-by-over run progression ─────────────────────────────
    const overData = useMemo((): OverStats[] => {
        const overMap: Record<number, { runs: number; wickets: number; }> = {};
        for (const ball of activeBalls) {
            const ovNum = ball.over;
            if (!overMap[ovNum]) overMap[ovNum] = { runs: 0, wickets: 0 };
            overMap[ovNum].runs += ball.totalBallRuns;
            if (ball.wicket?.isWicket) overMap[ovNum].wickets += 1;
        }
        const overs = Object.keys(overMap).map(Number).sort((a, b) => a - b);
        let cumRuns = 0, cumWickets = 0;
        return overs.map(ov => {
            const { runs, wickets } = overMap[ov];
            cumRuns += runs;
            cumWickets += wickets;
            return {
                over: ov + 1,
                runs,
                wickets,
                runRate: parseFloat((runs).toFixed(1)),
                cumRuns,
                cumWickets,
                team: activeTeamName,
            };
        });
    }, [activeBalls, activeTeamName]);

    // ── Batsman stats ─────────────────────────────────────────────
    const batsmanStats = useMemo((): BatsmanStats[] => {
        const map: Record<string, BatsmanStats> = {};
        for (const ball of activeBalls) {
            if (!ball.batsman) continue;
            if (!map[ball.batsman]) {
                map[ball.batsman] = { name: ball.batsman, runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, out: false };
            }
            const s = map[ball.batsman];
            if (ball.extraType !== "wide") {
                s.balls += 1;
            }
            if (ball.extraType === "none" || ball.extraType === "noball") {
                s.runs += ball.runs;
            }
            if (ball.runs === 4) s.fours += 1;
            if (ball.runs === 6) s.sixes += 1;
            if (ball.wicket?.isWicket && ball.wicket.playerOut === ball.batsman) s.out = true;
        }
        return Object.values(map)
            .map(s => ({ ...s, sr: s.balls > 0 ? parseFloat(((s.runs / s.balls) * 100).toFixed(1)) : 0 }))
            .sort((a, b) => b.runs - a.runs);
    }, [activeBalls]);

    // ── Bowler stats ─────────────────────────────────────────────
    const bowlerStats = useMemo((): BowlerStats[] => {
        const map: Record<string, { balls: number; runs: number; wickets: number }> = {};
        for (const ball of activeBalls) {
            if (!ball.bowler) continue;
            if (!map[ball.bowler]) map[ball.bowler] = { balls: 0, runs: 0, wickets: 0 };
            const s = map[ball.bowler];
            if (ball.extraType !== "wide" && ball.extraType !== "noball") s.balls += 1;
            // Byes and Leg-byes are not attributed to the bowler's runs conceded
            if (ball.extraType !== "bye" && ball.extraType !== "legbye") {
                s.runs += ball.totalBallRuns;
            }
            if (ball.wicket?.isWicket) s.wickets += 1;
        }
        return Object.values(map).map((s, i) => {
            const ovsStr = formatOvers(s.balls);
            const ovsNum = s.balls / 6;
            return {
                name: Object.keys(map)[i],
                balls: s.balls,
                runs: s.runs,
                wickets: s.wickets,
                overs: ovsStr,
                economy: ovsNum > 0 ? parseFloat((s.runs / ovsNum).toFixed(2)) : 0,
            };
        }).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);
    }, [activeBalls]);

    // ── Extras breakdown ─────────────────────────────────────────
    const extrasData = useMemo(() => {
        const types: Record<string, number> = { Wide: 0, NoBall: 0, Bye: 0, LegBye: 0 };
        for (const ball of activeBalls) {
            if (ball.extraType === "wide") types.Wide += ball.extraRuns || 1;
            else if (ball.extraType === "noball") types.NoBall += ball.extraRuns || 1;
            else if (ball.extraType === "bye") types.Bye += ball.extraRuns;
            else if (ball.extraType === "legbye") types.LegBye += ball.extraRuns;
        }
        return Object.entries(types).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
    }, [activeBalls]);

    // ── Batter Aggression (Dots vs Strike Rotation vs Boundaries) ──
    const batterAggression = useMemo(() => {
        return batsmanStats.filter(b => b.balls > 0).map(b => {
            const bBalls = activeBalls.filter(ball => ball.batsman === b.name && ball.extraType !== 'wide');
            const dots = bBalls.filter(ball => ball.runs === 0 && ball.extraType === 'none').length;
            const boundaries = b.fours + b.sixes;
            const rotation = bBalls.length - dots - boundaries;
            return {
                name: b.name,
                dots,
                rotation: Math.max(0, rotation),
                boundaries,
                totalBalls: bBalls.length
            }
        }).sort((a, b) => b.totalBalls - a.totalBalls).slice(0, 5);
    }, [batsmanStats, activeBalls]);

    // ── Batter Roles (Anchor vs Enforcer) ──
    const batterRoles = useMemo(() => {
        return batsmanStats.filter(b => b.balls > 0 && b.runs > 0).map(b => ({
            name: b.name,
            runs: b.runs,
            sr: b.sr,
            balls: b.balls
        }));
    }, [batsmanStats]);

    const { avgBatRuns, avgBatSR } = useMemo(() => {
        if (batterRoles.length === 0) return { avgBatRuns: 0, avgBatSR: 0 };
        const tr = batterRoles.reduce((s, b) => s + b.runs, 0);
        const tb = batterRoles.reduce((s, b) => s + b.balls, 0);
        return {
            avgBatRuns: tr / batterRoles.length,
            avgBatSR: tb > 0 ? (tr / tb) * 100 : 0
        };
    }, [batterRoles]);

    // ── Player Clutch Index (Pressure-based Performance) Match-Wide ──
    const playerClutchIndex = useMemo(() => {
        if (balls.length === 0) return [];
        const clutchScores: Record<string, { role: string; points: number; moments: string[]; mainEvent: string }> = {};

        const batterRuns: Record<string, number> = {};
        const overTracker: Record<number, number> = {};
        let recentWickets = 0;
        const recentBallsTracker: boolean[] = [];

        // Calculate Target for win probability heuristic
        const inn1Total = balls.filter(b => b.inning === 1).reduce((s, b) => s + b.totalBallRuns, 0);
        const matchType = match.tournament?.matchType || 'T20';
        const parScore = matchType === 'T20' ? 160 : (matchType === 'ODI' ? 280 : (matchType === 'T10' ? 100 : 350));

        for (const ball of balls) {
            // Update stats trackers
            batterRuns[ball.batsman] = (batterRuns[ball.batsman] || 0) + (ball.runs || 0);
            overTracker[ball.over] = (overTracker[ball.over] || 0) + (ball.totalBallRuns || 0);

            // 1. Calculate Core Pressure (Phase/Situation)
            let pressure = 1.0;
            if (matchType === 'T20' || matchType === 'T10') {
                if (ball.over >= 15) pressure += 0.8; // Death overs
                else if (ball.over < 6) pressure += 0.3; // Powerplay
            } else if (matchType === 'ODI') {
                if (ball.over >= 40) pressure += 1.0;
                else if (ball.over < 10) pressure += 0.4;
            }
            if (recentWickets >= 2) pressure += 0.6; // Collapse pressure

            // 2. Calculate Win Probability Heuristic for Dynamic Scaling
            let winProbHome = 50;
            if (ball.inning === 1) {
                const currentScore = balls.filter(b => b.inning === 1 && (b.over < ball.over || (b.over === ball.over && b.ball <= ball.ball))).reduce((s, b) => s + b.totalBallRuns, 0);
                const projectedScore = ball.over > 0 ? (currentScore / (ball.over + ball.ball / 6)) * (matchType === 'T20' ? 20 : 50) : parScore;
                winProbHome = Math.min(90, Math.max(10, (projectedScore / parScore) * 50));
            } else {
                const currentScore = balls.filter(b => b.inning === 2 && (b.over < ball.over || (b.over === ball.over && b.ball <= ball.ball))).reduce((s, b) => s + b.totalBallRuns, 0);
                const runsNeeded = (inn1Total + 1) - currentScore;
                winProbHome = Math.min(95, Math.max(5, ((inn1Total - runsNeeded) / (inn1Total || 1)) * 100));
            }

            // High pressure for the team that is behind (Win Prob < 40%)
            const currentBattingTeamProb = ball.inning === 1 ? winProbHome : (100 - winProbHome);
            if (currentBattingTeamProb < 40) pressure *= 1.5;
            else if (currentBattingTeamProb > 70) pressure *= 0.7; // Low pressure for dominant side

            // 3. Score Events & Detect "Main Events"
            // --- Batsman ---
            if (ball.batsman) {
                if (!clutchScores[ball.batsman]) clutchScores[ball.batsman] = { role: 'Batter', points: 0, moments: [], mainEvent: '' };
                let batPoints = (ball.runs || 0) * pressure;

                if (ball.runs >= 4) {
                    batPoints += (3.0 * pressure);
                    if (pressure > 2.0 && overTracker[ball.over] >= 15) {
                        clutchScores[ball.batsman].mainEvent = `Hitter of big ${overTracker[ball.over]} run over (${ball.over + 1})`;
                    }
                }
                clutchScores[ball.batsman].points += batPoints;
            }

            // --- Bowler ---
            if (ball.bowler) {
                if (!clutchScores[ball.bowler]) clutchScores[ball.bowler] = { role: 'Bowler', points: 0, moments: [], mainEvent: '' };
                let bowlPoints = (ball.totalBallRuns === 0 ? 2 : 0) * pressure; // Dot ball bonus

                if (ball.wicket?.isWicket) {
                    bowlPoints += (20 * pressure);
                    const isSetBatter = (batterRuns[ball.wicket.playerOut] || 0) >= 20;
                    if (isSetBatter) {
                        clutchScores[ball.bowler].mainEvent = `Dismissed set batter ${ball.wicket.playerOut || 'star'}`;
                        bowlPoints += 15; // Extra bonus for set batter
                    } else if (pressure > 1.8) {
                        clutchScores[ball.bowler].mainEvent = `Decisive wicket at ${ball.over + 1}.${ball.ball}`;
                    }
                }
                clutchScores[ball.bowler].points += bowlPoints;
            }

            // --- Fielder ---
            if (ball.wicket?.isWicket && ball.wicket.fielder && ball.wicket.type === 'caught') {
                const fielder = ball.wicket.fielder;
                if (!clutchScores[fielder]) clutchScores[fielder] = { role: 'Fielder', points: 0, moments: [], mainEvent: '' };
                clutchScores[fielder].points += (10 * pressure);
                if ((batterRuns[ball.wicket.playerOut] || 0) >= 20) {
                    clutchScores[fielder].mainEvent = `Caught set batter ${ball.wicket.playerOut}`;
                }
            }

            // --- Dropped Catch Penalty ---
            const dropData = ball as any;
            if (dropData.isDroppedCatch && dropData.droppedFielder) {
                const fielder = dropData.droppedFielder;
                if (!clutchScores[fielder]) clutchScores[fielder] = { role: 'Fielder', points: 0, moments: [], mainEvent: '' };
                clutchScores[fielder].points -= (15 * pressure);
                clutchScores[fielder].mainEvent = `Costly dropped catch under pressure`;
            }
        }

        return Object.entries(clutchScores)
            .map(([name, data]) => ({
                name,
                role: data.role,
                index: Math.min(99, Math.round(data.points / 2.5)),
                detail: data.mainEvent || `${data.role} impact under pressure`
            }))
            .sort((a, b) => b.index - a.index)
            .slice(0, 6);
    }, [balls, match]);

    // ── Player Match Ratings (Automated Sync) ──
    const playerRatings = useMemo(() => {
        if (balls.length === 0) return [];
        const stats: Record<string, { runs: number; balls: number; wickets: number; runsConceded: number; legalBalls: number; catches: number; drops: number }> = {};

        balls.forEach(b => {
            if (b.isCommentaryOnly) return;
            const pList = [
                { name: b.batsman, type: 'bat' },
                { name: b.bowler, type: 'bowl' },
                { name: b.wicket?.fielder, type: 'field' }
            ];
            pList.forEach(p => {
                if (!p.name) return;
                if (!stats[p.name]) stats[p.name] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0, catches: 0, drops: 0 };
                const s = stats[p.name];
                if (p.type === 'bat') {
                    if (b.extraType === 'none' || b.extraType === 'noball') s.runs += b.runs;
                    if (b.extraType !== 'wide') s.balls++;
                } else if (p.type === 'bowl') {
                    s.runsConceded += b.totalBallRuns || 0;
                    if (b.extraType !== 'wide' && b.extraType !== 'noball') s.legalBalls++;
                    if (b.wicket?.isWicket && b.wicket.type !== 'runout') s.wickets++;
                } else if (p.type === 'field' && b.wicket?.type === 'caught') {
                    s.catches++;
                }
            });
            const dropData = b as any;
            if (dropData.isDroppedCatch && dropData.droppedFielder) {
                const dropF = dropData.droppedFielder;
                if (!stats[dropF]) stats[dropF] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, legalBalls: 0, catches: 0, drops: 0 };
                stats[dropF].drops++;
            }
        });

        return Object.entries(stats).map(([name, s]) => {
            let rating = 5.0; // participation baseline
            if (s.balls > 0) {
                rating += Math.min(4.0, (s.runs / 15) + ((s.runs / s.balls) * 1.5));
            }
            if (s.legalBalls > 0) {
                const overs = s.legalBalls / 6;
                const economy = s.runsConceded / overs;
                rating += Math.min(4.0, (s.wickets * 1.5) + (overs > 0 ? (Math.max(0, 6 - economy) * 0.5) : 0));
            }
            rating += (s.catches * 0.5);
            rating -= ((s.drops || 0) * 1.5); // Penalty for dropped catches
            return { name, rating: Math.min(10.0, Math.max(1.0, rating)) };
        }).sort((a, b) => b.rating - a.rating);
    }, [balls]);

    // ── Momentum Changing Over (The Turning Point) ──
    const momentumChangingOver = useMemo(() => {
        if (!match.result || match.status !== "Completed" || balls.length === 0) return null;

        const overMap: Record<string, any> = {};

        balls.forEach(b => {
            const key = `${b.inning}-${b.over}`;
            if (!overMap[key]) {
                overMap[key] = {
                    inn: b.inning,
                    ov: b.over,
                    runs: 0,
                    wickets: 0,
                    team: b.inning === 1 ? team1Name : team2Name,
                    bowlingTeam: b.inning === 1 ? team2Name : team1Name,
                    bowler: b.bowler,
                    batters: new Set<string>(),
                    wicketDetails: [] as string[],
                    ballSummaries: [] as string[]
                };
            }

            // Prefer non-"Commentary" bowler name
            if (b.bowler && b.bowler !== "Commentary") {
                overMap[key].bowler = b.bowler;
            }

            overMap[key].runs += b.totalBallRuns;
            if (b.batsman) overMap[key].batters.add(b.batsman);

            let ballResult = b.totalBallRuns.toString();
            if (b.wicket?.isWicket) {
                overMap[key].wickets += 1;
                const outPlayer = b.wicket.playerOut || b.batsman;
                overMap[key].wicketDetails.push(outPlayer);
                ballResult = "W";
            } else if (b.extraType === "wide") ballResult = "Wd";
            else if (b.extraType === "noball") ballResult = "Nb";

            overMap[key].ballSummaries.push(ballResult);
        });

        const winnerId = match.result.winner;
        const processedOvers = Object.values(overMap).map(o => {
            let impactScore = 0;
            // A "Momentum Changer" is something that helped the winner win
            const isWinnerBatting = (o.inn === 1 && winnerId === match.homeTeam?._id) || (o.inn === 2 && winnerId === match.awayTeam?._id);
            const isWinnerBowling = !isWinnerBatting;

            if (isWinnerBatting) {
                impactScore += o.runs * 2.5;
                impactScore += o.wickets * -15; // losing wickets is bad
                if (o.runs >= 15) impactScore += 40; // Big over
                if (o.runs >= 20) impactScore += 60; // Game-changing over
            } else {
                impactScore += o.wickets * 50;
                impactScore += (o.runs <= 4 ? 30 : (o.runs > 12 ? -20 : 0)); // Tight over vs expensive over
                if (o.wickets >= 2) impactScore += 50; // Multiple wickets
            }

            // High pressure context (Death overs)
            const isDeath = (match.tournament?.matchType === 'T20' && o.ov >= 15) || (match.tournament?.matchType === 'ODI' && o.ov >= 40);
            if (isDeath) impactScore *= 1.8;

            return { ...o, impactScore };
        });

        const sorted = processedOvers.sort((a, b) => b.impactScore - a.impactScore);
        const top = sorted[0];

        if (!top) return null;

        // Generate dynamic description
        let description = "";
        const isWinnerBatting = (top.inn === 1 && winnerId === match.homeTeam?._id) || (top.inn === 2 && winnerId === match.awayTeam?._id);

        if (isWinnerBatting) {
            if (top.runs >= 22) {
                description = `Total carnage! ${top.runs} runs were plundered from this over. ${top.bowler} had no answers as the batting side seized absolute control, effectively ending the contest right here.`;
            } else if (top.runs >= 15) {
                description = `A massive ${top.runs}-run over that broke the back of the chase. By targeting ${top.bowler} successfully, ${top.team} swung the win probability decisively in their favor.`;
            } else {
                description = `A clinical display of batting under pressure. These ${top.runs} runs provided the much-needed momentum shift that ${top.team} rode all the way to victory.`;
            }
        } else {
            if (top.wickets >= 2) {
                description = `A devastating double-blow! ${top.bowler} removed ${top.wicketDetails.join(' and ')} in quick succession, completely derailing ${top.bowlingTeam}'s innings and sealing the win.`;
            } else if (top.wickets === 1 && top.runs <= 5) {
                description = `The perfect defensive over. ${top.bowler} not only took the vital wicket of ${top.wicketDetails[0]} but also kept it extremely tight, suffocating the opposition.`;
            } else {
                description = `Momentum shifted instantly when ${top.bowler} struck to remove ${top.wicketDetails[0]}. This clinical over put ${top.team} firmly in the driver's seat.`;
            }
        }

        return { ...top, description };
    }, [balls, match, team1Name, team2Name]);


    // ── Momentum Tracker (Over-by-over swing vs Avg Run Rate) ──
    const momentumTracker = useMemo(() => {
        const innRR = overData.length > 0 ? (overData[overData.length - 1].cumRuns / overData.length) : 8;
        return overData.map(o => ({
            over: o.over,
            runs: o.runs,
            momentum: parseFloat((o.runs - innRR).toFixed(1)),
            wickets: o.wickets
        }));
    }, [overData]);

    // ── Partnership Building (Wicket-by-Wicket) ──
    const partnershipBuilding = useMemo(() => {
        const partnerships: { name: string; runs: number; balls: number; rr: number }[] = [];
        let currentRuns = 0;
        let currentBalls = 0;
        let wktCount = 1;

        for (const ball of activeBalls) {
            currentRuns += ball.totalBallRuns;
            if (ball.extraType !== 'wide' && ball.extraType !== 'noball') currentBalls++;

            if (ball.wicket?.isWicket) {
                partnerships.push({
                    name: `${wktCount}${['st', 'nd', 'rd'][wktCount - 1] || 'th'} Wkt`,
                    runs: currentRuns,
                    balls: currentBalls,
                    rr: currentBalls > 0 ? parseFloat(((currentRuns / currentBalls) * 6).toFixed(1)) : 0
                });
                wktCount++;
                currentRuns = 0;
                currentBalls = 0;
            }
        }
        if (currentBalls > 0 || currentRuns > 0) {
            partnerships.push({
                name: `${wktCount}${['st', 'nd', 'rd'][wktCount - 1] || 'th'} Wkt*`,
                runs: currentRuns,
                balls: currentBalls,
                rr: currentBalls > 0 ? parseFloat(((currentRuns / currentBalls) * 6).toFixed(1)) : 0
            });
        }
        return partnerships;
    }, [activeBalls]);

    // ── MATCH SIMULATOR ENGINE (Highly Dynamic Scenarios) ──
    const dynamicScenarios = useMemo(() => {
        if (activeBalls.length === 0) return [];

        const scenarios: any[] = [];
        const currentTotal = activeBalls.reduce((sum, b) => sum + b.totalBallRuns, 0);
        const innRR = overData.length > 0 ? currentTotal / overData.length : 8;

        // 1. Dropped Catch (Highest priority if it exists)
        const dropBallIndex = activeBalls.findIndex(b => (b as any).isDroppedCatch);
        if (dropBallIndex !== -1) {
            const dropBall = activeBalls[dropBallIndex];
            const batsmanName = dropBall.batsman;
            const subsequentBalls = activeBalls.slice(dropBallIndex + 1);
            const runsScoredAfterDrop = subsequentBalls
                .filter(b => b.batsman === batsmanName)
                .reduce((sum, b) => sum + (b.extraType === 'none' || b.extraType === 'noball' ? b.runs : 0), 0);

            if (runsScoredAfterDrop > 10) {
                scenarios.push({
                    id: 'dropped_catch',
                    title: 'The Costly Drop',
                    description: <>What if <span className="text-white font-medium">{batsmanName}</span> was caught on that dropped chance? He added <span className="text-white font-medium">{runsScoredAfterDrop}</span> vital runs afterwards.</>,
                    impact: runsScoredAfterDrop,
                    originalScore: currentTotal,
                    newScore: currentTotal - runsScoredAfterDrop,
                    color: 'orange',
                    icon: 'AlertTriangle',
                    priority: 10
                });
            }
        }

        // 2. The Nightmare Over
        if (overData.length > 3) {
            const worstOver = [...overData].sort((a, b) => b.runs - a.runs)[0];
            const avgRR = currentTotal / overData.length;
            const runsSaved = worstOver.runs - Math.round(avgRR);

            if (runsSaved >= 10) {
                scenarios.push({
                    id: 'nightmare_over',
                    title: 'The Perfect Over',
                    description: <>What if Over <span className="text-white font-medium">{worstOver.over}</span> leaked only the average rate ({Math.round(avgRR)}) instead of a massive <span className="text-white font-medium">{worstOver.runs}</span>?</>,
                    impact: runsSaved,
                    originalScore: currentTotal,
                    newScore: currentTotal - runsSaved,
                    color: 'emerald',
                    icon: 'Eraser',
                    priority: worstOver.runs > 20 ? 9 : 5
                });
            }
        }

        // 3. Batting Collapse
        const collapseOver = [...overData].sort((a, b) => b.wickets - a.wickets)[0];
        if (collapseOver && collapseOver.wickets >= 2) {
            const runsLost = 15 * collapseOver.wickets; // Assuming each wicket cost ~15 potential runs
            scenarios.push({
                id: 'batting_collapse',
                title: 'Avoiding the Collapse',
                description: <>What if the batting team survived Over <span className="text-white font-medium">{collapseOver.over}</span> without losing those <span className="text-white font-medium">{collapseOver.wickets} wickets</span>?</>,
                impact: runsLost,
                originalScore: currentTotal,
                newScore: currentTotal + runsLost,
                color: 'blue',
                icon: 'ShieldOff',
                isPositive: true,
                priority: 8
            });
        }

        // 4. Slow Strike Rate Penalty
        const slowBatsman = batsmanStats.find(b => b.balls >= 15 && b.sr < innRR * 10 * 0.8);
        if (slowBatsman) {
            const expectedRuns = Math.round((slowBatsman.balls / 6) * innRR);
            const runsLost = expectedRuns - slowBatsman.runs;
            if (runsLost >= 10) {
                scenarios.push({
                    id: 'slow_batsman',
                    title: 'Shifting Gears',
                    description: <>What if <span className="text-white font-medium">{slowBatsman.name}</span> accelerated his innings to match the team's run rate instead of scoring {slowBatsman.runs} off {slowBatsman.balls}?</>,
                    impact: runsLost,
                    originalScore: currentTotal,
                    newScore: currentTotal + runsLost,
                    color: 'yellow',
                    icon: 'TrendingUp',
                    isPositive: true,
                    priority: 7
                });
            }
        }

        // 5. Expensive Bowler Replaced
        const worstBowler = bowlerStats.filter(b => b.balls >= 6).sort((a, b) => b.economy - a.economy)[0];
        if (worstBowler && worstBowler.economy > innRR + 3) {
            const expectedRuns = Math.round((worstBowler.balls / 6) * innRR);
            const runsSaved = worstBowler.runs - expectedRuns;
            if (runsSaved >= 10) {
                scenarios.push({
                    id: 'expensive_bowler',
                    title: 'Tactical Bowling Change',
                    description: <>What if <span className="text-white font-medium">{worstBowler.name}</span> was taken off the attack, saving the team from his economy of {worstBowler.economy}?</>,
                    impact: runsSaved,
                    originalScore: currentTotal,
                    newScore: currentTotal - runsSaved,
                    color: 'purple',
                    icon: 'Combine',
                    priority: 6
                });
            }
        }

        // 6. Extras Epidemic
        const totalExtras = activeBalls.reduce((sum, b) => sum + (b.extraRuns || 0), 0);
        if (totalExtras >= 10) {
            scenarios.push({
                id: 'extras_epidemic',
                title: 'Discipline Breakdown',
                description: <>What if the bowling team didn't leak <span className="text-white font-medium">{totalExtras} extra runs</span> through wides and no-balls?</>,
                impact: totalExtras,
                originalScore: currentTotal,
                newScore: currentTotal - totalExtras,
                color: 'red',
                icon: 'Activity',
                priority: 4
            });
        }

        // 7. Powerplay Capitalization
        const ppBalls = activeBalls.filter(b => b.over < 6);
        const ppRuns = ppBalls.reduce((sum, b) => sum + b.totalBallRuns, 0);
        if (ppBalls.length === 36 && ppRuns < 40) {
            const impact = 50 - ppRuns;
            scenarios.push({
                id: 'powerplay_capitalization',
                title: 'Powerplay Aggression',
                description: <>What if the team showed more intent in the Powerplay, scoring 50 runs instead of just <span className="text-white font-medium">{ppRuns}</span>?</>,
                impact: impact,
                originalScore: currentTotal,
                newScore: currentTotal + impact,
                color: 'emerald',
                icon: 'Zap',
                isPositive: true,
                priority: 5
            });
        }

        // 8. Broken Partnership
        const longestPartnership = partnershipBuilding.sort((a, b) => b.runs - a.runs)[0];
        if (longestPartnership && longestPartnership.runs > 40) {
            const runsSaved = Math.floor(longestPartnership.runs * 0.6); // If broken earlier
            scenarios.push({
                id: 'broken_partnership',
                title: 'Breaking the Stand',
                description: <>What if the massive <span className="text-white font-medium">{longestPartnership.runs}-run</span> {longestPartnership.name.replace(' Wkt*', ' Wicket').replace(' Wkt', ' Wicket')} partnership was broken midway?</>,
                impact: runsSaved,
                originalScore: currentTotal,
                newScore: currentTotal - runsSaved,
                color: 'blue',
                icon: 'Swords',
                priority: 6
            });
        }

        // If we don't have many generated, add some default boundary math
        if (scenarios.length < 3) {
            const totalSixes = activeBalls.filter(b => b.runs === 6).length;
            if (totalSixes >= 2) {
                const runsSaved = totalSixes * 6;
                scenarios.push({
                    id: 'boundary_denial',
                    title: 'Boundary Denial',
                    description: <>What if all <span className="text-white font-medium">{totalSixes} Sixes</span> hit were actually caught on the boundary instead?</>,
                    impact: runsSaved,
                    originalScore: currentTotal,
                    newScore: currentTotal - runsSaved,
                    color: 'purple',
                    icon: 'ShieldOff',
                    priority: 2
                });
            }
        }

        // We have a pool of diverse scenarios now.
        // Shuffle the scenarios with priority <= 8 randomly so it varies every time it's viewed,
        // but keep the absolute highest priority ones (like drops) at the top.
        const sorted = scenarios.sort((a, b) => {
            // Give 50% chance to swap items with similar priority (+- 2)
            if (Math.abs(a.priority - b.priority) <= 2) {
                return Math.random() - 0.5;
            }
            return b.priority - a.priority;
        });

        // Pick top 3 unique
        const finalScenarios = [];
        const seenIds = new Set();
        for (const s of sorted) {
            if (!seenIds.has(s.id)) {
                finalScenarios.push(s);
                seenIds.add(s.id);
            }
            if (finalScenarios.length >= 3) break;
        }

        return finalScenarios;
    }, [activeBalls, overData, batsmanStats, bowlerStats, partnershipBuilding]);

    // ── Enhanced Match Phases Analysis ───────────────────────────
    const phaseAnalysis = useMemo(() => {
        const matchType = match.tournament?.matchType || 'T20';
        let phases: { name: string; start: number; end: number }[] = [];

        if (matchType === 'T10') {
            phases = [
                { name: 'Powerplay', start: 1, end: 2 },
                { name: 'Middle Overs', start: 3, end: 7 },
                { name: 'Death Overs', start: 8, end: 10 }
            ];
        } else if (matchType === 'ODI') {
            phases = [
                { name: 'Powerplay 1', start: 1, end: 10 },
                { name: 'Middle Overs', start: 11, end: 40 },
                { name: 'Death Overs', start: 41, end: 50 }
            ];
        } else if (matchType === 'Test') {
            phases = [
                { name: 'Session 1', start: 1, end: 30 },
                { name: 'Session 2', start: 31, end: 60 },
                { name: 'Session 3', start: 61, end: 90 }
            ];
        } else { // Default T20
            phases = [
                { name: 'Powerplay', start: 1, end: 6 },
                { name: 'Middle Overs', start: 7, end: 15 },
                { name: 'Death Overs', start: 16, end: 20 }
            ];
        }

        return phases.map(phase => {
            const phaseBalls = activeBalls.filter(b => (b.over + 1) >= phase.start && (b.over + 1) <= phase.end);
            if (phaseBalls.length === 0) return null;

            const runs = phaseBalls.reduce((sum, b) => sum + b.totalBallRuns, 0);
            const wickets = phaseBalls.filter(b => b.wicket?.isWicket).length;
            const legalBalls = phaseBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'noball').length;
            const overs = legalBalls / 6;
            const rr = overs > 0 ? runs / overs : 0;

            // Identify Performer of the Phase
            const batStats: Record<string, number> = {};
            const bowlStats: Record<string, { w: number; r: number }> = {};

            phaseBalls.forEach(b => {
                if (b.batsman) batStats[b.batsman] = (batStats[b.batsman] || 0) + b.runs;
                if (b.bowler) {
                    if (!bowlStats[b.bowler]) bowlStats[b.bowler] = { w: 0, r: 0 };
                    bowlStats[b.bowler].r += b.totalBallRuns;
                    if (b.wicket?.isWicket) bowlStats[b.bowler].w += 1;
                }
            });

            let topBatsman = { name: '', runs: 0 };
            Object.entries(batStats).forEach(([name, r]) => { if (r > topBatsman.runs) topBatsman = { name, runs: r }; });

            let topBowler = { name: '', wickets: 0, runs: 0 };
            Object.entries(bowlStats).forEach(([name, s]) => { if (s.w > topBowler.wickets || (s.w === topBowler.wickets && s.r < topBowler.runs)) topBowler = { name, wickets: s.w, runs: s.r }; });

            const mvp = topBatsman.runs >= (topBowler.wickets * 25) ? { name: topBatsman.name, stat: `${topBatsman.runs} runs`, type: 'bat' } : { name: topBowler.name, stat: `${topBowler.wickets} wkts`, type: 'bowl' };

            // Dominance Heuristic: High RR and few wickets = batting dominance. Low RR and many wickets = bowling dominance.
            // thresholdRR varies by format
            const thresholdRR = matchType === 'T20' ? 8 : matchType === 'ODI' ? 5.5 : matchType === 'T10' ? 10 : 3.2;
            const dominanceScore = (rr - thresholdRR) - (wickets * 1.5);
            const dominatingSide = dominanceScore > 0.5 ? 'bat' : dominanceScore < -1.5 ? 'bowl' : 'even';

            return {
                ...phase,
                runs,
                wickets,
                rr: parseFloat(rr.toFixed(1)),
                mvp,
                dominatingSide
            };
        }).filter(Boolean);
    }, [activeBalls, match]);

    const phaseStats = useMemo(() => {
        return phaseAnalysis.map(p => ({
            subject: p!.name,
            A: p!.rr,
            fullMark: 12,
        }));
    }, [phaseAnalysis]);

    // ── Bowler Impact Scatter Plot ──
    const bowlerImpact = useMemo(() => {
        return bowlerStats.filter(b => b.balls >= 6).map(b => {
            // We'll plot Economy (X) vs Strike Rate (Y). Size (Z) is wickets.
            const strikeRate = b.wickets > 0 ? b.balls / b.wickets : b.balls;
            return {
                name: b.name,
                economy: b.economy,
                strikeRate: parseFloat(strikeRate.toFixed(1)),
                wickets: b.wickets,
                impactScore: (b.wickets * 10) - (b.economy)
            }
        });
    }, [bowlerStats]);

    // ── Wicket timeline ──────────────────────────────────────────
    const wickets = useMemo(() =>
        activeBalls.filter(b => b.wicket?.isWicket).map(b => ({
            over: `${b.over + 1}.${b.ball}`,
            player: b.wicket?.playerOut || b.batsman,
            type: b.wicket?.type || "out",
            score: `${activeBalls
                .filter(x => x.over < b.over || (x.over === b.over && x.ball <= b.ball))
                .reduce((sum, x) => sum + x.totalBallRuns, 0)}`,
        })),
        [activeBalls]
    );

    // ── NATIVE WIN PROBABILITY EVOLUTION ─────────────────────────
    const winProbabilityEvolution = useMemo(() => {
        if (balls.length === 0) return [];
        const matchType = match.tournament?.matchType || 'T20';
        const totalOvers = match.tournament?.overs || (matchType === 'T20' ? 20 : (matchType === 'ODI' ? 50 : (matchType === 'T10' ? 10 : 20)));
        const totalBallsInMatch = totalOvers * 12; // 2 innings
        const parRate = matchType === 'T20' ? 8.0 : (matchType === 'ODI' ? 5.6 : 10.0);

        const inn1TotalScore = balls.filter(b => b.inning === 1).reduce((s, b) => s + b.totalBallRuns, 0);

        const timeline: any[] = [];
        let currentHomeProb = 50;

        // Add start state
        timeline.push({ over: '0.0', homeProb: 50, awayProb: 50 });

        let inn1Runs = 0;
        let inn1Wickets = 0;
        let inn1Legal = 0;

        let inn2Runs = 0;
        let inn2Wickets = 0;
        let inn2Legal = 0;

        for (const bl of balls) {
            if (bl.isCommentaryOnly) continue;
            // Update accumulators
            if (bl.inning === 1) {
                inn1Runs += bl.totalBallRuns;
                if (bl.wicket?.isWicket) inn1Wickets++;
                if (bl.extraType !== 'wide' && bl.extraType !== 'noball') inn1Legal++;
            } else {
                inn2Runs += bl.totalBallRuns;
                if (bl.wicket?.isWicket) inn2Wickets++;
                if (bl.extraType !== 'wide' && bl.extraType !== 'noball') inn2Legal++;
            }

            // Only plot at the end of overs or wickets for a cleaner chart
            if (bl.ball !== 6 && !bl.wicket?.isWicket && bl !== balls[balls.length - 1]) continue;

            const overLabel = bl.inning === 1 ? `Inn1 ${bl.over}.${bl.ball}` : `Inn2 ${bl.over}.${bl.ball}`;

            let battingAdvantage = 50;

            if (bl.inning === 1) {
                battingAdvantage = calculateWinProbability({
                    inning: 1,
                    runs: inn1Runs,
                    wickets: inn1Wickets,
                    ballsBowled: inn1Legal,
                    totalOvers: totalOvers,
                    matchType: matchType
                });
                currentHomeProb = battingAdvantage;
            } else {
                battingAdvantage = calculateWinProbability({
                    inning: 2,
                    runs: inn2Runs,
                    wickets: inn2Wickets,
                    ballsBowled: inn2Legal,
                    totalOvers: totalOvers,
                    target: inn1TotalScore + 1,
                    matchType: matchType
                });
                currentHomeProb = 100 - battingAdvantage;
            }

            timeline.push({
                over: overLabel,
                homeProb: parseFloat(currentHomeProb.toFixed(1)),
                awayProb: parseFloat((100 - currentHomeProb).toFixed(1))
            });
        }
        return timeline;
    }, [balls, match]);

    const hasData = activeBalls.length > 0;

    if (!hasData) {
        return (
            <div className="py-16 text-center text-slate-500">
                <Zap className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-lg font-medium text-slate-400">No ball data available</p>
                <p className="text-sm mt-1">Ball-by-ball data will appear once the match has been scored.</p>
            </div>
        );
    }

    const teamColor = activeInnings === 1 ? TEAM1_COLOR : TEAM2_COLOR;

    return (
        <div className="space-y-6">
            {/* Innings Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-lg self-start w-fit">
                <button
                    onClick={() => setActiveInnings(1)}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeInnings === 1 ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    {team1Name} (Inn 1)
                </button>
                <button
                    onClick={() => setActiveInnings(2)}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeInnings === 2 ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    {team2Name} (Inn 2)
                </button>
            </div>

            {/* Run Progression */}
            <SectionCard icon={<Activity size={16} />} title="Run Progression" subtitle="Cumulative runs over the innings">
                <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overData}>
                            <defs>
                                <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={teamColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={teamColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="over" label={{ value: "Over", position: "insideBottom", offset: -2, fontSize: 10, fill: "#64748b" }} tick={{ fontSize: 10, fill: "#64748b" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="cumRuns" name="Runs" stroke={teamColor} fill="url(#runGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            {/* Win Probability Evolution (Match Wide) */}
            <SectionCard icon={<Activity size={16} />} title="Win Probability" subtitle="Match-wide advantage shift">
                <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={winProbabilityEvolution}>
                            <defs>
                                <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={TEAM1_COLOR} stopOpacity={0.5} />
                                    <stop offset="95%" stopColor={TEAM1_COLOR} stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="awayGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={TEAM2_COLOR} stopOpacity={0.5} />
                                    <stop offset="95%" stopColor={TEAM2_COLOR} stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="over" hide />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} unit="%" />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Area type="monotone" dataKey="homeProb" name={team1Name} stroke={TEAM1_COLOR} fill="url(#homeGrad)" strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="awayProb" name={team2Name} stroke={TEAM2_COLOR} fill="url(#awayGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Over-by-Over Runs */}
                <SectionCard icon={<TrendingUp size={16} />} title="Over-by-Over Runs" subtitle="Runs scored each over">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={overData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="over" tick={{ fontSize: 10, fill: "#64748b" }} />
                                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="runs" name="Runs" fill={teamColor} radius={[3, 3, 0, 0]} opacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </SectionCard>

                {/* Extras Breakdown */}
                {extrasData.length > 0 ? (
                    <SectionCard icon={<Target size={16} />} title="Extras Breakdown" subtitle="Distribution of extra runs">
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={extrasData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {extrasData.map((_, i) => (
                                            <Cell key={i} fill={EXTRAS_COLORS[i % EXTRAS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                ) : (
                    <SectionCard icon={<Target size={16} />} title="Extras Breakdown" subtitle="No extras in this innings">
                        <div className="h-[220px] flex items-center justify-center text-slate-600">
                            <p className="text-sm">No extras recorded</p>
                        </div>
                    </SectionCard>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Batsmen */}
                <SectionCard icon={<Users size={16} />} title="Batting Performance" subtitle={`${activeTeamName} batters`}>
                    <div className="space-y-2">
                        {batsmanStats.slice(0, 7).map((b, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600 text-xs w-4">{i + 1}</span>
                                        <span className="text-sm text-white font-medium">{b.name}</span>
                                        {!b.out && <span className="text-[10px] text-green-400 font-bold">*</span>}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <span className="text-white font-bold">{b.runs}</span>
                                        <span>({b.balls})</span>
                                        <span className="text-yellow-400">{b.fours}×4</span>
                                        <span className="text-purple-400">{b.sixes}×6</span>
                                        <span className="text-slate-500">SR:{b.sr}</span>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${batsmanStats[0]?.runs > 0 ? (b.runs / batsmanStats[0].runs) * 100 : 0}%`,
                                            backgroundColor: teamColor,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                        {batsmanStats.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-4">No batting data available</p>
                        )}
                    </div>
                </SectionCard>

                {/* Top Bowlers */}
                <SectionCard icon={<Award size={16} />} title="Bowling Performance" subtitle={`${bowlingTeamName} bowlers`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-500 text-xs border-b border-slate-800">
                                    <th className="text-left py-2 pb-3">Bowler</th>
                                    <th className="text-center py-2 pb-3">Ov</th>
                                    <th className="text-center py-2 pb-3">R</th>
                                    <th className="text-center py-2 pb-3">W</th>
                                    <th className="text-center py-2 pb-3">Eco</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {bowlerStats.map((b, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-2.5 text-white font-medium">{b.name}</td>
                                        <td className="text-center text-slate-400">{b.overs}</td>
                                        <td className="text-center text-slate-300">{b.runs}</td>
                                        <td className={`text-center font-bold ${b.wickets > 0 ? 'text-green-400' : 'text-slate-500'}`}>{b.wickets}</td>
                                        <td className={`text-center ${b.economy < 7 ? 'text-green-400' : b.economy < 10 ? 'text-yellow-400' : 'text-red-400'}`}>{b.economy}</td>
                                    </tr>
                                ))}
                                {bowlerStats.length === 0 && (
                                    <tr><td colSpan={5} className="text-center text-slate-600 py-6">No bowling data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            </div>

            {/* Wicket Timeline */}
            {wickets.length > 0 && (
                <SectionCard icon={<Zap size={16} />} title="Wicket Timeline" subtitle="When wickets fell in the innings">
                    <div className="space-y-3">
                        {wickets.map((w, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 hover:border-red-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium text-sm">{w.player}</p>
                                    <p className="text-slate-500 text-xs capitalize">{w.type?.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-xs">Over {w.over}</p>
                                    <p className="text-slate-300 text-sm font-medium">{w.score} runs</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* Advanced Analytics Section */}
            <div className="pt-6 pb-2 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="text-yellow-400 fill-yellow-400" size={20} /> Advanced Performance Analytics
                </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phase Breakdown List */}
                <SectionCard icon={<Layers size={16} />} title="Phase Breakdown" subtitle="Detailed breakdown of match phases">
                    <div className="space-y-4">
                        {phaseAnalysis.map((p, i) => (
                            <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                {/* Domination Indicator */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${p!.dominatingSide === 'bat' ? (activeInnings === 1 ? 'bg-blue-500' : 'bg-red-500') :
                                    p!.dominatingSide === 'bowl' ? (activeInnings === 1 ? 'bg-red-500' : 'bg-blue-500') :
                                        'bg-slate-600'
                                    }`} />

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-white font-bold text-sm tracking-tight">{p!.name}</h4>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${p!.dominatingSide === 'bat' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                            p!.dominatingSide === 'bowl' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                                                'text-slate-400 border-slate-500/30 bg-slate-500/10'
                                            }`}>
                                            {p!.dominatingSide === 'bat' ? 'Batting Domination' :
                                                p!.dominatingSide === 'bowl' ? 'Bowling Domination' : 'Balanced Phase'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 uppercase font-black text-[9px]">Score</span>
                                            <span className="text-white font-bold">{p!.runs}/{p!.wickets}</span>
                                        </div>
                                        <div className="flex flex-col border-l border-slate-700/50 pl-4">
                                            <span className="text-slate-500 uppercase font-black text-[9px]">Run Rate</span>
                                            <span className="text-white font-bold">{p!.rr}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/30 w-full sm:w-auto">
                                    <div className={`p-2 rounded-lg ${p!.mvp.type === 'bat' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {p!.mvp.type === 'bat' ? <Flame size={14} /> : <Target size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phase MVP</p>
                                        <p className="text-xs text-white font-bold">{p!.mvp.name}</p>
                                        <p className="text-[10px] text-slate-400">{p!.mvp.stat}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                {/* Bowler Impact Scatter */}
                <SectionCard icon={<Crosshair size={16} />} title="Bowler Impact Matrix" subtitle="Economy vs Strike Rate (Min 1 Over)">
                    <div className="h-[260px]">
                        {bowlerImpact.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" dataKey="economy" name="Economy" label={{ value: "Economy Rate(RPO)", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }} tick={{ fontSize: 10, fill: "#64748b" }} domain={['dataMin - 1', 'dataMax + 1']} />
                                    <YAxis type="number" dataKey="strikeRate" name="Strike Rate" label={{ value: "Strike Rate(Balls/Wicket)", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} tick={{ fontSize: 10, fill: "#64748b" }} reversed domain={['dataMin - 1', 'dataMax + 2']} />
                                    <ZAxis type="number" dataKey="wickets" range={[60, 400]} name="Wickets" />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={TOOLTIP_STYLE}
                                        formatter={(value, name, props) => {
                                            if (name === 'Wickets') return value;
                                            return name === 'Economy' ? value : value;
                                        }}
                                    />
                                    <Scatter name="Bowlers" data={bowlerImpact} fill={activeInnings === 1 ? TEAM2_COLOR : TEAM1_COLOR}>
                                        {bowlerImpact.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={activeInnings === 1 ? TEAM2_COLOR : TEAM1_COLOR} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">No bowlers have bowled a full over yet.</div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* Batter Aggression Profile */}
            <SectionCard icon={<Swords size={16} />} title="Batter Aggression Profile" subtitle="Shot Selection: Dots vs Rotation vs Boundaries (Top Batsmen)">
                <div className="h-[260px]">
                    {batterAggression.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={batterAggression} layout="vertical" margin={{ left: 30, right: 20, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#cbd5e1" }} width={90} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                <Bar dataKey="dots" name="Dot Balls" stackId="a" fill="#475569" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="rotation" name="1s, 2s, 3s" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="boundaries" name="Boundaries" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">No batting data available yet.</div>
                    )}
                </div>
            </SectionCard>

            {/* Player Clutch Index */}
            {
                playerClutchIndex.length > 0 && (
                    <SectionCard icon={<Flame size={16} className="text-orange-500" />} title="Player Clutch Index" subtitle="Top performers under pressure (Death overs, falling wickets)">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {playerClutchIndex.map((p, i) => (
                                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between group hover:border-orange-500/30 transition-all">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-700 text-slate-300'}`}>
                                                {i + 1}
                                            </div>
                                            <h4 className="text-white font-bold text-sm truncate max-w-[120px]">{p.name}</h4>
                                        </div>
                                        <span className="text-[10px] text-slate-500 ml-7 font-medium line-clamp-1">{p.detail}</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className={`text-2xl font-black ${p.index >= 80 ? 'text-orange-500' : p.index >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>
                                            {p.index}
                                        </span>
                                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold -mt-1">Index</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )
            }

            {/* Mind-Blowing Edge Analytics Section */}
            <div className="pt-8 pb-2 border-t border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="text-purple-400 fill-purple-400" size={20} /> Deep Dive Analytics
                </h3>
                <p className="text-sm text-slate-400 mt-1">Uncover the hidden turning points and structural impacts of the match.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Momentum Changing Over */}
                {momentumChangingOver && (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10 group">
                        <div className="px-6 py-4 border-b border-indigo-500/20 bg-indigo-500/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                                    <Zap size={24} className="fill-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white tracking-tight uppercase">Momentum Changing Over</h3>
                                    <p className="text-xs text-indigo-300/70 font-bold tracking-widest uppercase">The Turning Point</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter block mb-1">Impact Score</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${Math.min(100, momentumChangingOver.impactScore / 2)}%` }}
                                        />
                                    </div>
                                    <span className="text-indigo-400 font-black text-sm">{Math.round(momentumChangingOver.impactScore)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                            <Swords size={18} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Performance Analysis</p>
                                            <p className="text-white text-base leading-relaxed font-medium">{momentumChangingOver.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {momentumChangingOver.ballSummaries?.map((res, idx) => (
                                            <div key={idx} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all hover:scale-110 ${res === 'W' ? 'bg-red-500/20 border-red-500/50 text-red-500' :
                                                res === '6' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' :
                                                    res === '4' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                                                        'bg-slate-800 border-slate-700 text-slate-400'
                                                }`}>
                                                {res}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 rounded-2xl border border-indigo-500/10 p-5 space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                                <User size={14} className="text-indigo-400" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Bowler</span>
                                        </div>
                                        <span className="text-white font-black text-sm">{momentumChangingOver.bowler}</span>
                                    </div>

                                    <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                                <Target size={14} className="text-indigo-400" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Over No.</span>
                                        </div>
                                        <span className="text-white font-black text-sm">{momentumChangingOver.ov + 1}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                                <BarChart3 size={14} className="text-indigo-400" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">Result</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-white font-black text-sm">{momentumChangingOver.runs} Runs</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-red-500 font-black text-sm">{momentumChangingOver.wickets} Wkts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Player Match Ratings Matrix */}
                {playerRatings.length > 0 && (
                    <SectionCard icon={<Star size={16} className="text-yellow-400" />} title="Innings Match Ratings" subtitle="Dynamic performance score (1-10) based on impact and efficiency">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {playerRatings.map((p, i) => (
                                <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center transition-all hover:bg-slate-800/60 hover:border-yellow-500/20 group">
                                    <h5 className="text-[11px] font-bold text-slate-300 truncate mb-1.5 group-hover:text-white transition-colors">
                                        {p.name}
                                    </h5>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <div className={`text-xl font-black ${p.rating >= 9.0 ? 'text-yellow-400' : p.rating >= 8.0 ? 'text-emerald-400' : p.rating >= 7.0 ? 'text-blue-400' : 'text-slate-400'}`}>
                                            {p.rating.toFixed(1)}
                                        </div>
                                        {p.rating >= 9.0 && <Zap size={10} className="text-yellow-400 animate-pulse fill-yellow-400" />}
                                    </div>
                                    <div className="mt-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${p.rating >= 9.0 ? 'bg-yellow-500' : p.rating >= 8.0 ? 'bg-emerald-500' : p.rating >= 7.0 ? 'bg-blue-500' : 'bg-slate-600'}`}
                                            style={{ width: `${p.rating * 10}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {/* Momentum Tracker */}
                <SectionCard icon={<TrendingDown size={16} />} title="Momentum Swing" subtitle="Runs scored in an over compared to the Innings Average Run Rate">
                    <div className="h-[240px]">
                        {momentumTracker.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={momentumTracker} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="over" tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        cursor={{ fill: '#334155', opacity: 0.4 }}
                                        formatter={(val: number) => [`${val > 0 ? '+' : ''}${val} Runs`, 'Momentum Swing']}
                                    />
                                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
                                    <Bar dataKey="momentum" name="Momentum" radius={[2, 2, 2, 2]}>
                                        {momentumTracker.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.momentum > 0 ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Not enough data.</div>
                        )}
                    </div>
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Batter Role Quadrant */}
                <SectionCard icon={<BarChart3 size={16} />} title="Batter Roles: Anchor vs Enforcer" subtitle="Runs Scored vs Strike Rate (Quadrant Matrix)">
                    <div className="h-[280px]">
                        {batterRoles.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" dataKey="runs" name="Runs" label={{ value: "Runs Scored", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 11 }} tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis type="number" dataKey="sr" name="Strike Rate" label={{ value: "Strike Rate", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <ZAxis type="category" dataKey="name" name="Batter" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={TOOLTIP_STYLE} />
                                    <ReferenceLine x={avgBatRuns} stroke="#f59e0b" strokeDasharray="3 3" />
                                    <ReferenceLine y={avgBatSR} stroke="#f59e0b" strokeDasharray="3 3" />
                                    <Scatter name="Batters" data={batterRoles} fill={teamColor}>
                                        {batterRoles.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={teamColor} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Not enough batting data.</div>
                        )}
                    </div>
                </SectionCard>

                {/* Partnership Building */}
                <SectionCard icon={<Combine size={16} />} title="Partnership Engine" subtitle="Runs & Run-Rate created by each successive wicket">
                    <div className="h-[280px]">
                        {partnershipBuilding.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={partnershipBuilding} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#f59e0b" }} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                                    <Bar yAxisId="left" dataKey="runs" name="Runs Added" fill={teamColor} radius={[3, 3, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="rr" name="Run Rate" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">Not enough data.</div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* WHAT-IF SCENARIOS MACHINE */}
            {dynamicScenarios.length > 0 && (
                <div className="pt-8 pb-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                            <Zap className="text-orange-400 fill-orange-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                                Match Simulator Engine
                            </h3>
                            <p className="text-sm text-slate-400 mt-0.5">AI-driven hypothetical scenarios generated by analyzing this innings.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {dynamicScenarios.map((scenario) => {
                            const getIcon = (size: number, className: string) => {
                                switch (scenario.icon) {
                                    case 'AlertTriangle': return <AlertTriangle size={size} className={className} />;
                                    case 'Eraser': return <Eraser size={size} className={className} />;
                                    case 'ShieldOff': return <ShieldOff size={size} className={className} />;
                                    case 'Activity': return <Activity size={size} className={className} />;
                                    case 'Crosshair': return <Crosshair size={size} className={className} />;
                                    case 'TrendingUp': return <TrendingUp size={size} className={className} />;
                                    default: return <Zap size={size} className={className} />;
                                }
                            };

                            const colors: Record<string, any> = {
                                orange: { text: "text-orange-400", borderHover: "hover:border-orange-500/50", bgIcon: "text-orange-500", badge: "bg-red-500/10 border-red-500/20 text-red-400" },
                                emerald: { text: "text-emerald-400", borderHover: "hover:border-emerald-500/50", bgIcon: "text-emerald-500", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
                                purple: { text: "text-purple-400", borderHover: "hover:border-purple-500/50", bgIcon: "text-purple-500", badge: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
                                red: { text: "text-red-400", borderHover: "hover:border-red-500/50", bgIcon: "text-red-500", badge: "bg-red-500/10 border-red-500/20 text-red-400" },
                                blue: { text: "text-blue-400", borderHover: "hover:border-blue-500/50", bgIcon: "text-blue-500", badge: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                                yellow: { text: "text-yellow-400", borderHover: "hover:border-yellow-500/50", bgIcon: "text-yellow-500", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
                            };
                            const c = colors[scenario.color] || colors.orange;

                            return (
                                <div key={scenario.id} className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-5 relative overflow-hidden group transition-colors ${c.borderHover}`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        {getIcon(64, c.bgIcon)}
                                    </div>
                                    <div className={`flex items-center gap-2 mb-3 relative z-10 ${c.text}`}>
                                        {getIcon(16, "")}
                                        <h4 className="font-bold text-sm">{scenario.title}</h4>
                                    </div>
                                    <div className="text-xs text-slate-400 mb-4 h-8 relative z-10">
                                        {scenario.description}
                                    </div>
                                    <div className="flex items-end gap-3 relative z-10">
                                        <div className="flex-1">
                                            <div className="text-3xl font-black text-white">
                                                {scenario.newScore}
                                                {scenario.extraText && <span className="text-sm text-red-400 ml-2">{scenario.extraText}</span>}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 mt-1 line-through">Actual: {scenario.originalScore}</div>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${c.badge}`}>
                                            {scenario.isPositive ? '+' : '-'}{scenario.impact} Runs
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentCricketLab;
