import React, { useState, useEffect, useMemo } from "react";
import { Match, Ball, Team } from "@/data/scoringTypes";
import { customMatchApi, tournamentApi, playerApi } from "@/services/api";
import TournamentCricketLab from "./TournamentCricketLab";
import { PreMatchForecast } from "@/components/PreMatchForecast";
import { calculateNRRMargin } from "@/lib/cricketUtils";
import { calculateWinProbability } from "@/services/cricketMapper";
import {
    ArrowLeft, Shield, Trophy, MapPin, Calendar, Zap, RefreshCw,
    ClipboardList, MessageSquare, BarChart3, Award, User,
    Activity, TrendingUp, Radar, Target, Info, Flame, Sparkles, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { LiveStatCard } from "@/components/LiveStatCard";
import { BatsmanDetailPopup } from "../BatsmanDetailPopup";
import { BowlerDetailPopup } from "../BowlerDetailPopup";
import { ANALYSIS_PLAYERS } from "@/data/playerAnalysisData";

type DetailTab = "summary" | "live" | "scorecard" | "lineups" | "lab";

const cricketPlayers = ANALYSIS_PLAYERS.cricket;

const getRealBowlerCareerStats = (name: string, cache: Record<string, any> = {}) => {
    // 1. Try Cache (from API)
    const cached = cache[name];
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

const norm = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

interface Props {
    match: Match;
    overs: number;
    onBack: () => void;
}

/** Convert decimal overs (e.g. 3.8333 stored as balls/6) → cricket display (e.g. "3.5") */
const formatOvers = (oversNum: number) => {
    const totalBalls = Math.round(oversNum * 6);
    const completedOvers = Math.floor(totalBalls / 6);
    const remainingBalls = totalBalls % 6;
    return `${completedOvers}.${remainingBalls}`;
};

const getBallIcon = (ball: Ball) => {
    if (ball.wicket?.isWicket) return { icon: "🔴", label: "W", color: "bg-red-500/20 text-red-400 border-red-500/40" };
    if (ball.extraType === "wide") return { icon: "💨", label: `${ball.totalBallRuns}wd`, color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" };
    if (ball.extraType === "noball") return { icon: "⛔", label: `${ball.totalBallRuns}nb`, color: "bg-orange-500/10 text-orange-400 border-orange-500/30" };
    if (ball.runs === 6) return { icon: "💥", label: "6", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" };
    if (ball.runs === 4) return { icon: "⚡", label: "4", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" };
    if (ball.runs === 0) return { icon: "•", label: "0", color: "bg-slate-800 text-slate-400 border-slate-700" };
    return { icon: "🏏", label: String(ball.runs), color: "bg-green-500/10 text-green-400 border-green-500/20" };
};

// ── Deterministic pick from array using a seed (so rerenders stay stable) ──
const pick = (arr: string[], seed: number) => arr[seed % arr.length];

const getCommentaryText = (ball: Ball, idx: number): { headline: string; detail?: string; accent: string } => {
    const bat = ball.batsman || "Batsman";
    const bowl = ball.bowler || "Bowler";
    const t = ball.wicket?.type?.replace(/_/g, ' ') || "out";
    const dismissed = ball.wicket?.playerOut || bat;

    // Wicket
    if (ball.wicket?.isWicket) {
        const headlines = [
            `OUT! ${bowl} strikes — ${dismissed} departs for ${ball.runs > 0 ? ball.runs + ' off this ball' : 'a duck'}`,
            `WICKET! ${dismissed} walks back to the pavilion — ${t}`,
            `Huge wicket! ${bowl} removes ${dismissed} — what a breakthrough!`,
            `${dismissed} is gone! ${t}. The partnership broken.`,
            `Drama on the pitch! ${bowl} gets the crucial wicket of ${dismissed}`,
            `${dismissed} falls for ${t}! ${bowl} pumped up after that one. That was a phenomenal piece of execution, exactly what the team desperately needed at this stage of the match.`,
            `That's OUT! ${t} — ${dismissed} couldn't survive that delivery from ${bowl}. The bowling side is absolutely ecstatic, they know how important this wicket is in the context of the game.`,
            `Cleaned him up! ${bowl} is ecstatic, ${dismissed} has to walk. A magnificent moment of brilliance that sends the crowd into a pure frenzy.`,
            `Got him! Spectacular piece of play, ${dismissed} looks shell-shocked. The fielding unit celebrates as one, realizing they just turned the tide in their favor.`,
            `Wicket number ${t === 'bowled' ? 'one' : 'another'} for ${bowl}! ${dismissed} didn't read it.`,
            `Brilliant! ${bowl} completely outsmarts ${dismissed}.`,
            `The finger goes up! ${dismissed} is devastatingly disappointed.`,
        ];
        const details = [
            `${bowl} nails the line and length, leaving ${dismissed} with no answer.`,
            `Massive turning point in the innings — a key dismissal for the bowling side.`,
            `The fielders erupt as ${dismissed} trudges back. Pressure builds.`,
            `A beautiful delivery from ${bowl} — nothing ${dismissed} could do about that.`,
            `The bowler celebrates wildly — that wicket could change the game completely!`,
            `The captain's plan worked to absolute perfection there.`,
            `That was pitched perfectly. ${dismissed} played down the wrong line entirely.`,
            `The dugout is on their feet clapping. What a moment.`,
        ];
        return { headline: pick(headlines, idx + 5), detail: pick(details, idx), accent: "text-red-400" };
    }

    // Wide
    if (ball.extraType === "wide") {
        const headlines = [
            `Wide ball! ${bowl} strays well outside off — ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} added to the total.`,
            `Too wide from ${bowl}! The umpire signals wide. ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} to the score. That was a wayward delivery that completely missed the mark.`,
            `${bowl} loses control — that drifts far too wide. ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} awarded to the batting side. The bowler needs to find their rhythm again soon.`,
            `Wide called! Wayward delivery from ${bowl}. ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} added. The pressure might be getting to the bowling unit here.`,
            `Expensive delivery — wide from ${bowl} adds ${ball.totalBallRuns} to the run tally. It's an extra gift that the batting side will gladly accept at this stage.`,
        ];
        const details = [
            `The bowler is struggling with their line today. That was nowhere near the stumps.`,
            `Free runs for the opposition. ${bowl} looks frustrated with that execution.`,
            `The captain is having a quick word. Discipline is key in these middle overs.`,
            `That's a bonus for ${bat}, who didn't even have to move the bat.`,
        ];
        return { headline: pick(headlines, idx + 2), detail: pick(details, idx), accent: "text-yellow-400" };
    }

    // No ball
    if (ball.extraType === "noball") {
        const headlines = [
            `No-ball from ${bowl}! Overstepped the crease — ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} + Free Hit! It's a massive blunder that gives the batsman a license to swing.`,
            `${bowl} has overstepped! No ball called — ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} added & FREE HIT next! The crowd is buzzing with anticipation.`,
            `Careless from ${bowl} — overstepped the crease. ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} plus free hit. That's exactly what the bowling side didn't want right now.`,
            `No ball! ${bowl} can't afford that. ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} and a free hit on offer! ${bat} looks ready to capitalize.`,
            `Exciting moment — no-ball from ${bowl}. ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} plus FREE HIT next! A moment of madness that could cost plenty of runs.`,
        ];
        const details = [
            `A siren rings out across the stadium. The bowler has let the team down with that lack of discipline.`,
            `The batsman has a golden opportunity here. The fielders are moving back in anticipation of a big hit.`,
            `${bowl} needs to be more careful with the front foot. It's a basic error that can be very costly.`,
            `Free Hit coming up! The tension is palpable as ${bat} takes guard again.`,
        ];
        return { headline: pick(headlines, idx + 3), detail: pick(details, idx), accent: "text-orange-400" };
    }

    // Bye / Leg bye
    if (ball.extraType === "bye" || ball.extraType === "legbye") {
        const type = ball.extraType === "bye" ? "Bye" : "Leg bye";
        const headlines = [
            `${type}! The ball sneaks past the keeper — ${ball.totalBallRuns} run${ball.totalBallRuns !== 1 ? 's' : ''} added to the extras column. A lapse in concentration behind the stumps.`,
            `Scrambled ${type.toLowerCase()} — sneaks away for ${ball.totalBallRuns}. The batsmen were alert and took advantage of the ball beating the keeper.`,
            `${ball.totalBallRuns} ${type.toLowerCase()} — quick running from the batsmen! They saw the opportunity and didn't hesitate for a second.`,
        ];
        const details = [
            `Poor work by the keeper there, that should have been gathered cleanly.`,
            `The bowling was good, but the execution of the take was slightly off.`,
            `The batsmen are showing great intent, making the most of every half-chance.`,
            `Every run counts in this format, and these extras could prove vital later on.`,
        ];
        return { headline: pick(headlines, idx), detail: pick(details, idx), accent: "text-slate-300" };
    }

    // SIX
    if (ball.runs === 6) {
        const headlines = [
            `SIX! ${bat} sends it sailing over the boundary — pure power!`,
            `MAXIMUM! ${bat} clears the ropes with an absolute missile!`,
            `HUGE SIX from ${bat}! That's gone all the way into the stands! What an exquisite shot, he picked the length so early and absolutely demolished it into the crowd!`,
            `${bat} dispatches ${bowl} for a towering SIX! The crowd goes wild! The sound off the bat was like a gunshot, echoing around the entire stadium.`,
            `What a hit! ${bat} launches ${bowl} high and handsome — SIX! You cannot bowl there to a batsman of this caliber, he will punish you every single time.`,
            `SIX! Effortless from ${bat} — picked up length early and went for it! The fielder in the deep didn't even bother moving, just admiring its massive distance.`,
            `MASSIVE! ${bat} opens the shoulders and deposits ${bowl} over the fence! It's raining sixes now, the momentum is swinging drastically right before our eyes!`,
            `SIX and what a SIX! ${bat} hits it straight as an arrow, all the way! A textbook lofted drive that showcases why he is considered one of the very best in the business.`,
            `Out of the park! ${bat} completely obliterates that delivery.`,
            `Up, up and away! Six runs to the total courtesy of ${bat}.`,
            `Smoked it! ${bat} found the sweet spot and the ball disappeared.`,
        ];
        const details = [
            `${bowl} will rue that delivery — landed right in the slot.`,
            `Unbelievable timing. ${bat} barely seemed to swing hard.`,
            `Crowd on their feet! Stunning stroke play from ${bat}.`,
            `That's enormous. May have landed three rows back in the stands.`,
            `${bowl}'s figures take a hit — that's a top-drawer shot.`,
            `Just listen to the sweet sound the bat made there. Crisp.`,
            `The fielder didn't even bother moving, just admiring the distance.`,
        ];
        return { headline: pick(headlines, idx), detail: pick(details, idx + 1), accent: "text-purple-400" };
    }

    // FOUR
    if (ball.runs === 4) {
        const headlines = [
            `FOUR! ${bat} times it to perfection — races to the fence!`,
            `Cracking drive from ${bat} for FOUR! ${bowl} can only watch.`,
            `FOUR! Through the gap! Superb placement by ${bat}. The outfield is lightning fast and there was absolutely no touching that once it beat the inner ring.`,
            `${bat} finds the boundary! Flicks it off the pads for FOUR. The bowler dragged it agonizingly onto the legs and pays the ultimate price for the error.`,
            `Beautiful stroke from ${bat} — FOUR runs and the fielder didn't get close! That's just elegant batting, finding the gap with geometric precision.`,
            `FOUR! Cut shot — ${bat} frees the arms and bisects the field! A brilliant demonstration of hand-eye coordination to put away a very difficult delivery.`,
            `Elegant FOUR from ${bat}. That's a textbook cover drive. The coaches will be showing replays of that shot to youngsters for years to come.`,
            `FOUR! Short and wide from ${bowl} — ${bat} pounces immediately. A fierce strike that races across the turf, leaving a trail of dust in its wake.`,
            `Pulled away maliciously for four! ${bat} is dealing in boundaries. He saw the short ball early, rocked onto the back foot, and slapped it with sheer authority.`,
            `Swept fine for four runs! Fantastic innovative batting from ${bat}.`,
            `Down the ground! Past the bowler and it crosses the rope for four.`,
        ];
        const details = [
            `Timed to the fence. ${bowl} needed more pace there.`,
            `The fielder dived but had no chance. Brilliant footwork from ${bat}.`,
            `That gap was always there — ${bat} read it perfectly.`,
            `Electric running? No need — it raced there without breaking a sweat.`,
            `${bowl} looks frustrated. Two loose deliveries in a row now.`,
            `You don't need to run for those. Classic placement.`,
            `The outfield here is lightning fast, just gave it a tap.`,
        ];
        return { headline: pick(headlines, idx + 4), detail: pick(details, idx + 2), accent: "text-blue-400" };
    }

    // Dot ball
    if (ball.runs === 0) {
        const headlines = [
            `Dot ball. ${bowl} beats ${bat} outside off — absolute peach of a delivery! The batsman was caught in two minds and could only watch it zip past.`,
            `Good bowling! ${bowl} keeps it tight — no run off that delivery. The discipline from the bowling end is putting immense pressure on ${bat} right now.`,
            `${bat} defends solidly — dot ball. ${bowl} applying real pressure with consistent lines and lengths. It's a classic battle of patience between bat and ball.`,
            `Plays and misses! ${bowl} found the edge of the bat virtually, straight to keeper's hands but somehow missed. The bowler is deservedly holding their head.`,
            `Defence from ${bat} — good discipline from ${bowl}, forcing the error in judgment. Every dot ball increases the tension in the batting camp.`,
            `Dot! ${bowl} hits the seam and it jags away — ${bat} nearly edged it. That was subtle movement that could have easily produced a wicket.`,
            `No run. ${bat} is tied down — ${bowl} keeping an immaculate line. The bowler is giving nothing away, a masterclass in restrictive bowling.`,
            `Straight to the fielder! ${bat} hit it well but couldn't pierce the gap. The fielding unit is sharp and alert, closing down every possible run.`,
            `Ooh! That whistled past the off stump. ${bat} had absolutely no clue about that one. ${bowl} is finding some extra zip from the surface.`,
            `Solidly blocked by ${bat}. Respecting the good delivery. Sometimes the best shot is a solid defense to weather the storm.`,
            `Sharp bounce from ${bowl}! ${bat} sways out of the line cleverly. The bowler is testing the batsman's technique with some aggressive short-pitched stuff.`,
        ];
        const details = [
            `The bowler is in a great rhythm. That's three dots in a row now.`,
        ];
        return { headline: pick(headlines, idx + 7), detail: pick(details, idx), accent: "text-slate-400" };
    }

    // 1–3 runs
    const runLines: Record<number, string[]> = {
        1: [
            `Single taken — ${bat} rotates the strike, pushing to mid-on. It's sensible batting to keep things moving and not let the bowler settle.`,
            `Quick single! ${bat} and non-striker communicate well between the wickets. That was a sharp piece of running that stole a run from under the fielder's nose.`,
            `1 run — nudged to fine leg. Smart cricket from ${bat}. They are experts at finding the gaps and keeping the scoreboard ticking over consistently.`,
            `Pushed for one — ${bat} keeps the scoreboard ticking. A controlled push into the deep that allows for an easy trot to the other end.`,
            `Tapped playfully and they sprint for a quick single. The energy between the wickets is fantastic, putting the fielders under constant pressure.`,
            `Dropped it softly with soft hands and stole an easy run. Pure class from ${bat}, playing with the field and finding runs where others might see none.`,
        ],
        2: [
            `Two runs! Good running between the wickets from ${bat}. They pushed the first one hard and the second was never in doubt. Excellent intent shown here.`,
            `${bat} drills it to deep cover — comes back for 2! The placement was perfect, forcing the fielder to cover a lot of ground and allowing the second run.`,
            `Running well! ${bat} and partner pinch a quick 2. They are really testing the fielder's arm and winning the battle of wits on the field.`,
            `2 runs — cut to third man, fielder gets there quickly but can't prevent the brace. ${bat} is looking very comfortable in the middle today.`,
            `Excellent running! Pushed the fielder and made a comfortable two. That's the byproduct of great fitness and even better communication between the strikers.`,
        ],
        3: [
            `Three runs! ${bat} hits it into the gap and they push for the third. A fantastic effort from both batsmen to maximize the return from that stroke.`,
            `Superb running! They scrambled for the third run, putting the diving fielder under immense pressure. That's high-octane cricket at its very best.`,
            `3 runs — powered through the covers, the long boundary allows them to come back for three comfortably. ${bat} is finding the middle of the bat now.`,
        ],
    };

    const detailsMap: Record<number, string[]> = {
        1: [
            `Good rotation of strike here. It takes the pressure off both the batsmen.`,
            `The fielders need to be a bit more proactive. That single was too easy.`,
            `${bat} is looking to build an innings here, one run at a time.`,
            `The bowler is slightly off their line, allowing for these easy pickings.`,
        ],
        2: [
            `Fantastic intensity between the wickets. This is how you build a big total.`,
            `The outfield isn't quite fast enough to carry that to the rope, but two is a great result.`,
            `The captain is making some field adjustments after those two runs.`,
            `Precision placement from ${bat}, absolutely clinical.`,
        ],
        3: [
            `That's a lot of running! The batsmen are really working hard for every run.`,
            `The crowd is appreciating the effort. That was a marathon between the wickets.`,
            `The bowling side looks a bit deflated after conceding three on a single ball.`,
        ],
    };

    if (runLines[ball.runs]) {
        const lines = runLines[ball.runs];
        const details = detailsMap[ball.runs] || [];
        return {
            headline: pick(lines, idx),
            detail: details.length > 0 ? pick(details, idx + 1) : undefined,
            accent: ball.runs >= 2 ? "text-emerald-400" : "text-white"
        };
    }
    const lines = runLines[ball.runs] || [`${ball.runs} run${ball.runs !== 1 ? 's' : ''} — good work from ${bat}.`];
    return { headline: pick(lines, idx), accent: "text-green-400" };
};

export const MatchIntelligenceBlock = ({ ball }: { ball: Ball }) => {
    const type = (ball as any).insightType;
    const msg = ball.commentaryMessage;

    let Icon = Info;
    let colorScheme = {
        bg: "from-indigo-500/10 via-slate-950/80 to-blue-600/10",
        border: "border-indigo-500/40",
        iconBg: "bg-indigo-500/20",
        text: "text-indigo-400",
        label: "AI INSIGHT",
        glow: "shadow-indigo-500/20",
        accent: "bg-indigo-500"
    };

    if (type === 'Efficiency') {
        Icon = TrendingUp;
        colorScheme = {
            bg: "from-emerald-500/10 via-slate-950/80 to-teal-600/10",
            border: "border-emerald-500/40",
            iconBg: "bg-emerald-500/20",
            text: "text-emerald-400",
            label: "SPELL EFFICIENCY",
            glow: "shadow-emerald-500/20",
            accent: "bg-emerald-500"
        };
    } else if (type === 'Trend' || type === 'Momentum') {
        Icon = Activity; // Changed from Zap to Activity as Zap is not in lucide-react
        colorScheme = {
            bg: "from-purple-500/10 via-slate-950/80 to-pink-600/10",
            border: "border-purple-500/40",
            iconBg: "bg-purple-500/20",
            text: "text-purple-400",
            label: "MOMENTUM ALERT",
            glow: "shadow-purple-500/20",
            accent: "bg-purple-500"
        };
    } else if (type === 'Pressure') {
        Icon = Radar;
        colorScheme = {
            bg: "from-amber-500/10 via-slate-950/80 to-orange-600/10",
            border: "border-amber-500/40",
            iconBg: "bg-amber-500/20",
            text: "text-amber-400",
            label: "PRESSURE INDEX",
            glow: "shadow-amber-500/20",
            accent: "bg-amber-500"
        };
    } else if (type === 'Matchup') {
        Icon = Target;
        colorScheme = {
            bg: "from-cyan-500/10 via-slate-950/80 to-blue-600/10",
            border: "border-cyan-500/40",
            iconBg: "bg-cyan-500/20",
            text: "text-cyan-400",
            label: "TACTICAL MATCHUP",
            glow: "shadow-cyan-500/20",
            accent: "bg-cyan-500"
        };
    }

    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${colorScheme.bg} border ${colorScheme.border} shadow-lg ${colorScheme.glow} backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorScheme.accent}`}></div>
            <div className="p-4 flex items-start gap-4">
                <div className={`shrink-0 p-2.5 rounded-lg ${colorScheme.iconBg} ring-1 ring-inset ${colorScheme.border}`}>
                    <Icon size={20} className={colorScheme.text} />
                </div>
                <div className="flex-1 min-w-0">
                    <h5 className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5 ${colorScheme.text} opacity-90`}>
                        {colorScheme.label}
                    </h5>
                    <p className="text-slate-200 text-sm leading-relaxed font-medium">
                        {msg}
                    </p>
                </div>
            </div>
        </div>
    );
};

const buildScorecardFromBalls = (balls: Ball[], innings: 1 | 2) => {
    const innBalls = balls.filter(b => b.inning === innings);

    // Batting
    const batsmanMap: Record<string, { runs: number; balls: number; fours: number; sixes: number; out: boolean; wicketInfo: string }> = {};
    for (const ball of innBalls) {
        if (!ball.batsman || ball.isCommentaryOnly || ball.batsman.includes("Commentary")) continue;

        if (!batsmanMap[ball.batsman]) {
            batsmanMap[ball.batsman] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false, wicketInfo: "not out" };
        }
        const s = batsmanMap[ball.batsman];
        if (ball.extraType !== "wide") s.balls++;
        if (ball.extraType === "none" || ball.extraType === "noball") {
            s.runs += ball.runs;
            if (ball.runs === 4) s.fours++;
            if (ball.runs === 6) s.sixes++;
        }
        if (ball.wicket?.isWicket && ball.wicket.playerOut === ball.batsman) {
            s.out = true;
            const wtype = ball.wicket.type || 'out';
            const fielderName = (ball.wicket as any).fielder;
            if (wtype === 'caught') {
                s.wicketInfo = fielderName ? `c ${fielderName} b ${ball.bowler}` : `c unknown b ${ball.bowler}`;
            } else if (wtype === 'runout') {
                s.wicketInfo = fielderName ? `run out (${fielderName})` : `run out`;
            } else if (wtype === 'stumped') {
                s.wicketInfo = fielderName ? `st ${fielderName} b ${ball.bowler}` : `stumped b ${ball.bowler}`;
            } else if (wtype === 'caught and bowled') {
                s.wicketInfo = `c & b ${ball.bowler}`;
            } else if (wtype === 'lbw') {
                s.wicketInfo = `lbw b ${ball.bowler}`;
            } else if (wtype === 'bowled') {
                s.wicketInfo = `b ${ball.bowler}`;
            } else if (wtype === 'hitwicket') {
                s.wicketInfo = `hit wicket b ${ball.bowler}`;
            } else {
                s.wicketInfo = `${wtype} b ${ball.bowler}`;
            }
        }
    }

    // Bowling
    const bowlerMap: Record<string, { balls: number; runs: number; wickets: number }> = {};
    for (const ball of innBalls) {
        if (!ball.bowler || ball.isCommentaryOnly || ball.bowler.includes("Commentary")) continue;

        if (!bowlerMap[ball.bowler]) bowlerMap[ball.bowler] = { balls: 0, runs: 0, wickets: 0 };
        const s = bowlerMap[ball.bowler];
        if (ball.extraType !== "wide" && ball.extraType !== "noball") s.balls++;
        // Byes and Leg-byes are not attributed to the bowler's runs conceded
        if (ball.extraType !== "bye" && ball.extraType !== "legbye") {
            s.runs += ball.totalBallRuns;
        }
        if (ball.wicket?.isWicket) s.wickets++;
    }

    // Totals
    let runs = 0;
    let wickets = 0;
    const extras = { wide: 0, noball: 0, bye: 0, legbye: 0, total: 0 };

    for (const ball of innBalls) {
        if (ball.isCommentaryOnly) continue;
        runs += ball.totalBallRuns;
        if (ball.wicket?.isWicket) wickets++;
        if (ball.extraType !== 'none') {
            extras.total += ball.extraRuns || 0;
            if (ball.extraType === 'wide') extras.wide += ball.extraRuns || 0;
            else if (ball.extraType === 'noball') extras.noball += ball.extraRuns || 0;
            else if (ball.extraType === 'bye') extras.bye += ball.extraRuns || 0;
            else if (ball.extraType === 'legbye') extras.legbye += ball.extraRuns || 0;
        }
    }

    return {
        batsmen: Object.entries(batsmanMap).map(([name, s]) => ({ name, ...s, sr: s.balls > 0 ? parseFloat(((s.runs / s.balls) * 100).toFixed(1)) : 0 })),
        bowlers: Object.entries(bowlerMap).map(([name, s]) => ({
            name, ...s,
            overs: `${Math.floor(s.balls / 6)}.${s.balls % 6}`,
            economy: s.balls > 0 ? parseFloat((s.runs / (s.balls / 6)).toFixed(2)) : 0,
        })),
        runs,
        wickets,
        extras
    };
};

const generateDetailedMatchSummary = (match: Match, balls: Ball[], team1: any, team2: any, score1: any, score2: any, motm: any) => {
    if (!match.result || match.status !== "Completed" || !team1 || !team2 || !score1 || !score2) return null;

    const winnerName = match.result.winner === team1._id ? team1.name : (match.result.winner === team2._id ? team2.name : "None");
    const loserName = match.result.winner === team1._id ? team2.name : team1.name;
    const isTie = match.result.isTie;

    const inn1 = balls.filter(b => b.inning === 1);
    const inn2 = balls.filter(b => b.inning === 2);

    let highestBat1 = { name: '', runs: -1 };
    let highestBat2 = { name: '', runs: -1 };
    let bestBowl1 = { name: '', wkt: -1, runs: 999 };
    let bestBowl2 = { name: '', wkt: -1, runs: 999 };

    const sc1 = buildScorecardFromBalls(balls, 1);
    const sc2 = buildScorecardFromBalls(balls, 2);

    sc1.batsmen.forEach(b => { if (b.runs > highestBat1.runs) highestBat1 = { name: b.name, runs: b.runs }; });
    sc2.batsmen.forEach(b => { if (b.runs > highestBat2.runs) highestBat2 = { name: b.name, runs: b.runs }; });
    sc1.bowlers.forEach(b => { if (b.wickets > bestBowl1.wkt || (b.wickets === bestBowl1.wkt && b.runs < bestBowl1.runs)) bestBowl1 = { name: b.name, wkt: b.wickets, runs: b.runs }; });
    sc2.bowlers.forEach(b => { if (b.wickets > bestBowl2.wkt || (b.wickets === bestBowl2.wkt && b.runs < bestBowl2.runs)) bestBowl2 = { name: b.name, wkt: b.wickets, runs: b.runs }; });

    // Build the narrative paragraphs
    const paragraphs = [];

    // Para 1: The Result and Toss
    if (isTie) {
        paragraphs.push(`What an absolute thriller we witnessed at ${match.venue || 'the stadium'}! The match ended in an unbelievable tie between ${team1.name} and ${team2.name}, with neither side able to snatch the victory after a grueling contest of ${(match as any).matchType || 'T20'} cricket.`);
    } else {
        const marginStr = match.result.margin ? ` by a margin of ${match.result.margin}` : ` convincingly`;
        paragraphs.push(`A spectacular display of cricket at ${match.venue || 'the stadium'} saw ${winnerName} emerge victorious against ${loserName}${marginStr}. ${match.toss ? `Earlier in the day, the toss was won by ${match.toss.win === team1._id ? team1.name : team2.name}, who elected to ${match.toss.decision.toLowerCase()} first — a decision that shaped the trajectory of this fascinating contest.` : `It was a hard-fought battle from the first ball to the last.`}`);
    }

    // Para 2: First Innings Story
    if (highestBat1.runs >= 0) {
        paragraphs.push(`Batting first, ${match.toss?.decision === 'Batting' && match.toss?.win === team2._id ? team2.name : team1.name} posted a memorable total of ${score1.runs}/${score1.wickets} in their allotted ${formatOvers(score1.overs)} overs. The innings was anchored by a phenomenal knock from ${highestBat1.name}, who smashed ${highestBat1.runs} runs to give the team a solid platform. ${bestBowl1.wkt >= 0 ? `The bowling unit tried to restrict the flow of runs, with ${bestBowl1.name} standing out as the pick of the bowlers in the first innings, returning figures of ${bestBowl1.wkt} wickets for ${bestBowl1.runs} runs.` : ''}`);
    } else {
        paragraphs.push(`Batting first, ${match.toss?.decision === 'Batting' && match.toss?.win === team2._id ? team2.name : team1.name} posted a total of ${score1.runs}/${score1.wickets} in their allotted ${formatOvers(score1.overs)} overs.`);
    }

    // Para 3: Second Innings Chase
    const chaseTarget = score1.runs + 1;
    if (winnerName === (match.toss?.decision === 'Batting' && match.toss?.win === team2._id ? team1.name : team2.name)) {
        paragraphs.push(`In pursuit of the target of ${chaseTarget}, the chasing side paced their innings beautifully. Despite losing ${score2.wickets} wickets, they managed to chase down the total, finishing at ${score2.runs}/${score2.wickets} in ${formatOvers(score2.overs)} overs. ${highestBat2.runs >= 0 ? `The hero of the chase was undoubtedly ${highestBat2.name}, whose masterclass of ${highestBat2.runs} runs ensured that the required run rate was always within reach.` : ''} ${bestBowl2.wkt >= 0 ? `Though ${bestBowl2.name} put up a valiant fight taking ${bestBowl2.wkt} wickets, it wasn't enough to stop the batting onslaught.` : ''}`);
    } else if (isTie) {
        paragraphs.push(`The chase was a rollercoaster of emotions. The batting side fought tooth and nail to reach the target of ${chaseTarget}, but agonizingly fell short by just a fraction, ending their reply tied at ${score2.runs}/${score2.wickets} after ${formatOvers(score2.overs)} overs. ${highestBat2.runs >= 0 ? `${highestBat2.name}'s gritty contribution of ${highestBat2.runs} runs kept them alive, but fiery spells from ${bestBowl2.name} (${bestBowl2.wkt} wickets) kept taking crucial bites out of the batting order.` : ''}`);
    } else {
        paragraphs.push(`Faced with a daunting target of ${chaseTarget}, the chase never quite found its momentum under immense scoreboard pressure. They struggled to build partnerships and ultimately succumbed, ending their innings at ${score2.runs}/${score2.wickets} in ${formatOvers(score2.overs)} overs. ${highestBat2.runs >= 0 ? `While ${highestBat2.name} showed resistance with a fighting ${highestBat2.runs}, the bowling attack was simply too lethal.` : ''} ${bestBowl2.wkt >= 0 ? `${bestBowl2.name} dismantled the lineup, picking up ${bestBowl2.wkt} crucial wickets to seal a dominant victory defending the total.` : ''}`);
    }

    // Para 4: Conclusion & MOM
    if (motm) {
        paragraphs.push(`For a truly exceptional all-round performance that shifted the momentum of the game, ${motm.name} was rightfully crowned the Player of the Match. With ${motm.runs > 0 ? motm.runs + ' crucial runs ' : ''}${motm.wickets > 0 && motm.runs > 0 ? 'and ' : ''}${motm.wickets > 0 ? motm.wickets + ' vital wickets' : ''}, they delivered when it mattered most. A phenomenal game of cricket that fans will be talking about for quite some time!`);
    }

    return paragraphs;
};

export const TournamentMatchDetail = ({ match: initialMatch, overs, onBack }: Props) => {
    const [match, setMatch] = useState<Match>(initialMatch);
    const [tab, setTab] = useState<DetailTab>("live");
    const [activeScorecardInning, setActiveScorecardInning] = useState<1 | 2>(1);
    const [hasAutoSwitchedInning, setHasAutoSwitchedInning] = useState(false);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBatsman, setSelectedBatsman] = useState<{ name: string; inning: number } | null>(null);
    const [selectedBowler, setSelectedBowler] = useState<{ name: string; inning: number } | null>(null);
    const [playerStatsCache, setPlayerStatsCache] = useState<Record<string, any>>({});
    const [matchupCache, setMatchupCache] = useState<Record<string, any>>({});

    useEffect(() => {
        setMatch(initialMatch);
    }, [initialMatch._id]);

    useEffect(() => {
        if (balls.some(b => b.inning === 2) && !hasAutoSwitchedInning) {
            setActiveScorecardInning(2);
            setHasAutoSwitchedInning(true);
        }
    }, [balls, hasAutoSwitchedInning]);

    const fetchBalls = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            // Fetch both balls and latest match details (for real-time score)
            const [res, matchRes] = await Promise.all([
                customMatchApi.getBalls(match._id),
                customMatchApi.getById(match._id)
            ]);

            // Update match details if successful
            if ((matchRes as any).success && (matchRes as any).data) {
                setMatch((matchRes as any).data);
            }

            const sorted = (res.data || []).sort((a: Ball, b: Ball) => {
                if (a.inning !== b.inning) return a.inning - b.inning;
                if (a.over !== b.over) return a.over - b.over;
                if (a.ball !== b.ball) return a.ball - b.ball;
                return (a._id || "").localeCompare(b._id || "");
            });
            // Deduplicate balls
            const uniqueBalls: Ball[] = [];
            const seenIds = new Set<string>();
            for (const b of sorted) {
                if (b._id) {
                    if (seenIds.has(b._id)) continue;
                    seenIds.add(b._id);
                }
                uniqueBalls.push(b);
            }
            setBalls(uniqueBalls);
        } catch {
            // ignore
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBalls();
        // Auto-refresh for live matches
        if (match.status === "Live") {
            const interval = setInterval(() => fetchBalls(), 10000);
            return () => clearInterval(interval);
        }
    }, [match._id, match.status]);

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

        // Identify new bowler events and their corresponding batsmen at that moment
        const seenBowlersInInning = new Set<string>();
        const currentInningBalls: Ball[] = [];

        for (let i = 0; i < balls.length; i++) {
            const b = balls[i];
            if (b.isCommentaryOnly || !b.bowler) continue;

            const bKey = `${b.inning}-${b.bowler}`;
            if (!seenBowlersInInning.has(bKey)) {
                seenBowlersInInning.add(bKey);
                // This is a new bowler introduction. Identify batsmen at this moment.
                // We look at the most recent real ball before this one to find the batsmen.
                let striker = b.batsman;
                let nonStriker = b.nonStriker;

                if (!striker || !nonStriker) {
                    const lastRealBall = balls.slice(0, i).reverse().find(rb => !rb.isCommentaryOnly && rb.inning === b.inning);
                    if (lastRealBall) {
                        striker = striker || lastRealBall.batsman;
                        nonStriker = nonStriker || lastRealBall.nonStriker;
                    }
                }

                const batsmen = [striker, nonStriker].filter(Boolean) as string[];

                batsmen.forEach(bat => {
                    const mKey = `${b.bowler}-${bat}`;
                    if (!matchupCache[mKey]) {
                        playerApi.getMatchup(bat, b.bowler)
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
            }
        }
    }, [balls]);

    const manOfTheMatch = useMemo(() => {
        if (!match.result || match.status !== "Completed" || balls.length === 0) return null;

        const playerStats: Record<string, { name: string; runs: number; wickets: number; points: number; ballsFaced: number; boundaries: number }> = {};

        balls.forEach(ball => {
            // Batting
            if (ball.batsman) {
                if (!playerStats[ball.batsman]) playerStats[ball.batsman] = { name: ball.batsman, runs: 0, wickets: 0, points: 0, ballsFaced: 0, boundaries: 0 };
                const s = playerStats[ball.batsman];
                if (ball.extraType !== "wide") s.ballsFaced += 1;
                if (ball.extraType === "none" || ball.extraType === "noball") {
                    s.runs += ball.runs;
                    s.points += ball.runs; // 1 pt per run
                    if (ball.runs === 4) { s.boundaries += 1; s.points += 1; }
                    if (ball.runs === 6) { s.boundaries += 1; s.points += 2; }
                }
            }

            // Bowling
            if (ball.bowler && ball.wicket?.isWicket && ball.wicket.type !== 'runout') {
                if (!playerStats[ball.bowler]) playerStats[ball.bowler] = { name: ball.bowler, runs: 0, wickets: 0, points: 0, ballsFaced: 0, boundaries: 0 };
                playerStats[ball.bowler].wickets += 1;
                playerStats[ball.bowler].points += 25; // 25 pts per wicket
            }
        });

        // Bonuses
        Object.values(playerStats).forEach(p => {
            if (p.runs >= 30) p.points += 5;
            if (p.runs >= 50) p.points += 10;
            if (p.runs >= 100) p.points += 20;
            if (p.wickets >= 3) p.points += 10;
            if (p.wickets >= 5) p.points += 20;
        });

        let bestPlayer = null;
        let maxPoints = -1;

        Object.values(playerStats).forEach(p => {
            if (p.points > maxPoints) {
                maxPoints = p.points;
                bestPlayer = p;
            }
        });

        return bestPlayer;
    }, [balls, match.result, match.status]);

    const inn1 = balls.filter(b => b.inning === 1);
    const inn2 = balls.filter(b => b.inning === 2);
    const sc1 = buildScorecardFromBalls(balls, 1);
    const sc2 = buildScorecardFromBalls(balls, 2);

    const atCrease = useMemo(() => {
        if (balls.length === 0) return [];
        const activeSc = match.currentInnings === 1 ? sc1 : sc2;
        const currentInningBalls = balls.filter(b => b.inning === match.currentInnings && !b.isCommentaryOnly);
        if (currentInningBalls.length === 0) return [];
        const last = currentInningBalls[currentInningBalls.length - 1];
        const names = [last.batsman, last.nonStriker].filter(Boolean) as string[];
        const result: any[] = [];
        for (const name of names) {
            const stat = activeSc.batsmen.find(s => s.name === name);
            if (stat && !stat.out) result.push(stat);
        }
        return result;
    }, [balls, match.currentInnings, sc1, sc2]);

    const currentBowler = useMemo(() => {
        const activeSc = match.currentInnings === 1 ? sc1 : sc2;
        const currentInningBalls = balls.filter(b => b.inning === match.currentInnings && !b.isCommentaryOnly);
        if (currentInningBalls.length === 0) return null;
        const last = currentInningBalls[currentInningBalls.length - 1];
        return activeSc.bowlers.find(s => s.name === last.bowler) || null;
    }, [balls, match.currentInnings, sc1, sc2]);

    const tabs = [
        { id: "summary" as const, label: "Summary", icon: Trophy },
        { id: "live" as const, label: "Live", icon: MessageSquare },
        { id: "scorecard" as const, label: "Scorecard", icon: ClipboardList },
        { id: "lineups" as const, label: "Lineups", icon: Users },
        { id: "lab" as const, label: "Performance Lab", icon: BarChart3 },
    ];

    const isLive = match.status === "Live";
    const score1 = match.score?.team1;
    const score2 = match.score?.team2;
    const team1 = match.homeTeam;
    const team2 = match.awayTeam;

    const detailedSummary = useMemo(() => {
        return generateDetailedMatchSummary(match, balls, team1, team2, score1, score2, manOfTheMatch);
    }, [match, balls, team1, team2, score1, score2, manOfTheMatch]);

    /* ── Enhanced stats for score card ── */
    const currentInningBalls = useMemo(() => {
        return balls.filter(b => b.inning === match.currentInnings && !b.isCommentaryOnly);
    }, [balls, match.currentInnings]);

    const totalLegalBalls = currentInningBalls.filter(b => b.extraType !== "wide" && b.extraType !== "noball").length;
    const crrAdmin = totalLegalBalls > 0 ? (((match.currentInnings === 1 ? score1 : score2)?.runs || 0) / (totalLegalBalls / 6)).toFixed(2) : "0.00";

    const totalOvers = (match.tournament as any)?.overs || 20;
    let targetAdmin = 0;
    let rrrAdmin = "--";
    if (match.currentInnings === 2 && score1) {
        targetAdmin = score1.runs + 1;
        const remaining = targetAdmin - (score2?.runs || 0);
        const ballsLeft = totalOvers * 6 - totalLegalBalls;
        if (ballsLeft > 0) rrrAdmin = (remaining / (ballsLeft / 6)).toFixed(2);
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
    const last6Balls = useMemo(() => {
        return currentInningBalls.slice(-6);
    }, [currentInningBalls]);

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
        if (b.extraType === "wide") return "WD";
        if (b.extraType === "noball") return "NB";
        return String(b.runs);
    };

    /* ── Win Predictor ── */
    const winProb = useMemo(() => {
        if (match.status !== "Live" || !score1 || !score2) return null;
        
        const battingInning = match.currentInnings || 1;
        const battingScore = battingInning === 1 ? score1 : score2;
        const battingTeamName = battingInning === 1 ? team1?.name : team2?.name;
        const bowlingTeamName = battingInning === 1 ? team2?.name : team1?.name;
        
        const prob = calculateWinProbability({
            inning: battingInning,
            runs: battingScore.runs,
            wickets: battingScore.wickets,
            ballsBowled: totalLegalBalls,
            totalOvers: totalOvers,
            target: battingInning === 2 ? (score1.runs + 1) : undefined,
            matchType: match.tournament?.matchType || 'T20'
        });

        const battingAdvantage = prob;
        const bowlingAdvantage = 100 - prob;

        return {
            team1Name: battingTeamName || "Team 1",
            team1Pct: Math.round(battingAdvantage),
            team2Name: bowlingTeamName || "Team 2",
            team2Pct: Math.round(bowlingAdvantage),
        };
    }, [match, score1, score2, totalLegalBalls, totalOvers, team1, team2]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-400 hover:text-white h-9 w-9">
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1">
                    <h3 className="text-white font-bold">{team1?.name} vs {team2?.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {match.venue}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(match.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isLive && (
                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full font-bold animate-pulse">LIVE</span>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => fetchBalls(true)} disabled={refreshing}>
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Loading match data...
                </div>
            ) : (
                <>
                    {/* Main score card */}
                    <Card className="bg-slate-900 border-slate-700">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-6">
                                {/* Team 1 */}
                                <div className="flex-1 text-center">
                                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-2 overflow-hidden border border-slate-700">
                                        {team1?.logo ? <img src={team1.logo} className="w-full h-full object-cover" /> : <Shield className="w-7 h-7 text-blue-400" />}
                                    </div>
                                    <p className="text-white font-bold">{team1?.name}</p>
                                    {score1 && (
                                        <p className={`text-2xl font-black mt-1 ${match.result?.winner === team1?._id ? 'text-green-400' : 'text-white'}`}>
                                            {score1.runs}/{score1.wickets}
                                        </p>
                                    )}
                                    {score1 && <p className="text-slate-500 text-xs">({formatOvers(score1.overs)} ov)</p>}
                                </div>

                                <div className="text-center px-4">
                                    <p className="text-slate-600 font-black text-2xl italic">VS</p>
                                    {match.result && !match.result.isTie && !match.result.isNoResult && match.result.winner && (
                                        <div className="mt-2 text-xs text-center">
                                            <p className="text-green-400 font-bold">
                                                {match.result.winner === team1?._id ? team1?.name : team2?.name} {match.result.margin?.toLowerCase().startsWith('won by') ? match.result.margin : `won by ${match.result.margin || ""}`}
                                            </p>
                                        </div>
                                    )}
                                    {match.result?.isTie && <p className="text-yellow-400 text-xs font-bold mt-2">Match Tied</p>}
                                </div>

                                {/* Team 2 */}
                                <div className="flex-1 text-center">
                                    <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-2 overflow-hidden border border-slate-700">
                                        {team2?.logo ? <img src={team2.logo} className="w-full h-full object-cover" /> : <Shield className="w-7 h-7 text-red-400" />}
                                    </div>
                                    <p className="text-white font-bold">{team2?.name}</p>
                                    {score2 && (
                                        <p className={`text-2xl font-black mt-1 ${match.result?.winner === team2?._id ? 'text-green-400' : 'text-white'}`}>
                                            {score2.runs}/{score2.wickets}
                                        </p>
                                    )}
                                    {score2 && <p className="text-slate-500 text-xs">({formatOvers(score2.overs)} ov)</p>}
                                </div>
                            </div>

                            {/* ── Results Strip ── */}
                            {match.status === "Completed" && match.result && (
                                <div className="mt-6 flex justify-center">
                                    <div className="bg-gradient-to-r from-blue-900/40 via-slate-800/60 to-blue-900/40 border border-blue-500/30 px-8 py-3 rounded-2xl shadow-lg backdrop-blur-sm group">
                                        <p className="text-blue-400 font-black text-lg tracking-wider text-center flex items-center gap-3">
                                            <Trophy className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                                            {match.result.isTie ? "MATCH TIED" :
                                                match.result.isNoResult ? "NO RESULT" :
                                                    `${match.result.winner === team1?._id ? team1?.name : team2?.name} ${match.result.margin?.toLowerCase().startsWith('won by') ? match.result.margin : `WON BY ${match.result.margin || ""}`}`.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Enhanced Stats Row (Hidden if Completed) ── */}
                            {balls.length > 0 && match.status !== "Completed" && (
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <div className="flex justify-center gap-6 flex-wrap">
                                        <div className="text-center">
                                            <p className="text-slate-500 text-[10px] uppercase tracking-widest">CRR</p>
                                            <p className="text-lg font-bold text-blue-400">{crrAdmin}</p>
                                        </div>
                                        {match.currentInnings === 2 && (
                                            <>
                                                <div className="text-center">
                                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">RRR</p>
                                                    <p className="text-lg font-bold text-orange-400">{rrrAdmin}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">Target</p>
                                                    <p className="text-lg font-bold text-yellow-400">{targetAdmin}</p>
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
                                    {/* At This Stage OR Last 6 balls */}
                                    {match.currentInnings === 2 && atThisStageInfo ? (
                                        <div className="flex justify-center mt-4 pt-3 border-t border-slate-700/50">
                                            <div className="text-center">
                                                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1 font-semibold">At This Stage</p>
                                                <p className="text-sm text-slate-300">
                                                    <span className="text-white font-bold">{atThisStageInfo.teamName}</span> were <span className="text-emerald-400 font-bold">{atThisStageInfo.runs}/{atThisStageInfo.wickets}</span> <span className="text-slate-500">({atThisStageInfo.overs})</span>
                                                </p>
                                            </div>
                                        </div>
                                    ) : last6Balls.length > 0 && (
                                        <div className="flex justify-center gap-1.5 mt-3 pt-3 border-t border-slate-700/50">
                                            {last6Balls.map((b, i) => (
                                                <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border ${getBallChipStyle(b)}`}>
                                                    {getBallChipLabel(b)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Win Predictor Bar ── */}
                    {winProb && isLive && (
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


                    {/* Premium Live Mini-Scorecard */}
                    {match.status === "Live" && (
                        <div className="mb-4">
                            <LiveStatCard atCrease={atCrease} currentBowler={currentBowler} />
                        </div>
                    )}

                    {/* Tab bar */}
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${tab === t.id ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <t.icon size={13} />
                                <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Player of the match */}
                    {manOfTheMatch && (
                        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 rounded-xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <Award size={24} />
                                </div>
                                <div>
                                    <p className="text-yellow-500/80 text-xs font-bold uppercase tracking-wider mb-0.5">Player of the Match</p>
                                    <p className="text-white text-lg font-black">{manOfTheMatch.name}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                {manOfTheMatch.runs > 0 && (
                                    <div className="text-center px-2">
                                        <p className="text-white font-bold">{manOfTheMatch.runs}</p>
                                        <p className="text-slate-400 text-[10px] uppercase">Runs</p>
                                    </div>
                                )}
                                {manOfTheMatch.wickets > 0 && (
                                    <div className="text-center px-2">
                                        <p className="text-white font-bold">{manOfTheMatch.wickets}</p>
                                        <p className="text-slate-400 text-[10px] uppercase">Wickets</p>
                                    </div>
                                )}
                                <div className="text-center px-2 border-l border-yellow-500/20 pl-4">
                                    <p className="text-yellow-400 font-bold">{manOfTheMatch.points}</p>
                                    <p className="text-yellow-500/70 text-[10px] uppercase">Pts</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUMMARY TAB */}
                    {tab === "summary" && (
                        <div className="space-y-4">
                            {match.status === "Upcoming" && (
                                <PreMatchForecast match={match} />
                            )}

                            {/* Match Intelligence Center (Summary View) */}
                            {match.status === "Live" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-[0.2em] mb-2 px-1">
                                        <Zap size={14} className="text-yellow-400 animate-pulse" />
                                        <span>AI Match Intelligence</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {(() => {
                                            const sortedBalls = [...balls].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

                                            // Filter explicit insights
                                            const explicit = sortedBalls.filter(b => b.isCommentaryOnly && (b as any).insightType && (b as any).insightType !== 'None');

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

                            {/* Match info */}

                            <div className="grid grid-cols-2 gap-3">
                                {match.toss && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                                        <p className="text-slate-500 text-xs mb-1">Toss</p>
                                        <p className="text-white text-sm font-medium">
                                            {match.toss.win === team1?._id ? team1?.name : team2?.name} won, chose to {match.toss.decision.toLowerCase()}
                                        </p>
                                    </div>
                                )}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                                    <p className="text-slate-500 text-xs mb-1">Format</p>
                                    <p className="text-white text-sm font-medium">{overs} Overs</p>
                                </div>
                                {score1 && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                                        <p className="text-slate-500 text-xs mb-1">{team1?.name} Run Rate</p>
                                        <p className="text-blue-400 text-sm font-bold">
                                            {score1.overs > 0 ? (score1.runs / score1.overs).toFixed(2) : "—"}
                                        </p>
                                    </div>
                                )}
                                {score2 && (
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                                        <p className="text-slate-500 text-xs mb-1">{team2?.name} Run Rate</p>
                                        <p className="text-red-400 text-sm font-bold">
                                            {score2.overs > 0 ? (score2.runs / score2.overs).toFixed(2) : "—"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* ── Match Awards Section ── */}
                            {match.status === "Completed" && (
                                <div className="space-y-3 mt-6">
                                    <h5 className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] px-1 flex items-center gap-2">
                                        <Award size={12} className="text-yellow-500" /> Match Awards
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {(() => {
                                            const awards = [];
                                            
                                            // 1. Man of the Match (MVP)
                                            if (manOfTheMatch) {
                                                awards.push({
                                                    title: "Match MVP",
                                                    name: manOfTheMatch.name,
                                                    icon: <Trophy className="text-yellow-500" size={18} />,
                                                    desc: `${manOfTheMatch.runs} runs & ${manOfTheMatch.wickets} wickets`,
                                                    color: "from-yellow-500/20 to-amber-600/10 border-yellow-500/40"
                                                });
                                            }

                                            // Combine all batsmen and bowlers from both innings
                                            const allBatsmen = [...sc1.batsmen, ...sc2.batsmen];
                                            const allBowlers = [...sc1.bowlers, ...sc2.bowlers];

                                            // 2. Electric Striker (Highest SR, min 6 balls)
                                            const striker = allBatsmen
                                                .filter(b => b.balls >= 6)
                                                .sort((a, b) => b.sr - a.sr)[0];
                                            if (striker && striker.sr >= 150) {
                                                awards.push({
                                                    title: "Electric Striker",
                                                    name: striker.name,
                                                    icon: <Zap className="text-blue-400" size={18} />,
                                                    desc: `SR of ${striker.sr}`,
                                                    color: "from-blue-500/20 to-blue-600/10 border-blue-500/40"
                                                });
                                            }

                                            // 3. Solid Anchor (Most balls faced, min 15)
                                            const anchor = allBatsmen
                                                .filter(b => b.balls >= 15)
                                                .sort((a, b) => b.balls - a.balls)[0];
                                            if (anchor) {
                                                awards.push({
                                                    title: "Solid Anchor",
                                                    name: anchor.name,
                                                    icon: <Activity className="text-emerald-400" size={18} />,
                                                    desc: `Faced ${anchor.balls} balls`,
                                                    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/40"
                                                });
                                            }

                                            // 4. Bowling Maestro (Best Economy, min 1 over)
                                            const maestro = allBowlers
                                                .filter(b => b.balls >= 6)
                                                .sort((a, b) => a.economy - b.economy)[0];
                                            if (maestro && maestro.economy <= 7.0) {
                                                awards.push({
                                                    title: "Bowling Maestro",
                                                    name: maestro.name,
                                                    icon: <Sparkles className="text-purple-400" size={18} />,
                                                    desc: `Economy of ${maestro.economy}`,
                                                    color: "from-purple-500/20 to-indigo-600/10 border-purple-500/40"
                                                });
                                            }

                                            // 5. Boundary King (Most 4s + 6s)
                                            const boundaryKing = allBatsmen
                                                .map(b => ({ ...b, total: b.fours + b.sixes }))
                                                .filter(b => b.total >= 3)
                                                .sort((a, b) => b.total - a.total)[0];
                                            if (boundaryKing) {
                                                awards.push({
                                                    title: "Boundary King",
                                                    name: boundaryKing.name,
                                                    icon: <Flame className="text-orange-500" size={18} />,
                                                    desc: `${boundaryKing.total} boundaries hit`,
                                                    color: "from-orange-500/20 to-red-600/10 border-orange-500/40"
                                                });
                                            }

                                            if (awards.length === 0) return (
                                                <div className="col-span-full py-6 text-center bg-slate-900 border border-slate-800 rounded-xl">
                                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No significant awards for this match</p>
                                                </div>
                                            );

                                            return awards.map((a, idx) => (
                                                <Card key={idx} className={`bg-gradient-to-br ${a.color} border overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
                                                    <CardContent className="p-4 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10 shrink-0 group-hover:rotate-12 transition-transform">
                                                            {a.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{a.title}</p>
                                                            <p className="text-white text-sm font-bold truncate">{a.name}</p>
                                                            <p className="text-white/60 text-[11px] font-medium">{a.desc}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* ── Match Performance Highlights ── */}
                            <div className="space-y-3 mt-6">
                                <h5 className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] px-1">Performance Highlights</h5>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                                            <TrendingUp size={20} className="text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-bold mb-1">Scoring Momentum</p>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                {(() => {
                                                    const winnerId = match.result?.winner;
                                                    const winName = winnerId === team1?._id ? team1?.name : (winnerId === team2?._id ? team2?.name : 'The match');
                                                    
                                                    return match.status === "Live" ? (
                                                        match.currentInnings === 1
                                                            ? `${team1?.name} is maintaining a run rate of ${crrAdmin}. Projected total based on current tempo is ${Math.round(parseFloat(crrAdmin) * (match.tournament as any)?.overs || 20)}.`
                                                            : `${team2?.name} needs ${rrrAdmin} runs per over to win. Currently scoring at ${crrAdmin}.`
                                                    ) : (
                                                        `This match has concluded. ${winName} emerged as the winner in a highly competitive encounter.`
                                                    );
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* ... rest of existing highlights ... */}
                                    {partnershipInfo && match.status === "Live" && (
                                        <div className="flex items-start gap-4 border-t border-slate-800/50 pt-5">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                                <Users size={20} className="text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-bold mb-1">Current Partnership Record</p>
                                                <p className="text-slate-400 text-xs leading-relaxed">
                                                    The stand between {atCrease[0]?.name} and {atCrease[1]?.name || 'partner'} has reached <span className="text-white font-medium">{partnershipInfo.runs} runs off {partnershipInfo.balls} balls</span>.
                                                    This is building stability for the innings.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {atCrease.length >= 1 && match.status === "Live" && (
                                        <div className="flex items-start gap-4 border-t border-slate-800/50 pt-5">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                                                <Activity size={20} className="text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-bold mb-1">Game Context & Overview</p>
                                                <p className="text-slate-400 text-xs leading-relaxed">
                                                    {atCrease[0].name} ({atCrease[0].runs}) is currently leading the charge.
                                                    {currentBowler ? `Tactical observation: ${currentBowler.name} is bowling tight lines with an economy of ${currentBowler.economy}.` : 'Bowling change anticipated soon.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SCORECARD TAB */}
                    {tab === "scorecard" && (
                        <div className="space-y-6">
                            {balls.some(b => b.inning === 2) && (
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

                            {[{ sc: sc1, teamName: team1?.name, innNum: 1, teamPlayers: team1?.players, color: "text-blue-400" }, { sc: sc2, teamName: team2?.name, innNum: 2, teamPlayers: team2?.players, color: "text-red-400" }]
                                .filter(item => item.innNum === activeScorecardInning && (item.innNum === 1 || balls.some(b => b.inning === 2)))
                                .map(({ sc, teamName, innNum, teamPlayers, color }) => {
                                     const inningBalls = balls.filter(b => b.inning === innNum && !b.isCommentaryOnly);
                                     
                                     // Detailed extras calculation
                                     const extrasBreakdown = inningBalls.reduce((acc, b) => {
                                         if (b.extraType === 'wide') acc.w += (b.extraRuns || 0);
                                         else if (b.extraType === 'noball') acc.nb += (b.extraRuns || 0);
                                         else if (b.extraType === 'bye') acc.b += (b.extraRuns || 0);
                                         else if (b.extraType === 'legbye') acc.lb += (b.extraRuns || 0);
                                         return acc;
                                     }, { w: 0, nb: 0, b: 0, lb: 0 });
                                     const totalExt = extrasBreakdown.w + extrasBreakdown.nb + extrasBreakdown.b + extrasBreakdown.lb;
                                    const fow = inningBalls.filter(b => b.wicket?.isWicket).map(b => {
                                        const currentRuns = inningBalls.filter(x => x.over < b.over || (x.over === b.over && x.ball <= b.ball)).reduce((sum, x) => sum + x.totalBallRuns, 0);
                                        const wktNum = inningBalls.filter(x => x.wicket?.isWicket && (x.over < b.over || (x.over === b.over && x.ball <= b.ball))).length;
                                        const pName = b.wicket?.playerOut || b.batsman || "Unknown";
                                        return `${currentRuns}-${wktNum} (${pName}, ${b.over}.${b.ball})`;
                                    });

                                    const battedOrBatting = new Set(sc.batsmen.map(bs => bs.name));
                                    const yetToBat = (teamPlayers || [])
                                        .map((p: any) => typeof p === 'string' ? p : p.name)
                                        .filter((name: string) => name && !battedOrBatting.has(name));

                                    return (
                                        <div key={innNum} className="space-y-3">
                                            <h4 className={`text-sm font-bold ${color} flex items-center gap-2`}>
                                                <span className="w-2 h-2 rounded-full bg-current" />
                                                {teamName} — Innings {innNum}
                                            </h4>

                                            {/* Batting */}
                                            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                                <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700">
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Batting</p>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-slate-500 text-xs border-b border-slate-800">
                                                                <th className="text-left py-2 px-4">Batter</th>
                                                                <th className="text-center py-2">R</th>
                                                                <th className="text-center py-2">B</th>
                                                                <th className="text-center py-2">4s</th>
                                                                <th className="text-center py-2">6s</th>
                                                                <th className="text-center py-2 pr-4">SR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800/50">
                                                            {sc.batsmen.map((b) => (
                                                                <tr key={b.name} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelectedBatsman({ name: b.name, inning: innNum })}>
                                                                    <td className="py-2.5 px-4">
                                                                        <p className="text-white font-medium text-sm hover:text-blue-400 transition-colors">{b.name} {!b.out && <span className="text-green-400">*</span>}</p>
                                                                        <p className="text-slate-600 text-[11px] capitalize">{b.out ? b.wicketInfo : "not out"}</p>
                                                                    </td>
                                                                    <td className="text-center font-bold text-white">{b.runs}</td>
                                                                    <td className="text-center text-slate-400">{b.balls}</td>
                                                                    <td className="text-center text-yellow-400">{b.fours}</td>
                                                                    <td className="text-center text-purple-400">{b.sixes}</td>
                                                                    <td className="text-center text-slate-400 pr-4">{b.sr}</td>
                                                                </tr>
                                                            ))}
                                                            {sc.batsmen.length === 0 && (
                                                                <tr><td colSpan={6} className="text-center text-slate-600 py-6 text-xs">No batting data</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Extras Breakdown */}
                                                <div className="px-4 py-3 bg-slate-800/40 border-t border-slate-800/60 flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extras</span>
                                                        <span className="text-sm font-black text-white">{totalExt}</span>
                                                    </div>
                                                    <div className="flex gap-4 text-[11px] font-medium text-slate-400">
                                                        <span title="Wides">WD: <b className="text-slate-200">{extrasBreakdown.w}</b></span>
                                                        <span title="No Balls">NB: <b className="text-slate-200">{extrasBreakdown.nb}</b></span>
                                                        <span title="Byes">B: <b className="text-slate-200">{extrasBreakdown.b}</b></span>
                                                        <span title="Leg Byes">LB: <b className="text-slate-200">{extrasBreakdown.lb}</b></span>
                                                    </div>
                                                </div>

                                                {/* Fall of Wickets */}
                                                {fow.length > 0 && (
                                                    <div className="px-4 py-3 bg-slate-800/20 border-t border-slate-800/40">
                                                        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mx-2 mb-1.5">Fall of Wickets</p>
                                                        <p className="text-slate-300 text-sm leading-relaxed mx-2">
                                                            {fow.join(", ")}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Yet to Bat */}
                                                {yetToBat.length > 0 && (
                                                    <div className="px-4 py-3 bg-slate-800/10 border-t border-slate-800/40">
                                                        <p className="text-slate-500 text-xs uppercase tracking-widest font-medium mx-2 mb-1.5">Yet to Bat</p>
                                                        <p className="text-slate-400 text-sm mx-2">
                                                            {yetToBat.join(", ")}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bowling */}
                                            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mt-4">
                                                <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700">
                                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bowling</p>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-slate-500 text-xs border-b border-slate-800">
                                                                <th className="text-left py-2 px-4">Bowler</th>
                                                                <th className="text-center py-2">O</th>
                                                                <th className="text-center py-2">R</th>
                                                                <th className="text-center py-2">W</th>
                                                                <th className="text-center py-2 pr-4">Eco</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800/50">
                                                            {sc.bowlers.map((b) => (
                                                                <tr key={b.name} className="hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelectedBowler({ name: b.name, inning: innNum })}>
                                                                    <td className="py-2.5 px-4 text-white font-medium hover:text-blue-400 transition-colors">{b.name}</td>
                                                                    <td className="text-center text-slate-400">{b.overs}</td>
                                                                    <td className="text-center text-slate-300">{b.runs}</td>
                                                                    <td className={`text-center font-bold ${b.wickets > 0 ? 'text-green-400' : 'text-slate-500'}`}>{b.wickets}</td>
                                                                    <td className={`text-center pr-4 ${b.economy < 7 ? 'text-green-400' : b.economy < 10 ? 'text-yellow-400' : 'text-red-400'}`}>{b.economy}</td>
                                                                </tr>
                                                            ))}
                                                            {sc.bowlers.length === 0 && (
                                                                <tr><td colSpan={5} className="text-center text-slate-600 py-6 text-xs">No bowling data</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    {/* LIVE TAB */}
                    {tab === "live" && (
                        <div className="space-y-4">
                            {/* Match Summary generated if match is complete */}
                            {detailedSummary && detailedSummary.length > 0 && (
                                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 md:p-6 mb-6">
                                    <div className="flex items-center gap-2 text-blue-400 font-bold text-lg mb-4 pb-2 border-b border-slate-800">
                                        <Trophy size={18} />
                                        <h4>Match Highlights & Summary</h4>
                                    </div>
                                    <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
                                        {detailedSummary.map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {balls.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                                    <p>No live events yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {(() => {
                                        // ── Pre-compute which overs are complete (≥6 legal balls) ──
                                        const overMap = new Map<string, Ball[]>();
                                        const summaryTriggerId = new Map<string, string>(); // overKey -> latest ball _id

                                        for (const bl of balls) {
                                            if (bl.isCommentaryOnly || !bl._id) continue;
                                            const overKey = `${bl.inning}-${Math.floor(bl.over)}`;
                                            if (!overMap.has(overKey)) overMap.set(overKey, []);
                                            overMap.get(overKey)!.push(bl);
                                            
                                            // Chronologically latest ball seen so far for this over
                                            summaryTriggerId.set(overKey, bl._id);
                                        }

                                        // ── Pre-compute milestone and wicket events ──
                                        const milestoneMap = new Map<number, { title: string; detail: string }[]>(); // originalIndex -> milestone objects
                                        const wicketCardMap = new Map<number, { name: string; runs: number; balls: number; fours: number; sixes: number; sr: string; dismissal: string }>();
                                        const batRunning = new Map<string, number>(); 
                                        const batBalls = new Map<string, number>(); 
                                        const batFours = new Map<string, number>();
                                        const batSixes = new Map<string, number>();
                                        const bowlWickets = new Map<string, number>(); 
                                        const bowlBalls = new Map<string, number>(); 
                                        const batMilestones = [50, 100, 150, 200];
                                        const bowlMilestones = [3, 5];
                                        for (let bi = 0; bi < balls.length; bi++) {
                                            const bl = balls[bi];
                                            if (bl.isCommentaryOnly) continue;
                                            // Batting stats tracking
                                            const batKey = `${bl.inning}-${bl.batsman}`;
                                            const prevRuns = batRunning.get(batKey) || 0;
                                            const addedRuns = (bl.extraType === 'none' || bl.extraType === 'noball') ? bl.runs : 0;
                                            const newRuns = prevRuns + addedRuns;
                                            batRunning.set(batKey, newRuns);
                                            
                                            if (bl.runs === 4 && (bl.extraType === 'none' || bl.extraType === 'noball')) {
                                                batFours.set(batKey, (batFours.get(batKey) || 0) + 1);
                                            }
                                            if (bl.runs === 6 && (bl.extraType === 'none' || bl.extraType === 'noball')) {
                                                batSixes.set(batKey, (batSixes.get(batKey) || 0) + 1);
                                            }

                                            // Increment ball count for legal balls
                                            if (bl.extraType !== 'wide') {
                                                batBalls.set(batKey, (batBalls.get(batKey) || 0) + 1);
                                            }
                                            
                                            for (const m of batMilestones) {
                                                if (prevRuns < m && newRuns >= m) {
                                                    if (!milestoneMap.has(bi)) milestoneMap.set(bi, []);
                                                    const label = m === 50 ? 'HALF CENTURY! 🎉' : m === 100 ? 'CENTURY! 💯🔥' : m === 150 ? '150 UP! 🌟' : 'DOUBLE CENTURY! 🏆';
                                                    const bCount = batBalls.get(batKey) || 0;
                                                    milestoneMap.get(bi)!.push({ 
                                                        title: `${label} ${bl.batsman}`, 
                                                        detail: `A monumental milestone reached in ${bCount} deliveries. The crowd erupts in applause!` 
                                                    });
                                                }
                                            }
                                            // Bowling milestones
                                            if (bl.bowler) {
                                                const bwKey = `${bl.inning}-${bl.bowler}`;
                                                
                                                // Increment ball count for legal balls
                                                if (bl.extraType !== 'wide' && bl.extraType !== 'noball') {
                                                    bowlBalls.set(bwKey, (bowlBalls.get(bwKey) || 0) + 1);
                                                }

                                                if (bl.wicket?.isWicket) {
                                                    const prevW = bowlWickets.get(bwKey) || 0;
                                                    const newW = prevW + 1;
                                                    bowlWickets.set(bwKey, newW);
                                                    for (const m of bowlMilestones) {
                                                        if (prevW < m && newW >= m) {
                                                            if (!milestoneMap.has(bi)) milestoneMap.set(bi, []);
                                                            const label = m === 3 ? '3-WICKET HAUL! 🎳' : '5-WICKET HAUL! 🔥🎳';
                                                            const bTotal = bowlBalls.get(bwKey) || 0;
                                                            const ovs = `${Math.floor(bTotal / 6)}.${bTotal % 6}`;
                                                            milestoneMap.get(bi)!.push({ 
                                                                title: `${label} ${bl.bowler}`, 
                                                                detail: `Clinical performance! ${m} wickets taken in a spell of ${ovs} overs.` 
                                                            });
                                                        }
                                                    }
                                                    
                                                    // Wicket card data
                                                    const finalRuns = batRunning.get(batKey) || 0;
                                                    const finalBalls = batBalls.get(batKey) || 0;
                                                    const finalFours = batFours.get(batKey) || 0;
                                                    const finalSixes = batSixes.get(batKey) || 0;
                                                    const sr = finalBalls > 0 ? ((finalRuns / finalBalls) * 100).toFixed(1) : '0.0';
                                                    
                                                    let dismissal = bl.wicket.how || 'Out';
                                                    if (bl.wicket.fielder) dismissal = `ct ${bl.wicket.fielder} b ${bl.bowler}`;
                                                    else if (dismissal.toLowerCase().includes('bowled')) dismissal = `b ${bl.bowler}`;
                                                    else if (dismissal.toLowerCase().includes('lbw')) dismissal = `lbw b ${bl.bowler}`;

                                                    wicketCardMap.set(bi, {
                                                        name: bl.batsman,
                                                        runs: finalRuns,
                                                        balls: finalBalls,
                                                        fours: finalFours,
                                                        sixes: finalSixes,
                                                        sr,
                                                        dismissal
                                                    });
                                                }
                                            }
                                        }

                                        // ── Pre-compute bowler first appearances per innings ──
                                        const bowlerFirstBall = new Map<number, { bowler: string; inning: number }>();
                                        const seenBowlers = new Map<string, boolean>();
                                        const bowlerSpellStats = new Map<string, { overs: string; runs: number; wickets: number; maidens: number }>();
                                        {
                                            const bowlerBallMap = new Map<string, { legalBalls: number; runs: number; wickets: number; overRuns: Map<number, number> }>();
                                            for (let bi = 0; bi < balls.length; bi++) {
                                                const bl = balls[bi];
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

                                        // ── Pre-compute AI Insights per ball ──
                                        const aiInsightMap = new Map<string, Ball>();
                                        for (const bl of balls) {
                                            if (bl.isCommentaryOnly && bl.insightType && bl.insightType !== 'None') {
                                                const key = `${bl.inning}-${bl.over}-${bl.ball}`;
                                                aiInsightMap.set(key, bl);
                                            }
                                        }

                                        // ── Pre-compute struggle insights ──
                                        const struggleMap = new Map<number, { batsman: string; bowler: string; dots: number }>();
                                        const matchupDots = new Map<string, number>();
                                        for (let bi = 0; bi < balls.length; bi++) {
                                            const bl = balls[bi];
                                            if (bl.isCommentaryOnly || !bl.batsman || !bl.bowler) continue;
                                            const key = `${bl.batsman}-${bl.bowler}`;
                                            if (bl.runs === 0 && !bl.wicket?.isWicket && !bl.extraType) {
                                                const dots = (matchupDots.get(key) || 0) + 1;
                                                matchupDots.set(key, dots);
                                                if (dots >= 5 && dots % 3 === 2) {
                                                    struggleMap.set(bi, { batsman: bl.batsman, bowler: bl.bowler, dots });
                                                }
                                            } else if ((bl.runs || 0) > 0) {
                                                matchupDots.set(key, 0); // Reset on runs
                                            }
                                        }

                                        const rballs = [...balls].reverse();

                                        return rballs.map((ball, i) => {
                                            // Find its position in the original array to match pre-computed maps
                                            // Using findIndex with _id for robustness against duplicates
                                            const originalIndex = ball._id
                                                ? balls.findIndex(sb => sb._id === ball._id)
                                                : balls.indexOf(ball);

                                            // Only show over summary for the specific ball ID triggered by pre-computation
                                            const overKey = `${ball.inning}-${Math.floor(ball.over)}`;
                                            const overBalls = overMap.get(overKey) || [];
                                            const legalCount = overBalls.filter(bl => bl.extraType !== "wide" && bl.extraType !== "noball").length;
                                            
                                            const shouldShowOverSummary = ball._id && summaryTriggerId.get(overKey) === ball._id && legalCount >= 6;

                                            const milestones = milestoneMap.get(originalIndex) || [];
                                            const bowlerIntro = bowlerFirstBall.get(originalIndex) || null;
                                            const struggle = struggleMap.get(originalIndex) || null;

                                            // Filter out AI insights as separate cards - they are now combined with real balls
                                            if (ball.isCommentaryOnly && ball.insightType && ball.insightType !== 'None') {
                                                return null;
                                            }

                                            // Special Case: Innings summary (Keep as separate distinct card)
                                            const isInningsSummary = ball.isCommentaryOnly && ball.commentaryMessage?.includes('END OF INNINGS');
                                            if (isInningsSummary) {
                                                const paragraphs = (ball.commentaryMessage || '').split('\n\n').filter(Boolean);
                                                return (
                                                    <div key={ball._id || i} className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 md:p-6 my-4">
                                                        <div className="flex items-center gap-2 text-blue-400 font-bold text-lg mb-4 pb-2 border-b border-slate-800">
                                                            <Trophy size={18} />
                                                            <h4>Innings Highlights & Summary</h4>
                                                        </div>
                                                        <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
                                                            {paragraphs.map((para, pi) => (
                                                                <p key={pi}>{para}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            let overSummaryToRender = null;
                                            if (shouldShowOverSummary) {
                                                const overKeyForSummary = `${ball.inning}-${Math.floor(ball.over)}`;
                                                const oballs = overMap.get(overKeyForSummary) || [];
                                                const totalRuns = oballs.reduce((sum, bl) => sum + bl.runs + (bl.extraRuns || 0), 0);
                                                const wickets = oballs.filter(bl => bl.wicket?.isWicket).length;
                                                const extras = oballs.filter(bl => bl.extraType !== "none").length;
                                                const bowlers = [...new Set(oballs.map(bl => bl.bowler))];

                                                overSummaryToRender = (
                                                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 md:p-4 my-4 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                                                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-3">
                                                            <h4 className="text-white font-bold flex items-center gap-2">
                                                                <span className="bg-blue-500/20 text-blue-400 py-1 px-2.5 rounded text-sm tracking-wide">Over {ball.over + 1}</span>
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
                                                                    const ballsUpToNow = balls.slice(0, originalIndex + 1).filter(bl => bl.inning === ball.inning && !bl.isCommentaryOnly);
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
                                                                    const ballsUpToNow = balls.slice(0, originalIndex + 1).filter(bl => bl.inning === ball.inning && !bl.isCommentaryOnly);
                                                                    const bwBalls = ballsUpToNow.filter(bl => bl.bowler === bw);
                                                                    const r = bwBalls.reduce((s, bl) => s + (bl.extraType !== 'legbye' && bl.extraType !== 'bye' ? (bl.runs + (bl.extraRuns || 0)) : 0), 0);
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
                                                                    <span>CRR: {crrAdmin}</span>
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
                                                                            <span className="text-blue-400 font-bold text-xs">{Math.round(totalRuns * 0.5 + (match.currentInnings === 1 ? sc1.runs : sc2.runs))}</span>
                                                                        </p>
                                                                    )}
                                                                    {match.currentInnings === 2 && (
                                                                        <p className="text-slate-300 text-sm flex justify-between items-center">
                                                                            <span className="text-xs">RRR:</span>
                                                                            <span className="text-amber-400 font-bold text-xs">{rrrAdmin}</span>
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

                                            // Filter out legacy AI "OVER SUMMARY" insights to avoid duplication with the manual UI card
                                            if (ball.isCommentaryOnly && ball.commentaryMessage && /OVER SUMMARY/i.test(ball.commentaryMessage)) {
                                                return null;
                                            }

                                            const ballKey = `${ball.inning}-${ball.over}-${ball.ball}`;
                                            const aiInsight = aiInsightMap.get(ballKey);

                                            const { label, color } = getBallIcon(ball);
                                            const isBig = ball.runs === 4 || ball.runs === 6 || ball.wicket?.isWicket;
                                            const isWkt = !!ball.wicket?.isWicket;
                                            const commentary = getCommentaryText(ball, originalIndex);

                                            return (
                                                <React.Fragment key={ball._id || i}>
                                                    {overSummaryToRender}
                                                    
                                                    {/* Unified Premium Card */}
                                                    <div className={`group relative flex flex-col gap-0 overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-2xl ${
                                                        isWkt ? 'bg-red-500/15 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' : 
                                                        ball.runs === 6 ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' :
                                                        ball.runs === 4 ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' :
                                                        ball.runs >= 1 ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                        'bg-slate-900/60 backdrop-blur-xl border-slate-800/80 shadow-lg'
                                                    }`}>
                                                        {/* Top Accent Bar (Universal Premium Feel) */}
                                                        <div className={`h-[2px] w-full bg-gradient-to-r ${
                                                            isWkt ? 'from-red-600 via-red-400 to-red-600' : 
                                                            ball.runs === 6 ? 'from-purple-600 via-purple-400 to-purple-600' :
                                                            ball.runs === 4 ? 'from-blue-600 via-blue-400 to-blue-600' :
                                                            ball.runs >= 1 ? 'from-emerald-600/40 via-emerald-400/40 to-emerald-600/40' :
                                                            'from-slate-700 via-slate-600 to-slate-700'
                                                        }`} />

                                                        <div className="p-2.5 md:p-3.5">
                                                            <div className="flex items-center gap-2">
                                                                {/* Ball Record Avatar - Moderate */}
                                                                <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-[13px] font-black border shadow-sm flex-shrink-0 ${color}`}>
                                                                    {label}
                                                                </div>

                                                                <div className="flex-1 min-w-0 flex flex-col">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <span className="text-[10.5px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 shrink-0">
                                                                                {Math.min(ball.over, (overs || 20) - 1)}.{ball.ball}
                                                                            </span>
                                                                            <div className="truncate flex items-center gap-2 text-[13px]">
                                                                                <span className="text-white font-bold">{ball.bowler}</span>
                                                                                <span className="text-slate-500 text-[11px]">to</span>
                                                                                <span className="text-white font-bold">{ball.batsman}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            {isWkt && <div className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-tight">WICKET</div>}
                                                                            {ball.runs === 6 && <div className="bg-purple-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-tight">BOUNDARY</div>}
                                                                            {ball.runs === 4 && <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-tight">BOUNDARY</div>}
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-1.5 space-y-1.5">
                                                                        <p className={`text-[14px] font-bold leading-relaxed ${commentary.accent} tracking-tight opacity-100`}>
                                                                            {commentary.headline}
                                                                        </p>
                                                                        {commentary.detail && (
                                                                            <p className="text-[12px] text-slate-400/90 leading-relaxed font-medium italic">
                                                                                {commentary.detail}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                            {/* Dropped Catch Section (Internal) */}
                                                            {(ball as any).isDroppedCatch && (ball as any).droppedFielder && (
                                                                <div className="ml-[44px] mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-3 py-1.5 flex items-center gap-2">
                                                                    <Shield size={10} className="text-yellow-400" />
                                                                    <p className="text-yellow-300/80 text-[10px] font-medium leading-none">Dropped: {(ball as any).droppedFielder}</p>
                                                                </div>
                                                            )}

                                                            {/* Wicket Batsman Stats Card (Enhanced & Centered) */}
                                                            {wicketCardMap.has(originalIndex) && (
                                                                <div className="mt-4 mb-4 overflow-hidden relative rounded-xl border border-red-500/40 bg-[#0a0505]/95 shadow-[0_0_40px_rgba(239,68,68,0.2)] group/wicketcard transition-all duration-500 hover:scale-[1.01] hover:shadow-red-500/30">
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-red-950/40 to-transparent pointer-events-none" />
                                                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover/wicketcard:opacity-40 transition-opacity">
                                                                        <div className="text-[40px] font-black text-red-500 leading-none select-none italic tracking-tighter">OUT</div>
                                                                    </div>
                                                                    
                                                                    <div className="relative p-4 md:p-5">
                                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-red-500/20 pb-4">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="relative">
                                                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/30 to-red-900/50 border border-red-500/50 flex items-center justify-center shadow-lg">
                                                                                        <User size={28} className="text-red-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                                                                                    </div>
                                                                                    <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border border-black shadow-lg">
                                                                                        <XCircle size={12} className="text-white" />
                                                                                    </div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Dismissed</span>
                                                                                        <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Precision Data</span>
                                                                                    </div>
                                                                                    <h2 className="text-[18px] md:text-[22px] font-black text-white leading-none tracking-tight">{wicketCardMap.get(originalIndex)!.name}</h2>
                                                                                    <p className="text-[11px] font-bold text-red-400/90 italic mt-1.5 flex items-center gap-1.5">
                                                                                        <Target size={10} />
                                                                                        {wicketCardMap.get(originalIndex)!.dismissal}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-4 md:text-right">
                                                                                <div className="h-10 w-[1px] bg-red-500/20 hidden md:block" />
                                                                                <div>
                                                                                    <p className="text-[32px] font-black text-white leading-none tracking-tighter">{wicketCardMap.get(originalIndex)!.runs}</p>
                                                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-1">Runs Scored</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-4 gap-2 md:gap-4">
                                                                            {[
                                                                                { label: 'Balls', val: wicketCardMap.get(originalIndex)!.balls, color: 'text-white' },
                                                                                { label: 'Fours', val: wicketCardMap.get(originalIndex)!.fours, color: 'text-blue-400' },
                                                                                { label: 'Sixes', val: wicketCardMap.get(originalIndex)!.sixes, color: 'text-purple-400' },
                                                                                { label: 'S.Rate', val: wicketCardMap.get(originalIndex)!.sr, color: 'text-amber-400' }
                                                                            ].map((stat, si) => (
                                                                                <div key={si} className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-3 text-center border border-white/5 hover:border-red-500/20 transition-all group/stat">
                                                                                    <p className={`text-[15px] md:text-[18px] font-black ${stat.color} leading-none mb-1.5`}>{stat.val}</p>
                                                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/stat:text-slate-400">{stat.label}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Premium Milestone Celebration Section (Detailed) */}
                                                            {milestones.length > 0 && milestones.map((mObj, mi) => (
                                                                <div key={mi} className="mt-2 ml-[36px] overflow-hidden relative group/milestone rounded-lg">
                                                                    {/* Luminous Background Layer */}
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-amber-900/40 to-[#0a0a0b] backdrop-blur-md" />
                                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)] animate-pulse" />
                                                                    
                                                                    <div className="relative flex items-center gap-5 p-4 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.1)] group-hover/milestone:border-amber-400/50 transition-colors">
                                                                        <div className="relative shrink-0">
                                                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                                                                                <Award size={24} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                                                                            </div>
                                                                            <div className="absolute -top-1 -right-1">
                                                                                <Sparkles size={14} className="text-amber-300 animate-bounce" />
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex flex-col min-w-0 flex-1">
                                                                            <div className="flex items-center gap-3 mb-1">
                                                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 flex items-center gap-1.5">
                                                                                    <Zap size={10} className="fill-amber-500" />
                                                                                    Milestone Reached
                                                                                </span>
                                                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/40 to-transparent" />
                                                                            </div>
                                                                            <p className="text-amber-50 font-black text-[15px] tracking-tight leading-none mb-1.5 drop-shadow-sm flex items-center gap-2">
                                                                                {mObj.title}
                                                                            </p>
                                                                            <p className="text-amber-200/80 text-[11.5px] font-medium leading-relaxed italic">
                                                                                {mObj.detail}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        <div className="opacity-40 group-hover/milestone:opacity-100 transition-opacity">
                                                                            <Trophy size={24} className="text-amber-500/50" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                    {/* AI Insight Section (Separate Card) */}
                                                    {aiInsight && (
                                                        <div className="mt-2 ml-[44px] bg-indigo-500/5 border border-indigo-500/20 rounded-md p-2.5 relative group/insight overflow-hidden shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Zap size={12} className="text-indigo-400 fill-indigo-400/20" />
                                                                <p className="text-indigo-200/90 text-[11.5px] font-bold italic truncate flex-1">
                                                                    "{aiInsight.commentaryMessage}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Tactical Cards (Bowler Intro & Struggle) */}
                                                    {bowlerIntro && (() => {
                                                        const careerStats = getRealBowlerCareerStats(bowlerIntro.bowler, playerStatsCache);
                                                        const recentBall = balls.slice(0, originalIndex + 1).reverse().find(bl => !bl.isCommentaryOnly && bl.inning === ball.inning);
                                                        const currentBatsmenAtIntro = [...new Set([recentBall?.batsman, recentBall?.nonStriker].filter(Boolean))];

                                                        return (
                                                            <div className="bg-[#05070a]/95 border border-white/10 rounded-xl my-4 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-3xl group/hud">
                                                                {/* HUD Scanline Effect */}
                                                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] -mr-16 -mt-16 rounded-full" />
                                                                
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02] gap-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="relative">
                                                                            <div className="w-11 h-11 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center relative shadow-inner overflow-hidden">
                                                                                <Zap size={20} className="text-indigo-400 relative z-10" />
                                                                                <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                                                                            </div>
                                                                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-indigo-400" />
                                                                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-indigo-400" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                                <span className="text-[7px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Active Spell</span>
                                                                                <span className="text-[7px] font-black border border-indigo-500/30 text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Analysis Engine</span>
                                                                            </div>
                                                                            <h3 className="text-white font-black text-[17px] tracking-tight uppercase italic flex items-center gap-2">
                                                                                {bowlerIntro.bowler}
                                                                            </h3>
                                                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{careerStats.type}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t border-white/5 pt-3 md:border-t-0 md:pt-0">
                                                                        <div className="flex gap-5 px-4 py-1.5 bg-black/40 border border-white/5 rounded-xl">
                                                                            {[
                                                                                { l: 'T20 WKT', v: careerStats.wickets, c: 'text-purple-400' }, 
                                                                                { l: 'CAREER ECO', v: careerStats.economy, c: 'text-emerald-400' }
                                                                            ].map(s => (
                                                                                <div key={s.l} className="flex flex-col items-center md:items-end">
                                                                                    <span className="text-[8px] font-black text-slate-500 tracking-tighter uppercase mb-0.5">{s.l}</span>
                                                                                    <span className={`text-[14px] md:text-[16px] font-black ${s.c} tracking-tight`}>{s.v}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="text-right hidden sm:block">
                                                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Performance Mode</p>
                                                                            <span className={`text-[12px] font-black ${careerStats.economy < 7.5 ? 'text-emerald-400' : 'text-indigo-400'} uppercase tracking-widest italic`}>
                                                                                {careerStats.economy < 7.5 ? 'LOCKDOWN' : 'INTERCEPTOR'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="p-3 space-y-2 bg-black/40">
                                                                    <div className="px-4 py-2 flex justify-between items-center bg-white/[0.02] rounded-lg border border-white/5">
                                                                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                                            <Radar size={12} className="animate-pulse" />
                                                                            Match-Up Intelligence
                                                                        </div>
                                                                        <div className="flex gap-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mr-4">
                                                                            <span className="w-10 text-center">Power</span>
                                                                            <span className="w-40 text-center">Head-to-Head Statistics</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {currentBatsmenAtIntro.map(bat => {
                                                                        const m = matchupCache[`${bowlerIntro.bowler}-${bat}`];
                                                                        if (!m || m.balls === 0) return null;
                                                                        const advantage = Math.abs(m.strikeRate - 130) > 30 ? (m.strikeRate > 130 ? 'BATSMAN' : 'BOWLER') : 'NEUTRAL';
                                                                        const advColor = advantage === 'BATSMAN' ? 'text-blue-400' : advantage === 'BOWLER' ? 'text-red-400' : 'text-slate-400';
                                                                        const runs = m.runs || Math.round((m.strikeRate * m.balls) / 100);

                                                                        return (
                                                                            <div key={bat} className="flex flex-col md:flex-row items-center justify-between p-4 px-5 hover:bg-white/[0.04] transition-all rounded-xl border border-white/5 hover:border-indigo-500/20 group/row bg-white/[0.01] gap-4">
                                                                                <div className="flex items-center gap-4 w-full md:w-1/4">
                                                                                    <div className={`w-1.5 h-8 rounded-full ${advantage === 'BATSMAN' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : advantage === 'BOWLER' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-500'}`} />
                                                                                    <div className="flex flex-col">
                                                                                        <div className="text-white text-[14px] font-black uppercase tracking-tight group-hover/row:text-indigo-300 transition-colors truncate">{bat}</div>
                                                                                        <div className={`text-[9px] font-bold uppercase tracking-widest ${advColor}`}>{advantage} ADVANTAGE</div>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                <div className="flex-1 hidden md:flex items-center px-8" title="Strike Rate Intensity">
                                                                                    <div className="w-full h-[6px] rounded-full bg-slate-800 relative overflow-hidden border border-white/5">
                                                                                        <div 
                                                                                            className={`absolute inset-y-0 left-0 transition-all duration-1000 ${advantage === 'BATSMAN' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : advantage === 'BOWLER' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-indigo-500'}`}
                                                                                            style={{ width: `${Math.max(10, Math.min(90, (m.strikeRate / 2.5)))}%` }}
                                                                                        />
                                                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3 bg-white/20 rounded-full" />
                                                                                    </div>
                                                                                </div>

                                                                                <div className="grid grid-cols-5 gap-4 md:gap-8 items-center w-full md:w-auto">
                                                                                    {[
                                                                                        { l: 'RUNS', v: runs, c: 'text-white' },
                                                                                        { l: 'BALLS', v: m.balls, c: 'text-slate-400' },
                                                                                        { l: 'SR', v: m.strikeRate, c: 'text-indigo-400' },
                                                                                        { l: 'DOTS', v: m.dots || 0, c: 'text-emerald-400' },
                                                                                        { l: 'OUTS', v: m.outs, c: 'text-red-400' }
                                                                                    ].map(s => (
                                                                                        <div key={s.l} className="flex flex-col items-center">
                                                                                            <span className={`text-[13px] md:text-[15px] font-black ${s.c} tracking-tighter`}>{s.v}</span>
                                                                                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{s.l}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    {struggle && (
                                                        <div className="mt-4 mb-4 overflow-hidden relative rounded-xl border border-orange-500/40 bg-[#0a0705]/95 shadow-[0_0_40px_rgba(249,115,22,0.15)] group/struggle transition-all duration-500 hover:scale-[1.01]">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-red-950/20 to-transparent pointer-events-none" />
                                                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full" />
                                                            
                                                            <div className="relative p-4 md:p-5 flex items-center gap-5">
                                                                <div className="relative shrink-0">
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-red-900/40 border border-orange-500/40 flex items-center justify-center shadow-lg">
                                                                        <Activity size={24} className="text-orange-400 animate-pulse" />
                                                                    </div>
                                                                    <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border border-black shadow-lg">
                                                                        <TrendingUp size={10} className="text-white" />
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <span className="bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Pressure Alert</span>
                                                                        <span className="text-orange-400 text-[9px] font-bold uppercase tracking-widest italic">Tactical Insight</span>
                                                                    </div>
                                                                    <p className="text-white text-[14px] md:text-[16px] font-medium leading-relaxed">
                                                                        <span className="font-black text-orange-400 uppercase tracking-tight">{struggle.batsman}</span> is finding it difficult against <span className="font-black text-white uppercase tracking-tight">{struggle.bowler}</span>, facing <span className="text-orange-400 font-black">{struggle.dots}</span> dot balls.
                                                                    </p>
                                                                    <div className="mt-3 flex items-center gap-3">
                                                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-orange-500/40 to-transparent" />
                                                                        <span className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest">Momentum: Bowler</span>
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

                            )}
                        </div>
                    )}

                    {/* LINEUPS TAB */}
                    {tab === "lineups" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Home Team Lineup */}
                                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-blue-500/10 border-b border-slate-700 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {team1?.logo ? <img src={team1.logo} alt={team1.name} className="w-full h-full object-cover" /> : <Shield size={16} className="text-blue-400" />}
                                        </div>
                                        <h4 className="font-bold text-blue-400">{team1?.name} Playing XI</h4>
                                    </div>
                                    <div className="divide-y divide-slate-800/50">
                                        {(() => {
                                            const squad = team1?.players || [];
                                            const hasLineup = match.homeLineup && match.homeLineup.length > 0;
                                            const lineupNames = hasLineup ? match.homeLineup! : [];
                                            
                                            // Determine Playing XI
                                            let playingXI: any[] = [];
                                            if (hasLineup) {
                                                // Map names to full player objects if possible
                                                playingXI = lineupNames.map(name => {
                                                    const found = squad.find(p => norm(typeof p === 'string' ? p : p.name) === norm(name));
                                                    return found || name;
                                                });
                                            } else {
                                                playingXI = squad.slice(0, 11);
                                            }

                                            // Determine Bench
                                            const playingNamesNorm = playingXI.map(p => norm(typeof p === 'string' ? p : p.name));
                                            const bench = squad.filter(p => !playingNamesNorm.includes(norm(typeof p === 'string' ? p : p.name)));

                                            return (
                                                <>
                                                    {playingXI.length > 0 ? playingXI.map((p, i) => {
                                                        const pName = typeof p === 'string' ? p : p.name;
                                                        const pRole = typeof p === 'string' ? 'Player' : p.role || 'Player';
                                                        const isOut = match.impactPlayers?.team1?.playerOut === pName;
                                                        return (
                                                            <div key={i} className={`px-4 py-3 flex items-center gap-4 hover:bg-slate-800/30 transition-colors ${isOut ? 'opacity-50' : ''}`}>
                                                                <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                                    {typeof p === 'object' && p.photo ? (
                                                                        <img src={p.photo} alt={pName} className="w-full h-full object-cover rounded" />
                                                                    ) : pName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-white text-sm font-medium ${isOut ? 'line-through text-slate-400' : ''}`}>
                                                                        {pName} {pName === team1.captain && <span className="text-xs text-yellow-500 ml-1 font-bold">(C)</span>}
                                                                        {isOut && <span className="text-[9px] ml-2 text-red-500 bg-red-500/20 px-1.5 py-0.5 border border-red-500/30 rounded">SUBBED OUT</span>}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">{pRole}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <p className="p-6 text-center text-slate-500 text-sm">No players assigned to this team.</p>
                                                    )}

                                                    {bench.length > 0 && (
                                                        <>
                                                            <div className="px-4 py-2 bg-slate-800/60 border-y border-slate-700">
                                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rest of Squad (Bench)</h5>
                                                            </div>
                                                            {bench.map((p, i) => {
                                                                const pName = typeof p === 'string' ? p : p.name;
                                                                const pRole = typeof p === 'string' ? 'Player' : p.role || 'Player';
                                                                const isIn = match.impactPlayers?.team1?.playerIn === pName;
                                                                return (
                                                                    <div key={`bench-${i}`} className={`px-4 py-3 flex items-center gap-4 hover:bg-slate-800/30 transition-colors ${isIn ? '' : 'opacity-70'}`}>
                                                                        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                                            {typeof p === 'object' && p.photo ? (
                                                                                <img src={p.photo} alt={pName} className={`w-full h-full object-cover rounded ${isIn ? '' : 'grayscale opacity-80'}`} />
                                                                            ) : pName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-white text-sm font-medium">
                                                                                {pName} {pName === team1.captain && <span className="text-xs text-yellow-500 ml-1 font-bold">(C)</span>}
                                                                                {isIn && <span className="text-[9px] ml-2 text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 border border-emerald-500/30 rounded">IMPACT SUB</span>}
                                                                            </p>
                                                                            <p className="text-xs text-slate-500">{pRole}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Away Team Lineup */}
                                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                                    <div className="px-4 py-3 bg-red-500/10 border-b border-slate-700 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {team2?.logo ? <img src={team2.logo} alt={team2.name} className="w-full h-full object-cover" /> : <Shield size={16} className="text-red-400" />}
                                        </div>
                                        <h4 className="font-bold text-red-400">{team2?.name} Playing XI</h4>
                                    </div>
                                    <div className="divide-y divide-slate-800/50">
                                        {(() => {
                                            const squad = team2?.players || [];
                                            const hasLineup = match.awayLineup && match.awayLineup.length > 0;
                                            const lineupNames = hasLineup ? match.awayLineup! : [];
                                            
                                            // Determine Playing XI
                                            let playingXI: any[] = [];
                                            if (hasLineup) {
                                                playingXI = lineupNames.map(name => {
                                                    const found = squad.find(p => norm(typeof p === 'string' ? p : p.name) === norm(name));
                                                    return found || name;
                                                });
                                            } else {
                                                playingXI = squad.slice(0, 11);
                                            }

                                            // Determine Bench
                                            const playingNamesNorm = playingXI.map(p => norm(typeof p === 'string' ? p : p.name));
                                            const bench = squad.filter(p => !playingNamesNorm.includes(norm(typeof p === 'string' ? p : p.name)));

                                            return (
                                                <>
                                                    {playingXI.length > 0 ? playingXI.map((p, i) => {
                                                        const pName = typeof p === 'string' ? p : p.name;
                                                        const pRole = typeof p === 'string' ? 'Player' : p.role || 'Player';
                                                        const isOut = match.impactPlayers?.team2?.playerOut === pName;
                                                        return (
                                                            <div key={i} className={`px-4 py-3 flex items-center gap-4 hover:bg-slate-800/30 transition-colors ${isOut ? 'opacity-50' : ''}`}>
                                                                <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                                    {typeof p === 'object' && p.photo ? (
                                                                        <img src={p.photo} alt={pName} className="w-full h-full object-cover rounded" />
                                                                    ) : pName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-white text-sm font-medium ${isOut ? 'line-through text-slate-400' : ''}`}>
                                                                        {pName} {pName === team2.captain && <span className="text-xs text-yellow-500 ml-1 font-bold">(C)</span>}
                                                                        {isOut && <span className="text-[9px] ml-2 text-red-500 bg-red-500/20 px-1.5 py-0.5 border border-red-500/30 rounded">SUBBED OUT</span>}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">{pRole}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <p className="p-6 text-center text-slate-500 text-sm">No players assigned to this team.</p>
                                                    )}

                                                    {bench.length > 0 && (
                                                        <>
                                                            <div className="px-4 py-2 bg-slate-800/60 border-y border-slate-700">
                                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rest of Squad (Bench)</h5>
                                                            </div>
                                                            {bench.map((p, i) => {
                                                                const pName = typeof p === 'string' ? p : p.name;
                                                                const pRole = typeof p === 'string' ? 'Player' : p.role || 'Player';
                                                                const isIn = match.impactPlayers?.team2?.playerIn === pName;
                                                                return (
                                                                    <div key={`bench-${i}`} className={`px-4 py-3 flex items-center gap-4 hover:bg-slate-800/30 transition-colors ${isIn ? '' : 'opacity-70'}`}>
                                                                        <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                                            {typeof p === 'object' && p.photo ? (
                                                                                <img src={p.photo} alt={pName} className={`w-full h-full object-cover rounded ${isIn ? '' : 'grayscale opacity-80'}`} />
                                                                            ) : pName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-white text-sm font-medium">
                                                                                {pName} {pName === team2.captain && <span className="text-xs text-yellow-500 ml-1 font-bold">(C)</span>}
                                                                                {isIn && <span className="text-[9px] ml-2 text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 border border-emerald-500/30 rounded">IMPACT SUB</span>}
                                                                            </p>
                                                                            <p className="text-xs text-slate-500">{pRole}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PERFORMANCE LAB TAB */}
                    {tab === "lab" && (
                        <TournamentCricketLab match={match} balls={balls} />
                    )}
                </>
            )}

            {/* ── Batsman Detail Popup ── */}
            {selectedBatsman && (
                <BatsmanDetailPopup
                    batsmanName={selectedBatsman.name}
                    allBalls={balls}
                    inning={selectedBatsman.inning}
                    batStat={
                        (selectedBatsman.inning === 1 ? sc1.batsmen : sc2.batsmen).find(s => s.name === selectedBatsman.name)
                        || { name: selectedBatsman.name, runs: 0, balls: 0, fours: 0, sixes: 0, sr: "0.00", isOut: false, dismissalText: "" }
                    }
                    teamName={selectedBatsman.inning === 1 ? team1?.name : team2?.name}
                    teamPlayers={(
                        (selectedBatsman.inning === 1 ? team1 : team2)?.players || []
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
                    bowlStat={
                        (selectedBowler.inning === 1 ? sc1.bowlers : sc2.bowlers).find(s => s.name === selectedBowler.name)
                        || { name: selectedBowler.name, overs: "0.0", maidens: 0, runs: 0, wickets: 0, economy: "0.00", legalBalls: 0 }
                    }
                    teamName={selectedBowler.inning === 1 ? team2?.name : team1?.name}
                    teamPlayers={(
                        (selectedBowler.inning === 1 ? team2 : team1)?.players || []
                    ).map((p: any) => ({
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

export default TournamentMatchDetail;
