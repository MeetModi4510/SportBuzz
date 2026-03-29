import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Zap, Trophy, Calendar, MapPin, ChevronLeft, Wifi, WifiOff,
    Shield, Crown, User, Activity, BarChart2, MessageSquare, Users, Clock, Flame, Sparkles
} from "lucide-react";
import { customMatchApi, playerApi } from "@/services/api";
import { Match, Ball, PlayerRole, getPlayerName, getPlayerRole } from "@/data/scoringTypes";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { io, Socket } from "socket.io-client";
import { MatchIntelligenceBlock } from "@/components/admin/TournamentMatchDetail";
import { LiveStatCard } from "@/components/LiveStatCard";
import { BatsmanDetailPopup } from "@/components/BatsmanDetailPopup";
import { BowlerDetailPopup } from "@/components/BowlerDetailPopup";
import { SquadsList } from "@/components/SquadsList";
import { ANALYSIS_PLAYERS } from "@/data/playerAnalysisData";

const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : (import.meta.env.PROD ? 'https://sportbuzz-backend.onrender.com' : 'http://localhost:5000');

const cricketPlayers = ANALYSIS_PLAYERS.cricket;

// Original getRealBowlerCareerStats is removed from global scope as it's redefined inside the component.

type ViewTab = "live" | "scorecard" | "commentary" | "lineups";

interface SelectedBatsman { name: string; inning: number; }

/* ── Helper: compute batsman stats from balls ── */
interface BatsmanStat {
    name: string; runs: number; balls: number; fours: number; sixes: number; sr: string;
    isOut: boolean; dismissalText: string;
}
interface BowlerStat {
    name: string; overs: string; maidens: number; runs: number; wickets: number; economy: string;
    legalBalls: number;
}

const computeBatsmanStats = (inningBalls: Ball[]): BatsmanStat[] => {
    const map = new Map<string, BatsmanStat>();
    const dismissed = new Set<string>();

    for (const b of inningBalls) {
        if (b.isCommentaryOnly || b.batsman?.includes("Commentary") || b.bowler?.includes("Commentary")) continue;

        // Striker
        if (!map.has(b.batsman)) {
            map.set(b.batsman, { name: b.batsman, runs: 0, balls: 0, fours: 0, sixes: 0, sr: "0.00", isOut: false, dismissalText: "" });
        }
        const stat = map.get(b.batsman)!;

        // Count ball faced (not for wide)
        if (b.extraType !== "wide") {
            stat.balls++;
        }

        // Count runs scored by batsman (not extras like byes/legbyes/wides)
        if (b.extraType === "none" || b.extraType === "noball") {
            stat.runs += b.runs;
            if (b.runs === 4) stat.fours++;
            if (b.runs === 6) stat.sixes++;
        }

        // Handle wicket
        if (b.wicket?.isWicket) {
            const outPlayer = b.wicket.playerOut || b.batsman;
            if (!map.has(outPlayer)) {
                map.set(outPlayer, { name: outPlayer, runs: 0, balls: 0, fours: 0, sixes: 0, sr: "0.00", isOut: false, dismissalText: "" });
            }
            const outStat = map.get(outPlayer)!;
            outStat.isOut = true;
            const type = b.wicket.type || "out";
            const fielder = (b.wicket as any)?.fielder;
            if (type === "caught and bowled") outStat.dismissalText = `c & b ${b.bowler}`;
            else if (type === "caught") outStat.dismissalText = `c ${fielder || ''} b ${b.bowler}`;
            else if (type === "bowled") outStat.dismissalText = `b ${b.bowler}`;
            else if (type === "lbw") outStat.dismissalText = `lbw b ${b.bowler}`;
            else if (type === "runout" && fielder) outStat.dismissalText = `run out (${fielder})`;
            else if (type === "runout") outStat.dismissalText = `run out`;
            else if (type === "stumped" && fielder) outStat.dismissalText = `st ${fielder} b ${b.bowler}`;
            else if (type === "stumped") outStat.dismissalText = `st ${b.bowler}`;
            else if (type === "hitwicket") outStat.dismissalText = `hit wicket b ${b.bowler}`;
            else outStat.dismissalText = type;
            dismissed.add(outPlayer);
        }

        // Ensure non-striker is tracked
        if (b.nonStriker && !map.has(b.nonStriker)) {
            map.set(b.nonStriker, { name: b.nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, sr: "0.00", isOut: false, dismissalText: "" });
        }
    }

    // Calculate strike rates
    for (const [, stat] of map) {
        stat.sr = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(1) : "0.0";
    }

    // Sort: not-out batsmen first (currently batting), then by batting order
    const arr = Array.from(map.values());
    return arr;
};

const computeBowlerStats = (inningBalls: Ball[]): BowlerStat[] => {
    const map = new Map<string, BowlerStat>();

    for (const b of inningBalls) {
        if (b.isCommentaryOnly || b.batsman?.includes("Commentary") || b.bowler?.includes("Commentary")) continue;

        if (!map.has(b.bowler)) {
            map.set(b.bowler, { name: b.bowler, overs: "0", maidens: 0, runs: 0, wickets: 0, economy: "0.00", legalBalls: 0 });
        }
        const stat = map.get(b.bowler)!;
        stat.runs += b.totalBallRuns;
        if (b.wicket?.isWicket) stat.wickets++;
        if (b.extraType !== "wide" && b.extraType !== "noball") {
            stat.legalBalls++;
        }
    }

    for (const [, stat] of map) {
        const completedOvers = Math.floor(stat.legalBalls / 6);
        const remainingBalls = stat.legalBalls % 6;
        stat.overs = remainingBalls > 0 ? `${completedOvers}.${remainingBalls}` : `${completedOvers}`;
        stat.economy = stat.legalBalls > 0 ? ((stat.runs / stat.legalBalls) * 6).toFixed(1) : "0.0";
    }

    return Array.from(map.values());
};

