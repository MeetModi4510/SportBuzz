import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Shield, Zap, User, ArrowLeftRight, Activity, RotateCcw, CheckCircle,
    XCircle, ChevronLeft, Crown, Users, ChevronRight, Check
} from "lucide-react";
import { customMatchApi } from "@/services/api";
import { Match, Ball, getPlayerName } from "@/data/scoringTypes";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

/* ─── Types ────────────────────────────────────────────────── */
type Phase = "lineup" | "toss" | "scoring";

/* ─── Component ────────────────────────────────────────────── */
const ScoringPanel = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    /* Match & ball data */
    const [match, setMatch] = useState<Match | null>(null);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /* Pre-match flow */
    const [phase, setPhase] = useState<Phase>("lineup");

    /* Lineup selection: playing-XI per team */
    const [homeSquad, setHomeSquad] = useState<string[]>([]);
    const [awaySquad, setAwaySquad] = useState<string[]>([]);
    const [homeLineup, setHomeLineup] = useState<string[]>([]);
    const [awayLineup, setAwayLineup] = useState<string[]>([]);

    /* Toss */
    const [tossWinner, setTossWinner] = useState<"home" | "away">("home");
    const [tossDecision, setTossDecision] = useState<"Batting" | "Bowling">("Batting");

    /* Scoring state */
    const [striker, setStriker] = useState("");
    const [nonStriker, setNonStriker] = useState("");
    const [bowler, setBowler] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    /* Bowler tracking for consecutive-over prevention */
    const [lastOverBowler, setLastOverBowler] = useState("");

    /* Dialogs */
    const [showWicketDialog, setShowWicketDialog] = useState(false);
    const [wicketType, setWicketType] = useState("bowled");
    const [wicketRuns, setWicketRuns] = useState(0);
    const [fielder, setFielder] = useState("");
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [showNewBatsmanDialog, setShowNewBatsmanDialog] = useState(false);
    const [showNewBowlerDialog, setShowNewBowlerDialog] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);
    const [newBatsman, setNewBatsman] = useState("");
    const [newBowler, setNewBowler] = useState("");

    /* Already used batsmen/bowlers this innings */
    const [usedBatsmen, setUsedBatsmen] = useState<string[]>([]);

    /* Session Control */
    const [isSessionBreak, setIsSessionBreak] = useState(false);

    /* Impact Player Control */
    const [impactTeam, setImpactTeam] = useState<"home" | "away" | null>(null);
    const [impactOut, setImpactOut] = useState("");
    const [impactIn, setImpactIn] = useState("");

    /* Dropped Catch Tracking */
    const [isDroppedCatch, setIsDroppedCatch] = useState(false);
    const [showDroppedCatchDialog, setShowDroppedCatchDialog] = useState(false);
    const [droppedFielder, setDroppedFielder] = useState("");

    /* Extras Run Selection */
    const [showExtraRunsDialog, setShowExtraRunsDialog] = useState(false);
    const [pendingExtraType, setPendingExtraType] = useState<string | null>(null);
    const [noBallRunType, setNoBallRunType] = useState<"bat" | "extra">("bat");
    const [isInningsStartPending, setIsInningsStartPending] = useState(false);

    /* Wagon Wheel Direction Picker */
    const [showWagonWheelPicker, setShowWagonWheelPicker] = useState(false);
    const [pendingShotRuns, setPendingShotRuns] = useState(0);

    /* ─── Fetch ──────────────────────────────────────────────── */
    useEffect(() => { if (id) fetchMatchDetails(); }, [id]);

    const fetchMatchDetails = async (skipDerive = false) => {
        try {
            const [matchRes, ballsRes] = await Promise.all([
                customMatchApi.getById(id!),
                customMatchApi.getBalls(id!)
            ]);
            const m = matchRes.data;
            setMatch(m);
            setBalls(ballsRes.data || []);

            /* Populate squads – handle both string[] and PlayerEntry[] */
            setHomeSquad((m.homeTeam.players || []).map(getPlayerName));
            setAwaySquad((m.awayTeam.players || []).map(getPlayerName));

            // Populate lineups from saved data if available, else from squad (limit to 11)
            const savedHomeLineup = m.homeLineup && m.homeLineup.length > 0
                ? m.homeLineup
                : (m.homeTeam.players || []).map(getPlayerName).filter(Boolean).slice(0, 11);

            const savedAwayLineup = m.awayLineup && m.awayLineup.length > 0
                ? m.awayLineup
                : (m.awayTeam.players || []).map(getPlayerName).filter(Boolean).slice(0, 11);

            setHomeLineup(savedHomeLineup);
            setAwayLineup(savedAwayLineup);

            /* If match already Live/Completed, jump straight to scoring */
            if (m.status === "Live" || m.status === "Completed") {
                setPhase("scoring");
                if (!skipDerive) derivePlayersFromBalls(m, ballsRes.data || []);
            }
        } catch (err: any) {
            console.error("Failed to load match:", err);
            toast.error("Failed to load match: " + (err.message || 'Unknown error'));
            navigate("/admin");
        } finally {
            setIsLoading(false);
        }
    };

    /* When resuming a live match, derive current striker/bowler from recorded balls */
    const derivePlayersFromBalls = (m: Match, ballsData: Ball[]) => {
        const inningBalls = ballsData.filter(b => b.inning === m.currentInnings);
        if (inningBalls.length > 0) {
            const last = inningBalls[inningBalls.length - 1];
            setStriker(last.batsman);
            setNonStriker(last.nonStriker || "");
            setBowler(last.bowler);

            /* Track unique batsmen */
            const batsmen = [...new Set(inningBalls.flatMap(b => [b.batsman, b.nonStriker].filter(Boolean)))];
            setUsedBatsmen(batsmen as string[]);
        }
    };

    /* ─── Derived state ──────────────────────────────────────── */
    const currentScore = match ? (match.currentInnings === 1 ? match.score.team1 : match.score.team2) : null;
    const totalLegalBalls = useMemo(() => {
        if (!match) return 0;
        return balls.filter(b =>
            b.inning === match.currentInnings &&
            !b.isCommentaryOnly &&
            b.extraType !== "wide" &&
            b.extraType !== "noball"
        ).length;
    }, [balls, match]);

    const maxOversForFormat = match?.tournament?.overs || 20;
    const currentOver = Math.min(Math.floor(totalLegalBalls / 6), maxOversForFormat - 1);
    const currentBallInOver = totalLegalBalls >= maxOversForFormat * 6 ? 6 : totalLegalBalls % 6;
    const displayOvers = totalLegalBalls >= maxOversForFormat * 6 ? `${maxOversForFormat}.0` : `${currentOver}.${currentBallInOver}`;

    const crr = currentScore && totalLegalBalls > 0 ? (currentScore.runs / (totalLegalBalls / 6)).toFixed(2) : "0.00";

    let rrr = "--";
    let target = 0;
    if (match && match.currentInnings === 2) {
        target = match.score.team1.runs + 1;
        const remaining = target - match.score.team2.runs;
        const oversLeft = match.tournament?.overs ? (match.tournament.overs * 6 - totalLegalBalls) / 6 : (20 * 6 - totalLegalBalls) / 6;
        if (remaining <= 0) rrr = "0.00";
        else if (oversLeft > 0) rrr = (remaining / oversLeft).toFixed(2);
    }

    /* Batting & bowling teams (determined by toss in Phase 1, or by currentInnings) */
    const battingTeam = match ? (match.currentInnings === 1 ? match.homeTeam : match.awayTeam) : null;
    const bowlingTeam = match ? (match.currentInnings === 1 ? match.awayTeam : match.homeTeam) : null;

    /* Available batsmen = lineup players who haven't been dismissed */
    const dismissedBatsmen = useMemo(() => {
        if (!match) return [];
        return balls.filter(b => b.inning === match.currentInnings && b.wicket?.isWicket).map(b => b.wicket?.playerOut || b.batsman);
    }, [balls, match]);

    const getActivePlayingXI = useCallback((lineup: string[], teamKey: 'team1' | 'team2') => {
        // Lineup already contains the selected playing XI (max 11)
        let activeXI = [...lineup];
        const impact = match?.impactPlayers?.[teamKey];
        if (impact?.playerOut && impact?.playerIn) {
            activeXI = activeXI.filter(p => p !== impact.playerOut);
            if (!activeXI.includes(impact.playerIn)) {
                activeXI.push(impact.playerIn);
            }
        }
        return activeXI;
    }, [match]);

    const activeHomeLineup = useMemo(() => getActivePlayingXI(homeLineup, 'team1'), [homeLineup, getActivePlayingXI]);
    const activeAwayLineup = useMemo(() => getActivePlayingXI(awayLineup, 'team2'), [awayLineup, getActivePlayingXI]);

    const battingLineup = match?.currentInnings === 1 ? activeHomeLineup : activeAwayLineup;
    const bowlingLineup = match?.currentInnings === 1 ? activeAwayLineup : activeHomeLineup;

    const availableBatsmen = battingLineup.filter(p => !dismissedBatsmen.includes(p) && p !== striker && p !== nonStriker);
    const availableBowlers = bowlingLineup.filter(p => p !== lastOverBowler);

    /* This over balls */
    const thisOverBalls = useMemo(() => {
        if (!match) return [];
        const inningBalls = balls.filter(b => b.inning === match.currentInnings && !b.isCommentaryOnly);
        /* Count only legal deliveries to find current over's balls */
        let legalCount = 0;
        let overStartIdx = 0;
        for (let i = 0; i < inningBalls.length; i++) {
            if (legalCount >= currentOver * 6 && overStartIdx === 0 && currentOver > 0) {
                overStartIdx = i;
            }
            if (inningBalls[i].extraType !== "wide" && inningBalls[i].extraType !== "noball") {
                legalCount++;
            }
        }
        /* Get balls from current over (including extras) */
        return inningBalls.filter(b => b.over === currentOver);
    }, [balls, match, currentOver]);

    /* ─── Auto-save lineups ────────────────────────────────── */
    useEffect(() => {
        if (phase === "lineup" && match && (homeLineup.length > 0 || awayLineup.length > 0)) {
            const saveTimeout = setTimeout(async () => {
                try {
                    await customMatchApi.update(match._id, {
                        homeLineup,
                        awayLineup
                    });
                } catch (err) {
                    console.error("Failed to auto-save lineups:", err);
                }
            }, 1000); // 1-second debounce
            return () => clearTimeout(saveTimeout);
        }
    }, [homeLineup, awayLineup, phase, match]);

    /* ─── Lineup toggle ──────────────────────────────────────── */
    const togglePlayer = (player: string, team: "home" | "away") => {
        const setter = team === "home" ? setHomeLineup : setAwayLineup;
        const current = team === "home" ? homeLineup : awayLineup;
        if (current.includes(player)) {
            setter(current.filter(p => p !== player));
        } else {
            if (current.length < 11) setter([...current, player]);
            else toast.error("Maximum 11 players per lineup");
        }
    };

    /* ─── Toss & Start ───────────────────────────────────────── */
    const handleStartMatch = async () => {
        if (!match) return;

        /* Determine who bats first based on toss */
        const tossWinTeamId = tossWinner === "home" ? match.homeTeam._id : match.awayTeam._id;

        /* If toss winner chose batting, they bat first (innings 1) 
           We need to rearrange lineups based on toss:
           - If home won toss & chose batting => home lineup = batting (innings 1 = home team)  ✓ (default)
           - If home won toss & chose bowling => away lineup = batting → need to swap currentInnings mapping
           - If away won toss & chose batting => away bats first → swap
           - If away won toss & chose bowling => home bats first ✓ (default)
        */
        let battingFirst: "home" | "away";
        if (tossWinner === "home") {
            battingFirst = tossDecision === "Batting" ? "home" : "away";
        } else {
            battingFirst = tossDecision === "Batting" ? "away" : "home";
        }

        /* If away bats first, we need to swap teams - but our model always has homeTeam as innings1.
           Instead, we store toss info and track which team bats first.
           For simplicity, if away bats first, set currentInnings concept:
           We'll update the match with toss info. The homeTeam = innings 1 by convention. */

        try {
            await customMatchApi.update(match._id, {
                status: "Live",
                toss: { win: tossWinTeamId, decision: tossDecision },
                homeLineup: homeLineup,
                awayLineup: awayLineup
            });

            /* Set initial batsmen from batting lineup */
            const batLineup = battingFirst === "home" ? homeLineup : awayLineup;
            if (batLineup.length >= 2) {
                setStriker(batLineup[0]);
                setNonStriker(batLineup[1]);
                setUsedBatsmen([batLineup[0], batLineup[1]]);
            }

            toast.success("Match started! 🏏");
            setPhase("scoring");
            setIsInningsStartPending(true); // Mark as pending to allow verifying openers before commentary
            await fetchMatchDetails();

            // Post walk-out commentary for the start of the match
            try {
                const batTeamName = battingFirst === "home" ? (typeof match.homeTeam === 'object' ? match.homeTeam?.name : "Home") : (typeof match.awayTeam === 'object' ? match.awayTeam?.name : "Away");
                const phaseInning = match.currentInnings || 1;
                const walkMsg = `————— INNINGS ${phaseInning} BEGINS —————\nThe ${batTeamName} openers ${batLineup[0]} and ${batLineup[1]} walk out to the middle. The umpires signal the start of play! \uD83C\uDFCF`;
                await customMatchApi.recordCommentaryBall(match._id, walkMsg, phaseInning, 0, 0);
            } catch { /* silently ignore commentary failure */ }
        } catch {
            toast.error("Failed to start match");
        }
    };

    /* ─── Ball recording ─────────────────────────────────────── */
    const handleRecordBall = async (runs: number, extra: string = "none", isWicket: boolean = false, shotDir?: string) => {
        if (!match || isRecording) return;
        if (!striker || !bowler) {
            toast.error("Please select striker and bowler before scoring");
            return;
        }

        setIsRecording(true);
        const isLegal = extra === "none" || extra === "bye" || extra === "legbye";
        
        let finalRuns = runs;
        let finalExtraRuns = (extra === "wide" || extra === "noball") ? 1 : 0;

        // If it's a no-ball and user selected "Bye/Legbye", runs go to extras
        if (extra === "noball" && noBallRunType === "extra") {
            finalExtraRuns += runs;
            finalRuns = 0;
        }

        const ballNumber = isLegal ? currentBallInOver + 1 : currentBallInOver;

        try {
            const ballData: any = {
                inning: match.currentInnings,
                over: currentOver,
                ball: ballNumber,
                batsman: striker,
                bowler: bowler,
                nonStriker: nonStriker,
                runs: finalRuns,
                extraType: extra,
                extraRuns: finalExtraRuns,
                wicket: isWicket ? { isWicket: true, type: wicketType, playerOut: striker, batsman: striker, fielder: (wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped') ? fielder : undefined } : { isWicket: false },
                totalBallRuns: finalRuns + finalExtraRuns,
                isDroppedCatch: isDroppedCatch,
                droppedFielder: isDroppedCatch ? droppedFielder : undefined,
                shotDirection: shotDir || null
            };

            const response: any = await customMatchApi.recordBall(match._id, ballData);

            if (response) {
                setBalls(prev => [...prev, response.data || response]);
                await fetchMatchDetails(true); // skip derive to keep local striker/nonStriker state
                setIsDroppedCatch(false); // Reset dropped catch
                setDroppedFielder(""); // Reset dropped fielder

                /* Strike rotation and Over check */
                let overEnded = false;
                
                // Strike rotation: swap if odd runs are scored (including extras like WD+1, NB+3)
                if (runs % 2 !== 0) swapStrike();

                // Over check only applies to legal deliveries (Normal, Bye, Leg-Bye)
                if (extra === "none" || extra === "bye" || extra === "legbye") {
                    if (currentBallInOver + 1 >= 6) overEnded = true;
                }

                /* Target reached check (2nd innings) */
                const isTargetReached = match.currentInnings === 2 && (match.score.team2.runs + finalRuns + finalExtraRuns) >= (match.score.team1.runs + 1);
                if (isTargetReached) {
                    toast.success("Target reached!");
                    handleEndMatch();
                    return;
                }

                /* Wicket handling */
                let isAllOut = false;
                if (isWicket) {
                    setShowWicketDialog(false);
                    setWicketType("bowled");
                    setWicketRuns(0);
                    setFielder("");

                    /* Check if all out */
                    const totalWickets = (currentScore?.wickets || 0) + 1;
                    if (totalWickets >= (battingLineup.length - 1)) {
                        isAllOut = true;
                        toast.info("All out!");
                        if (match.currentInnings === 1) {
                            handleEndInnings();
                        } else {
                            handleEndMatch();
                        }
                    } else {
                        setShowNewBatsmanDialog(true);
                    }
                }

                /* End of Over Limits & Break Logic */
                if (overEnded && !isAllOut) {
                    setLastOverBowler(bowler);
                    swapStrike(); // end of over swap

                    const currentTotalOvers = currentOver + 1;
                    const matchType = match.tournament?.matchType || 'T20';

                    if (matchType === 'Test') {
                        const sessionOvers = match.tournament?.oversPerSession || 30;
                        if (currentTotalOvers > 0 && currentTotalOvers % sessionOvers === 0) {
                            handleSessionBreak();
                        } else if (!isWicket) {
                            setShowNewBowlerDialog(true);
                        }
                    } else if (matchType !== 'Custom') {
                        const maxOvers = match.tournament?.overs || 20;
                        if (currentTotalOvers >= maxOvers) {
                            toast.info(`Innings ended! ${maxOvers} overs completed.`);
                            if (match.currentInnings === 1) {
                                handleEndInnings();
                            } else {
                                handleEndMatch();
                            }
                        } else if (!isWicket) {
                            setShowNewBowlerDialog(true);
                        }
                    } else {
                        // Fallback generic logic
                        if (!isWicket) setShowNewBowlerDialog(true);
                    }
                }
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || "Failed to record ball";
            toast.error(msg);
        } finally {
            setIsRecording(false);
        }
    };

    const handleExtraClick = (type: string) => {
        setPendingExtraType(type);
        setShowExtraRunsDialog(true);
    };

    const handleConfirmExtraRuns = (runs: number) => {
        if (pendingExtraType) {
            handleRecordBall(runs, pendingExtraType);
            setPendingExtraType(null);
            setNoBallRunType("bat");
            setShowExtraRunsDialog(false);
        }
    };

    const swapStrike = () => {
        const s = striker;
        const ns = nonStriker;
        setStriker(ns);
        setNonStriker(s);
    };

    const confirmNewBatsman = () => {
        if (!newBatsman) { toast.error("Select a batsman"); return; }
        setStriker(newBatsman);
        setUsedBatsmen(prev => [...prev, newBatsman]);
        setNewBatsman("");
        setShowNewBatsmanDialog(false);

        // Post commentary when a new batsman walks in at start of innings 2
        if (match && match.currentInnings === 2 && usedBatsmen.length <= 1) {
            const batTeamName = match.currentInnings === 2 ? (typeof match.awayTeam === 'object' ? match.awayTeam?.name : "Away") : (typeof match.homeTeam === 'object' ? match.homeTeam?.name : "Home");
            const target = match.score.team1.runs + 1;
            const ns = nonStriker || newBatsman;
            const str = newBatsman;
            const walkMsg = `————— INNINGS 2 BEGINS —————\n${batTeamName} need ${target} runs to win! ${str} and ${ns} stride out to the middle to begin the chase. \uD83C\uDFCF`;
            customMatchApi.recordCommentaryBall(match._id, walkMsg, 2, 0, 0).catch(() => { });
        }
    };

    const confirmNewBowler = () => {
        if (!newBowler) { toast.error("Select a bowler"); return; }
        setBowler(newBowler);
        setNewBowler("");
        setShowNewBowlerDialog(false);
    };

    const handleSessionBreak = async () => {
        if (!match) return;
        try {
            const currentDay = match.testDay || 1;
            const currentSession = match.testSession || 1;

            let nextDay = currentDay;
            let nextSession = currentSession + 1;
            let message = "Lunch Break 🍽️";

            if (currentSession === 2) {
                message = "Tea Break ☕";
            } else if (currentSession >= 3) {
                message = `Stumps Day ${currentDay} 🌙`;
                nextDay = currentDay + 1;
                nextSession = 1;
            }

            await customMatchApi.update(match._id, {
                testDay: nextDay,
                testSession: nextSession
            });

            const teamScore = match.currentInnings === 1 ? match.score.team1 : match.score.team2;
            const detailedMessage = `SESSION SUMMARY: ${message.toUpperCase()} • Score: ${teamScore.runs}/${teamScore.wickets} in ${displayOvers} overs • CRR: ${crr}`;

            await customMatchApi.recordCommentaryBall(match._id, detailedMessage, match.currentInnings, currentOver, currentBallInOver);
            toast.success("Detailed Session Summary published to commentary");

            setIsSessionBreak(true);
            await fetchMatchDetails(true);
        } catch {
            toast.error("Failed to update session state");
        }
    };

    const handleImpactSubstitution = async () => {
        if (!match || !impactTeam || !impactOut || !impactIn) return;
        try {
            const teamKey = impactTeam === "home" ? "team1" : "team2";
            const updatedImpact = {
                ...(match.impactPlayers || {}),
                [teamKey]: { playerOut: impactOut, playerIn: impactIn }
            };

            await customMatchApi.update(match._id, {
                impactPlayers: updatedImpact
            });

            const teamName = impactTeam === "home" ? (typeof match.homeTeam === 'object' ? match.homeTeam?.name : "Home") : (typeof match.awayTeam === 'object' ? match.awayTeam?.name : "Away");
            const msg = `IMPACT PLAYER SUBSTITUTION (${teamName}): ${impactIn} replaces ${impactOut} in the Playing XI.`;
            await customMatchApi.recordCommentaryBall(match._id, msg, match.currentInnings, currentOver, currentBallInOver);

            toast.success(`Impact Player ${impactIn} subbed in successfully!`);
            setImpactTeam(null);
            setImpactOut("");
            setImpactIn("");
            await fetchMatchDetails(true);
        } catch {
            toast.error("Failed to process Impact substitution");
        }
    };

    const handleStartNewSession = async () => {
        if (!match) return;
        const msgs = [
            `The umpires are making their way to the middle for Day ${match.testDay}, Session ${match.testSession}.`,
            `Players walk out to the center. It's time for the next session to begin!`,
            `We are back for live action in this Test Match! The fielding team is spreading out.`,
            `Ready for the next session! The batting duo marches to the pitch.`
        ];
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];

        try {
            await customMatchApi.recordCommentaryBall(match._id, randomMsg, match.currentInnings, currentOver, currentBallInOver);
            setIsSessionBreak(false);
            toast.success("New session started! Commentary published.");
            await fetchMatchDetails(true);
        } catch {
            toast.error("Failed to post session start commentary");
        }
    };

    const publishInningsSummary = async (inningNum: number) => {
        if (!match) return;
        try {
            const battingTeamName = inningNum === 1 ? (typeof match.homeTeam === 'object' ? match.homeTeam?.name : "Home") : (typeof match.awayTeam === 'object' ? match.awayTeam?.name : "Away");
            const bowlingTeamName = inningNum === 1 ? (typeof match.awayTeam === 'object' ? match.awayTeam?.name : "Away") : (typeof match.homeTeam === 'object' ? match.homeTeam?.name : "Home");
            const score = inningNum === 1 ? match.score.team1 : match.score.team2;

            // Calculate overs for summary
            const inningBallsForSummary = balls.filter(b => b.inning === inningNum && !b.isCommentaryOnly);
            const legalBalls = inningBallsForSummary.filter(b => b.extraType !== "wide" && b.extraType !== "noball").length;
            const ovs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

            // Gather detailed stats
            const batsmenRuns: Record<string, { runs: number, balls: number, fours: number, sixes: number }> = {};
            let totalFours = 0, totalSixes = 0, totalExtras = 0, totalDots = 0;
            inningBallsForSummary.forEach(b => {
                if (b.batsman) {
                    if (!batsmenRuns[b.batsman]) batsmenRuns[b.batsman] = { runs: 0, balls: 0, fours: 0, sixes: 0 };
                    if (b.extraType === "none" || b.extraType === "noball") {
                        batsmenRuns[b.batsman].runs += b.runs;
                        if (b.runs === 4) { batsmenRuns[b.batsman].fours++; totalFours++; }
                        if (b.runs === 6) { batsmenRuns[b.batsman].sixes++; totalSixes++; }
                    }
                    if (b.extraType !== "wide") batsmenRuns[b.batsman].balls++;
                    if (b.runs === 0 && b.extraType === "none" && !b.wicket?.isWicket) totalDots++;
                }
                if (b.extraType !== "none") totalExtras += (b.extraRuns || 0);
            });

            const sortedBatsmen = Object.entries(batsmenRuns).sort((a, b) => b[1].runs - a[1].runs);
            const topScorer = sortedBatsmen[0];
            const secondScorer = sortedBatsmen[1];

            // Bowler stats
            const bowlerStats: Record<string, { wickets: number, runs: number, balls: number }> = {};
            inningBallsForSummary.forEach(b => {
                if (b.bowler) {
                    if (!bowlerStats[b.bowler]) bowlerStats[b.bowler] = { wickets: 0, runs: 0, balls: 0 };
                    if (b.wicket?.isWicket && b.wicket.type !== 'runout') bowlerStats[b.bowler].wickets++;
                    bowlerStats[b.bowler].runs += b.runs + (b.extraRuns || 0);
                    if (b.extraType !== "wide" && b.extraType !== "noball") bowlerStats[b.bowler].balls++;
                }
            });
            const topBowler = Object.entries(bowlerStats).sort((a, b) => b[1].wickets - a[1].wickets)[0];

            const crrVal = legalBalls > 0 ? (score.runs / (legalBalls / 6)).toFixed(2) : "0.00";
            const maxOv = match.tournament?.overs || 20;

            // Build flowing narrative
            let narrative = `═══ END OF INNINGS ${inningNum} ═══\n\n`;

            const runRateDesc = parseFloat(crrVal) >= 10 ? 'an explosive' : parseFloat(crrVal) >= 7 ? 'an impressive' : 'a steady';
            narrative += `${battingTeamName} posted a ${score.runs >= 150 ? 'mammoth' : score.runs >= 100 ? 'competitive' : 'modest'} total of ${score.runs}/${score.wickets} in ${ovs} overs, maintaining ${runRateDesc} run rate of ${crrVal} runs per over.`;

            narrative += `\n\n`;
            if (topScorer) {
                const ts = topScorer[1];
                const sr = ts.balls > 0 ? ((ts.runs / ts.balls) * 100).toFixed(0) : "0";
                narrative += `The innings was anchored by ${ts.runs >= 50 ? 'a magnificent' : 'an impactful'} knock from ${topScorer[0]}, who smashed ${ts.runs} runs off ${ts.balls} balls (SR: ${sr})`;
                if (ts.fours > 0 || ts.sixes > 0) {
                    const parts = [];
                    if (ts.fours > 0) parts.push(`${ts.fours} fours`);
                    if (ts.sixes > 0) parts.push(`${ts.sixes} sixes`);
                    narrative += `, featuring ${parts.join(' and ')}`;
                }
                narrative += `. `;
            }

            narrative += `\n\n`;
            if (topBowler) {
                const tb = topBowler[1];
                const bowlerOvers = `${Math.floor(tb.balls / 6)}.${tb.balls % 6}`;
                narrative += `For the bowling side, ${topBowler[0]} was the pick of the bowlers with figures of ${tb.wickets}/${tb.runs} in ${bowlerOvers} overs. `;
            }
            narrative += `The innings saw a total of ${totalFours} boundaries, ${totalSixes} sixes, and ${totalDots} dot balls.`;

            if (inningNum === 1) {
                const rrr = ((score.runs + 1) / maxOv).toFixed(2);
                narrative += `\n\n${bowlingTeamName} now require ${score.runs + 1} runs to win at ${rrr} RPO.`;
            } else {
                narrative += `\n\nThat concludes the innings and the match!`;
            }

            await customMatchApi.recordCommentaryBall(match._id, narrative, inningNum, currentOver, currentBallInOver);
        } catch (err) {
            console.error("Summary Generation Error:", err);
        }
    };

    /* ─── Innings / Match end ────────────────────────────────── */
    const handleEndInnings = async () => {
        if (!match) return;
        try {
            await publishInningsSummary(1);

            await customMatchApi.update(match._id, {
                currentInnings: 2,
                status: 'Live'
            });
            toast.success("Innings ended. Starting 2nd innings.");
            setStriker(""); setNonStriker(""); setBowler("");
            setLastOverBowler(""); setUsedBatsmen([]);
            setIsInningsStartPending(true); // Requiring confirmation for 2nd innings openers too
            await fetchMatchDetails();
        } catch { toast.error("Failed to end innings"); }
    };

    const handleEndMatch = async () => {
        if (!match) return;
        try {
            // Publish final innings summary
            await publishInningsSummary(match.currentInnings);

            const t1 = match.score.team1.runs;
            const t2 = match.score.team2.runs;
            const w1 = match.score.team1.wickets;
            const w2 = match.score.team2.wickets;

            // Determine who batted first to calculate margin correctly (runs vs wickets)
            const tossWinnerBatFirst = match.toss?.decision === "Batting" && match.toss?.win === match.homeTeam._id;
            const tossLoserBatFirst = match.toss?.decision === "Bowling" && match.toss?.win === match.awayTeam._id;
            const homeBattedFirst = tossWinnerBatFirst || tossLoserBatFirst;

            let result: any;
            if (t1 > t2) {
                const margin = homeBattedFirst ? `${t1 - t2} runs` : `${10 - w1} wickets`;
                result = { winner: match.homeTeam._id, winnerName: match.homeTeam.name, margin, isTie: false };
            }
            else if (t2 > t1) {
                const margin = (!homeBattedFirst) ? `${t2 - t1} runs` : `${10 - w2} wickets`;
                result = { winner: match.awayTeam._id, winnerName: match.awayTeam.name, margin, isTie: false };
            }
            else result = { isTie: true };

            // Post final result commentary
            if (result.isTie) {
                await customMatchApi.recordCommentaryBall(match._id, "🏆 MATCH TIED! A thrilling finish to an incredible game of cricket!", match.currentInnings, currentOver, currentBallInOver);
            } else {
                const winMsg = `🏆 MATCH OVER! ${result.winnerName} win by ${result.margin}! Congratulations to the victors.`;
                await customMatchApi.recordCommentaryBall(match._id, winMsg, match.currentInnings, currentOver, currentBallInOver);
            }

            await customMatchApi.update(match._id, { status: 'Completed', result });
            toast.success("Match completed! 🏆");
            setShowEndDialog(false);
            navigate("/admin");
        } catch { toast.error("Failed to end match"); }
    };

    /* ─── Undo last ball ──────────────────────────────────────── */
    const handleUndo = async () => {
        if (!match || isUndoing) return;
        const inningBalls = balls.filter(b => b.inning === match.currentInnings);
        if (inningBalls.length === 0) {
            toast.error("No balls to undo");
            return;
        }
        setIsUndoing(true);
        try {
            const response: any = await customMatchApi.undoLastBall(match._id);
            if (response) {
                toast.success("Last ball undone! ⏪");
                /* Re-fetch full match data to ensure everything is in sync */
                await fetchMatchDetails();
            }
        } catch {
            toast.error("Failed to undo ball");
        } finally {
            setIsUndoing(false);
        }
    };

    const handleConfirmInningsStart = async () => {
        if (!match || !striker || !nonStriker) {
            toast.error("Set both openers first");
            return;
        }
        try {
            const batTeamName = match.currentInnings === 1 
                ? (typeof match.homeTeam === 'object' ? match.homeTeam?.name : "Home") 
                : (typeof match.awayTeam === 'object' ? match.awayTeam?.name : "Away");
            
            const msg = match.currentInnings === 1
                ? `————— INNINGS 1 BEGINS —————\nThe ${batTeamName} openers ${striker} and ${nonStriker} walk out to the middle. The umpires signal the start of play! \uD83C\uDFCF`
                : `————— INNINGS 2 BEGINS —————\n${batTeamName} need ${match.score.team1.runs + 1} runs to win! ${striker} and ${nonStriker} stride out to the middle to begin the chase. \uD83C\uDFCF`;

            await customMatchApi.recordCommentaryBall(match._id, msg, match.currentInnings, 0, 0);
            setIsInningsStartPending(false);
            toast.success("Play started! Commentary published.");
        } catch {
            toast.error("Failed to post start commentary");
        }
    };

    /* ─── Loading ─────────────────────────────────────────────── */
    if (isLoading || !match) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400">Loading Scorer Panel...</p>
                </div>
            </div>
        );
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user._id || user.id || '';
    const userEmail = user.email || '';
    const isAdmin = user.role === 'admin';

    const creatorId = match.tournament?.createdBy ? (typeof match.tournament.createdBy === 'object' ? (match.tournament.createdBy as any)._id : match.tournament.createdBy) : null;
    
    // --- AUTH LOGIC ---
    const isCreator = creatorId && String(creatorId) === String(currentUserId);
    const isLegacyTournament = match.tournament ? (!creatorId || new Date(match.tournament.createdAt) < new Date('2026-03-30T00:00:00Z')) : false;
    const isSpecialUserForLegacy = userEmail === 'meetmodi451013@gmail.com' && isLegacyTournament;
    
    if (!isCreator && !isSpecialUserForLegacy && !isAdmin) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-slate-400 mb-6 font-medium text-center">You are not authorized to score matches in this tournament.</p>
                <Button onClick={() => navigate("/admin")} className="bg-blue-600 hover:bg-blue-700">
                    Return to Dashboard
                </Button>
            </div>
        );
    }
    // ------------------

    /* ═══════════════════════════════════════════════════════════
       PHASE 1: LINEUP SELECTION
       ═══════════════════════════════════════════════════════════ */
    if (phase === "lineup") {
        return (
            <div className="min-h-screen bg-slate-950 p-4 md:p-8">
                <Helmet><title>Select Lineups — {match.homeTeam.name} vs {match.awayTeam.name}</title></Helmet>
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-white mb-2">Select Playing Lineups</h1>
                        <p className="text-slate-400">{match.homeTeam.name} vs {match.awayTeam.name}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Home Team Lineup */}
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Shield className="text-blue-500" /> {match.homeTeam.name}
                                    <span className="ml-auto text-sm text-blue-400 font-normal">{homeLineup.length}/11</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {homeSquad.length === 0 ? (
                                    <p className="text-amber-400 text-sm">⚠️ No players in squad. Add players to the team first.</p>
                                ) : homeSquad.map(player => (
                                    <button
                                        key={player}
                                        onClick={() => togglePlayer(player, "home")}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${homeLineup.includes(player)
                                            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2 line-clamp-1 text-left">
                                            <User size={14} className="shrink-0" />
                                            <span className="truncate">{player}</span>
                                            {match.homeTeam.captain && match.homeTeam.captain.toLowerCase().trim() === player.toLowerCase().trim() && (
                                                <span className="flex items-center gap-1 text-xs text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                                                    <Crown size={12} className="shrink-0" /> (C)
                                                </span>
                                            )}
                                        </span>
                                        {homeLineup.includes(player) && <Check size={16} className="text-blue-400" />}
                                    </button>
                                ))}
                                {homeSquad.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mt-2"
                                        onClick={() => setHomeLineup(homeSquad.slice(0, 11))}
                                    >
                                        Select All ({Math.min(homeSquad.length, 11)})
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Away Team Lineup */}
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Shield className="text-red-500" /> {match.awayTeam.name}
                                    <span className="ml-auto text-sm text-red-400 font-normal">{awayLineup.length}/11</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {awaySquad.length === 0 ? (
                                    <p className="text-amber-400 text-sm">⚠️ No players in squad. Add players to the team first.</p>
                                ) : awaySquad.map(player => (
                                    <button
                                        key={player}
                                        onClick={() => togglePlayer(player, "away")}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${awayLineup.includes(player)
                                            ? "bg-red-500/20 border border-red-500/40 text-red-300"
                                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2 line-clamp-1 text-left">
                                            <User size={14} className="shrink-0" />
                                            <span className="truncate">{player}</span>
                                            {match.awayTeam.captain && match.awayTeam.captain.toLowerCase().trim() === player.toLowerCase().trim() && (
                                                <span className="flex items-center gap-1 text-xs text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                                                    <Crown size={12} className="shrink-0" /> (C)
                                                </span>
                                            )}
                                        </span>
                                        {awayLineup.includes(player) && <Check size={16} className="text-red-400" />}
                                    </button>
                                ))}
                                {awaySquad.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 mt-2"
                                        onClick={() => setAwayLineup(awaySquad.slice(0, 11))}
                                    >
                                        Select All ({Math.min(awaySquad.length, 11)})
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={() => {
                                if (homeLineup.length < 2 || awayLineup.length < 2) {
                                    toast.error("Select at least 2 players per team");
                                    return;
                                }
                                setPhase("toss");
                            }}
                            className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6 font-bold rounded-xl"
                            disabled={homeLineup.length < 2 || awayLineup.length < 2}
                        >
                            Continue to Toss <ChevronRight size={20} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       PHASE 2: TOSS
       ═══════════════════════════════════════════════════════════ */
    if (phase === "toss") {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Helmet><title>Toss — {match.homeTeam.name} vs {match.awayTeam.name}</title></Helmet>
                <Card className="bg-slate-900 border-slate-700 w-full max-w-lg">
                    <CardHeader className="text-center pb-2">
                        <Crown className="text-yellow-400 mx-auto mb-2" size={40} />
                        <CardTitle className="text-2xl text-white">Toss</CardTitle>
                        <p className="text-slate-400 text-sm">Who won the toss?</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Toss winner */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setTossWinner("home")}
                                className={`p-4 rounded-xl border-2 text-center transition-all ${tossWinner === "home"
                                    ? "border-blue-500 bg-blue-500/15 text-blue-300"
                                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                    }`}
                            >
                                <Shield className="mx-auto mb-2 text-blue-500" />
                                <p className="font-bold text-white text-sm">{match.homeTeam.name}</p>
                            </button>
                            <button
                                onClick={() => setTossWinner("away")}
                                className={`p-4 rounded-xl border-2 text-center transition-all ${tossWinner === "away"
                                    ? "border-red-500 bg-red-500/15 text-red-300"
                                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                    }`}
                            >
                                <Shield className="mx-auto mb-2 text-red-500" />
                                <p className="font-bold text-white text-sm">{match.awayTeam.name}</p>
                            </button>
                        </div>

                        {/* Decision */}
                        <div>
                            <Label className="text-slate-400 text-sm mb-3 block">Elected to</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTossDecision("Batting")}
                                    className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${tossDecision === "Batting"
                                        ? "border-green-500 bg-green-500/15 text-green-300"
                                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                        }`}
                                >
                                    🏏 Bat
                                </button>
                                <button
                                    onClick={() => setTossDecision("Bowling")}
                                    className={`p-3 rounded-xl border-2 text-center font-bold transition-all ${tossDecision === "Bowling"
                                        ? "border-amber-500 bg-amber-500/15 text-amber-300"
                                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                        }`}
                                >
                                    🎯 Bowl
                                </button>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 text-center">
                            <span className="font-semibold text-white">{tossWinner === "home" ? match.homeTeam.name : match.awayTeam.name}</span>
                            {" "}won the toss and elected to{" "}
                            <span className="font-semibold text-green-400">{tossDecision.toLowerCase()}</span> first
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setPhase("lineup")} className="flex-1 text-slate-400">
                                ← Back
                            </Button>
                            <Button onClick={handleStartMatch} className="flex-1 bg-green-600 hover:bg-green-700 font-bold text-lg py-6">
                                Start Match 🏏
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       PHASE 3: LIVE SCORING
       ═══════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <Helmet><title>Scoring: {match.homeTeam.name} vs {match.awayTeam.name}</title></Helmet>
            <div className="max-w-4xl mx-auto space-y-5">

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Link to="/admin" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
                        <ChevronLeft size={16} /> Back to Dashboard
                    </Link>
                    <a href={`/live/${match._id}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">
                        Open Viewer Link ↗
                    </a>
                </div>

                {/* ── Score Header ──────────────────────────────────────── */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h1 className="text-2xl font-bold text-white mb-1">{battingTeam?.name}</h1>
                                <div className="text-slate-400 text-sm uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                    <span>Innings {match.currentInnings}</span>
                                    {match.tournament?.matchType === 'Test' && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                            <span className="text-yellow-400 font-semibold">Day {match.testDay || 1} • Session {match.testSession || 1}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-6xl font-black text-white flex items-center gap-2">
                                    {currentScore!.runs} <span className="text-slate-500">/</span> {currentScore!.wickets}
                                </div>
                                <p className="text-slate-400 mt-2 font-medium">Overs: {displayOvers}</p>
                            </div>
                            <div className="text-center md:text-right space-y-2">
                                <div className="flex gap-4 justify-center md:justify-end">
                                    <div>
                                        <p className="text-slate-500 text-xs">CRR</p>
                                        <p className="text-lg font-bold text-blue-400">{crr}</p>
                                    </div>
                                    {match.currentInnings === 2 && (
                                        <div>
                                            <p className="text-slate-500 text-xs">RRR</p>
                                            <p className="text-lg font-bold text-orange-400">{rrr}</p>
                                        </div>
                                    )}
                                </div>
                                {match.currentInnings === 2 && (
                                    <p className="text-yellow-400 text-xs font-semibold">Target: {target}</p>
                                )}
                                <p className="text-green-500 text-xs font-bold flex items-center justify-center md:justify-end gap-1">
                                    <Zap size={12} className="animate-pulse" /> LIVE SCORING
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Batsmen & Bowler ──────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Batting Panel */}
                    <Card className="bg-slate-900 border-slate-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <User className="text-blue-500" /> Batting
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Striker */}
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex justify-between items-center">
                                <div className="flex items-center gap-3 flex-1">
                                    <Select value={striker} onValueChange={setStriker}>
                                        <SelectTrigger className="bg-transparent border-none text-white font-bold shadow-none h-auto p-0 [&>span]:text-white">
                                            <SelectValue placeholder="Select striker" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            {battingLineup.filter(p => !dismissedBatsmen.includes(p) && p !== nonStriker).map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="text-xs text-blue-400 px-1.5 py-0.5 bg-blue-500/20 rounded shrink-0">*</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { const t = striker; setStriker(nonStriker); setNonStriker(t); }} className="text-slate-500 hover:text-white shrink-0">
                                    <ArrowLeftRight size={14} />
                                </Button>
                            </div>
                            {/* Non-Striker */}
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <Select value={nonStriker} onValueChange={setNonStriker}>
                                    <SelectTrigger className="bg-transparent border-none text-slate-300 shadow-none h-auto p-0 [&>span]:text-white">
                                        <SelectValue placeholder="Select non-striker" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {battingLineup.filter(p => !dismissedBatsmen.includes(p) && p !== striker).map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bowling Panel */}
                    <Card className="bg-slate-900 border-slate-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Activity className="text-red-500" /> Bowling
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <Select value={bowler} onValueChange={setBowler}>
                                    <SelectTrigger className="bg-transparent border-none text-white font-bold shadow-none h-auto p-0">
                                        <SelectValue placeholder="Select bowler" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {bowlingLineup.map(p => (
                                            <SelectItem key={p} value={p} disabled={p === lastOverBowler}>
                                                {p} {p === lastOverBowler ? "(just bowled)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {lastOverBowler && (
                                <p className="text-xs text-slate-500 mt-2">⚠️ {lastOverBowler} cannot bowl this over (consecutive overs not allowed)</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── This Over ─────────────────────────────────────────── */}
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <span>Over {currentOver + 1}</span>
                            <span className="text-slate-600">{currentBallInOver}/6</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 flex-wrap">
                            {thisOverBalls.map((b, i) => (
                                <div key={i} className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border transition-all ${b.wicket?.isWicket ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                                    b.runs === 4 ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                                        b.runs === 6 ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
                                            b.extraType !== 'none' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                                                'bg-slate-800 text-white border-slate-700'
                                    }`}>
                                    {b.wicket?.isWicket ? 'W' :
                                        b.extraType === 'wide' ? 'WD' :
                                            b.extraType === 'noball' ? 'NB' :
                                                b.extraType === 'bye' ? `${b.runs}B` :
                                                    b.extraType === 'legbye' ? `${b.runs}LB` :
                                                        b.runs}
                                </div>
                            ))}
                            {thisOverBalls.length === 0 && (
                                <p className="text-slate-600 text-sm italic">New over — awaiting delivery...</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Scoring Controls ──────────────────────────────────── */}
                <Card className="bg-slate-900 border-slate-800 p-6">
                    <div className="space-y-6">
                        {isInningsStartPending && (
                            <div className="flex justify-center mb-6">
                                <Button 
                                    onClick={handleConfirmInningsStart} 
                                    className="bg-green-600 hover:bg-green-700 text-lg py-7 px-10 rounded-2xl font-black animate-bounce shadow-xl shadow-green-500/20 border-2 border-white/20"
                                >
                                    Confirm Openers & Start Play 🏏
                                </Button>
                            </div>
                        )}
                        {isSessionBreak && (
                            <div className="flex justify-center mb-2">
                                <Button onClick={handleStartNewSession} className="bg-emerald-600 hover:bg-emerald-700 text-lg py-6 px-8 rounded-xl font-bold animate-pulse shadow-lg shadow-emerald-500/20">
                                    Start Next Session
                                </Button>
                            </div>
                        )}
                        {/* Run buttons */}
                        <div className={`flex flex-wrap gap-3 justify-center ${isInningsStartPending ? 'opacity-30 pointer-events-none' : ''}`}>
                            {[0, 1, 2, 3, 4, 6].map(run => (
                                <Button
                                    key={run}
                                    onClick={() => {
                                        if (run === 0) {
                                            handleRecordBall(0);
                                        } else {
                                            setPendingShotRuns(run);
                                            setShowWagonWheelPicker(true);
                                        }
                                    }}
                                    disabled={isRecording}
                                    className={`w-16 h-16 rounded-full text-xl font-bold shadow-lg transition-all active:scale-90 hover:scale-105 ${run === 4 ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
                                        run === 6 ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' :
                                            'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                >
                                    {run}
                                </Button>
                            ))}
                        </div>

                        {/* Extras & Wicket */}
                        <div className={`flex flex-wrap gap-4 justify-center border-t border-slate-800 pt-6 ${isInningsStartPending ? 'opacity-30 pointer-events-none' : ''}`}>
                            <Button variant="outline" onClick={() => handleExtraClick("wide")} disabled={isRecording} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">WD</Button>
                            <Button variant="outline" onClick={() => handleExtraClick("noball")} disabled={isRecording} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">NB</Button>
                            <Button variant="outline" onClick={() => handleExtraClick("bye")} disabled={isRecording} className="border-slate-600 text-slate-400 hover:bg-slate-800">BYE</Button>
                            <Button variant="outline" onClick={() => handleExtraClick("legbye")} disabled={isRecording} className="border-slate-600 text-slate-400 hover:bg-slate-800">L-BYE</Button>
                            <Button
                                variant={isDroppedCatch ? "default" : "outline"}
                                onClick={() => {
                                    if (isDroppedCatch) {
                                        setIsDroppedCatch(false);
                                        setDroppedFielder("");
                                    } else {
                                        setDroppedFielder("");
                                        setShowDroppedCatchDialog(true);
                                    }
                                }}
                                disabled={isRecording}
                                className={isDroppedCatch ? "bg-amber-600 hover:bg-amber-700 text-white font-bold" : "border-amber-500/40 text-amber-500 hover:bg-amber-500/10"}
                            >
                                {isDroppedCatch && droppedFielder ? `Dropped by ${droppedFielder}` : "Dropped Catch"}
                            </Button>
                            <Button variant="outline" onClick={() => setShowWicketDialog(true)} disabled={isRecording} className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold">
                                <XCircle size={16} className="mr-2" /> WICKET
                            </Button>
                        </div>

                        {/* Impact Player Buttons (T10 / T20 only) */}
                        {(match?.tournament?.matchType === 'T20' || match?.tournament?.matchType === 'T10') && (
                            <div className="flex gap-4 justify-center border-t border-slate-800 pt-6">
                                {!match.impactPlayers?.team1 && (
                                    <Button variant="outline" onClick={() => setImpactTeam("home")} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                                        <ArrowLeftRight size={16} className="mr-2" /> Impact Sub ({match.homeTeam.name})
                                    </Button>
                                )}
                                {!match.impactPlayers?.team2 && (
                                    <Button variant="outline" onClick={() => setImpactTeam("away")} className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                                        <ArrowLeftRight size={16} className="mr-2" /> Impact Sub ({match.awayTeam.name})
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Undo + Match controls */}
                        <div className="flex flex-wrap gap-3 justify-center border-t border-slate-800 pt-6">
                            <Button
                                onClick={handleUndo}
                                disabled={isUndoing || balls.filter(b => b.inning === match.currentInnings).length === 0}
                                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-40"
                            >
                                <RotateCcw size={16} className={`mr-2 ${isUndoing ? 'animate-spin' : ''}`} /> Undo Last Ball
                            </Button>
                            {match.currentInnings === 1 && (
                                <Button onClick={handleEndInnings} className="bg-amber-600 hover:bg-amber-700">
                                    End Innings
                                </Button>
                            )}
                            <Button onClick={() => setShowEndDialog(true)} className="bg-red-700 hover:bg-red-800">
                                <CheckCircle size={16} className="mr-2" /> End Match
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* ══ DIALOGS ═══════════════════════════════════════════ */}

                {/* Wicket Dialog */}
                <Dialog open={showWicketDialog} onOpenChange={setShowWicketDialog}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader><DialogTitle className="text-red-400">Record Wicket</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Batsman Out</Label>
                                <p className="text-white font-bold bg-slate-800 p-3 rounded-lg">{striker}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Dismissal Type</Label>
                                <Select value={wicketType} onValueChange={setWicketType}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="bowled">Bowled</SelectItem>
                                        <SelectItem value="caught">Caught</SelectItem>
                                        <SelectItem value="caught and bowled">Caught & Bowled</SelectItem>
                                        <SelectItem value="lbw">LBW</SelectItem>
                                        <SelectItem value="runout">Run Out</SelectItem>
                                        <SelectItem value="stumped">Stumped</SelectItem>
                                        <SelectItem value="hitwicket">Hit Wicket</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {(wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped') && (
                                <div className="space-y-2">
                                    <Label>Fielder</Label>
                                    <Select value={fielder} onValueChange={setFielder}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select fielder" /></SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                            {bowlingLineup.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Runs scored on this ball</Label>
                                <Input type="number" value={wicketRuns} onChange={(e) => setWicketRuns(parseInt(e.target.value) || 0)} className="bg-slate-800 border-slate-700" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowWicketDialog(false)}>Cancel</Button>
                            <Button onClick={() => handleRecordBall(wicketRuns, "none", true)} className="bg-red-600 hover:bg-red-700">Confirm Wicket</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* New Batsman Dialog */}
                <Dialog open={showNewBatsmanDialog} onOpenChange={setShowNewBatsmanDialog}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader><DialogTitle>New Batsman</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label>Select new batsman</Label>
                            <Select value={newBatsman} onValueChange={setNewBatsman}>
                                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Choose batsman" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {availableBatsmen.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button onClick={confirmNewBatsman} className="bg-blue-600 hover:bg-blue-700">Confirm</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Dropped Catch Dialog */}
                <Dialog open={showDroppedCatchDialog} onOpenChange={setShowDroppedCatchDialog}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader><DialogTitle className="text-amber-500">Record Dropped Catch</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label>Who dropped the catch?</Label>
                            <Select value={droppedFielder} onValueChange={setDroppedFielder}>
                                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select fielder" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {bowlingLineup.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-400">Selecting a fielder will flag this ball as a dropped catch, which negatively affects the player's performance rating.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => { setShowDroppedCatchDialog(false); setIsDroppedCatch(false); setDroppedFielder(""); }}>Cancel</Button>
                            <Button
                                onClick={() => {
                                    if (droppedFielder) {
                                        setIsDroppedCatch(true);
                                        setShowDroppedCatchDialog(false);
                                    } else {
                                        toast.error("Please select the fielder who dropped the catch.");
                                    }
                                }}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                Confirm Drop
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* New Bowler Dialog (after over completes) */}
                <Dialog open={showNewBowlerDialog} onOpenChange={setShowNewBowlerDialog}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader><DialogTitle>Over Complete — Select New Bowler</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label>Select bowler for the next over</Label>
                            {lastOverBowler && <p className="text-xs text-amber-400">⚠️ {lastOverBowler} cannot bowl consecutive overs</p>}
                            <Select value={newBowler} onValueChange={setNewBowler}>
                                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Choose bowler" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {availableBowlers.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button onClick={confirmNewBowler} className="bg-green-600 hover:bg-green-700">Start Over</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Extras Run Selection Dialog */}
                <Dialog open={showExtraRunsDialog} onOpenChange={setShowExtraRunsDialog}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-orange-400 uppercase">
                                {pendingExtraType} Runs Selection
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-6">
                            <p className="text-sm text-slate-400 mb-4 text-center">Select additional runs scored on this {pendingExtraType} ball:</p>
                            
                            {pendingExtraType === 'noball' && (
                                <div className="flex gap-2 mb-6">
                                    <Button 
                                        variant={noBallRunType === 'bat' ? 'default' : 'outline'}
                                        onClick={() => setNoBallRunType('bat')}
                                        className={`flex-1 ${noBallRunType === 'bat' ? 'bg-orange-600 hover:bg-orange-700' : 'border-slate-700 text-slate-400'}`}
                                    >
                                        From Bat
                                    </Button>
                                    <Button 
                                        variant={noBallRunType === 'extra' ? 'default' : 'outline'}
                                        onClick={() => setNoBallRunType('extra')}
                                        className={`flex-1 ${noBallRunType === 'extra' ? 'bg-orange-600 hover:bg-orange-700' : 'border-slate-700 text-slate-400'}`}
                                    >
                                        Bye / Legbye
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                {[0, 1, 2, 3, 4, 6].map(run => (
                                    <Button
                                        key={run}
                                        onClick={() => handleConfirmExtraRuns(run)}
                                        className="h-16 text-xl font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
                                    >
                                        +{run}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => { setShowExtraRunsDialog(false); setPendingExtraType(null); setNoBallRunType("bat"); }}>Cancel</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* End Match Dialog */}
                <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                        <DialogHeader><DialogTitle>End Match?</DialogTitle></DialogHeader>
                        <p className="text-slate-400">Are you sure? The result will be calculated and the points table updated automatically.</p>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowEndDialog(false)}>Cancel</Button>
                            <Button onClick={handleEndMatch} className="bg-red-600 hover:bg-red-700">Confirm End Match</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Impact Player Dialog */}
                <Dialog open={!!impactTeam} onOpenChange={(open) => { if (!open) setImpactTeam(null); }}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-emerald-400 flex items-center gap-2"><ArrowLeftRight size={20} /> Impact Player Substitution</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-slate-400">Select the player to sub out from the Playing XI, and the player to sub in from the bench.</p>
                            <div className="space-y-2">
                                <Label>Player Out (From Playing XI)</Label>
                                <Select value={impactOut} onValueChange={setImpactOut}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select outgoing player" /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {(impactTeam === "home" ? activeHomeLineup : activeAwayLineup)
                                            .map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p} {p === striker || p === nonStriker || p === bowler ? "(Active on pitch)" : ""} {dismissedBatsmen.includes(p) ? "(Dismissed)" : ""}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Player In (From Bench)</Label>
                                <Select value={impactIn} onValueChange={setImpactIn}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select incoming player" /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        {(impactTeam === "home" ? homeSquad : awaySquad)
                                            .filter(p => !(impactTeam === "home" ? activeHomeLineup : activeAwayLineup).includes(p))
                                            .map((p) => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setImpactTeam(null)} className="border-slate-700 text-white hover:bg-slate-800">Cancel</Button>
                            <Button onClick={handleImpactSubstitution} disabled={!impactIn || !impactOut} className="bg-emerald-600 hover:bg-emerald-700">Confirm Sub</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Wagon Wheel Direction Picker (Enhanced) ───────────────────────── */}
                <Dialog open={showWagonWheelPicker} onOpenChange={setShowWagonWheelPicker}>
                    <DialogContent className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 text-white max-w-md p-0 overflow-hidden">
                        <DialogHeader className="px-6 pt-5 pb-2">
                            <DialogTitle className="text-center text-lg font-black tracking-tight">
                                <span className={`text-2xl ${pendingShotRuns === 4 ? 'text-blue-400' : pendingShotRuns === 6 ? 'text-purple-400' : 'text-emerald-400'}`}>{pendingShotRuns}</span>
                                <span className="text-slate-400 text-sm ml-2">{pendingShotRuns === 1 ? 'run' : 'runs'} — Tap where the shot was played</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center px-4 pb-5">
                            <svg viewBox="0 0 340 340" width={320} height={320} className="drop-shadow-2xl">
                                <defs>
                                    <radialGradient id="pickerFieldGrad" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#1a3a18" />
                                        <stop offset="100%" stopColor="#0f2510" />
                                    </radialGradient>
                                    <filter id="pickerGlow">
                                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                    </filter>
                                </defs>
                                {/* Outer ring glow */}
                                <ellipse cx={170} cy={170} rx={155} ry={155} fill="none" stroke={pendingShotRuns === 4 ? '#3b82f6' : pendingShotRuns === 6 ? '#a855f7' : '#22c55e'} strokeWidth={1.5} opacity={0.15} />
                                {/* Ground */}
                                <ellipse cx={170} cy={170} rx={148} ry={148} fill="url(#pickerFieldGrad)" stroke="#2d5a27" strokeWidth={2.5} />
                                {/* Inner (30-yard) circle */}
                                <ellipse cx={170} cy={170} rx={72} ry={72} fill="none" stroke="#2d5a27" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.4} />
                                {/* Pitch */}
                                <rect x={166} y={153} width={8} height={34} fill="#c4a46c" rx={3} opacity={0.6} />
                                {/* Batting crease dot */}
                                <circle cx={170} cy={170} r={5} fill="#fff" opacity={0.9} />
                                <circle cx={170} cy={170} r={2.5} fill="#1e293b" opacity={0.7} />

                                {/* Clickable zones */}
                                {[
                                    { id: 'straight', angle: 270, label: 'Straight', emoji: '⬆️' },
                                    { id: 'mid-off', angle: 300, label: 'Mid Off', emoji: '↗️' },
                                    { id: 'cover', angle: 330, label: 'Cover', emoji: '➡️' },
                                    { id: 'point', angle: 10, label: 'Point', emoji: '↘️' },
                                    { id: 'third-man', angle: 40, label: '3rd Man', emoji: '⤵️' },
                                    { id: 'fine-leg', angle: 140, label: 'Fine Leg', emoji: '⤴️' },
                                    { id: 'square-leg', angle: 170, label: 'Sq Leg', emoji: '⬅️' },
                                    { id: 'midwicket', angle: 210, label: 'Mid Wkt', emoji: '↙️' },
                                    { id: 'mid-on', angle: 240, label: 'Mid On', emoji: '↖️' },
                                ].map(zone => {
                                    const rad = (zone.angle * Math.PI) / 180;
                                    const zx = 170 + 108 * Math.cos(rad);
                                    const zy = 170 + 108 * Math.sin(rad);
                                    const lx = 170 + 135 * Math.cos(rad);
                                    const ly = 170 + 135 * Math.sin(rad);
                                    const accentColor = pendingShotRuns === 4 ? '#3b82f6' : pendingShotRuns === 6 ? '#a855f7' : '#22c55e';
                                    return (
                                        <g key={zone.id} className="cursor-pointer group" onClick={() => {
                                            handleRecordBall(pendingShotRuns, "none", false, zone.id);
                                            setShowWagonWheelPicker(false);
                                        }}>
                                            {/* Direction line from pitch to zone */}
                                            <line x1={170} y1={170} x2={zx} y2={zy} stroke={accentColor} strokeWidth={2} opacity={0} className="group-hover:opacity-70 transition-opacity duration-200" strokeLinecap="round" />
                                            {/* Outer glow ring on hover */}
                                            <circle cx={zx} cy={zy} r={30} fill="transparent" stroke={accentColor} strokeWidth={0} className="group-hover:[stroke-width:2] transition-all" opacity={0.4} />
                                            {/* Zone circle */}
                                            <circle cx={zx} cy={zy} r={24} fill="#1e293b" stroke="#475569" strokeWidth={1.5} className="group-hover:fill-blue-900/60 group-hover:stroke-blue-400 transition-all duration-200" />
                                            {/* Zone text */}
                                            <text x={zx} y={zy + 1} textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize={9} fontWeight="800" className="group-hover:fill-white transition-colors select-none uppercase tracking-wider">
                                                {zone.label}
                                            </text>
                                            {/* Outer label */}
                                            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize={7} fontWeight="bold" className="select-none group-hover:fill-slate-300 transition-colors">
                                                {zone.emoji}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                            <div className="flex gap-3 mt-3">
                                <Button
                                    variant="ghost"
                                    className="text-slate-500 hover:text-white text-xs border border-slate-700 hover:border-slate-500 px-5 py-2 rounded-full"
                                    onClick={() => {
                                        handleRecordBall(pendingShotRuns);
                                        setShowWagonWheelPicker(false);
                                    }}
                                >
                                    Skip direction →
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-slate-500 hover:text-white text-xs border border-slate-700 hover:border-slate-500 px-5 py-2 rounded-full"
                                    onClick={() => setShowWagonWheelPicker(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default ScoringPanel;