/* ── Component ── */
const LiveMatchViewer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [match, setMatch] = useState<Match | null>(null);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState<ViewTab>("live");
    const [activeScorecardInning, setActiveScorecardInning] = useState<1 | 2>(1);
    const [hasAutoSwitchedInning, setHasAutoSwitchedInning] = useState(false);
    const [selectedBatsman, setSelectedBatsman] = useState<{ name: string; inning: number } | null>(null);
    const [selectedBowler, setSelectedBowler] = useState<{ name: string; inning: number } | null>(null);
    const [playerStatsCache, setPlayerStatsCache] = useState<Record<string, any>>({}); // Added playerStatsCache state
    const [matchupCache, setMatchupCache] = useState<Record<string, any>>({}); // Matchup stats: "bowler-batsman" -> stats

    useEffect(() => {
        // Only auto-switch to Inning 2 ONCE when it's detected and we haven't switched yet
        if (balls.some(b => b.inning === 2) && !hasAutoSwitchedInning) {
            setActiveScorecardInning(2);
            setHasAutoSwitchedInning(true);
        }
    }, [balls, hasAutoSwitchedInning]);

    useEffect(() => {
        if (!id) return;

        const fetchMatch = async () => {
            try {
                const [matchRes, ballsRes] = await Promise.all([
                    customMatchApi.getById(id),
                    customMatchApi.getBalls(id)
                ]);
                setMatch(matchRes.data);
                // Deduplicate initially fetched balls
                const rawBalls = ballsRes.data || [];
                const uniqueBalls: Ball[] = [];
                const seenIds = new Set<string>();
                for (const b of rawBalls) {
                    if (b._id) {
                        if (seenIds.has(b._id)) continue;
                        seenIds.add(b._id);
                    }
                    uniqueBalls.push(b);
                }
                setBalls(uniqueBalls);
            } catch {
                toast.error("Failed to load match");
                navigate("/");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMatch();

        /* Socket connection with auto-reconnection */
        const newSocket = io(API_BASE, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });

        newSocket.on("connect", () => {
            setIsConnected(true);
            newSocket.emit("join_match", id);
        });
        newSocket.on("disconnect", () => setIsConnected(false));
        newSocket.on("reconnect", () => {
            setIsConnected(true);
            newSocket.emit("join_match", id);
            /* Re-fetch full data after reconnect to avoid missed updates */
            fetchMatch();
        });

        /* Listen for score updates (event name matches backend) */
        newSocket.on("score_updated", (data: any) => {
            setMatch(prev => prev ? {
                ...prev,
                score: data.score,
                currentInnings: data.currentInnings,
                ...(data.status && { status: data.status }),
                ...(data.toss && { toss: data.toss }),
                ...(data.result && { result: data.result })
            } : null);
            if (data.lastBall) {
                setBalls(prev => {
                    const isDup = data.lastBall._id && prev.some(b => b._id === data.lastBall._id);
                    if (isDup) return prev;
                    return [...prev, data.lastBall];
                });
            }
        });

        /* Listen for undo events — re-fetch all data */
        newSocket.on("score_undo", () => {
            fetchMatch();
        });

        /* Also listen on general channel as fallback */
        newSocket.on("live_matches_update", (data: any) => {
            if (data.matchId === id) {
                setMatch(prev => prev ? {
                    ...prev,
                    score: data.score,
                    currentInnings: data.currentInnings,
                    ...(data.status && { status: data.status }),
                    ...(data.toss && { toss: data.toss }),
                    ...(data.result && { result: data.result })
                } : null);
                if (data.lastBall) {
                    setBalls(prev => {
                        const isDup = data.lastBall._id && prev.some(b => b._id === data.lastBall._id);
                        if (isDup) return prev;
                        return [...prev, data.lastBall];
                    });
                }
            }
        });

        /* Periodic HTTP poll fallback every 15s if socket drops */
        const pollInterval = setInterval(async () => {
            if (!newSocket.connected) {
                try {
                    const [mr, br] = await Promise.all([
                        customMatchApi.getById(id),
                        customMatchApi.getBalls(id)
                    ]);
                    setMatch(mr.data);
                    setBalls(br.data || []);
                } catch { /* ignore poll errors */ }
            }
        }, 15000);

        return () => {
            newSocket.emit("leave_match", id);
            newSocket.disconnect();
            clearInterval(pollInterval);
        };
    }, [id, navigate]);

    /* ── Fetch and cache career stats for all players in the match ── */
    useEffect(() => {
        if (balls.length === 0) return;

        const allPlayerNames = new Set<string>();
        balls.forEach(b => {
            if (b.batsman) allPlayerNames.add(b.batsman);
            if (b.bowler) allPlayerNames.add(b.bowler);
            if (b.nonStriker) allPlayerNames.add(b.nonStriker);
        });

        const playersToFetch = Array.from(allPlayerNames).filter(name => !playerStatsCache[name]);

        if (playersToFetch.length > 0) {
            playersToFetch.forEach(name => {
                playerApi.getStats(name)
                    .then((res: any) => {
                        if (res?.success && res?.data) {
                            setPlayerStatsCache(prev => ({ ...prev, [name]: res.data }));
                        }
                    })
                    .catch(() => {
                        // Ignore error, fallback to local data
                    });
            });
        }
    }, [balls]);

    /* ── Fetch and cache bowler-batsman matchups when a new bowler comes ── */
    useEffect(() => {
        if (balls.length === 0) return;

        // Sort balls by inning and time to correctly identify "new bowler" moments
        const sorted = [...balls].sort((a, b) => {
            if (a.inning !== b.inning) return a.inning - b.inning;
            if (a.over !== b.over) return a.over - b.over;
            return a.ball - b.ball;
        });

        const newBowlerEvents: { bowler: string; batsmen: string[]; inning: number }[] = [];
        let currentBowler: string | null = null;

        sorted.forEach((b, i) => {
            if (b.bowler !== currentBowler) {
                // Potential new bowler introduction
                // Check if this bowler has bowled before in this inning
                const previousBallsInInning = sorted.slice(0, i).filter(pb => pb.inning === b.inning);
                const hasBowledBefore = previousBallsInInning.some(pb => pb.bowler === b.bowler);

                if (!hasBowledBefore) {
                    newBowlerEvents.push({
                        bowler: b.bowler,
                        batsmen: [b.batsman, b.nonStriker].filter(Boolean),
                        inning: b.inning
                    });
                }
                currentBowler = b.bowler;
            }
        });

        // Fetch matchups for all identified new bowler events
        newBowlerEvents.forEach(event => {
            event.batsmen.forEach(bat => {
                const mKey = `${event.bowler}-${bat}`;
                if (!matchupCache[mKey]) {
                    playerApi.getMatchup(bat, event.bowler)
                        .then((res: any) => {
                            if (res?.success && res?.data) {
                                setMatchupCache(prev => ({ ...prev, [mKey]: res.data }));
                            }
                        })
                        .catch(() => {
                            // Silently ignore errors
                        });
                }
            });
        });
    }, [balls]);

    const getRealBowlerCareerStats = (name: string) => {
        // 1. Try Cache (from API)
        const cached = playerStatsCache[name];
        if (cached && cached.formats) {
            // Pick most relevant format (T20 > ODI > Test)
            const format = cached.formats.t20 || cached.formats.odi || cached.formats.test || {};
            return {
                matches: format.matches || cached.matches || 0,
                wickets: format.wickets || cached.wickets || 0,
                economy: format.economy || cached.economy || "0.00",
                type: cached.role || "Bowler",
            };
        }

        // 2. Fallback to our detailed analysis data
        const profile = cricketPlayers.find(p =>
            p.name.toLowerCase() === name.toLowerCase() ||
            p.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.name.toLowerCase())
        );

        if (profile && profile.detailedStats) {
            return {
                matches: profile.detailedStats.Matches || 0,
                wickets: profile.detailedStats.Wickets || 0,
                economy: profile.detailedStats.Economy || "0.00",
                type: profile.role || "Bowler",
            };
        }

        // Default stats if not found in cache or analysis data
        return {
            matches: 0,
            wickets: 0,
            economy: "0.00",
            type: "Bowler"
        };
    };

    /* ── Derived data ── */
    const isRealBall = (b: Ball) => !b.isCommentaryOnly && !b.batsman?.includes("Commentary") && !b.bowler?.includes("Commentary");
    const sortedBalls = useMemo(() => {
        return [...balls].sort((a, b) => {
            if (a.inning !== b.inning) return a.inning - b.inning;
            if (a.over !== b.over) return a.over - b.over;
            if (a.ball !== b.ball) return a.ball - b.ball;
            return (a._id || "").localeCompare(b._id || "");
        });
    }, [balls]);

    const inning1Balls = useMemo(() => sortedBalls.filter(b => b.inning === 1 && isRealBall(b)), [sortedBalls]);
    const inning2Balls = useMemo(() => sortedBalls.filter(b => b.inning === 2 && isRealBall(b)), [sortedBalls]);
    const currentInningBalls = useMemo(() =>
        match ? (match.currentInnings === 1 ? inning1Balls : inning2Balls) : [],
        [match, inning1Balls, inning2Balls]
    );

    const bat1Stats = useMemo(() => computeBatsmanStats(inning1Balls), [inning1Balls]);
    const bowl1Stats = useMemo(() => computeBowlerStats(inning1Balls), [inning1Balls]);
    const bat2Stats = useMemo(() => computeBatsmanStats(inning2Balls), [inning2Balls]);
    const bowl2Stats = useMemo(() => computeBowlerStats(inning2Balls), [inning2Balls]);

    const currentBatStats = useMemo(() => computeBatsmanStats(currentInningBalls), [currentInningBalls]);
    const currentBowlStats = useMemo(() => computeBowlerStats(currentInningBalls), [currentInningBalls]);

    /* Current batsmen at crease (not out) */
    const atCrease = useMemo(() => {
        if (currentInningBalls.length === 0) return [];
        const last = currentInningBalls[currentInningBalls.length - 1];
        const names = [last.batsman, last.nonStriker].filter(Boolean) as string[];
        const result: BatsmanStat[] = [];
        for (const name of names) {
            const stat = currentBatStats.find(s => s.name === name && !s.isOut);
            if (stat) {
                result.push(stat);
            } else if (!currentBatStats.find(s => s.name === name)?.isOut) {
                /* Player hasn't faced a ball yet — show them with zero stats */
                result.push({ name, runs: 0, balls: 0, fours: 0, sixes: 0, sr: "0.00", isOut: false, dismissalText: "" });
            }
        }
        return result;
    }, [currentInningBalls, currentBatStats]);

    /* Current bowler */
    const currentBowler = useMemo(() => {
        if (currentInningBalls.length === 0) return null;
        const last = currentInningBalls[currentInningBalls.length - 1];
        return currentBowlStats.find(s => s.name === last.bowler) || null;
    }, [currentInningBalls, currentBowlStats]);

    /* This over balls */
    const thisOverBalls = useMemo(() => {
        if (currentInningBalls.length === 0) return [];
        const legalBalls = currentInningBalls.filter(b => b.extraType !== "wide" && b.extraType !== "noball");
        const currentOver = Math.floor(legalBalls.length / 6);
        // Check if over just completed — if so show the last over
        const overNum = legalBalls.length > 0 && legalBalls.length % 6 === 0
            ? currentOver - 1
            : currentOver;
        return currentInningBalls.filter(b => b.over === overNum);
    }, [currentInningBalls]);

    /* ── Loading ── */
    if (isLoading || !match) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400">Loading live match...</p>
                </div>
            </div>
        );
    }

    const team1Score = match.score.team1;
    const team2Score = match.score.team2;
    const battingTeam = match.currentInnings === 1 ? match.homeTeam : match.awayTeam;
    const bowlingTeam = match.currentInnings === 1 ? match.awayTeam : match.homeTeam;
    const currentScore = match.currentInnings === 1 ? team1Score : team2Score;
    const totalLegal = currentInningBalls.filter(b => b.extraType !== "wide" && b.extraType !== "noball").length;
    const oversDisplay = `${Math.floor(totalLegal / 6)}.${totalLegal % 6}`;
    const crr = totalLegal > 0 ? (currentScore.runs / (totalLegal / 6)).toFixed(2) : "0.00";

    let target = 0;
    let rrr = "--";
    if (match.currentInnings === 2) {
        target = team1Score.runs + 1;
        const remaining = target - team2Score.runs;
        const ballsLeft = ((match.tournament as any)?.overs || 20) * 6 - totalLegal;
        if (ballsLeft > 0) rrr = (remaining / (ballsLeft / 6)).toFixed(2);
    }

    // Current partnership
    const partnershipInfo = useMemo(() => {
        if (currentInningBalls.length === 0) return null;
        let partRuns = 0, partBalls = 0;
        for (let i = currentInningBalls.length - 1; i >= 0; i--) {
            const b = currentInningBalls[i];
            if (b.wicket?.isWicket) break;
            partRuns += b.runs + (b.extraRuns || 0);
            if (b.extraType !== "wide" && b.extraType !== "noball") partBalls++;
        }
        return { runs: partRuns, balls: partBalls };
    }, [currentInningBalls]);

    // Last 6 balls (for 1st innings)
    const last6Balls = useMemo(() => currentInningBalls.slice(-6), [currentInningBalls]);

    // At This Stage (for 2nd innings)
    const atThisStageInfo = useMemo(() => {
        if (match?.currentInnings !== 2) return null;
        if (!balls || balls.length === 0) return null;

        const currentLegalBalls = currentInningBalls.filter(b => b.extraType !== "wide" && b.extraType !== "noball").length;
        if (currentLegalBalls === 0) return null;

        const inn1 = balls.filter(b => b.inning === 1 && !b.isCommentaryOnly);
        let runs = 0;
        let wickets = 0;
        let legalCount = 0;

        for (const b of inn1) {
            runs += (b.runs + (b.extraRuns || 0));
            if (b.wicket?.isWicket) wickets++;
            if (b.extraType !== "wide" && b.extraType !== "noball") {
                legalCount++;
            }
            if (legalCount === currentLegalBalls) {
                break;
            }
        }

        const oversDisplay = `${Math.floor(legalCount / 6)}.${legalCount % 6}`;
        const team1Name = match.homeTeam.name;

        return {
            teamName: team1Name,
            runs,
            wickets,
            overs: oversDisplay
        };
    }, [match, balls, currentInningBalls]);

    const getBallChipStyle = (b: Ball) => {
        if (b.wicket?.isWicket) return "bg-red-500/30 text-red-400 border-red-500/50";
        if (b.runs === 6) return "bg-purple-500/30 text-purple-400 border-purple-500/50";
        if (b.runs === 4) return "bg-blue-500/30 text-blue-400 border-blue-500/50";
        if (b.extraType !== "none") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
        if (b.runs === 0) return "bg-slate-800 text-slate-500 border-slate-700";
        return "bg-green-500/20 text-green-400 border-green-500/40";
    };
    const getBallChipLabel = (b: Ball) => {
        if (b.wicket?.isWicket) return "W";
        if (b.extraType === "wide") return `${b.totalBallRuns}WD`;
        if (b.extraType === "noball") return `${b.totalBallRuns}NB`;
        return String(b.runs);
    };

    /* ── Win Predictor ── */
    const totalOvers = (match.tournament as any)?.overs || 20;
    const winProb = useMemo(() => {
        if (match.status !== "Live") return null;
        const battingScore = match.currentInnings === 1 ? team1Score : team2Score;
        const battingTeamName = match.currentInnings === 1 ? match.homeTeam.name : match.awayTeam.name;
        const bowlingTeamName = match.currentInnings === 1 ? match.awayTeam.name : match.homeTeam.name;
        const wicketsGone = battingScore.wickets;
        const wicketsLeft = 10 - wicketsGone;
        const totalBallsInMatch = totalOvers * 6;
        const ballsBowled = totalLegal;
        const ballsRemaining = totalBallsInMatch - ballsBowled;

        let battingAdvantage = 50;

        if (match.currentInnings === 1) {
            const parRate = 7.5;
            const currentCRR = totalLegal > 0 ? battingScore.runs / (totalLegal / 6) : 0;
            const rateAdv = ((currentCRR - parRate) / parRate) * 30;
            const wicketPenalty = wicketsGone * 4;
            const resourceFactor = (ballsRemaining / totalBallsInMatch) * 10;
            battingAdvantage = 50 + rateAdv - wicketPenalty + resourceFactor;
        } else {
            const tgt = team1Score.runs + 1;
            const runsNeeded = tgt - team2Score.runs;
            const rrr_val = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 999;
            const currentCRR = totalLegal > 0 ? team2Score.runs / (totalLegal / 6) : 0;
            const rateAdv = currentCRR > 0 ? ((currentCRR - rrr_val) / Math.max(currentCRR, rrr_val, 1)) * 35 : -10;
            const wicketFactor = (wicketsLeft / 10) * 25;
            const proximity = team2Score.runs / Math.max(tgt, 1);
            const proxFactor = proximity * 20;
            const resFactor = (ballsRemaining / totalBallsInMatch) * 10;
            battingAdvantage = 30 + rateAdv + wicketFactor + proxFactor + resFactor;
            if (runsNeeded <= 0) battingAdvantage = 98;
            if (wicketsGone >= 10) battingAdvantage = 2;
            if (ballsRemaining <= 0 && runsNeeded > 0) battingAdvantage = 2;
        }

        battingAdvantage = Math.max(5, Math.min(95, battingAdvantage));
        const bowlingAdvantage = 100 - battingAdvantage;
        return {
            team1Name: battingTeamName,
            team1Pct: Math.round(battingAdvantage),
            team2Name: bowlingTeamName,
            team2Pct: Math.round(bowlingAdvantage),
        };
    }, [match, team1Score, team2Score, totalLegal, totalOvers]);

    let testBreakStatus: string | null = null;
    if (match.status === "Live" && match.tournament?.matchType === "Test") {
        const sessionOvers = match.tournament.oversPerSession || 30;
        const currentInningsScore = match.currentInnings === 1 ? match.score?.team1 : match.score?.team2;
        if (currentInningsScore) {
            const overs = currentInningsScore.overs || 0;
            // Check if perfectly divisible (end of session)
            if (overs > 0 && Number.isInteger(overs) && overs % sessionOvers === 0) {
                if (match.testSession === 2) testBreakStatus = "LUNCH BREAK";
                else if (match.testSession === 3) testBreakStatus = "TEA BREAK";
                else if (match.testSession === 1) testBreakStatus = `STUMPS DAY ${Math.max(1, (match.testDay || 1) - 1)}`;
                else testBreakStatus = "SESSION BREAK";
            }
        }
    }

    const tabs: { id: ViewTab; label: string; icon: any }[] = [
        { id: "live", label: "Live", icon: Zap },
        { id: "scorecard", label: "Scorecard", icon: BarChart2 },
        { id: "commentary", label: "Commentary", icon: MessageSquare },
        { id: "lineups", label: "Lineups", icon: Users },
    ];

    /* ── Ball label helper ── */
    const ballLabel = (b: Ball) => {
        if (b.wicket?.isWicket) return "W";
        if (b.extraType === "wide") return `${b.totalBallRuns}wd`;
        if (b.extraType === "noball") return `${b.totalBallRuns}nb`;
        if (b.extraType === "bye") return `${b.runs}B`;
        if (b.extraType === "legbye") return `${b.runs}LB`;
        return String(b.runs);
    };
    const ballColor = (b: Ball) => {
        if (b.wicket?.isWicket) return "bg-red-500/20 text-red-400 border-red-500/40";
        if (b.runs === 4) return "bg-blue-500/20 text-blue-400 border-blue-500/40";
        if (b.runs === 6) return "bg-purple-500/20 text-purple-400 border-purple-500/40";
        if (b.extraType !== "none") return "bg-orange-500/20 text-orange-400 border-orange-500/40";
        if (b.runs === 0) return "bg-slate-800/80 text-slate-400 border-slate-700";
        return "bg-slate-800 text-white border-slate-700";
    };

    /* ═══════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
            <Helmet>
                <title>Live: {match.homeTeam.name} vs {match.awayTeam.name} | SportBuzz</title>
            </Helmet>

            {/* Connection Bar */}
            <div className={`text-center py-1.5 text-xs font-medium ${isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <span className="flex items-center justify-center gap-1.5">
                    {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {isConnected ? 'Connected — Live updates active' : 'Disconnected — Reconnecting...'}
                </span>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-4">
                <Link to="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
                    <ChevronLeft size={16} /> Back to Home
                </Link>

                {/* ── Score Header ── */}
                <Card className="bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 border-slate-700/60 overflow-hidden relative">
                    <div className="absolute top-3 right-3">
                        {match.status === "Live" && !testBreakStatus && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                                <Zap size={10} className="animate-pulse" /> LIVE
                            </span>
                        )}
                        {match.status === "Live" && testBreakStatus && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                                <Clock size={10} className="animate-pulse" /> {testBreakStatus}
                            </span>
                        )}
                        {match.status === "Completed" && (
                            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs font-bold">COMPLETED</span>
                        )}
                    </div>
                    <CardContent className="p-5 md:p-6">
                        <div className="flex items-center justify-between gap-4">
                            {/* Home Team */}
                            <div className="text-center flex-1">
                                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center border border-slate-700 mb-2 overflow-hidden">
                                    {match.homeTeam.logo ? <img src={match.homeTeam.logo} className="w-full h-full object-cover" /> : <Shield className="text-blue-400 w-6 h-6" />}
                                </div>
                                <p className="text-white font-bold text-sm">{match.homeTeam.name}</p>
                                <p className="text-3xl font-black text-white mt-1">
                                    {team1Score.runs}<span className="text-slate-500">/</span>{team1Score.wickets}
                                </p>
                                <p className="text-slate-500 text-xs">{team1Score.overs?.toFixed?.(1) || "0.0"} ov</p>
                            </div>

                            {/* VS */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <p className="text-slate-600 font-black text-2xl">VS</p>
                                {match.toss && (
                                    <p className="text-slate-500 text-[10px] max-w-[120px] text-center leading-tight">
                                        Toss: {match.toss.win === match.homeTeam._id ? match.homeTeam.name : match.awayTeam.name} ({match.toss.decision})
                                    </p>
                                )}
                            </div>

                            {/* Away Team */}
                            <div className="text-center flex-1">
                                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-red-600/30 to-pink-600/30 flex items-center justify-center border border-slate-700 mb-2 overflow-hidden">
                                    {match.awayTeam.logo ? <img src={match.awayTeam.logo} className="w-full h-full object-cover" /> : <Shield className="text-red-400 w-6 h-6" />}
                                </div>
                                <p className="text-white font-bold text-sm">{match.awayTeam.name}</p>
                                <p className="text-3xl font-black text-white mt-1">
                                    {team2Score.runs}<span className="text-slate-500">/</span>{team2Score.wickets}
                                </p>
                                <p className="text-slate-500 text-xs">{team2Score.overs?.toFixed?.(1) || "0.0"} ov
                                </p>
                            </div>
                        </div>

                        {/* ── Results Strip ── */}
                        {match.status === "Completed" && match.result && (
                            <div className="mt-8 flex justify-center">
                                <div className="bg-gradient-to-r from-blue-900/40 via-slate-800/60 to-blue-900/40 border border-blue-500/30 px-10 py-4 rounded-2xl shadow-xl backdrop-blur-md group transform hover:scale-105 transition-all duration-500">
                                    <p className="text-blue-400 font-black text-xl tracking-widest text-center flex items-center gap-4">
                                        <Trophy className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform" />
                                        {match.result.isTie ? "MATCH TIED" :
                                            match.result.isNoResult ? "NO RESULT" :
                                                `${match.result.winner === match.homeTeam._id ? match.homeTeam.name : match.awayTeam.name} WON BY ${match.result.margin || ""}`.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Run rates, target, partnership - Hidden if Completed */}
                        {match.status !== "Completed" && (
                            <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-700/50 flex-wrap">
                                <div className="text-center">
                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">CRR</p>
                                    <p className="text-lg font-bold text-blue-400">{crr}</p>
                                </div>
                                {match.currentInnings === 2 && (
                                    <>
                                        <div className="text-center">
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">RRR</p>
                                            <p className="text-lg font-bold text-orange-400">{rrr}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Target</p>
                                            <p className="text-lg font-bold text-yellow-400">{target}</p>
                                        </div>
                                    </>
                                )}
                                {partnershipInfo && (
                                    <div className="text-center">
                                        <p className="text-slate-500 text-[10px] uppercase tracking-widest">Partnership</p>
                                        <p className="text-lg font-bold text-emerald-400">{partnershipInfo.runs}<span className="text-slate-500 text-xs">({partnershipInfo.balls})</span></p>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* At This Stage OR Last 6 balls */}
                        {match.currentInnings === 2 && atThisStageInfo && match.status !== "Completed" ? (
                            <div className="flex justify-center mt-4 pt-3 border-t border-slate-700/50">
                                <div className="text-center">
                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">At This Stage</p>
                                    <p className="text-sm text-slate-300">
                                        <span className="text-white font-bold">{atThisStageInfo.teamName}</span> were <span className="text-emerald-400 font-bold">{atThisStageInfo.runs}/{atThisStageInfo.wickets}</span> <span className="text-slate-500">({atThisStageInfo.overs})</span>
                                    </p>
                                </div>
                            </div>
                        ) : (last6Balls.length > 0 && match.status !== "Completed") && (
                            <div className="flex justify-center gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                                {last6Balls.map((b, i) => (
                                    <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border ${getBallChipStyle(b)}`}>
                                        {getBallChipLabel(b)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Premium Live Mini-Scorecard */}
                {match.status === "Live" && (
                    <div className="mb-4">
                        <LiveStatCard 
                            atCrease={atCrease} 
                            currentBowler={currentBowler}
                            onBatsmanClick={(name) => setSelectedBatsman({ name, inning: match.currentInnings })}
                            onBowlerClick={(name) => setSelectedBowler({ name, inning: match.currentInnings })}
                        />
                    </div>
                )}

                {/* ── Win Predictor Bar ── */}
                {winProb && match.status === "Live" && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-blue-400 font-bold flex items-center gap-1.5">
                                <Zap size={12} /> WIN PREDICTOR
                            </span>
                            <span className="text-slate-600 text-[10px]">Live probability</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm w-24 text-left truncate">{winProb.team1Name}</span>
                            <div className="flex-1 h-7 rounded-full overflow-hidden flex bg-slate-800 relative">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white text-xs font-black transition-all duration-700 ease-out"
                                    style={{ width: `${winProb.team1Pct}%`, minWidth: '30px' }}
                                >
                                    {winProb.team1Pct}%
                                </div>
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-black transition-all duration-700 ease-out"
                                    style={{ width: `${winProb.team2Pct}%`, minWidth: '30px' }}
                                >
                                    {winProb.team2Pct}%
                                </div>
                            </div>
                            <span className="text-white font-bold text-sm w-24 text-right truncate">{winProb.team2Name}</span>
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* ════════════════════════════════════════════
                    TAB: LIVE
                   ════════════════════════════════════════════ */}
                {activeTab === "live" && (
                    <div className="space-y-4">
                        {/* Match Intelligence Center (Summary View) */}
                        {match.status === "Live" && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] mb-2 px-1">
                                    <Activity size={14} className="text-yellow-400 animate-pulse" />
                                    <span>AI Match Intelligence</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {(() => {
                                        // Filter explicit insights
                                        const explicit = balls.filter(b => b.isCommentaryOnly && (b as any).insightType && (b as any).insightType !== 'None');

                                        // Derive synthetic insights
                                        const synthetic: Ball[] = [];
                                        if (balls.length > 10) {
                                            const recentBalls = sortedBalls.slice(0, 18).filter(b => !b.isCommentaryOnly);

                                            // 1. Pressure Index
                                            const dots = recentBalls.slice(0, 12).filter(b => b.runs === 0 && !b.extraType).length;
                                            if (dots >= 8) {
                                                synthetic.push({
                                                    _id: 'syn-pressure',
                                                    isCommentaryOnly: true,
                                                    commentaryMessage: `BOWLING PRESSURE: The bowlers have delivered ${dots} dot balls in the last 12 legal deliveries, mounting significant pressure on the batting side.`,
                                                    insightType: 'Pressure',
                                                    timestamp: new Date().toISOString()
                                                } as any);
                                            }

                                            // 2. Momentum Alert
                                            const boundaries = recentBalls.slice(0, 18).filter(b => b.runs === 4 || b.runs === 6).length;
                                            const legalCount = recentBalls.filter(b => b.extraType !== 'wide' && b.extraType !== 'noball').length;
                                            const oversInPeriod = (Math.floor(legalCount / 6) + (legalCount % 6) / 10).toFixed(1);

                                            if (boundaries >= 4) {
                                                synthetic.push({
                                                    _id: 'syn-momentum',
                                                    isCommentaryOnly: true,
                                                    commentaryMessage: `MOMENTUM SHIFT: With ${boundaries} boundaries in the last ${oversInPeriod} overs, the batting side has seized control of the game's tempo.`,
                                                    insightType: 'Momentum',
                                                    timestamp: new Date().toISOString()
                                                } as any);
                                            }

                                            // 3. Efficiency / Scoring Rate
                                            const last3OversRuns = recentBalls.slice(0, 18).reduce((acc, b) => acc + (b.totalBallRuns || 0), 0);
                                            if (last3OversRuns > 35) {
                                                synthetic.push({
                                                    _id: 'syn-efficiency',
                                                    isCommentaryOnly: true,
                                                    commentaryMessage: `SCORING SURGE: The current partnership is scoring at ${(last3OversRuns / (legalCount / 6 || 1)).toFixed(1)} runs per over in the last ${oversInPeriod} overs, forcing tactical changes from the captain.`,
                                                    insightType: 'Efficiency',
                                                    timestamp: new Date().toISOString()
                                                } as any);
                                            }
                                        }

                                        const combined = [...explicit, ...synthetic]
                                            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
                                            .slice(0, 3);

                                        if (combined.length === 0) {
                                            return (
                                                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 text-center">
                                                    <Activity size={24} className="text-slate-700 mx-auto mb-2 opacity-20" />
                                                    <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Analyzing match patterns...</p>
                                                </div>
                                            );
                                        }

                                        return combined.map(insight => (
                                            <div key={insight._id}>
                                                <MatchIntelligenceBlock ball={insight} />
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* This Over */}
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-sm text-slate-400 uppercase tracking-widest">
                                    This Over
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 flex-wrap">
                                    {thisOverBalls.map((b, i) => (
                                        <div key={i} className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${ballColor(b)}`}>
                                            {ballLabel(b)}
                                        </div>
                                    ))}
                                    {thisOverBalls.length === 0 && <p className="text-slate-600 text-sm italic">Waiting for delivery...</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Match Info */}
                        <Card className="bg-slate-900 border-slate-700">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center gap-2 text-slate-400 text-sm"><MapPin size={14} /><span>{match.venue}</span></div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm"><Calendar size={14} /><span>{new Date(match.date).toLocaleString()}</span></div>
                                {match.tournament && <div className="flex items-center gap-2 text-slate-400 text-sm"><Trophy size={14} className="text-yellow-500" /><span>{(match.tournament as any).name}</span></div>}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ════════════════════════════════════════════
                    TAB: SCORECARD
                   ════════════════════════════════════════════ */}
                {activeTab === "scorecard" && (
                    <div className="space-y-6">
                        {/* Innings Tabs */}
                        {inning2Balls.length > 0 && (
                            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1 w-full max-w-sm mx-auto mb-2">
                                <button
                                    onClick={() => setActiveScorecardInning(1)}
                                    className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${activeScorecardInning === 1 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    Innings 1
                                </button>
                                <button
                                    onClick={() => setActiveScorecardInning(2)}
                                    className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${activeScorecardInning === 2 ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    Innings 2
                                </button>
                            </div>
                        )}

                        {/* Innings 1 */}
                        {activeScorecardInning === 1 && (
                            <InningsScorecard
                                inning={1}
                                teamName={match.homeTeam.name}
                                teamLogo={match.homeTeam.logo}
                                score={team1Score}
                                batStats={bat1Stats}
                                bowlStats={bowl1Stats}
                                balls={inning1Balls}
                                teamPlayers={match.homeTeam.players}
                                onBatsmanClick={(name) => setSelectedBatsman({ name, inning: 1 })}
                                onBowlerClick={(name) => setSelectedBowler({ name, inning: 1 })}
                            />
                        )}

                        {/* Innings 2 (if started) */}
                        {activeScorecardInning === 2 && inning2Balls.length > 0 && (
                            <InningsScorecard
                                inning={2}
                                teamName={match.awayTeam.name}
                                teamLogo={match.awayTeam.logo}
                                score={team2Score}
                                batStats={bat2Stats}
                                bowlStats={bowl2Stats}
                                balls={inning2Balls}
                                teamPlayers={match.awayTeam.players}
                                onBatsmanClick={(name) => setSelectedBatsman({ name, inning: 2 })}
                                onBowlerClick={(name) => setSelectedBowler({ name, inning: 2 })}
                            />
                        )}

                        {inning1Balls.length === 0 && inning2Balls.length === 0 && (
                            <div className="py-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                                <BarChart2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-400">No scorecard data yet</h3>
                                <p className="text-slate-500 mt-1">Scorecard will appear once play begins.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════
                    TAB: COMMENTARY
                   ════════════════════════════════════════════ */}
                {activeTab === "commentary" && (
                    <Card className="bg-slate-900 border-slate-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <MessageSquare size={18} className="text-green-400" /> Ball-by-Ball Commentary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {balls.length > 0 ? (
                                <div className="space-y-0 divide-y divide-slate-800/60">
                                    {(() => {
                                        // ── Pre-compute which overs are complete (≥6 legal balls) ──
                                        const overMap = new Map<string, Ball[]>();
                                        const overTriggerBallId = new Map<string, string>(); // inning-over -> absolute last ball _id

                                        for (const bl of sortedBalls) {
                                            if (bl.isCommentaryOnly || !bl._id) continue;
                                            const key = `${bl.inning}-${bl.over}`;
                                            if (!overMap.has(key)) overMap.set(key, []);
                                            overMap.get(key)!.push(bl);
                                            // Always update trigger to the latest ball seen for this over
                                            overTriggerBallId.set(key, bl._id);
                                        }

                                        const lastBallOfOverId = new Set<string>();
                                        overMap.forEach((overBalls, key) => {
                                            const legal = overBalls.filter(bl => bl.extraType !== "wide" && bl.extraType !== "noball").length;
                                            if (legal >= 6) {
                                                const triggerId = overTriggerBallId.get(key);
                                                if (triggerId) lastBallOfOverId.add(triggerId);
                                            }
                                        });

                                        // ── Pre-compute milestone events ──
                                        const milestoneMap = new Map<number, string[]>();
                                        const batRunning = new Map<string, number>();
                                        const bowlWickets = new Map<string, number>();
                                        const batMilestones = [50, 100, 150, 200];
                                        const bowlMilestones = [3, 5];
                                        for (let bi = 0; bi < sortedBalls.length; bi++) {
                                            const bl = sortedBalls[bi];
                                            if (bl.isCommentaryOnly) continue;
                                            const batKey = `${bl.inning}-${bl.batsman}`;
                                            const prevRuns = batRunning.get(batKey) || 0;
                                            const addedRuns = (bl.extraType === 'none' || bl.extraType === 'noball') ? bl.runs : 0;
                                            const newRuns = prevRuns + addedRuns;
                                            batRunning.set(batKey, newRuns);
                                            for (const m of batMilestones) {
                                                if (prevRuns < m && newRuns >= m) {
                                                    if (!milestoneMap.has(bi)) milestoneMap.set(bi, []);
                                                    const label = m === 50 ? 'HALF CENTURY! 🎉' : m === 100 ? 'CENTURY! 💯🔥' : m === 150 ? '150 UP! 🌟' : 'DOUBLE CENTURY! 🏆';
                                                    milestoneMap.get(bi)!.push(`${label} ${bl.batsman} reaches ${m} runs!`);
                                                }
                                            }
                                            if (bl.wicket?.isWicket && bl.bowler) {
                                                const bwKey = `${bl.inning}-${bl.bowler}`;
                                                const prevW = bowlWickets.get(bwKey) || 0;
                                                const newW = prevW + 1;
                                                bowlWickets.set(bwKey, newW);
                                                for (const m of bowlMilestones) {
                                                    if (prevW < m && newW >= m) {
                                                        if (!milestoneMap.has(bi)) milestoneMap.set(bi, []);
                                                        const label = m === 3 ? '3-WICKET HAUL! 🎳' : '5-WICKET HAUL! 🔥🎳';
                                                        milestoneMap.get(bi)!.push(`${label} ${bl.bowler} picks up ${m} wickets!`);
                                                    }
                                                }
                                            }
                                        }

                                        // ── Pre-compute bowler first appearances per innings ──
                                        const bowlerFirstBall = new Map<number, { bowler: string; inning: number }>(); // originalIndex -> bowler info
                                        const seenBowlers = new Map<string, boolean>(); // "inning-bowler" -> true
                                        // Also pre-compute bowler spell stats for the intro card
                                        const bowlerSpellStats = new Map<string, { overs: string; runs: number; wickets: number; maidens: number }>();
                                        {
                                            const bowlerBallMap = new Map<string, { legalBalls: number; runs: number; wickets: number; overRuns: Map<number, number> }>();
                                            for (let bi = 0; bi < sortedBalls.length; bi++) {
                                                const bl = sortedBalls[bi];
                                                if (bl.isCommentaryOnly || !bl.bowler) continue;
                                                const bKey = `${bl.inning}-${bl.bowler}`;
                                                if (!seenBowlers.has(bKey)) {
                                                    seenBowlers.set(bKey, true);
                                                    bowlerFirstBall.set(bi, { bowler: bl.bowler, inning: bl.inning });
                                                }
                                                if (!bowlerBallMap.has(bKey)) bowlerBallMap.set(bKey, { legalBalls: 0, runs: 0, wickets: 0, overRuns: new Map() });
                                                const entry = bowlerBallMap.get(bKey)!;
                                                if (bl.extraType !== 'wide' && bl.extraType !== 'noball') entry.legalBalls++;
                                                entry.runs += bl.runs + (bl.extraRuns || 0);
                                                if (bl.wicket?.isWicket) entry.wickets++;
                                                const runKey = bl.over;
                                                entry.overRuns.set(runKey, (entry.overRuns.get(runKey) || 0) + bl.runs + (bl.extraRuns || 0));
                                            }
                                            bowlerBallMap.forEach((stats, key) => {
                                                // Removed static bowler spell calculation since it calculates end of inning, not live.
                                            });
                                        }

                                        // ── Pre-compute batsman struggle analysis ──
                                        const struggleMap = new Map<number, { batsman: string; bowler: string; runs: number; balls: number; dots: number; fours: number; sixes: number; sr: string }>();
                                        {
                                            // Track per-ball cumulative matchup stats: batsman vs bowler
                                            const matchupStats = new Map<string, { runs: number; balls: number; dots: number; fours: number; sixes: number; lastShown: number }>();
                                            for (let bi = 0; bi < sortedBalls.length; bi++) {
                                                const bl = sortedBalls[bi];
                                                if (bl.isCommentaryOnly || !bl.batsman || !bl.bowler) continue;
                                                if (bl.extraType === 'wide') continue; // wides don't count for batsman
                                                const mKey = `${bl.inning}-${bl.batsman}-${bl.bowler}`;
                                                if (!matchupStats.has(mKey)) matchupStats.set(mKey, { runs: 0, balls: 0, dots: 0, fours: 0, sixes: 0, lastShown: -20 });
                                                const m = matchupStats.get(mKey)!;
                                                const batRuns = (bl.extraType === 'none' || bl.extraType === 'noball') ? bl.runs : 0;
                                                m.runs += batRuns;
                                                if (bl.extraType !== 'noball') m.balls++;
                                                if (batRuns === 0 && bl.extraType === 'none' && !bl.wicket?.isWicket) m.dots++;
                                                if (batRuns === 4 && bl.extraType === 'none') m.fours++;
                                                if (batRuns === 6 && bl.extraType === 'none') m.sixes++;
                                                // Show struggle card if: 6+ balls faced, SR < 80, dot% > 50%, and haven't shown in last 8 balls
                                                const sr = m.balls > 0 ? (m.runs / m.balls) * 100 : 0;
                                                const dotPct = m.balls > 0 ? (m.dots / m.balls) * 100 : 0;
                                                if (m.balls >= 6 && sr < 80 && dotPct > 50 && (bi - m.lastShown) >= 8) {
                                                    m.lastShown = bi;
                                                    struggleMap.set(bi, {
                                                        batsman: bl.batsman,
                                                        bowler: bl.bowler,
                                                        runs: m.runs,
                                                        balls: m.balls,
                                                        dots: m.dots,
                                                        fours: m.fours,
                                                        sixes: m.sixes,
                                                        sr: sr.toFixed(1),
                                                    });
                                                }
                                            }
                                        }

                                        const rballs = [...sortedBalls].reverse();
                                        return rballs.map((b, i) => {
                                            // Find its position in the original sorted array to match pre-computed maps
                                            // Using findIndex with _id for robustness against duplicates
                                            const originalIndex = b._id
                                                ? sortedBalls.findIndex(sb => sb._id === b._id)
                                                : sortedBalls.indexOf(b);

                                            const shouldShowOverSummary = !b.isCommentaryOnly && b._id && lastBallOfOverId.has(b._id);
                                            const milestones = milestoneMap.get(originalIndex) || [];
                                            const bowlerIntro = bowlerFirstBall.get(originalIndex) || null;
                                            const struggle = struggleMap.get(originalIndex) || null;

                                            let overSummaryToRender = null;
                                            if (shouldShowOverSummary) {
                                                const overKey = `${b.inning}-${b.over}`;
                                                const oballs = overMap.get(overKey) || [];
                                                const totalRuns = oballs.reduce((s, bl) => s + bl.runs + (bl.extraRuns || 0), 0);
                                                const wickets = oballs.filter(bl => bl.wicket?.isWicket).length;
                                                const extras = oballs.filter(bl => bl.extraType !== "none").length;
                                                const bowlers = [...new Set(oballs.map(bl => bl.bowler))];

                                                overSummaryToRender = (
                                                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 my-6 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                                                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-3">
                                                            <h4 className="text-white font-bold flex items-center gap-2">
                                                                <span className="bg-blue-500/20 text-blue-400 py-1 px-2.5 rounded text-sm tracking-wide">Over {b.over + 1}</span>
                                                                <span className="text-slate-300">Summary</span>
                                                            </h4>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-black text-white">{totalRuns} <span className="text-sm text-slate-500 font-medium tracking-wide">RUNS</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                                                                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 flex justify-between">
                                                                    <span>Batsmen</span>
                                                                    <span>R (B)</span>
                                                                </p>
                                                                {(() => {
                                                                    const ballsUpToNow = sortedBalls.slice(0, originalIndex + 1).filter(bl => bl.inning === b.inning && !bl.isCommentaryOnly);
                                                                    const dismissedBatsmen = ballsUpToNow.filter(bl => bl.wicket?.isWicket && bl.wicket?.playerOut).map(bl => bl.wicket.playerOut);
                                                                    const allBatsmenSoFar = [...new Set(ballsUpToNow.flatMap(bl => [bl.batsman, bl.nonStriker].filter(Boolean)))];
                                                                    const activeBatsmen = allBatsmenSoFar.filter(batsman => !dismissedBatsmen.includes(batsman));
                                                                    return activeBatsmen.map(batsman => {
                                                                        const batsmanBalls = ballsUpToNow.filter(bl => bl.batsman === batsman);
                                                                        const r = batsmanBalls.reduce((s, bl) => s + (bl.runs || 0), 0);
                                                                        const bCount = batsmanBalls.filter(bl => bl.extraType !== 'wide').length;
                                                                        return (
                                                                            <div key={batsman} className="flex justify-between items-center mb-0.5">
                                                                                <span className="text-slate-300 font-medium text-sm truncate pr-2">{batsman}</span>
                                                                                <span className="text-white font-bold text-sm shrink-0">{r} <span className="text-slate-500 font-normal text-xs">({bCount})</span></span>
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                                                                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 flex justify-between">
                                                                    <span>Bowler(s)</span>
                                                                    <span>O-M-R-W</span>
                                                                </p>
                                                                {bowlers.map(bw => {
                                                                    const ballsUpToNow = sortedBalls.slice(0, originalIndex + 1).filter(bl => bl.inning === b.inning && !bl.isCommentaryOnly);
                                                                    const bwBalls = ballsUpToNow.filter(bl => bl.bowler === bw);
                                                                    const r = bwBalls.reduce((s, bl) => s + bl.runs + (bl.extraType !== 'legbye' && bl.extraType !== 'bye' ? (bl.extraRuns || 0) : 0), 0);
                                                                    const w = bwBalls.filter(bl => bl.wicket?.isWicket && !['runout', 'retired'].includes(bl.wicket.type || '')).length;
                                                                    const legalTotal = bwBalls.filter(bl => bl.extraType !== 'wide' && bl.extraType !== 'noball').length;
                                                                    const ovs = Math.floor(legalTotal / 6) + (legalTotal % 6) / 10;
                                                                    return (
                                                                        <div key={bw} className="flex justify-between items-center mb-0.5">
                                                                            <span className="text-slate-300 font-medium text-sm truncate pr-2">{bw}</span>
                                                                            <span className="text-white font-bold text-sm shrink-0">{ovs}-0-{r}-{w}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 flex flex-col justify-center">
                                                                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5 flex justify-between">
                                                                    <span>Match State</span>
                                                                    <span>CRR: {crr}</span>
                                                                </p>
                                                                <div className="space-y-1">
                                                                    <p className="text-slate-300 text-sm flex justify-between items-center">
                                                                        <span className="text-xs">Trend:</span>
                                                                        <span className={`font-bold text-xs ${totalRuns >= 12 ? 'text-red-400' : totalRuns <= 4 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                                            {totalRuns >= 12 ? 'High Scoring' : wickets > 0 ? 'Breakthrough' : totalRuns <= 2 ? 'Tight' : 'Steady'}
                                                                        </span>
                                                                    </p>
                                                                    {match.currentInnings === 1 && (
                                                                        <p className="text-slate-300 text-sm flex justify-between items-center">
                                                                            <span className="text-xs">Projected:</span>
                                                                            <span className="text-blue-400 font-bold text-xs">{Math.round(totalRuns * 0.5 + currentScore.runs)}</span>
                                                                        </p>
                                                                    )}
                                                                    {match.currentInnings === 2 && (
                                                                        <p className="text-slate-300 text-sm flex justify-between items-center">
                                                                            <span className="text-xs">RRR:</span>
                                                                            <span className="text-amber-400 font-bold text-xs">{rrr}</span>
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                                                            <span className="text-slate-500 text-xs font-medium mr-1 uppercase tracking-wider">Balls:</span>
                                                            {oballs.map((bl, bi) => (
                                                                <span key={bi} className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border shadow-sm ${getBallChipStyle(bl)}`}>
                                                                    {getBallChipLabel(bl)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Filter out legacy AI "OVER SUMMARY" insights
                                            if (b.isCommentaryOnly && b.commentaryMessage && /OVER SUMMARY/i.test(b.commentaryMessage)) {
                                                return null;
                                            }

                                            if (b.isCommentaryOnly) {
                                                const isInningsSummary = b.commentaryMessage?.includes('END OF INNINGS');
                                                if (isInningsSummary) {
                                                    const paragraphs = (b.commentaryMessage || '').split('\n\n').filter(Boolean);
                                                    return (
                                                        <div key={b._id || i} className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 md:p-6 my-4">
                                                            <div className="flex items-center gap-2 text-blue-400 font-bold text-lg mb-4 pb-2 border-b border-slate-800">
                                                                <Trophy size={18} />
                                                                <h4>Innings Highlights &amp; Summary</h4>
                                                            </div>
                                                            <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
                                                                {paragraphs.map((para: string, pi: number) => (
                                                                    <p key={pi}>{para}</p>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const isPartnership = b.commentaryMessage?.match(/partnership has just reached (\d+)/i);
                                                if (isPartnership) {
                                                    const runsStr = isPartnership[1];
                                                    // Find the START of this partnership
                                                    let partnershipStartIdx = 0;
                                                    for (let bi = originalIndex; bi >= 0; bi--) {
                                                        const pBall = sortedBalls[bi];
                                                        if (!pBall.isCommentaryOnly && pBall.inning === b.inning && pBall.wicket?.isWicket) {
                                                            partnershipStartIdx = bi + 1;
                                                            break;
                                                        }
                                                    }

                                                    const partnershipBallsArr = sortedBalls.slice(partnershipStartIdx, originalIndex + 1).filter(bl => bl.inning === b.inning && !bl.isCommentaryOnly);

                                                    // Find current batsmen from the most recent non-commentary ball
                                                    const recentBall = sortedBalls.slice(0, originalIndex + 1).reverse().find(bl => !bl.isCommentaryOnly && bl.inning === b.inning);
                                                    const currentBatsmen = [...new Set([recentBall?.batsman, recentBall?.nonStriker].filter(Boolean))];

                                                    const batStats = currentBatsmen.map(batsman => {
                                                        const bBalls = partnershipBallsArr.filter(bl => bl.batsman === batsman);
                                                        const r = bBalls.reduce((s, bl) => s + (bl.runs || 0), 0);
                                                        const bCount = bBalls.filter(bl => bl.extraType !== 'wide' && bl.extraType !== 'noball').length;
                                                        return { batsman, r, bCount };
                                                    });

                                                    // Also fetch current partnership balls
                                                    let partnershipBalls = 0;
                                                    for (let bi = originalIndex; bi >= 0; bi--) {
                                                        const pBall = sortedBalls[bi];
                                                        if (!pBall.isCommentaryOnly && pBall.inning === b.inning) {
                                                            if (pBall.wicket?.isWicket) break;
                                                            if (pBall.extraType !== 'wide') partnershipBalls++;
                                                        }
                                                    }

                                                    return (
                                                        <div key={b._id || i} className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 my-4 overflow-hidden relative shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"></div>
                                                            <div className="flex flex-col items-center">
                                                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3"><Flame size={12} className="inline mr-1 mb-0.5" />Partnership Milestone</span>
                                                                <p className="text-white text-xl font-black text-center mb-1">{runsStr} Runs Partnership <span className="text-slate-400 text-sm font-medium ml-1">({partnershipBalls} balls)</span></p>

                                                                {batStats.length >= 2 && (
                                                                    <div className="w-full flex items-center justify-between gap-3 mt-4">
                                                                        <div className="flex-1 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center shadow-inner">
                                                                            <p className="text-emerald-300 font-bold mb-1 truncate">{batStats[0].batsman}</p>
                                                                            <p className="text-white text-xl font-bold">{batStats[0].r} <span className="text-slate-500 text-xs font-normal tracking-wide">({batStats[0].bCount})</span></p>
                                                                        </div>
                                                                        <div className="text-slate-600 text-[10px] font-black italic px-2">AND</div>
                                                                        <div className="flex-1 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center shadow-inner">
                                                                            <p className="text-emerald-300 font-bold mb-1 truncate">{batStats[1].batsman}</p>
                                                                            <p className="text-white text-xl font-bold">{batStats[1].r} <span className="text-slate-500 text-xs font-normal tracking-wide">({batStats[1].bCount})</span></p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={b._id || i} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 my-3 text-center shadow-md relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
                                                        <p className="text-emerald-400 font-medium italic text-sm tracking-wide">"{b.commentaryMessage}"</p>
                                                    </div>
                                                );
                                            }

                                            const maxOv = (match.tournament as any)?.overs || 20;
                                            const clampedOver = Math.min(b.over, maxOv - 1);
                                            const overBall = b.extraType === "wide" || b.extraType === "noball"
                                                ? `${clampedOver}.${b.ball}*`
                                                : `${clampedOver}.${b.ball}`;

                                            const statArray = b.inning === 1 ? bat1Stats : bat2Stats;
                                            const outPlayerName = b.wicket?.playerOut || b.batsman;
                                            const outBatsmanStat = statArray.find(s => s.name === outPlayerName);

                                            const commentaryPrefix = `${b.bowler} to `;
                                            const commentarySuffix = `${b.batsman}, `;
                                            let commentaryBody = "";
                                            if (b.wicket?.isWicket) {
                                                commentaryBody += `WICKET! ${b.wicket.type || "out"}`;
                                                if ((b.wicket as any)?.fielder) commentaryBody += ` (${(b.wicket as any).fielder})`;
                                                commentaryBody += `. ${b.wicket.playerOut || b.batsman} departs.`;
                                            } else if (b.extraType === "wide") {
                                                commentaryBody += `wide, ${b.totalBallRuns} run${b.totalBallRuns !== 1 ? 's' : ''}`;
                                            } else if (b.extraType === "noball") {
                                                commentaryBody += `no ball, ${b.totalBallRuns} run${b.totalBallRuns !== 1 ? 's' : ''}`;
                                            } else if (b.runs === 0) {
                                                commentaryBody += "no run";
                                            } else if (b.runs === 4) {
                                                commentaryBody += "FOUR!";
                                            } else if (b.runs === 6) {
                                                commentaryBody += "SIX!";
                                            } else {
                                                commentaryBody += `${b.runs} run${b.runs !== 1 ? 's' : ''}`;
                                            }

                                            return (
                                                <React.Fragment key={i}>
                                                    <div className="flex flex-col gap-2 py-3">
                                                        <div className="flex gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${ballColor(b)}`}>
                                                                {ballLabel(b)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-slate-500 text-xs mb-0.5">
                                                                    Inn {b.inning} • Ov {overBall}
                                                                </p>
                                                                <p className={`text-sm ${b.wicket?.isWicket ? 'text-red-400 font-bold !text-lg md:!text-xl' : b.runs === 6 ? 'text-purple-400 font-bold !text-lg md:!text-xl' : b.runs === 4 ? 'text-blue-400 font-bold !text-lg md:!text-xl' : b.runs >= 4 ? 'text-white font-medium' : 'text-slate-300'}`}>
                                                                    <span 
                                                                        className="hover:text-blue-400 cursor-pointer transition-colors"
                                                                        onClick={() => setSelectedBowler({ name: b.bowler, inning: b.inning })}
                                                                    >
                                                                        {b.bowler}
                                                                    </span> to {b.batsman}, {commentaryBody}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {overSummaryToRender}
                                                    </div>
                                                        {/* Dropped Catch */}
                                                        {(b as any).isDroppedCatch && (b as any).droppedFielder && (
                                                            <div className="ml-13 mt-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                                                                <p className="text-yellow-400 text-xs font-bold">⚠ DROPPED CATCH!</p>
                                                                <p className="text-yellow-300/80 text-xs">{(b as any).droppedFielder} put down a chance off {b.batsman}</p>
                                                            </div>
                                                        )}
                                                        {/* Batsman Out Card */}
                                                        {b.wicket?.isWicket && outBatsmanStat && (
                                                            <div className="mt-2 ml-13 rounded-xl overflow-hidden border border-slate-700/60 shadow-lg relative shrink-0">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                                                                <div className="bg-slate-800/80 flex flex-col sm:flex-row">
                                                                    <div className="flex-1 p-3 pl-5 bg-gradient-to-r from-slate-800 to-slate-800/40 flex flex-col justify-center min-w-[200px]">
                                                                        <span className="text-white font-bold text-[15px]">{outBatsmanStat.name}</span>
                                                                        <span className="text-red-400 text-xs font-semibold mt-0.5">{outBatsmanStat.dismissalText}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-around gap-2 sm:gap-6 p-3 px-5 bg-slate-800 border-t sm:border-t-0 sm:border-l border-slate-700/60">
                                                                        <div className="text-center min-w-[3rem]">
                                                                            <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">R (B)</p>
                                                                            <p className="text-white font-black text-[15px]">
                                                                                {outBatsmanStat.runs} <span className="text-slate-500 font-medium text-xs ml-0.5">({outBatsmanStat.balls})</span>
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-center min-w-[2rem]">
                                                                            <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">4s</p>
                                                                            <p className="text-white font-bold text-[15px]">{outBatsmanStat.fours}</p>
                                                                        </div>
                                                                        <div className="text-center min-w-[2rem]">
                                                                            <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">6s</p>
                                                                            <p className="text-white font-bold text-[15px]">{outBatsmanStat.sixes}</p>
                                                                        </div>
                                                                        <div className="text-center min-w-[3rem]">
                                                                            <p className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">SR</p>
                                                                            <p className="text-white font-bold text-[15px]">{outBatsmanStat.sr}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    {/* Milestone celebration cards */}
                                                    {milestones.map((msg, mi) => (
                                                        <div key={`ms-${mi}`} className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-yellow-500/40 rounded-xl p-4 my-3 text-center shadow-lg relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400"></div>
                                                            <p className="text-yellow-300 font-bold text-sm tracking-wide">{msg}</p>
                                                        </div>
                                                    ))}
                                                    {/* Bowler intro card */}
                                                    {bowlerIntro && (() => {
                                                        const careerStats = getRealBowlerCareerStats(bowlerIntro.bowler);
                                                        
                                                        // Get current batsmen at this point in the match
                                                        const currentBall = sortedBalls[originalIndex];
                                                        const currentBatsmen = [currentBall.batsman, currentBall.nonStriker].filter(Boolean);
                                                        
                                                        return (
                                                            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/40 rounded-xl p-4 my-3 shadow-lg relative overflow-hidden">
                                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400"></div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                                                                        <span className="text-indigo-300 text-xs font-bold">Bowling</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-indigo-300 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5"><Sparkles size={10} className="text-indigo-400" /> New Bowler</p>
                                                                        <p 
                                                                            className="text-white font-bold text-sm truncate hover:text-indigo-400 cursor-pointer transition-colors"
                                                                            onClick={() => setSelectedBowler({ name: bowlerIntro.bowler, inning: bowlerIntro.inning })}
                                                                        >
                                                                            {bowlerIntro.bowler}
                                                                        </p>
                                                                        <p className="text-slate-400 text-xs mt-0.5">{careerStats.type}</p>
                                                                    </div>
                                                                    <div className="flex gap-2 shrink-0">
                                                                        <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded text-xs font-bold border border-indigo-500/30">First Spell</span>
                                                                    </div>
                                                                </div>

                                                                {/* Career Stats Grid */}
                                                                <div className="mt-3 pt-3 border-t border-indigo-500/20 grid grid-cols-3 gap-2">
                                                                    <div className="text-center bg-indigo-950/30 rounded-lg py-1.5 border border-indigo-500/10">
                                                                        <p className="text-indigo-300/70 text-[9px] uppercase tracking-wider font-bold mb-0.5">Mat</p>
                                                                        <p className="text-indigo-100 font-bold text-xs">{careerStats.matches}</p>
                                                                    </div>
                                                                    <div className="text-center bg-indigo-950/30 rounded-lg py-1.5 border border-indigo-500/10">
                                                                        <p className="text-indigo-300/70 text-[9px] uppercase tracking-wider font-bold mb-0.5">Wkts</p>
                                                                        <p className="text-indigo-100 font-bold text-xs">{careerStats.wickets}</p>
                                                                    </div>
                                                                    <div className="text-center bg-indigo-950/30 rounded-lg py-1.5 border border-indigo-500/10">
                                                                        <p className="text-indigo-300/70 text-[9px] uppercase tracking-wider font-bold mb-0.5">Econ</p>
                                                                        <p className="text-indigo-100 font-bold text-xs">{careerStats.economy}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Matchups against current batsmen */}
                                                                <div className="mt-4 space-y-2">
                                                                    <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Historical Matchups</p>
                                                                    {currentBatsmen.map(bat => {
                                                                        const m = matchupCache[`${bowlerIntro.bowler}-${bat}`];
                                                                        if (!m || m.balls === 0) return null;
                                                                        return (
                                                                            <div key={bat} className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/60">
                                                                                <div className="flex justify-between items-center mb-2">
                                                                                    <span className="text-indigo-300 text-xs font-bold">{bat}</span>
                                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.outs > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                                                        OUT: {m.outs}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="grid grid-cols-4 gap-1 text-center">
                                                                                    <div>
                                                                                        <p className="text-slate-500 text-[8px] uppercase">Runs</p>
                                                                                        <p className="text-white text-xs font-bold">{m.runs}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-slate-500 text-[8px] uppercase">Balls</p>
                                                                                        <p className="text-white text-xs font-bold">{m.balls}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-slate-500 text-[8px] uppercase">SR</p>
                                                                                        <p className="text-indigo-300 text-xs font-bold">{m.strikeRate}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-slate-500 text-[8px] uppercase">4s/6s</p>
                                                                                        <p className="text-white text-xs font-bold">{m.fours}/{m.sixes}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                    {/* Batsman struggle analysis card */}
                                                    {struggle && (
                                                        <div className="bg-gradient-to-r from-red-500/8 via-orange-500/8 to-red-500/8 border border-orange-500/30 rounded-xl p-4 my-3 shadow-lg relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-orange-400 to-red-400"></div>
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <span className="text-orange-300 text-xs">⚠️</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-orange-300 text-[10px] uppercase tracking-widest font-bold mb-1">Struggle Alert</p>
                                                                    <p className="text-slate-300 text-xs">
                                                                        <span className="text-white font-bold">{struggle.batsman}</span> is struggling against <span className="text-white font-bold hover:text-orange-300 cursor-pointer transition-colors" onClick={() => setSelectedBowler({ name: struggle.bowler, inning: b.inning })}>{struggle.bowler}</span>
                                                                    </p>
                                                                    <div className="flex gap-3 mt-2 text-[10px]">
                                                                        <div className="bg-slate-800/80 rounded px-2 py-1">
                                                                            <span className="text-slate-500">R(B) </span><span className="text-white font-bold">{struggle.runs}({struggle.balls})</span>
                                                                        </div>
                                                                        <div className="bg-slate-800/80 rounded px-2 py-1">
                                                                            <span className="text-slate-500">SR </span><span className="text-red-400 font-bold">{struggle.sr}</span>
                                                                        </div>
                                                                        <div className="bg-slate-800/80 rounded px-2 py-1">
                                                                            <span className="text-slate-500">Dots </span><span className="text-orange-400 font-bold">{struggle.dots}</span>
                                                                        </div>
                                                                        {(struggle.fours + struggle.sixes) > 0 && (
                                                                            <div className="bg-slate-800/80 rounded px-2 py-1">
                                                                                <span className="text-slate-500">Boundaries </span><span className="text-blue-400 font-bold">{struggle.fours + struggle.sixes}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        });
                                    })()}

                                </div>
                            ) : (
                                <p className="text-slate-600 text-sm italic py-6 text-center">Commentary will appear once play begins.</p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ════════════════════════════════════════════
                    TAB: LINEUPS
                   ════════════════════════════════════════════ */}
                {activeTab === "lineups" && (
                    <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                        <SquadsList match={match} />
                    </div>
                )}
            </div>

            {/* ── Batsman Detail Popup ── */}
            {selectedBatsman && (
                <BatsmanDetailPopup
                    batsmanName={selectedBatsman.name}
                    allBalls={sortedBalls}
                    inning={selectedBatsman.inning}
                    batStat={
                        (selectedBatsman.inning === 1 ? bat1Stats : bat2Stats).find(s => s.name === selectedBatsman.name)
                        || { name: selectedBatsman.name, runs: 0, balls: 0, fours: 0, sixes: 0, sr: "0.00", isOut: false, dismissalText: "" }
                    }
                    teamName={selectedBatsman.inning === 1 ? match.homeTeam.name : match.awayTeam.name}
                    teamPlayers={(
                        (selectedBatsman.inning === 1 ? match.homeTeam : match.awayTeam).players || []
                    ).map((p: any) => ({
                        name: typeof p === "string" ? p : p.name,
                        role: typeof p === "string" ? undefined : p.role,
                        photo: typeof p === "string" ? undefined : p.photo,
                    }))}
                    onClose={() => setSelectedBatsman(null)}
                />
            )}

            {/* Bowler Detail Popup */}
            {selectedBowler && (
                <BowlerDetailPopup
                    bowlerName={selectedBowler.name}
                    allBalls={balls}
                    inning={selectedBowler.inning}
                    bowlStat={(() => {
                        const innBalls = balls.filter(b => b.inning === selectedBowler.inning);
                        const stats = computeBowlerStats(innBalls);
                        return stats.find(s => s.name === selectedBowler.name) || {
                            name: selectedBowler.name, overs: "0.0", maidens: 0, runs: 0, wickets: 0, economy: "0.00", legalBalls: 0
                        };
                    })()}
                    teamName={selectedBowler.inning === 1 ? match.awayTeam.name : match.homeTeam.name}
                    teamPlayers={((selectedBowler.inning === 1 ? match.awayTeam.players : match.homeTeam.players) || []).map((p: any) => ({
                        name: typeof p === "string" ? p : p.name,
                        role: typeof p === "string" ? undefined : p.role,
                        photo: typeof p === "string" ? undefined : p.photo,
                    }))}
                    onClose={() => setSelectedBowler(null)}
                />
            )}
        </div>
    );
};

/* ── Sub-Component: Innings Scorecard ── */
const InningsScorecard = ({ inning, teamName, teamLogo, score, batStats, bowlStats, balls, teamPlayers, onBatsmanClick, onBowlerClick }: {
    inning: number; teamName: string; teamLogo?: string;
    score: { runs: number; wickets: number; overs: number };
    batStats: BatsmanStat[]; bowlStats: BowlerStat[]; balls: Ball[];
    teamPlayers?: any[];
    onBatsmanClick?: (name: string) => void;
    onBowlerClick?: (name: string) => void;
}) => {
    const totalExtras = balls.reduce((s, b) => s + (b.extraRuns || 0), 0);
    const wides = balls.filter(b => b.extraType === "wide").length;
    const noballs = balls.filter(b => b.extraType === "noball").length;
    const byes = balls.filter(b => b.extraType === "bye").reduce((s, b) => s + b.runs, 0);
    const legbyes = balls.filter(b => b.extraType === "legbye").reduce((s, b) => s + b.runs, 0);

    const fow = balls.filter(b => b.wicket?.isWicket).map(b => {
        const currentRuns = balls.filter(x => x.over < b.over || (x.over === b.over && x.ball <= b.ball)).reduce((sum, x) => sum + x.totalBallRuns, 0);
        const wktNum = balls.filter(x => x.wicket?.isWicket && (x.over < b.over || (x.over === b.over && x.ball <= b.ball))).length;
        const pName = b.wicket?.playerOut || b.batsman || "Unknown";
        return `${currentRuns}-${wktNum} (${pName}, ${b.over}.${b.ball})`;
    });

    const battedOrBatting = new Set(batStats.map(bs => bs.name));
    const yetToBat = (teamPlayers || [])
        .map(p => typeof p === 'string' ? p : p.name)
        .filter(name => name && !battedOrBatting.has(name));

    return (
        <Card className="bg-slate-900 border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800/60 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
                        {teamLogo ? <img src={teamLogo} className="w-full h-full object-cover" /> : <Shield size={16} className="text-blue-400" />}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">{teamName} — Innings {inning}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-white font-black text-xl">{score.runs}/{score.wickets}</p>
                    <p className="text-slate-500 text-xs">{typeof score.overs === 'number' ? score.overs.toFixed(1) : (score as any).overs || "0.0"} ov</p>
                </div>
            </div>

            <CardContent className="p-0">
                {/* Batting */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500 text-xs bg-slate-800/30">
                                <th className="text-left py-2 pl-4 font-medium">Batter</th>
                                <th className="text-center py-2 font-medium">R</th>
                                <th className="text-center py-2 font-medium">B</th>
                                <th className="text-center py-2 font-medium">4s</th>
                                <th className="text-center py-2 font-medium">6s</th>
                                <th className="text-center py-2 pr-4 font-medium">SR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batStats.map(b => (
                                <tr key={b.name} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => onBatsmanClick?.(b.name)}>
                                    <td className="py-2.5 pl-4">
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-medium text-sm hover:text-blue-400 transition-colors">{b.name}</p>
                                            {!b.isOut && <span className="text-[10px] text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">*</span>}
                                        </div>
                                        <p className="text-slate-500 text-[11px]">{b.isOut ? b.dismissalText : "batting"}</p>
                                    </td>
                                    <td className="text-center text-white font-bold">{b.runs}</td>
                                    <td className="text-center text-slate-400">{b.balls}</td>
                                    <td className="text-center text-blue-400">{b.fours}</td>
                                    <td className="text-center text-purple-400">{b.sixes}</td>
                                    <td className="text-center text-green-400 pr-4">{b.sr}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Extras */}
                <div className="px-4 py-2 bg-slate-800/20 border-t border-b border-slate-800/40 text-xs text-slate-400 flex items-center justify-between">
                    <span>Extras: <span className="text-white font-medium">{totalExtras}</span></span>
                    <span>(WD {wides}, NB {noballs}, B {byes}, LB {legbyes})</span>
                </div>

                {/* Fall of Wickets */}
                {fow.length > 0 && (
                    <div className="px-4 py-3 bg-slate-800/20 border-b border-slate-800/40">
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mx-2 mb-1.5">Fall of Wickets</p>
                        <p className="text-slate-300 text-sm leading-relaxed mx-2">
                            {fow.join(", ")}
                        </p>
                    </div>
                )}

                {/* Yet to Bat */}
                {yetToBat.length > 0 && (
                    <div className="px-4 py-3 bg-slate-800/10 border-b border-slate-800/40">
                        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mx-2 mb-1.5">Yet to Bat</p>
                        <p className="text-slate-400 text-sm mx-2">
                            {yetToBat.join(", ")}
                        </p>
                    </div>
                )}

                {/* Bowling */}
                <div className="px-4 py-2 bg-slate-800/30">
                    <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 font-medium">Bowling</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-slate-500 text-xs bg-slate-800/20">
                                <th className="text-left py-2 pl-4 font-medium">Bowler</th>
                                <th className="text-center py-2 font-medium">O</th>
                                <th className="text-center py-2 font-medium">R</th>
                                <th className="text-center py-2 font-medium">W</th>
                                <th className="text-center py-2 pr-4 font-medium">Econ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bowlStats.map(b => (
                                <tr key={b.name} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => onBowlerClick?.(b.name)}>
                                    <td className="py-2.5 pl-4 text-white font-medium hover:text-blue-400 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onBowlerClick?.(b.name); }}>
                                        {b.name}
                                    </td>
                                    <td className="text-center text-slate-300">{b.overs}</td>
                                    <td className="text-center text-slate-300">{b.runs}</td>
                                    <td className="text-center text-red-400 font-bold">{b.wickets}</td>
                                    <td className="text-center text-amber-400 pr-4">{b.economy}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

/* ── Sub-Component: Team Lineup (grouped by role) ── */
const ROLE_ORDER: PlayerRole[] = ["Wicket Keeper", "Batsman", "All-Rounder", "Bowler"];
const ROLE_CFG: Record<string, { bg: string; text: string; border: string; icon: string; tag: string }> = {
    "Batsman": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", icon: "🏏", tag: "BAT" },
    "Bowler": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: "🎯", tag: "BOWL" },
    "All-Rounder": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", icon: "⭐", tag: "AR" },
    "Wicket Keeper": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", icon: "🧤", tag: "WK" },
};

const DEFAULT_ROLE_CFG = { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", icon: "👤", tag: "PLAYER" };

const TeamLineup = ({ team, color, impactInfo }: { team: any; color: "blue" | "red"; impactInfo?: { playerOut: string, playerIn: string } }) => {
    const gradient = color === "blue" ? "from-blue-600/20 to-indigo-600/20" : "from-red-600/20 to-pink-600/20";
    const borderColor = color === "blue" ? "border-blue-500/30" : "border-red-500/30";
    const iconColor = color === "blue" ? "text-blue-400" : "text-red-400";

    const players = team.players || [];
    const grouped: Record<string, string[]> = { "Batsman": [], "Bowler": [], "All-Rounder": [], "Wicket Keeper": [] };
    players.forEach((p: any) => {
        const name = getPlayerName(p);
        const role = getPlayerRole(p);
        if (!grouped[role]) grouped[role] = [];
        grouped[role].push(name);
    });

    const activeRoles = Object.keys(grouped).filter(r => grouped[r].length > 0).sort((a, b) => {
        const idxA = ROLE_ORDER.indexOf(a as PlayerRole);
        const idxB = ROLE_ORDER.indexOf(b as PlayerRole);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    return (
        <Card className={`bg-slate-900 border-slate-700 overflow-hidden`}>
            <div className={`bg-gradient-to-r ${gradient} px-4 py-3 border-b ${borderColor} flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                    {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Shield className={`${iconColor} w-5 h-5`} />}
                </div>
                <div>
                    <p className="text-white font-bold">{team.name}</p>
                    {team.captain && <p className="text-yellow-400 text-xs flex items-center gap-1"><Crown size={10} /> {team.captain}</p>}
                </div>
                <span className="ml-auto text-xs text-slate-500">{players.length} players</span>
            </div>
            <CardContent className="p-3 space-y-3">
                {players.length > 0 ? (
                    activeRoles.map(role => {
                        const rolePlayers = grouped[role];
                        const rc = ROLE_CFG[role] || DEFAULT_ROLE_CFG;
                        return (
                            <div key={role}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={`text-xs font-semibold ${rc.text} flex items-center gap-1`}>
                                        <span>{rc.icon}</span> {role}s
                                    </span>
                                    <span className="text-[10px] text-slate-600">({rolePlayers.length})</span>
                                </div>
                                <div className="space-y-1">
                                    {rolePlayers.map((pName, idx) => (
                                        <div key={pName} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${rc.bg} border ${rc.border} hover:brightness-110 transition-colors ${pName === impactInfo?.playerOut ? 'opacity-50' : ''}`}>
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-slate-800/60 ${rc.text}`}>
                                                {idx + 1}
                                            </span>
                                            <span className={`text-white text-sm font-medium flex-1 truncate ${pName === impactInfo?.playerOut ? 'line-through text-slate-400' : ''}`}>{pName}</span>
                                            {pName === team.captain && <Crown size={11} className="text-yellow-400" />}
                                            {pName === impactInfo?.playerIn && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">IMPACT</span>}
                                            {pName === impactInfo?.playerOut && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/30">OUT</span>}
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${rc.bg} ${rc.text} border ${rc.border}`}>{rc.tag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-slate-500 text-sm text-center py-6">No lineup available</p>
                )}
            </CardContent>
        </Card>
    );
};

export default LiveMatchViewer;
