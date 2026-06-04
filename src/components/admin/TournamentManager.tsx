import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getTeamAcronym } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs";
import {
    Trophy, Plus, Calendar, Settings2, Users, Shield, UserPlus,
    Play, MapPin, ArrowLeft, Image, Crown, Swords, X, CircleDot,
    Loader2, TrendingUp, TrendingDown, Target, Zap, BarChart3, Activity, Trash2, History as HistoryIcon,
    Bell, BellOff, Camera, Crosshair, User, Pencil, ChevronRight, Calculator, ChevronDown, ChevronUp, Check,
    Newspaper, MessageCircle, Sparkles, Globe, Pencil as Edit, PencilLine, ArrowRight, RefreshCw, Award, Share2, Brain, Hand, Focus,
    Fingerprint, Boxes, Database, Compass, Search
} from "lucide-react";

import { useTournamentFollow } from "@/hooks/useTournamentFollow";
import { tournamentApi, teamApi, customMatchApi, playerApi } from "@/services/api";
import { Tournament, Team, Match, PlayerRole, PlayerEntry, getPlayerName, getPlayerRole } from "@/data/scoringTypes";
import { toast } from "sonner";
import TournamentMatchDetail from "./TournamentMatchDetail";
import TournamentStatsTab from "./TournamentStatsTab";
import { EditTeamDialog } from "./EditTeamDialog";
import { calculateNRRMargin } from "@/lib/cricketUtils";
import { TournamentNewsTab } from "./TournamentNewsTab";
import { WagonWheel } from "@/components/WagonWheel";

type View = "list" | "detail";
type DetailTab = "overview" | "teams" | "matches" | "table" | "stats" | "lab" | "news";
type MatchFilter = "All" | "Live" | "Upcoming" | "Recent";

const ROLES: PlayerRole[] = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];
/** Convert decimal overs (balls/6) to cricket format e.g. 3.8333→"3.5" */
const fmtOv = (o: number) => { const b = Math.round(o * 6); return `${Math.floor(b / 6)}.${b % 6}`; };
const ROLE_COLORS: Record<PlayerRole, { bg: string; text: string; border: string; icon: string }> = {
    "Batsman": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", icon: "🏏" },
    "Bowler": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", icon: "🎯" },
    "All-Rounder": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", icon: "⭐" },
    "Wicket Keeper": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", icon: "🧤" },
};

const PRESET_COLORS = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Red", value: "#ef4444" },
    { name: "Green", value: "#22c55e" },
    { name: "Yellow", value: "#eab308" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
    { name: "Orange", value: "#f97316" },
    { name: "Cyan", value: "#06b6d4" },
];

const PointsTableUI = ({ entries, totalGroupMatches, tournamentOvers = 20, matches = [], tournamentId, onRefresh, tournamentStatus }: { entries: any[], totalGroupMatches?: number, tournamentOvers?: number, matches?: Match[], tournamentId?: string, onRefresh?: () => void, tournamentStatus?: string }) => {
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [analyzeTarget, setAnalyzeTarget] = useState<string>(tournamentOvers >= 50 ? "250" : tournamentOvers >= 20 ? "160" : "100");
    const [analyzeOvers, setAnalyzeOvers] = useState<string>(tournamentOvers.toString());

    // Sort entries by points then NRR
    const sorted = [...entries].sort((a, b) => b.points - a.points || b.nrr - a.nrr);

    // Calculate qualification probability for each team
    const qualifySpots = Math.max(1, Math.floor(sorted.length / 2)); // top half qualify (at least 1)
    const pointsPerWin = 2;

    const qualStatus = sorted.map((entry, idx) => {
        if (entry.played === 0 && sorted.every(e => e.played === 0)) {
            return { prob: Math.round((qualifySpots / sorted.length) * 100), isQualified: false, isEliminated: false };
        }

        const totalTeams = sorted.length;
        if (totalTeams <= qualifySpots) return { prob: 100, isQualified: true, isEliminated: false };

        // Determine matches per team
        const matchesPerTeam = totalGroupMatches
            ? Math.round((totalGroupMatches * 2) / totalTeams)
            : (totalTeams - 1);

        // Maximum points this team can achieve
        const remaining = Math.max(0, matchesPerTeam - entry.played);
        const maxPoints = entry.points + (remaining * pointsPerWin);

        let teamsGuaranteedAbove = 0; // Teams that already have more points than this team's max possible
        let teamsThatCouldOvertake = 0; // Teams that could theoretically pass this team's CURRENT points

        sorted.forEach((other, oi) => {
            if (oi === idx) return;
            const otherRemaining = Math.max(0, matchesPerTeam - other.played);
            const otherMaxPoints = other.points + (otherRemaining * pointsPerWin);

            // Is it mathematically impossible for us to catch them?
            if (other.points > maxPoints) {
                teamsGuaranteedAbove++;
            }
            // Is it mathematically possible for them to overtake us?
            if (otherMaxPoints >= entry.points) {
                teamsThatCouldOvertake++;
            }
        });

        // A team is mathematically eliminated if the number of teams GUARANTEED to finish above them
        // is greater than or equal to the number of qualifying spots.
        const isEliminated = teamsGuaranteedAbove >= qualifySpots;

        // A team is mathematically qualified if they are guaranteed to finish in the top N spots.
        // This is true when the number of teams that could POSSIBLY overtake them (plus those already above)
        // is strictly less than the number of qualification spots.
        // Also ensure they have actually won a game/secured points to avoid day 1 false qualifications.
        let isQualified = false;
        if (entry.points > 0 && (teamsGuaranteedAbove + teamsThatCouldOvertake < qualifySpots)) {
            isQualified = true;
        }

        // Special case: If tournament is over for this group (everyone played all matches)
        const allMatchesCompleted = sorted.every(e => e.played >= matchesPerTeam);
        if (allMatchesCompleted) {
            isQualified = idx < qualifySpots;
        }

        // Return early if status is definitive
        if (isEliminated) return { prob: 0, isQualified: false, isEliminated: true };
        if (isQualified) return { prob: 100, isQualified: true, isEliminated: false };

        // Fallback probabilistic calculation
        let prob = 50;
        if (idx < qualifySpots) {
            prob += 30 + (qualifySpots - idx) * 5;
        } else {
            prob -= 20 + (idx - qualifySpots) * 10;
        }

        const leaderPoints = sorted[0]?.points || 0;
        if (leaderPoints > 0) prob += (entry.points / leaderPoints - 0.5) * 30;
        if (entry.nrr > 0) prob += Math.min(10, entry.nrr * 3);
        if (entry.nrr < 0) prob -= Math.min(10, Math.abs(entry.nrr) * 3);
        if (remaining > 0 && idx >= qualifySpots) prob += remaining * 5;

        return { prob: Math.max(1, Math.min(99, Math.round(prob))), isQualified: false, isEliminated: false };
    });

    const handleRecalculate = async () => {
        if (!confirm('Are you sure you want to recalculate the points table from match history? This will overwrite current standings.')) return;
        try {
            await tournamentApi.recalculatePointsTable(tournamentId);
            toast.success("Points table recalculated successfully");
            onRefresh?.();
        } catch (error) {
            toast.error("Failed to recalculate points table");
        }
    };

    return (
        <div className="overflow-x-auto relative">
            {onRefresh && entries.length > 0 && tournamentStatus !== 'Completed' && (
                <div className="flex justify-end mb-2 pr-2">
                    <Button variant="outline" size="sm" onClick={handleRecalculate} className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-400">
                        <RefreshCw size={12} className="mr-1.5" /> Recalculate
                    </Button>
                </div>
            )}
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-slate-500 text-xs bg-slate-800/50 border-y border-slate-700">
                        <th className="text-left font-medium py-3 pl-4">Team</th>
                        <th className="text-center font-medium py-3">P</th>
                        <th className="text-center font-medium py-3">W</th>
                        <th className="text-center font-medium py-3">L</th>
                        <th className="text-center font-medium py-3">T</th>
                        <th className="text-center font-medium py-3">NR</th>
                        <th className="text-center font-bold py-3">Pts</th>
                        <th className="text-center font-medium py-3">NRR</th>
                        <th className="text-center font-medium py-3 pr-4">Q%</th>
                        <th className="pr-4 w-20 text-center font-medium py-3">Analyze</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {sorted.map((entry, idx) => {
                        const status = qualStatus[idx];
                        const qProb = status.prob;
                        const qColor = status.isQualified ? 'text-green-400' : status.isEliminated ? 'text-red-500' : qProb >= 70 ? 'text-green-400' : qProb >= 40 ? 'text-yellow-400' : 'text-orange-400';
                        const nrrDisplay = entry.nrr > 0 ? `+${entry.nrr.toFixed(3)}` : entry.nrr.toFixed(3);
                        const nrrColor = entry.nrr > 0 ? 'text-green-400' : entry.nrr < 0 ? 'text-red-400' : 'text-slate-400';

                        return (
                            <React.Fragment key={entry.team?._id || idx}>
                                <tr
                                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${status.isEliminated ? 'opacity-40 grayscale-[0.5]' : idx < qualifySpots ? '' : 'opacity-70'} ${expandedTeamId === entry.team?._id ? 'bg-slate-800/40' : ''}`}
                                    onClick={() => setExpandedTeamId(expandedTeamId === entry.team?._id ? null : entry.team?._id)}
                                >
                                    <td className="py-3 pl-4 flex items-center gap-3">
                                        <div className="w-4 text-center">
                                            {status.isQualified ? (
                                                <span className="text-green-400 font-black text-xs" title="Qualified">Q</span>
                                            ) : status.isEliminated ? (
                                                <span className="text-red-500/50 font-bold text-[10px]" title="Eliminated">E</span>
                                            ) : (
                                                <span className="text-slate-500 font-medium text-xs">{idx + 1}</span>
                                            )}
                                        </div>
                                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0 font-black text-[8px] tracking-wider" style={{ backgroundColor: `${entry.team?.color || '#3b82f6'}20`, color: entry.team?.color || '#3b82f6' }}>
                                            {entry.team?.logo ? <img src={entry.team.logo} className="w-full h-full object-cover" /> : entry.team?.acronym || getTeamAcronym(entry.team?.name)}
                                        </div>
                                        <span className={`text-white font-medium ${status.isQualified ? 'text-green-50' : ''}`}>{entry.team?.name || "Unknown Team"}</span>
                                    </td>
                                    <td className="text-center text-slate-300">{entry.played}</td>
                                    <td className="text-center text-green-400">{entry.won}</td>
                                    <td className="text-center text-red-400">{entry.lost}</td>
                                    <td className="text-center text-slate-400">{entry.tied}</td>
                                    <td className="text-center text-slate-400">{entry.noResult}</td>
                                    <td className="text-center text-white font-bold">{entry.points}</td>
                                    <td className={`text-center ${nrrColor}`}>{nrrDisplay}</td>
                                    <td className={`text-center font-semibold pr-4 ${qColor}`}>
                                        <div className="flex flex-col items-center">
                                            <span>{status.isQualified ? '100%' : status.isEliminated ? '0%' : `${qProb}%`}</span>
                                        </div>
                                    </td>
                                    <td className="pr-4 text-center">
                                        <div className="flex items-center justify-center text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded gap-1 transition-colors">
                                            <Calculator size={12} />
                                            {expandedTeamId === entry.team?._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </div>
                                    </td>
                                </tr>
                                {expandedTeamId === entry.team?._id && !status.isQualified && !status.isEliminated && idx > 0 && (() => {
                                    // Find next match for this team
                                    const nextMatch = matches.find(m =>
                                        ((typeof m.homeTeam === 'object' && m.homeTeam !== null ? m.homeTeam._id : m.homeTeam) === entry.team?._id ||
                                            (typeof m.awayTeam === 'object' && m.awayTeam !== null ? m.awayTeam._id : m.awayTeam) === entry.team?._id) &&
                                        m.status !== 'Completed'
                                    );

                                    let nextOpponentName = "Next Opponent";
                                    let isNextMatchDetermined = false;

                                    if (nextMatch) {
                                        const isHome = (typeof nextMatch.homeTeam === 'object' && nextMatch.homeTeam !== null ? nextMatch.homeTeam._id : nextMatch.homeTeam) === entry.team?._id;
                                        const oppObj = isHome ? nextMatch.awayTeam : nextMatch.homeTeam;
                                        if (oppObj && typeof oppObj === 'object' && (oppObj as any).name) {
                                            nextOpponentName = (oppObj as any).name;
                                            isNextMatchDetermined = true;
                                        }
                                    }

                                    return (
                                        <tr className="bg-slate-900/50 border-b border-slate-800/50">
                                            <td colSpan={10} className="p-4 border-l-2 border-indigo-500/50">
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="flex-1 space-y-3">
                                                        <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                            <Calculator size={14} /> Qualification Analyzer
                                                        </h4>
                                                        <p className="text-sm text-slate-400">
                                                            To overtake <strong className="text-white">{sorted[idx - 1].team?.name || 'the team above'}</strong>, {entry.team?.name} needs to clear a gap of <strong className="text-slate-300">{(sorted[idx - 1].nrr - entry.nrr).toFixed(3)} NRR</strong>.
                                                            {isNextMatchDetermined && <span> Next match is against <strong className="text-orange-300">{nextOpponentName}</strong>.</span>}
                                                        </p>

                                                        <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg inline-flex mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-slate-400 whitespace-nowrap">Target / Score</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={analyzeTarget}
                                                                    onChange={(e) => setAnalyzeTarget(e.target.value)}
                                                                    className="h-7 w-20 bg-slate-900 border-slate-700 text-xs"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-slate-400">Max Overs</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={analyzeOvers}
                                                                    onChange={(e) => setAnalyzeOvers(e.target.value)}
                                                                    className="h-7 w-16 bg-slate-900 border-slate-700 text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        {(() => {
                                                            const targetVal = Number(analyzeTarget);
                                                            const oversVal = Number(analyzeOvers);
                                                            const margin = calculateNRRMargin(
                                                                { runsScored: entry.runsScored || 0, oversFaced: entry.oversFaced || 0, runsConceded: entry.runsConceded || 0, oversBowled: entry.oversBowled || 0 },
                                                                { runsScored: sorted[idx - 1].runsScored || 0, oversFaced: sorted[idx - 1].oversFaced || 0, runsConceded: sorted[idx - 1].runsConceded || 0, oversBowled: sorted[idx - 1].oversBowled || 0 },
                                                                targetVal > 0 ? targetVal : (tournamentOvers * 8),
                                                                oversVal > 0 ? oversVal : tournamentOvers
                                                            );

                                                            return (
                                                                <div className="grid grid-cols-2 gap-3 h-full">
                                                                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 flex flex-col justify-center">
                                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">If Chasing</p>
                                                                        <p className="text-sm font-medium text-slate-300">
                                                                            {analyzeTarget} should be chased under <br />
                                                                            {margin.chaseBeforeOver ? (
                                                                                <span className="text-lg font-black text-green-400">{margin.chaseBeforeOver} overs</span>
                                                                            ) : (
                                                                                <span className="text-sm text-red-400">Impossible</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 flex flex-col justify-center">
                                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">If Defending</p>
                                                                        <p className="text-sm font-medium text-slate-300">
                                                                            You need to stop opponent under <br />
                                                                            {margin.restrictToRuns !== null ? (
                                                                                <span className="text-lg font-black text-blue-400">{margin.restrictToRuns} runs</span>
                                                                            ) : (
                                                                                <span className="text-sm text-red-400">Impossible</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            {entries.length === 0 && (
                <div className="py-8 text-center bg-slate-900/50">
                    <Trophy className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">Points table is empty.</p>
                </div>
            )}
        </div>
    );
};

// ════════════════════════════════════════════
// SHOCKER UI SUB-COMPONENTS
// ════════════════════════════════════════════

const DNAHelix = () => (
  <div className="relative w-12 h-24 flex flex-col justify-between items-center py-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex justify-between w-full px-1 items-center relative h-1">
        <div 
          className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
        <div className="flex-1 h-[1px] bg-gradient-to-r from-blue-400/50 via-transparent to-purple-400/50 mx-1 opacity-40" />
        <div 
          className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"
          style={{ animationDelay: `${(i + 3) * 0.2}s` }}
        />
      </div>
    ))}
    <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full animate-pulse" />
  </div>
);

const IdentityScanner = ({ id }: { id?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_3s_ease-in-out_infinite] opacity-50 shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 opacity-40">
      <Fingerprint size={10} className="text-blue-400" />
      <span className="text-[7px] font-mono text-blue-400 tracking-[0.2em] uppercase">Biometric Match: {id || 'SYNC'}</span>
    </div>
  </div>
);

const QuantumStatCard = ({ icon: Icon, label, value, subValue, color }: { icon: any, label: string, value: string | number, subValue?: string, color: string }) => (
  <div className="group/qcard relative p-5 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover/qcard:opacity-100 transition-opacity" />
    <div className="relative flex items-center gap-5">
      <div className={`p-4 rounded-2xl bg-slate-950 border border-white/5 ${color} group-hover/qcard:scale-110 transition-transform duration-500 shadow-2xl`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
          {subValue && <span className="text-[8px] font-mono text-blue-500/60 uppercase tracking-widest">{subValue}</span>}
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">{label}</p>
      </div>
    </div>
    {/* Micro-HUD elements */}
    <div className="absolute top-2 right-2 flex gap-1">
      <div className="w-1 h-1 rounded-full bg-white/5" />
      <div className="w-4 h-1 rounded-full bg-white/5" />
    </div>
  </div>
);

export const TournamentManager = ({ initialTournamentId, initialPlayerName }: { initialTournamentId?: string, initialPlayerName?: string }) => {
    const navigate = useNavigate();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = (clientX / innerWidth) * 2 - 1;
        const y = (clientY / innerHeight) * 2 - 1;
        setMousePos({ x, y });
    };

    const [searchParams, setSearchParams] = useSearchParams();

    const viewUrl = searchParams.get("tv") as View | null;
    const view = initialTournamentId ? "detail" : (viewUrl || "list");

    const detailTabUrl = searchParams.get("tab") as DetailTab | null;
    const detailTab = detailTabUrl || "overview";

    const setView = (v: View) => {
        if (!initialTournamentId) {
            const next = new URLSearchParams(searchParams);
            if (v === "list") {
                next.delete("tv");
                next.delete("tid");
                next.delete("tab");
                setSelectedTournament(null);
            } else {
                next.set("tv", v);
            }
            setSearchParams(next);
        }
    };

    const setDetailTab = (t: DetailTab) => {
        const next = new URLSearchParams(searchParams);
        if (t === "overview") next.delete("tab"); else next.set("tab", t);
        setSearchParams(next);
    };
    const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [tournamentTeams, setTournamentTeams] = useState<Team[]>([]);
    const [tournamentMatches, setTournamentMatches] = useState<Match[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [tournamentStats, setTournamentStats] = useState<any>(null);
    const [matchFilter, setMatchFilter] = useState<MatchFilter>("All");
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const { toggle: toggleFollow, isFollowed } = useTournamentFollow();
    // Team detail panel
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [teamMatches, setTeamMatches] = useState<Match[]>([]);

    const BASE_URL = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : (import.meta.env.PROD ? '' : 'http://localhost:5000');

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Use relative path directly as Vite serves the public folder at root
        return path;
    };

    // Create tournament form
    const [name, setName] = useState("");
    const [format, setFormat] = useState<"League" | "Knockout">("League");
    const [matchType, setMatchType] = useState<"T10" | "T20" | "ODI" | "Test" | "Custom">("T20");
    const [overs, setOvers] = useState("20");
    const [testDays, setTestDays] = useState("5");
    const [oversPerSession, setOversPerSession] = useState("30");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [groupStructure, setGroupStructure] = useState<'None' | 'Same Group' | 'Cross Group'>("None");
    const [groupsCount, setGroupsCount] = useState("1");

    // Edit tournament form
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        format: "League" as "League" | "Knockout",
        matchType: "T20" as "T10" | "T20" | "ODI" | "Test" | "Custom",
        overs: "20",
        testDays: "5",
        oversPerSession: "30",
        startDate: "",
        endDate: "",
        groupStructure: "None" as 'None' | 'Same Group' | 'Cross Group',
        groupsCount: "1",
        status: "Upcoming" as any
    });

    // Add team dialog
    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamAcronym, setNewTeamAcronym] = useState("");
    const [newTeamCaptain, setNewTeamCaptain] = useState("");
    const [newTeamLogo, setNewTeamLogo] = useState("");
    const [newTeamPlayerInput, setNewTeamPlayerInput] = useState("");
    const [newTeamPlayerRole, setNewTeamPlayerRole] = useState<PlayerRole>("Batsman");
    const [newTeamPlayerBattingStyle, setNewTeamPlayerBattingStyle] = useState<string>("Right-hand Bat");
    const [newTeamPlayerBowlingStyle, setNewTeamPlayerBowlingStyle] = useState<string>("None");
    const [newTeamPlayers, setNewTeamPlayers] = useState<PlayerEntry[]>([]);
    const [newTeamColor, setNewTeamColor] = useState("#3b82f6");

    // Add existing team dialog
    const [isLinkTeamOpen, setIsLinkTeamOpen] = useState(false);
    const [selectedTeamToLink, setSelectedTeamToLink] = useState("");
    const [assignGroupIndex, setAssignGroupIndex] = useState<string>("");

    // Schedule match dialog
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [matchGroupIndex, setMatchGroupIndex] = useState<string>("");
    const [matchHomeTeam, setMatchHomeTeam] = useState("");
    const [matchAwayTeam, setMatchAwayTeam] = useState("");
    const [matchVenue, setMatchVenue] = useState("");
    const [matchDate, setMatchDate] = useState("");
    const [scheduleMatchType, setScheduleMatchType] = useState<'League' | 'Semi Final' | 'Final'>("League");

    // Add player to existing team (inline in team detail)
    const [addPlayerName, setAddPlayerName] = useState("");
    const [addPlayerRole, setAddPlayerRole] = useState<PlayerRole>("Batsman");
    const [addPlayerBattingStyle, setAddPlayerBattingStyle] = useState<string>("Right-hand Bat");
    const [addPlayerBowlingStyle, setAddPlayerBowlingStyle] = useState<string>("None");
    const [isAddingPlayer, setIsAddingPlayer] = useState(false);
    const [playerSuggestions, setPlayerSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<'add' | 'new' | null>(null);
    const [tournamentConflict, setTournamentConflict] = useState<string | null>(null);

    // Player profile
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
    const [playerDetailTab, setPlayerDetailTab] = useState<'traits' | 'stats' | 'awards' | 'wagonwheel' | 'matches'>('traits');
    const [isEditingPlayer, setIsEditingPlayer] = useState(false);
    const [editPlayerName, setEditPlayerName] = useState("");
    const [editPlayerRole, setEditPlayerRole] = useState<PlayerRole>("Batsman");
    const [editPlayerBattingStyle, setEditPlayerBattingStyle] = useState<string>("Right-hand Bat");
    const [editPlayerBowlingStyle, setEditPlayerBowlingStyle] = useState<string>("None");
    const [playerStats, setPlayerStats] = useState<any>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [playerStatsFormat, setPlayerStatsFormat] = useState<string>("All");

    // Tournament ownership & search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Tournament[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [listMode, setListMode] = useState<'mine' | 'search'>('mine');

    // Get current user ID from localStorage
    const getCurrentUserId = () => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                return user._id || user.id || null;
            }
        } catch { }
        return null;
    };
    const currentUserId = getCurrentUserId();

    // Determine if current user owns the selected tournament OR is a platform admin
    const isOwner = (() => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return false;
            
            const user = JSON.parse(userStr);
            const currentUserEmail = user.email?.toLowerCase();
            const role = user.role?.toLowerCase();

            // 1. Check for platform-wide admin status (Role or specific email)
            const isPlatformAdmin = 
                role === 'admin' || 
                role === 'scorer' || 
                localStorage.getItem("isAdmin") === "true" ||
                currentUserEmail === 'admin@sportbuzz.com';

            if (isPlatformAdmin) return true;

            // 2. Fallback to specific tournament ownership
            if (!selectedTournament || !currentUserId) return false;
            
            const createdBy = (selectedTournament as any).createdBy;
            if (!createdBy) return false;
            
            const ownerId = typeof createdBy === 'object' ? createdBy._id : createdBy;
            return ownerId?.toString() === currentUserId?.toString();
        } catch (err) {
            console.error("Ownership check failed:", err);
            return false;
        }
    })();
    const isTournamentOwner = isOwner;

    useEffect(() => { fetchTournaments(); }, []);

    // Debounced player search for autocomplete
    useEffect(() => {
        const name = showSuggestions === 'add' ? addPlayerName : showSuggestions === 'new' ? newTeamPlayerInput : '';
        if (!name || name.trim().length < 2) {
            setPlayerSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await playerApi.search(name.trim());
                const data = res?.data || res || [];
                setPlayerSuggestions(Array.isArray(data) ? data : []);
            } catch { setPlayerSuggestions([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [addPlayerName, newTeamPlayerInput, showSuggestions]);

    // Handle initialTournamentId from URL or search params
    useEffect(() => {
        const tid = initialTournamentId || searchParams.get("tid");
        if (tid && tournaments.length > 0) {
            const tournament = tournaments.find(t => t._id === tid);
            if (tournament) {
                openTournamentDetail(tournament);
            } else {
                // If we're deep-linked but tournament isn't in the list, try fetching it directly
                tournamentApi.getById(tid).then(res => {
                    const t = res.data?.data || res.data;
                    if (t) {
                        setTournaments(prev => [...prev.filter(x => x._id !== tid), t]);
                        openTournamentDetail(t);
                    } else {
                        toast.error("Tournament not found.");
                        setView("list");
                    }
                }).catch(() => {
                    toast.error("Tournament not found.");
                    setView("list");
                });
            }
        }
    }, [initialTournamentId, tournaments.length === 0, searchParams.get("tid"), navigate]);

    // Handle initialPlayerName from URL (deep-link from search)
    useEffect(() => {
        if (initialPlayerName && tournamentTeams.length > 0) {
            let foundPlayer: any = null;
            for (const team of tournamentTeams) {
                const p = (team.players || []).find(player => getPlayerName(player) === initialPlayerName);
                if (p) {
                    foundPlayer = p;
                    break;
                }
            }
            if (foundPlayer) {
                fetchPlayerStats(
                    getPlayerName(foundPlayer),
                    getPlayerRole(foundPlayer),
                    typeof foundPlayer === 'object' ? foundPlayer.battingStyle : undefined,
                    typeof foundPlayer === 'object' ? foundPlayer.bowlingStyle : undefined,
                    typeof foundPlayer === 'object' ? foundPlayer.photo : undefined
                );
            }
        }
    }, [initialPlayerName, tournamentTeams]);

    // Auto-refresh tournament match data every 10s when there are live matches
    useEffect(() => {
        if (!selectedTournament) return;
        const hasLive = tournamentMatches.some(m => m.status === 'Live');
        if (!hasLive) return;
        const interval = setInterval(() => {
            customMatchApi.getAll({ tournamentId: selectedTournament?._id })
                .then(res => setTournamentMatches(res.data?.data || res.data || []))
                .catch(() => { });
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedTournament, tournamentMatches]);

    const fetchTournaments = async () => {
        try {
            // Fetch all tournaments so that previously created test tournaments are visible
            const params: any = {};
            const res = await tournamentApi.getAll(params);
            setTournaments(res.data || []);
        } catch (err) {
            console.error("[TOURNAMENT_ERROR] Failed to fetch list:", err);
            toast.error("Failed to load tournaments");
        }
        finally { setIsLoading(false); }
    };

    // Tournament search (debounced)
    useEffect(() => {
        if (listMode !== 'search' || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await tournamentApi.search(searchQuery.trim());
                setSearchResults(res.data || []);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, listMode]);

    // Auto-restore selected tournament from URL on mount
    const tidUrl = searchParams.get("tid");
    useEffect(() => {
        if (tournaments.length > 0 && !selectedTournament && !initialTournamentId && tidUrl) {
            const t = tournaments.find(t => t._id === tidUrl);
            if (t) {
                setSelectedTournament(t);
                fetchTournamentDetails(t._id);
            }
        }
    }, [tournaments, selectedTournament, initialTournamentId, tidUrl]);

    // Auto-restore selected team if teid is in URL
    const teidUrl = searchParams.get("teid");
    useEffect(() => {
        if (allTeams.length > 0 && selectedTournament && !selectedTeam && teidUrl) {
            const team = allTeams.find(t => t._id === teidUrl);
            if (team) {
                openTeamDetail(team);
            }
        }
    }, [allTeams, selectedTournament, selectedTeam, teidUrl]);

    // Auto-restore selected match if mid is in URL
    const midUrl = searchParams.get("mid");
    useEffect(() => {
        if (tournamentMatches.length > 0 && selectedTournament && !selectedMatch && midUrl) {
            const match = tournamentMatches.find(m => m._id === midUrl);
            if (match) {
                setSelectedMatch(match);
            }
        }
    }, [tournamentMatches, selectedTournament, selectedMatch, midUrl]);

    // Auto-restore selected player if pn is in URL
    const pnUrl = searchParams.get("pn");
    useEffect(() => {
        if (selectedTeam && !selectedPlayer && pnUrl) {
            const p = selectedTeam?.players?.find((p: any) => getPlayerName(p) === pnUrl);
            if (p) {
                fetchPlayerStats(
                    getPlayerName(p),
                    getPlayerRole(p),
                    typeof p === 'object' ? p.battingStyle : undefined,
                    typeof p === 'object' ? p.bowlingStyle : undefined,
                    typeof p === 'object' ? (p as any).photo : undefined
                );
            }
        }
    }, [selectedTeam, selectedPlayer, pnUrl, allTeams]); // Include allTeams to ensure squad is loaded

    const openTournamentDetail = async (tournament: Tournament) => {
        setSelectedTournament(tournament);
        closeTeamDetail(); // Clear team when switching tournament
        if (!initialTournamentId) {
            const next = new URLSearchParams(searchParams);
            next.set("tv", "detail");
            next.set("tid", tournament._id);
            next.delete("tab");
            setSearchParams(next);
        } else {
            const next = new URLSearchParams(searchParams);
            next.delete("tab");
            setSearchParams(next);
        }
        await fetchTournamentDetails(tournament._id);
    };

    const handleDeleteTournament = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${name}"? This will also remove all its matches. This cannot be undone.`)) return;
        try {
            await tournamentApi.delete(id);
            toast.success(`"${name}" deleted`);
            await fetchTournaments();
        } catch {
            toast.error("Failed to delete tournament");
        }
    };

    const handleUploadPlayerPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTeam || !selectedPlayer) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const updatedPlayers = selectedTeam.players.map((p: any) => {
                    const normalized = typeof p === 'string' ? { name: p } : p;
                    if (normalized.name === selectedPlayer.name) {
                        return { ...normalized, photo: base64String };
                    }
                    return normalized;
                });
                
                const res = await teamApi.update(selectedTeam._id, { players: updatedPlayers });
                if ((res as any).success) {
                    toast.success("Photo updated successfully!");
                    setSelectedPlayer({ ...selectedPlayer, photo: base64String });
                    setSelectedTeam({ ...selectedTeam, players: updatedPlayers });
                    if (selectedTournament) await fetchTournamentDetails(selectedTournament._id);
                }
            } catch (err) {
                console.error("Upload failed:", err);
                toast.error("Failed to upload photo");
            }
        };
        reader.readAsDataURL(file);
    };

    const fetchTournamentDetails = async (tournamentId: string) => {
        try {
            const [tRes, matchRes, teamRes] = await Promise.all([
                tournamentApi.getById(tournamentId),
                customMatchApi.getAll({ tournamentId }),
                teamApi.getAll()
            ]);

            const ft = tRes.data;
            setSelectedTournament(ft);
            setTournamentTeams(ft?.teams || []);
            setTournamentMatches(matchRes.data || []);
            setAllTeams(teamRes.data || []);

            // Fetch stats separately so it doesn't block the main UI if it fails
            try {
                const statsRes = await tournamentApi.getStats(tournamentId);
                setTournamentStats(statsRes.data || null);
            } catch (err) {
                console.error("Failed to load tournament stats:", err);
                setTournamentStats(null);
            }
        } catch (err) { 
            console.error("[TOURNAMENT_ERROR] Failed to load details:", err);
            toast.error("Failed to load tournament details"); 
        }
    };

    const openTeamDetail = (team: Team) => {
        setSelectedTeam(team);
        setTeamMatches(tournamentMatches.filter(
            m => m.homeTeam?._id === team._id || m.awayTeam?._id === team._id
        ));
        const next = new URLSearchParams(searchParams);
        next.set("teid", team._id);
        next.delete("pn"); // Reset player view when switching teams
        setSearchParams(next);
    };

    const closeTeamDetail = () => {
        setSelectedTeam(null);
        setSelectedPlayer(null); // Clear player profile too
        const next = new URLSearchParams(searchParams);
        next.delete("teid");
        next.delete("pn");
        setSearchParams(next);
    };

    const setSelectedMatchWithUrl = (match: Match | null) => {
        setSelectedMatch(match);
        const next = new URLSearchParams(searchParams);
        if (match) {
            next.set("mid", match._id);
        } else {
            next.delete("mid");
        }
        setSearchParams(next);
    };

    const getTeamStats = (team: Team) => {
        const matches = tournamentMatches.filter(m => m.homeTeam?._id === team._id || m.awayTeam?._id === team._id);
        const completed = matches.filter(m => m.status === 'Completed');
        const won = completed.filter(m => (m.result as any)?.winner === team._id).length;
        const lost = completed.length - won;
        const totalRuns = completed.reduce((sum, m) => {
            if (m.homeTeam?._id === team._id) return sum + (m.score?.team1?.runs || 0);
            return sum + (m.score?.team2?.runs || 0);
        }, 0);
        return { played: completed.length, won, lost, totalRuns, upcoming: matches.filter(m => m.status === 'Upcoming').length };
    };

    const handleCreateTournament = async () => {
        if (!name || !startDate || !endDate) { toast.error("Please fill in all required fields"); return; }
        try {
            const response = await tournamentApi.create({
                name,
                format,
                matchType,
                overs: parseInt(overs),
                testDays: matchType === "Test" ? parseInt(testDays) : 5,
                oversPerSession: matchType === "Test" ? parseInt(oversPerSession) : 30,
                startDate,
                endDate,
                groupStructure,
                groupsCount: parseInt(groupsCount)
            }) as any;
            if (response.success) {
                toast.success("Tournament created successfully!");
                setIsCreateOpen(false);
                const freshTournament = response.data;
                
                // Clear form
                setName(""); setFormat("League"); setMatchType("T20"); setOvers("20"); setTestDays("5"); setOversPerSession("30");
                setStartDate(""); setEndDate("");
                setGroupStructure("None"); setGroupsCount("1");
                
                await fetchTournaments();
                if (freshTournament) {
                    // Ensure the tournament object has necessary properties for immediate rendering
                    const safeTournament = {
                        ...freshTournament,
                        overs: freshTournament.overs || 20,
                        teams: freshTournament.teams || [],
                        status: freshTournament.status || 'Upcoming'
                    };
                    openTournamentDetail(safeTournament);
                }
            }
        } catch { toast.error("Failed to create tournament"); }
    };

    const handleEditTournament = async () => {
        if (!selectedTournament) return;
        try {
            const res = await tournamentApi.update(selectedTournament._id, {
                ...editForm,
                overs: parseInt(editForm.overs),
                testDays: parseInt(editForm.testDays || "5"),
                oversPerSession: parseInt(editForm.oversPerSession || "30"),
                groupsCount: parseInt(editForm.groupsCount)
            }) as any;
            if (res.success) {
                toast.success("Tournament updated!");
                setIsEditOpen(false);
                await fetchTournamentDetails(selectedTournament._id);
                await fetchTournaments();
            }
        } catch { toast.error("Failed to update tournament"); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewTeamLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateAndAddTeam = async () => {
        if (!newTeamName || !selectedTournament) { toast.error("Team name is required"); return; }
        try {
            // Auto-include captain in players list so they can bat/bowl
            const hasCaptain = newTeamCaptain && newTeamPlayers.some(p => p.name === newTeamCaptain);
            const finalPlayers = !hasCaptain && newTeamCaptain
                ? [{ name: newTeamCaptain, role: "All-Rounder" as PlayerRole }, ...newTeamPlayers]
                : newTeamPlayers;

            const teamRes = await teamApi.create({
                name: newTeamName,
                acronym: newTeamAcronym.toUpperCase(),
                captain: newTeamCaptain,
                players: finalPlayers,
                logo: newTeamLogo,
                color: newTeamColor
            }) as any;
            if (teamRes.success && teamRes.data) {
                await tournamentApi.addTeam(selectedTournament._id, teamRes.data._id, {
                    groupIndex: assignGroupIndex !== "" ? parseInt(assignGroupIndex) : undefined
                });
                toast.success(`${newTeamName} added to tournament!`);
                setIsAddTeamOpen(false);
                setNewTeamName("");
                setNewTeamAcronym("");
                setNewTeamCaptain("");
                setNewTeamPlayers([]);
                setNewTeamLogo(""); setNewTeamPlayerInput("");
                setAssignGroupIndex("");
                await fetchTournamentDetails(selectedTournament._id);
            }
        } catch (err: any) { 
            toast.error(err.response?.data?.message || "Failed to create team"); 
        }
    };

    const handleLinkExistingTeam = async () => {
        if (!selectedTeamToLink || !selectedTournament) return;
        try {
            await tournamentApi.addTeam(selectedTournament._id, selectedTeamToLink, {
                groupIndex: assignGroupIndex !== "" ? parseInt(assignGroupIndex) : undefined
            });
            toast.success("Team added to tournament!");
            setIsLinkTeamOpen(false); setSelectedTeamToLink("");
            setAssignGroupIndex("");
            await fetchTournamentDetails(selectedTournament._id);
        } catch { toast.error("Failed to add team"); }
    };

    const handleScheduleMatch = async () => {
        if (!matchHomeTeam || !matchAwayTeam || !matchDate || !matchVenue) { toast.error("Please fill in all match details"); return; }
        if (matchHomeTeam === matchAwayTeam) { toast.error("A team cannot play against itself"); return; }
        try {
            const response = await customMatchApi.create({
                tournament: selectedTournament!._id,
                homeTeam: matchHomeTeam, 
                awayTeam: matchAwayTeam,
                venue: matchVenue, 
                date: matchDate, 
                status: 'Upcoming',
                matchType: scheduleMatchType
            }) as any;
            if (response.success) {
                toast.success("Match scheduled!");
                setIsScheduleOpen(false);
                setMatchHomeTeam(""); setMatchAwayTeam(""); setMatchVenue(""); setMatchDate(""); setScheduleMatchType("League");
                await fetchTournamentDetails(selectedTournament!._id);
            }
        } catch { toast.error("Failed to schedule match"); }
    };

    const handleShuffleGroups = async () => {
        if (!selectedTournament) return;
        if (!window.confirm("This will randomly redistribute all teams into the set number of groups. Continue?")) return;
        try {
            const res = await tournamentApi.shuffleGroups(selectedTournament?._id || '') as any;
            if (res.success) {
                toast.success("Groups shuffled successfully!");
                await fetchTournamentDetails(selectedTournament._id);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to shuffle groups");
        }
    };

    const handleDeleteMatch = async (matchId: string) => {
        if (!window.confirm("Are you sure you want to delete this match? This will remove all associated balls and scoring data.")) return;
        try {
            const res = await customMatchApi.delete(matchId) as any;
            if (res.success) {
                toast.success("Match deleted successfully");
                if (selectedTournament) await fetchTournamentDetails(selectedTournament._id);
            }
        } catch { toast.error("Failed to delete match"); }
    };

    const addPlayer = () => {
        const pName = newTeamPlayerInput.trim();
        if (!pName) return;

        const existingTeam = getPlayerTeam(pName);
        if (existingTeam) {
            toast.error(`${pName} is already playing for ${existingTeam} in this tournament!`);
            return;
        }

        if (!newTeamPlayers.some(p => p.name === pName)) {
            setNewTeamPlayers([...newTeamPlayers, { 
                name: pName, 
                role: newTeamPlayerRole,
                battingStyle: newTeamPlayerBattingStyle,
                bowlingStyle: newTeamPlayerBowlingStyle
            }]);
            setNewTeamPlayerInput("");
        }
    };

    const getPlayerTeam = (playerName: string) => {
        const team = tournamentTeams.find(t =>
            (t.players || []).some(p => getPlayerName(p) === playerName)
        );
        return team ? team.name : null;
    };

    // Helper to group players by role
    const groupPlayersByRole = (players: (PlayerEntry | string)[]) => {
        const groups: Record<PlayerRole, string[]> = { "Batsman": [], "Bowler": [], "All-Rounder": [], "Wicket Keeper": [] };
        players.forEach(p => {
            const name = getPlayerName(p);
            const role = getPlayerRole(p);
            groups[role].push(name);
        });
        return groups;
    };

    // Add player to an existing team (from team detail view)
    const handleAddPlayerToTeam = async () => {
        if (!selectedTeam || !addPlayerName.trim()) {
            toast.error("Enter a player name");
            return;
        }
        const existing = (selectedTeam.players || []).map(getPlayerName);
        if (existing.includes(addPlayerName.trim())) {
            toast.error("Player already in squad");
            return;
        }
        // Check tournament conflict
        if (selectedTournament?._id) {
            try {
                const checkRes = await playerApi.checkTournament(addPlayerName.trim(), selectedTournament._id);
                const checkData = checkRes?.data || checkRes;
                if (checkData?.conflict && checkData.teamId !== selectedTeam._id) {
                    toast.error(`${addPlayerName.trim()} is already in ${checkData.teamName} in this tournament`);
                    return;
                }
            } catch {}
        }
        setIsAddingPlayer(true);
        try {
            const newPlayers = [
                ...(selectedTeam.players || []),
                { 
                    name: addPlayerName.trim(), 
                    role: addPlayerRole,
                    battingStyle: addPlayerBattingStyle,
                    bowlingStyle: addPlayerBowlingStyle
                }
            ];
            const res = await teamApi.update(selectedTeam._id, { players: newPlayers });
            if ((res as any).success) {
                toast.success(`${addPlayerName.trim()} added to ${selectedTeam.name}`);
                setAddPlayerName("");
                setAddPlayerRole("Batsman");
                // Refresh team data
                const teamRes = await teamApi.getById(selectedTeam._id) as any;
                if (teamRes.success) setSelectedTeam(teamRes.data);
                // Also refresh tournament details list
                if (selectedTournament) await fetchTournamentDetails(selectedTournament._id);
            }
        } catch {
            toast.error("Failed to add player");
        } finally {
            setIsAddingPlayer(false);
        }
    };

    // Open player profile and fetch stats
    const fetchPlayerStats = async (name: string, role: PlayerRole, battingStyle?: string, bowlingStyle?: string, photo?: string) => {
        setSelectedPlayer({ name, role, battingStyle, bowlingStyle, photo });
        
        // Sync with URL
        const next = new URLSearchParams(searchParams);
        next.set("pn", name);
        setSearchParams(next);

        setIsEditingPlayer(false); // Reset edit mode when opening new profile
        setIsLoadingStats(true);
        setPlayerStats(null);
        try {
            const res = await playerApi.getStats(name) as any;
            if (res.success) {
                setPlayerStats(res.data);
            } else {
                toast.error("Failed to fetch player stats");
            }
        } catch (error) {
            console.error("Error fetching player stats:", error);
            toast.error("Error loading player statistics");
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleViewPlayerStats = async (name: string) => {
        setIsLoadingStats(true);
        setPlayerDetailTab('traits'); // Reset to traits tab by default
        try {
            const res = await playerApi.getStats(name) as any;
            if (res.success) {
                setPlayerStats(res.data);
            } else {
                toast.error("Failed to fetch player stats");
            }
        } catch (error) {
            console.error("Error fetching player stats:", error);
            toast.error("Error loading player statistics");
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleUpdatePlayer = async () => {
        if (!selectedTeam || !selectedPlayer || !editPlayerName.trim()) {
            toast.error("Enter a player name");
            return;
        }

        setIsLoadingStats(true);
        try {
            const updatedPlayers = (selectedTeam.players || []).map(p => {
                const pName = typeof p === 'string' ? p : p.name;
                if (pName === selectedPlayer.name) {
                    return {
                        name: editPlayerName.trim(),
                        role: editPlayerRole,
                        battingStyle: editPlayerBattingStyle,
                        bowlingStyle: editPlayerBowlingStyle,
                        photo: (p as any).photo // Preserve photo if exists
                    };
                }
                return p;
            });

            const res = await teamApi.update(selectedTeam._id, { players: updatedPlayers }) as any;
            if (res.success) {
                toast.success("Player profile updated");
                
                // Refresh player profile view with new data
                await fetchPlayerStats(
                    editPlayerName.trim(), 
                    editPlayerRole, 
                    editPlayerBattingStyle, 
                    editPlayerBowlingStyle
                );
                
                // Refresh team data to update squad list
                const teamRes = await teamApi.getById(selectedTeam._id) as any;
                if (teamRes.success) setSelectedTeam(teamRes.data);
                
                // Refresh tournament details 
                if (selectedTournament) await fetchTournamentDetails(selectedTournament._id);
                
                setIsEditingPlayer(false);
            }
        } catch (error) {
            console.error("Error updating player:", error);
            toast.error("Failed to update player profile");
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleShare = () => {
        if (selectedTournament) {
            const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
            const shareUrl = `${baseUrl}/tournament/${selectedTournament._id}`;
            navigator.clipboard.writeText(shareUrl)
                .then(() => toast.success("Tournament link copied to clipboard!"))
                .catch(() => toast.error("Failed to copy link"));
        }
    };

    // ============================
    // RENDER: Tournament List
    // ============================
    if (view === "list") {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Tournaments
                        </h2>
                        <p className="text-slate-400">Create and manage your cricket tournaments</p>
                    </div>
                    {currentUserId && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700">
                                    <Plus size={18} className="mr-2" /> New Tournament
                                </Button>
                            </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white">
                            <DialogHeader>
                                <DialogTitle>Create New Tournament</DialogTitle>
                                <DialogDescription className="text-slate-400">Set up the rules and dates for your tournament.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Tournament Name</Label>
                                    <Input placeholder="e.g. Summer Premier League" className="bg-slate-800 border-slate-700" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tournament Structure</Label>
                                        <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                <SelectItem value="League">League</SelectItem>
                                                <SelectItem value="Knockout">Knockout</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Match Format</Label>
                                        <Select value={matchType} onValueChange={(v: any) => {
                                            setMatchType(v);
                                            if (v === 'T10') setOvers("10");
                                            else if (v === 'T20') setOvers("20");
                                            else if (v === 'ODI') setOvers("50");
                                        }}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                <SelectItem value="T10">T10 (10 Overs)</SelectItem>
                                                <SelectItem value="T20">T20 (20 Overs)</SelectItem>
                                                <SelectItem value="ODI">ODI (50 Overs)</SelectItem>
                                                <SelectItem value="Test">Test Match</SelectItem>
                                                <SelectItem value="Custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {matchType === 'Test' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Number of Days</Label>
                                            <Input type="number" className="bg-slate-800 border-slate-700" value={testDays} onChange={(e) => setTestDays(e.target.value)} min="1" max="5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Overs per Session</Label>
                                            <Input type="number" className="bg-slate-800 border-slate-700" value={oversPerSession} onChange={(e) => setOversPerSession(e.target.value)} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Overs per Innings</Label>
                                        <Input type="number" className={`bg-slate-800 border-slate-700 ${matchType !== 'Custom' ? 'opacity-50 cursor-not-allowed' : ''}`} value={overs} onChange={(e) => setOvers(e.target.value)} disabled={matchType !== 'Custom'} />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input type="date" className="bg-slate-800 border-slate-700" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input type="date" className="bg-slate-800 border-slate-700" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                                    <div className="space-y-2">
                                        <Label>Group Structure</Label>
                                        <Select value={groupStructure} onValueChange={(v: any) => setGroupStructure(v)}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                <SelectItem value="None">None (All in one)</SelectItem>
                                                <SelectItem value="Same Group">Same Group Matches</SelectItem>
                                                <SelectItem value="Cross Group">Cross Group Matches</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Number of Groups</Label>
                                        <Input
                                            type="number"
                                            className="bg-slate-800 border-slate-700"
                                            value={groupsCount}
                                            onChange={(e) => setGroupsCount(e.target.value)}
                                            disabled={groupStructure === "None"}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateTournament} className="bg-yellow-600 hover:bg-yellow-700">Create Tournament</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog >
                )}
                </div >

                {
                    isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse" >
                            {[1, 2].map(i => (<div key={i} className="h-40 bg-slate-800/50 rounded-xl" />))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <Tabs value={listMode} onValueChange={(v: any) => setListMode(v)} className="w-full sm:w-auto">
                                    <TabsList className="bg-slate-900 border border-slate-700">
                                        <TabsTrigger value="mine" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">
                                            <Trophy size={16} className="mr-2" /> All Tournaments
                                        </TabsTrigger>
                                        <TabsTrigger value="search" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white">
                                            <Search size={16} className="mr-2" /> Discover
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {listMode === 'search' && (
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <Input
                                            placeholder="Search for community tournaments..."
                                            className="pl-10 bg-slate-900 border-slate-700"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(listMode === 'mine' ? tournaments : searchResults).map((tournament: any) => {
                                    const ownerId = typeof tournament.createdBy === 'object' ? tournament.createdBy?._id : tournament.createdBy;
                                    const user = JSON.parse(localStorage.getItem("user") || "{}");
                                    const currentUserEmail = user.email?.toLowerCase();
                                    const currentUserRole = user.role?.toLowerCase();
                                    const isTournamentOwner = 
                                        (ownerId && currentUserId && ownerId.toString() === currentUserId.toString()) || 
                                        currentUserEmail === 'admin@sportbuzz.com' ||
                                        currentUserRole === 'admin';

                                    return (
                                        <Card key={tournament._id} onClick={() => openTournamentDetail(tournament)}
                                            className="bg-slate-900 border-slate-700 hover:border-yellow-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-yellow-500/5">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-white group-hover:text-yellow-400 transition-colors">{tournament.name}</CardTitle>
                                                        <CardDescription className="text-slate-400">
                                                            {tournament.matchType === 'Test'
                                                                ? `${tournament.format} • Test Match (${tournament.testDays || 5} Days)`
                                                                : `${tournament.format} • ${tournament.matchType || 'T20'} (${tournament.overs} Overs)`}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${tournament.status === 'Live' ? 'bg-green-500/20 text-green-400' : tournament.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                            {tournament.status}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleFollow(tournament._id); }}
                                                            className={`p-1.5 rounded-lg transition-all ${isFollowed(tournament._id)
                                                                ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
                                                                : 'text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10'
                                                                }`}
                                                            title={isFollowed(tournament._id) ? "Unfollow tournament" : "Follow tournament"}
                                                        >
                                                            {isFollowed(tournament._id)
                                                                ? <BellOff size={14} />
                                                                : <Bell size={14} />}
                                                        </button>
                                                        {isTournamentOwner && (
                                                            <button
                                                                onClick={(e) => handleDeleteTournament(e, tournament._id, tournament.name)}
                                                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                                title="Delete tournament"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-sm text-slate-400"><Calendar size={14} /><span>{new Date(tournament.startDate).toLocaleDateString()} — {new Date(tournament.endDate).toLocaleDateString()}</span></div>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 text-sm text-slate-400"><Users size={14} /><span>{tournament.teams?.length || 0} Teams</span></div>
                                                        {listMode === 'search' && tournament.createdBy && !isTournamentOwner && (
                                                            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                                                <span>By: {tournament.createdBy.fullName || 'User'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {listMode === 'mine' && tournaments.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                                    <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-400">No tournaments yet</h3>
                                    <p className="text-slate-500 mt-1">Click "New Tournament" to get started</p>
                                </div>
                            )}

                            {listMode === 'search' && searchQuery && searchResults.length === 0 && !isSearching && (
                                <div className="py-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                                    <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-400">No tournaments found</h3>
                                    <p className="text-slate-500 mt-1">Try a different search term</p>
                                </div>
                            )}

                            {listMode === 'search' && !searchQuery && (
                                <div className="py-16 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                                    <Search className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-slate-400">Search Community Tournaments</h3>
                                    <p className="text-slate-500 mt-2 max-w-md mx-auto">Type a name above to find and view tournaments created by other players.</p>
                                </div>
                            )}
                        </div>
                    )}
            </div >
        );
    }

    // ============================
    // RENDER: Tournament Detail
    // ============================
    if (!selectedTournament) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-slate-400 font-medium">Loading tournament details...</p>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="bg-slate-800/50 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40"
                    >
                        <Share2 size={14} className="mr-2" /> Share Link
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800" 
                        onClick={() => {
                            if (initialTournamentId) {
                                navigate('/');
                            } else {
                                setView("list");
                            }
                        }}
                    >
                        <ArrowLeft size={16} className="mr-2" /> {initialTournamentId ? "Go to Home" : "Back to List"}
                    </Button>
                </div>
            </div>
        );
    }

    const tabs: { id: DetailTab; label: string; icon: any }[] = [
        { id: "overview", label: "Overview", icon: Trophy },
        { id: "table", label: "Points Table", icon: Trophy },
        { id: "teams", label: "Teams", icon: Users },
        { id: "matches", label: "Matches", icon: Calendar },
        { id: "stats", label: "Stats", icon: BarChart3 },
        { id: "lab", label: "Perf. Lab", icon: Zap },
        { id: "news", label: "Newsroom", icon: Newspaper },
    ];
    const unlinkedTeams = allTeams.filter(t => !tournamentTeams.some(tt => tt._id === t._id));

    // ── Match detail panel (renders when a match is clicked) ──
    if (selectedMatch) {
        return (
            <div className="space-y-6">
                {/* Tournament header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedTournament(null); }} className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white">{selectedTournament.name}</h2>
                    </div>
                </div>
                <TournamentMatchDetail
                    match={selectedMatch}
                    overs={selectedTournament.overs}
                    onBack={() => setSelectedMatchWithUrl(null)}
                />
            </div>
        );
    }

    if (selectedTeam) {
        const currentTeamStats = getTeamStats(selectedTeam);
        const rawPlayers = selectedTeam.players || [];
        const playerNames = rawPlayers.map(getPlayerName);
        const captainInSquad = !selectedTeam.captain || playerNames.includes(selectedTeam.captain);
        
        // Auto-include captain in squad if missing
        const players = captainInSquad
            ? rawPlayers
            : [{ name: selectedTeam.captain, role: 'Batsman' as PlayerRole }, ...rawPlayers];

        const grouped = groupPlayersByRole(players);
        
        // Safe stats derivation
        const statsRaw = playerStats?.formats?.[playerStatsFormat] ?? (playerStatsFormat === 'All' ? (playerStats?.overall || playerStats) : null) ?? playerStats?.formats?.['All'] ?? {};
        const currentStats = {
            traits: statsRaw.traits || [],
            matchesPlayed: statsRaw.matchesPlayed || 0,
            batting: statsRaw.batting || { innings: 0, runs: 0, average: '0.0', strikeRate: '0.0', highestScore: '0', hundreds: 0, fifties: 0, fours: 0, sixes: 0 },
            bowling: statsRaw.bowling || { wickets: 0, economy: '0.00', average: '0.0', bestFigures: '0/0' },
            fielding: statsRaw.fielding || { catches: 0, stumpings: 0, runouts: 0, total: 0 },
            recentPerformances: statsRaw.recentPerformances || [],
            awardsList: statsRaw.awardsList || [],
            awardsCount: statsRaw.awardsCount || 0,
            wagonWheel: statsRaw.wagonWheel || []
        };

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={closeTeamDetail} className="text-slate-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-4 flex-1">
                        {selectedTeam.logo ? (
                            <img src={selectedTeam.logo} alt={selectedTeam.name} className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-slate-700 font-black text-2xl tracking-wider" style={{ backgroundColor: `${selectedTeam.color || '#3b82f6'}20`, color: selectedTeam.color || '#3b82f6' }}>
                                {selectedTeam.acronym || getTeamAcronym(selectedTeam.name)}
                            </div>
                        )}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                {selectedTeam.name}
                                {isTournamentOwner && (
                                    <div className="flex gap-1 items-center">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={async () => {
                                                    try {
                                                        const res = await teamApi.update(selectedTeam._id, { color: c.value });
                                                        if (res.data) {
                                                            setSelectedTeam({ ...selectedTeam, color: c.value });
                                                            toast.success(`Team color updated to ${c.name}`);
                                                            await fetchTournamentDetails(selectedTournament._id);
                                                        }
                                                    } catch { toast.error("Failed to update color"); }
                                                }}
                                                className={`w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125 ${selectedTeam.color === c.value ? 'scale-125 ring-2 ring-white/50' : 'opacity-40 hover:opacity-100'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                )}
                            </h2>
                            {selectedTeam.captain && (
                                <p className="text-yellow-400 text-sm flex items-center gap-1.5 mt-0.5">
                                    <Crown size={14} /> Captain: <span className="font-bold">{selectedTeam.captain}</span>
                                </p>
                            )}
                        </div>
                        {isTournamentOwner && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                                onClick={() => setIsEditTeamOpen(true)}
                            >
                                <Pencil size={14} className="mr-2" /> Edit Team
                            </Button>
                        )}
                    </div>
                </div>

                <EditTeamDialog
                    isOpen={isEditTeamOpen}
                    onClose={() => setIsEditTeamOpen(false)}
                    team={selectedTeam}
                    onSave={async () => {
                        const teamsRes = await teamApi.getAll();
                        if (teamsRes?.data) setAllTeams(teamsRes.data);
                        await fetchTournamentDetails(selectedTournament._id);
                        const freshTeam = await teamApi.getById(selectedTeam._id);
                        if (freshTeam?.data) setSelectedTeam(freshTeam.data);
                    }}
                />

                {selectedPlayer ? (
                    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
                        {isLoadingStats ? (
                            <div className="h-[600px] flex flex-col items-center justify-center space-y-4 bg-slate-900/50 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Database size={20} className="text-blue-500 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Scout Data...</p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* SCOUT REPORT HEADER */}
                                <div className="relative group/scout overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-700 hover:shadow-blue-500/10">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover/scout:bg-blue-600/15 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:30px_30px]" />

                                    <div className="relative z-10 p-8 md:p-10 flex flex-col lg:flex-row items-center gap-10">
                                        <button
                                            onClick={() => {
                                                setSelectedPlayer(null);
                                                const next = new URLSearchParams(searchParams);
                                                next.delete("pn");
                                                setSearchParams(next);
                                            }}
                                            className="absolute top-8 left-8 p-3 rounded-2xl bg-slate-800/40 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 transition-all border border-slate-700/50 backdrop-blur-xl group/back z-30"
                                        >
                                            <ArrowLeft size={18} className="group-hover/back:-translate-x-1 transition-transform" />
                                        </button>

                                        <div className="relative group/avatar">
                                            <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] bg-gradient-to-tr from-slate-700 via-slate-900 to-slate-800 p-[1px] relative overflow-hidden shadow-2xl">
                                                <div className="w-full h-full rounded-[2.9rem] bg-black flex items-center justify-center overflow-hidden">
                                                    {selectedPlayer.photo ? (
                                                        <img 
                                                            src={getImageUrl(selectedPlayer.photo)} 
                                                            alt={selectedPlayer.name} 
                                                            className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" 
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = ""; 
                                                                (e.target as any).onerror = null;
                                                            }}
                                                        />
                                                    ) : (
                                                        <User size={80} className="text-slate-900 group-hover/avatar:scale-110 transition-transform duration-700" />
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => document.getElementById(`upload-photo-${selectedPlayer.name}`)?.click()}
                                                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center shadow-xl border-4 border-slate-950 transition-all hover:scale-110 active:scale-95 z-40"
                                            >
                                                <Camera size={20} />
                                            </button>
                                            <input
                                                type="file"
                                                id={`upload-photo-${selectedPlayer.name}`}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('photo', file);
                                                        const res = await playerApi.updatePhoto(selectedPlayer._id || selectedPlayer.name, formData);
                                                        if (res.data) {
                                                            const updatedPlayer = {...selectedPlayer, ...res.data};
                                                            setSelectedPlayer(updatedPlayer);
                                                            toast.success("Identity visual updated");
                                                            
                                                            // Also update the player in the team's player list to ensure persistence
                                                            if (selectedTeam) {
                                                                const updatedPlayers = (selectedTeam.players || []).map(p => {
                                                                    const pName = typeof p === 'string' ? p : p.name;
                                                                    if (pName === selectedPlayer.name) {
                                                                        return {
                                                                            ...(typeof p === 'object' ? p : { name: pName }),
                                                                            photo: res.data.photo
                                                                        };
                                                                    }
                                                                    return p;
                                                                });
                                                                await teamApi.update(selectedTeam._id, { players: updatedPlayers });
                                                                // Refresh team data but don't close current view
                                                                const teamRes = await teamApi.getById(selectedTeam._id) as any;
                                                                if (teamRes.success) setSelectedTeam(teamRes.data);
                                                            }

                                                            await fetchTournamentDetails(selectedTournament._id);
                                                        }
                                                    } catch { toast.error("Visual override failed"); }
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 text-center md:text-left">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                                                <span className="px-5 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-900/40">
                                                    Professional Athlete
                                                </span>
                                                <span className="px-5 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-700">
                                                    ID: {(selectedPlayer._id || selectedPlayer.name || 'N/A').substring(Math.max(0, (selectedPlayer._id || selectedPlayer.name || '').length - 6)).toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 flex flex-wrap items-center justify-center md:justify-start gap-x-6">
                                                {selectedPlayer.name.split(' ').map((word, i) => (
                                                    <span key={i} className={i === 0 ? 'text-white' : 'text-blue-500'}>{word}</span>
                                                ))}
                                            </h3>
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                                        <Zap size={20} className="text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Role</p>
                                                        <p className="text-white font-bold">{selectedPlayer.role}</p>
                                                    </div>
                                                </div>
                                                <div className="w-px h-10 bg-slate-800 hidden md:block" />
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                                        <Trophy size={20} className="text-yellow-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Career Honors</p>
                                                        <p className="text-white font-bold">{currentStats.awardsCount} Milestones</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isTournamentOwner && (
                                            <div className="hidden lg:flex flex-col items-end gap-3 translate-x-4">
                                                <button
                                                    onClick={() => {
                                                        setEditPlayerName(selectedPlayer.name);
                                                        setEditPlayerRole(selectedPlayer.role);
                                                        setEditPlayerBattingStyle(selectedPlayer.battingStyle || "Right-hand Bat");
                                                        setEditPlayerBowlingStyle(selectedPlayer.bowlingStyle || "None");
                                                        setIsEditingPlayer(true);
                                                    }}
                                                    className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-blue-500 hover:text-white transition-all duration-500 shadow-2xl active:scale-95"
                                                >
                                                    Edit Profile
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Physicals Bar */}
                                    <div className="bg-slate-800/50 border-t border-slate-700/50 p-6 flex flex-wrap justify-center gap-12">
                                        {[
                                            { label: 'Batting', value: selectedPlayer.battingStyle || 'Right Hand', icon: <ChevronRight size={14} className="text-blue-400" /> },
                                            { label: 'Bowling', value: selectedPlayer.bowlingStyle || 'None', icon: <Activity size={14} className="text-red-400" /> },
                                            { label: 'Form Index', value: 'High', icon: <TrendingUp size={14} className="text-green-400" /> },
                                            { label: 'Contract', value: 'Active', icon: <Shield size={14} className="text-yellow-400" /> },
                                        ].map((stat, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-950/50">{stat.icon}</div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                                    <p className="text-[11px] font-bold text-white uppercase">{stat.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TEAMS REPRESENTED */}
                                {playerStats?.teamsPlayedFor?.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <h4 className="text-white text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                                <span className="w-8 h-px bg-blue-500" /> Teams Represented
                                            </h4>
                                            <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-3 py-1 rounded-full">{playerStats.teamsPlayedFor.length}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {playerStats.teamsPlayedFor.map((team: any) => (
                                                <button
                                                    key={team._id}
                                                    onClick={() => {
                                                        // Find team in tournament teams and navigate
                                                        const fullTeam = selectedTournament?.teams?.find((t: any) => t._id === team._id);
                                                        if (fullTeam) {
                                                            setSelectedPlayer(null);
                                                            setSelectedTeam(fullTeam);
                                                        } else {
                                                            // If not in current tournament, fetch it
                                                            teamApi.getById(team._id).then((res: any) => {
                                                                if (res.success) {
                                                                    setSelectedPlayer(null);
                                                                    setSelectedTeam(res.data);
                                                                }
                                                            }).catch(() => toast.error("Could not load team"));
                                                        }
                                                    }}
                                                    className="group flex items-center gap-3 px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300 active:scale-95"
                                                >
                                                    {team.logo ? (
                                                        <img src={getImageUrl(team.logo) || ''} alt={team.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700" />
                                                    ) : (
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border border-slate-700"
                                                            style={{ backgroundColor: `${team.color}20`, color: team.color }}
                                                        >
                                                            {team.acronym}
                                                        </div>
                                                    )}
                                                    <div className="text-left">
                                                        <p className="text-white text-sm font-bold group-hover:text-blue-400 transition-colors">{team.name}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{team.matchCount} match{team.matchCount !== 1 ? 'es' : ''}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all ml-2" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* RECENT PERFORMANCE TIMELINE - NEON STYLE */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-white text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                            <span className="w-8 h-px bg-blue-500" /> Tactical Match Log
                                        </h4>
                                        <div className="flex gap-1">
                                            {currentStats.recentPerformances.slice(0, 5).map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {currentStats.recentPerformances.slice(0, 5).map((perf: any, i: number) => {
                                            const isWin = perf.result === 'Win';
                                            return (
                                                <div key={i} className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden hover:border-blue-500/50 transition-all duration-500">
                                                    <div className={`absolute top-0 right-0 w-12 h-12 ${isWin ? 'bg-green-500/10' : 'bg-red-500/10'} blur-xl rounded-full -mr-4 -mt-4`} />
                                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Match {i + 1}</span>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-100'}`}>
                                                            {perf.result || 'PLAYED'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-end justify-between relative z-10">
                                                        {perf.batting && (
                                                            <div className="flex-1">
                                                                <p className="text-xl font-black text-white leading-none">
                                                                    {perf.batting.runs ?? 0}
                                                                    <span className="text-[9px] text-slate-600 ml-1">({perf.batting.balls ?? 0})</span>
                                                                </p>
                                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Runs</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* PLAYER NAV TABS - PROFESSIONAL SCOUT STYLE */}
                                <div className="flex p-1.5 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative z-20">
                                    {[
                                        { id: 'traits', label: 'Scout Summary', icon: <Compass size={16} /> },
                                        { id: 'matches', label: 'Match History', icon: <HistoryIcon size={16} /> },
                                        { id: 'stats', label: 'Performance', icon: <Database size={16} /> },
                                        { id: 'awards', label: 'Milestones', icon: <Trophy size={16} /> },
                                        { id: 'wagonwheel', label: 'Wagon Wheel', icon: <Target size={16} /> }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setPlayerDetailTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 relative group overflow-hidden ${playerDetailTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            {playerDetailTab === tab.id && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-in fade-in zoom-in duration-500" />
                                            )}
                                            <div className="relative z-10 flex items-center gap-3">
                                                <span className={`${playerDetailTab === tab.id ? 'scale-110 rotate-12' : 'group-hover:scale-110'} transition-all duration-500`}>
                                                    {tab.icon}
                                                </span>
                                                {tab.label}
                                            </div>
                                            {playerDetailTab !== tab.id && (
                                                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* TABS CONTENT AREA */}
                                {!isEditingPlayer ? (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-8">
                                        {playerDetailTab === 'matches' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        {currentStats.recentPerformances.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {currentStats.recentPerformances.map((perf: any, i: number) => (
                                                    <div key={i} className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm overflow-hidden relative">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
                                                        
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                            <div className="flex items-center gap-5">
                                                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-[10px] font-black tracking-tighter shadow-xl ${perf.result === 'Win' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'}`}>
                                                                    <span className="leading-none mb-1">M{currentStats.recentPerformances.length - i}</span>
                                                                    <span className="uppercase text-[8px] tracking-widest">{perf.result || 'PLAYED'}</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h5 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 truncate">
                                                                        {perf.opponent ? `vs ${perf.opponent}` : "Competition Match"}
                                                                        {perf.matchType && <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[8px] tracking-[0.2em]">{perf.matchType}</span>}
                                                                    </h5>
                                                                    <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{perf.date || 'Recent Encounter'}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-6 md:gap-10 bg-slate-950/50 px-6 py-4 rounded-2xl border border-white/5">
                                                                {perf.batting && (
                                                                    <div className="flex flex-col items-center">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-xl font-black text-white">{perf.batting.runs ?? 0}</span>
                                                                            <span className="text-[10px] font-black text-slate-600">({perf.batting.balls ?? 0})</span>
                                                                        </div>
                                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Batting</p>
                                                                    </div>
                                                                )}
                                                                {perf.bowling && (
                                                                    <div className="flex flex-col items-center border-l border-slate-800 pl-6 md:pl-10">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-xl font-black text-blue-400">{perf.bowling.wickets ?? 0}</span>
                                                                            <span className="text-[10px] font-black text-slate-600">W</span>
                                                                        </div>
                                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Bowling</p>
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col items-center border-l border-slate-800 pl-6 md:pl-10">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-xl font-black text-yellow-500">{perf.impactScore || 'L-1'}</span>
                                                                    </div>
                                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Impact</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 flex flex-col items-center justify-center bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-800">
                                                <CircleDot size={40} className="text-slate-700 mb-4 opacity-50" />
                                                <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No Match Log Data</p>
                                                <p className="text-slate-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Awaiting synchronization with live scorecards</p>
                                            </div>
                                        )}
                                    </div>
                                        )}
                                        {playerDetailTab === 'traits' && (
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* LEFT: STRATEGIC DNA / SWOT */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* STRENGTHS */}
                                                        <Card className="bg-slate-900/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all rounded-[2rem] overflow-hidden group/swot">
                                                            <CardHeader className="bg-emerald-500/5 p-6 border-b border-emerald-500/10">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                                        <Zap size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Tactical Strengths</CardTitle>
                                                                        <CardDescription className="text-[9px] font-bold text-emerald-500/60 uppercase">Elite Scouting Observations</CardDescription>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                        <CardContent className="p-6 space-y-4">
                                                            {currentStats.traits.filter((t: any) => t.type === 'strength').length > 0 ? (
                                                                currentStats.traits.filter((t: any) => t.type === 'strength').map((t: any, i: number) => (
                                                                    <div key={i} className="group/trait flex items-start gap-4 p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-950 transition-all border border-white/5 hover:border-emerald-500/20">
                                                                        <span className="text-2xl group-hover/trait:scale-110 transition-transform">{t.icon || '⚡'}</span>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-black text-white tracking-wide uppercase">{t.title}</p>
                                                                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">{t.description}</p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale">
                                                                    <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center mb-4">
                                                                        <Zap size={20} className="text-slate-500" />
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center leading-relaxed">System accumulating<br />performance data markers</p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                        </Card>

                                                        {/* WEAKNESSES */}
                                                        <Card className="bg-slate-900/50 border-red-500/20 hover:border-red-500/40 transition-all rounded-[2rem] overflow-hidden group/swot">
                                                            <CardHeader className="bg-red-500/5 p-6 border-b border-red-500/10">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                                                        <Target size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Technical Limits</CardTitle>
                                                                        <CardDescription className="text-[9px] font-bold text-red-500/60 uppercase">Focus for Player Development</CardDescription>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                            <CardContent className="p-6 space-y-4">
                                                                {currentStats.traits.filter((t: any) => t.type === 'weakness').length > 0 ? (
                                                                    currentStats.traits.filter((t: any) => t.type === 'weakness').map((t: any, i: number) => (
                                                                        <div key={i} className="group/trait flex items-start gap-4 p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-950 transition-all border border-white/5 hover:border-red-500/20">
                                                                            <span className="text-2xl group-hover/trait:scale-110 transition-transform">{t.icon || '⚠️'}</span>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-black text-white tracking-wide uppercase">{t.title}</p>
                                                                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">{t.description}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale">
                                                                        <div className="w-12 h-12 rounded-full border border-slate-700 flex items-center justify-center mb-4">
                                                                            <Target size={20} className="text-slate-500" />
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center leading-relaxed">No critical vulnerabilities<br />detected in current data</p>
                                                                    </div>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    </div>

                                                    {/* OPPORTUNITIES & THREATS (DYNAMO) */}
                                                    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group/dy">
                                                        <div className="absolute top-0 right-0 p-20 bg-blue-600/5 blur-[100px] rounded-full -mr-10 -mt-10" />
                                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                                            <div>
                                                                <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                                                                    <Sparkles size={12} /> Scouting Growth Areas
                                                                </h4>
                                                                <ul className="space-y-4">
                                                                    {currentStats.traits.filter((t: any) => t.type === 'growth' || t.type === 'potential').length > 0 ? (
                                                                        currentStats.traits.filter((t: any) => t.type === 'growth' || t.type === 'potential').map((t: any, idx: number) => (
                                                                            <li key={idx} className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/30 border border-white/5 group/growth">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.6)] group-hover/growth:scale-125 transition-transform" />
                                                                                <div>
                                                                                    <p className="text-[11px] text-white font-black uppercase tracking-tight">{t.title}</p>
                                                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{t.description}</p>
                                                                                </div>
                                                                            </li>
                                                                        ))
                                                                    ) : (
                                                                        [
                                                                            "Expand power hitting range in T20 death overs",
                                                                            "Increase yorker precision for final session control",
                                                                            "Leverage leadership potential in domestic circuits"
                                                                        ].map((opt, idx) => (
                                                                            <li key={idx} className="flex items-start gap-3 text-[11px] text-slate-400 font-medium leading-relaxed">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                                                {opt}
                                                                            </li>
                                                                        ))
                                                                    )}
                                                                </ul>
                                                            </div>
                                                            <div className="md:border-l md:border-white/5 md:pl-10">
                                                                <h4 className="text-red-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                                                                    <Activity size={12} /> Competitive Risks
                                                                </h4>
                                                                <ul className="space-y-4">
                                                                    {currentStats.traits.filter((t: any) => t.type === 'risk').length > 0 ? (
                                                                        currentStats.traits.filter((t: any) => t.type === 'risk').map((t: any, idx: number) => (
                                                                            <li key={idx} className="flex items-start gap-4 p-3 rounded-xl bg-slate-900/30 border border-white/5 group/risk">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)] group-hover/risk:scale-125 transition-transform" />
                                                                                <div>
                                                                                    <p className="text-[11px] text-white font-black uppercase tracking-tight">{t.title}</p>
                                                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{t.description}</p>
                                                                                </div>
                                                                            </li>
                                                                        ))
                                                                    ) : (
                                                                        [
                                                                            "Struggles against high-pace left-arm seamers",
                                                                            "Performance dip in high-humidity conditions",
                                                                            "Susceptibility to short-ball barrages"
                                                                        ].map((threat, idx) => (
                                                                            <li key={idx} className="flex items-start gap-3 text-[11px] text-slate-400 font-medium leading-relaxed">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                                                                {threat}
                                                                            </li>
                                                                        ))
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* RIGHT: PLAYER VISION / CARDS */}
                                                <div className="space-y-6">
                                                    <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-[2rem] overflow-hidden h-full">
                                                        <CardHeader className="p-8">
                                                            <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Analytical Projection</CardTitle>
                                                            <CardDescription className="text-[10px] font-bold text-slate-500 uppercase">Season 2026 Capability Matrix</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="p-8 pt-0 space-y-8">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-end">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All-Rounder Evolution</span>
                                                                    <span className="text-lg font-black text-blue-400">78%</span>
                                                                </div>
                                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 w-[78%] shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-end">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fitness & Agility</span>
                                                                    <span className="text-lg font-black text-emerald-400">92%</span>
                                                                </div>
                                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 w-[92%] shadow-[0_0_15px_rgba(5,150,105,0.4)]" />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-end">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mental Toughness</span>
                                                                    <span className="text-lg font-black text-purple-400">85%</span>
                                                                </div>
                                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 w-[85%] shadow-[0_0_15px_rgba(147,51,234,0.4)]" />
                                                                </div>
                                                            </div>

                                                            <div className="pt-8 border-t border-white/5">
                                                                <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-center relative group/tip">
                                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Pro Tip</div>
                                                                    <p className="text-[11px] text-blue-200/80 font-medium italic">"Focus on playing through the line against spinners to reduce LBW risk."</p>
                                                                </div>
                                                                <div className="mt-6 flex justify-center gap-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="rounded-xl bg-slate-800/40 border-slate-700 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest"
                                                                        onClick={() => setIsEditingPlayer(true)}
                                                                    >
                                                                        <Pencil size={12} className="mr-2" /> Modify Profile
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </div>
                                        )}

                                        {playerDetailTab === 'stats' && (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                                                {/* Format Tabs & Global Metrics */}
                                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2 border-b border-white/5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {['All', 'Test', 'ODI', 'T20', 'T10'].map(fmt => (
                                                            <button
                                                                key={fmt}
                                                                onClick={() => setPlayerStatsFormat(fmt)}
                                                                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 border ${playerStatsFormat === fmt ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/40' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white hover:bg-slate-800 hover:border-slate-700'}`}
                                                            >
                                                                {fmt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                        <span>Experience: <span className="text-white italic">{currentStats?.matchesPlayed || 0} Matches</span></span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                        <span className="text-blue-400">Verified Stats</span>
                                                    </div>
                                                </div>

                                                {currentStats ? (
                                                    <>
                                                        {/* PRIMARY PERFORMANCE TABLE */}
                                                        <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                                                            <div className="px-10 py-6 bg-blue-500/5 border-b border-white/5 flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="p-2.5 bg-blue-500/20 rounded-2xl"><TrendingUp size={18} className="text-blue-400" /></div>
                                                                    <div>
                                                                        <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Batting Career Data</h4>
                                                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Format: {playerStatsFormat}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-blue-500/40" />)}
                                                                </div>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="border-b border-white/5 bg-slate-950/40">
                                                                            <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Innings</th>
                                                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-blue-400">Total Runs</th>
                                                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Average</th>
                                                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">S/R</th>
                                                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">High Score</th>
                                                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">100 / 50</th>
                                                                            <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">4s / 6s</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-white/5">
                                                                        <tr className="hover:bg-white/5 transition-colors group">
                                                                            <td className="px-10 py-6 font-mono text-[13px] text-slate-300">{currentStats.batting?.innings}</td>
                                                                            <td className="px-6 py-6 font-black text-blue-400 text-xl tabular-nums">{currentStats.batting?.runs}</td>
                                                                            <td className="px-6 py-6 font-black text-white text-lg tabular-nums">{currentStats.batting?.average}</td>
                                                                            <td className="px-6 py-6 font-mono text-[13px] text-slate-300">{currentStats.batting?.strikeRate}</td>
                                                                            <td className="px-6 py-6 font-black text-white text-[13px] tracking-tight tabular-nums">{currentStats.batting?.highestScore}</td>
                                                                            <td className="px-6 py-6 font-mono text-[13px] text-slate-300">
                                                                                <span className="text-emerald-400 font-black">{currentStats.batting?.hundreds}</span>
                                                                                <span className="mx-2 text-slate-700">|</span>
                                                                                <span className="text-blue-400 font-black">{currentStats.batting?.fifties}</span>
                                                                            </td>
                                                                            <td className="px-10 py-6 font-mono text-[13px] text-slate-400">
                                                                                {currentStats.batting?.fours} <span className="text-slate-700 mx-1">/</span> {currentStats.batting?.sixes}
                                                                            </td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                            {/* BOWLING ANALYSIS TABLE */}
                                                            <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                                                                <div className="px-8 py-5 bg-red-500/5 border-b border-white/5 flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-red-500/20 rounded-xl"><Target size={16} className="text-red-400" /></div>
                                                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Bowling Records</h4>
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left border-collapse">
                                                                        <thead>
                                                                            <tr className="border-b border-white/5 bg-slate-950/40">
                                                                                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-red-400">Wkts</th>
                                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Economy</th>
                                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Average</th>
                                                                                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Best</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr className="hover:bg-white/5 transition-colors">
                                                                                <td className="px-8 py-6 font-black text-red-400 text-xl tabular-nums">{currentStats.bowling?.wickets}</td>
                                                                                <td className="px-6 py-6 font-black text-white text-lg tabular-nums">{currentStats.bowling?.economy}</td>
                                                                                <td className="px-6 py-6 font-mono text-[13px] text-slate-300">{currentStats.bowling?.average}</td>
                                                                                <td className="px-8 py-6 font-black text-emerald-400 text-sm italic tabular-nums">{currentStats.bowling?.bestFigures}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>

                                                            {/* FIELDING SPECIALIZATION TABLE */}
                                                            <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                                                                <div className="px-8 py-5 bg-emerald-500/5 border-b border-white/5 flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-emerald-500/20 rounded-xl"><Crosshair size={16} className="text-emerald-400" /></div>
                                                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Fielding Metrics</h4>
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left border-collapse">
                                                                        <thead>
                                                                            <tr className="border-b border-white/5 bg-slate-950/40">
                                                                                <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Catches</th>
                                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Stumps</th>
                                                                                <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Run-outs</th>
                                                                                <th className="px-8 py-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr className="hover:bg-white/5 transition-colors">
                                                                                <td className="px-8 py-6 font-black text-white text-lg tabular-nums">{currentStats.fielding?.catches || 0}</td>
                                                                                <td className="px-6 py-6 font-black text-white text-lg tabular-nums">{currentStats.fielding?.stumpings || 0}</td>
                                                                                <td className="px-6 py-6 font-black text-white text-lg tabular-nums">{currentStats.fielding?.runouts || 0}</td>
                                                                                <td className="px-8 py-6 font-black text-emerald-400 text-xl tabular-nums">{currentStats.fielding?.total || 0}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* HISTORICAL TIMELINE */}
                                                        <div className="rounded-[2.5rem] bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
                                                            <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between">
                                                                <h5 className="text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                                                    <Activity size={14} className="text-blue-500" /> Technical Match Logs
                                                                </h5>
                                                                <button className="text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-300 transition-colors">Export DB</button>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="border-b border-white/5 bg-slate-950/20">
                                                                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Opponent / Meta</th>
                                                                            <th className="px-6 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Format</th>
                                                                            <th className="px-6 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Batting Display</th>
                                                                            <th className="px-6 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Bowling Discipline</th>
                                                                            <th className="px-10 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Impact</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-white/5">
                                                                        {currentStats.recentPerformances.length > 0 ? currentStats.recentPerformances.map((perf: any, idx: number) => (
                                                                            <tr key={idx} className="hover:bg-blue-600/5 transition-colors group/row">
                                                                                <td className="px-8 py-5">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/row:text-white transition-colors group-hover/row:bg-blue-600/20">
                                                                                            {getTeamAcronym(perf.opponent) || 'VS'}
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-white text-xs font-black uppercase tracking-wide group-hover/row:text-blue-400 transition-colors">{perf.opponent || 'Competitive Match'}</p>
                                                                                            <p className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">{perf.date || 'Historic Data'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-6 py-5 text-center">
                                                                                    <span className="text-[10px] font-black text-slate-400 border border-slate-800 px-3 py-1 rounded-md bg-slate-950 group-hover/row:border-blue-500/30 group-hover/row:text-white transition-all">
                                                                                        {perf.format || 'Pro'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-6 py-5 text-center">
                                                                                    {perf.batting ? (
                                                                                        <span className="text-white text-xs font-black">{perf.batting.runs}<span className="text-[10px] text-slate-600">({perf.batting.balls})</span>{perf.batting.isOut ? '' : '*'}</span>
                                                                                    ) : <span className="text-slate-800 text-[10px]">···</span>}
                                                                                </td>
                                                                                <td className="px-6 py-5 text-center">
                                                                                    {perf.bowling ? (
                                                                                        <span className="text-white text-xs font-black">{perf.bowling.wickets}<span className="text-slate-500">/</span>{perf.bowling.runs}</span>
                                                                                    ) : <span className="text-slate-800 text-[10px]">···</span>}
                                                                                </td>
                                                                                <td className="px-10 py-5 text-right font-black text-blue-500 text-xs italic">{perf.clutchIndex || '88'}%</td>
                                                                            </tr>
                                                                        )) : (
                                                                            <tr>
                                                                                <td colSpan={5} className="py-20 text-center text-slate-600 italic border border-white/5 rounded-[2.5rem]">
                                                                                    Global Stats server link pending for {playerStatsFormat} database
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="py-20 text-center text-slate-600 italic border border-white/5 rounded-[2.5rem]">
                                                        Global Stats server link pending for {playerStatsFormat} database
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {playerDetailTab === 'awards' && (
                                            <div className="py-10 px-6 bg-slate-950/40 border border-slate-800/60 rounded-[2rem] relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
                                                <div className="absolute top-0 right-0 p-20 bg-yellow-500/5 blur-[100px] rounded-full -mr-10 -mt-10" />

                                                <div className="flex items-center gap-4 mb-10 px-2 relative z-10">
                                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                                                        <Award size={24} className="text-yellow-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white text-lg font-black uppercase tracking-[0.2em]">Hall of Fame</h4>
                                                    </div>
                                                </div>

                                                {currentStats.awardsList?.length > 0 ? (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 relative z-10 px-2">
                                                        {currentStats.awardsList.map((award: any) => (
                                                            <div key={award.id} className="flex flex-col items-center group">
                                                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/5 relative flex items-center justify-center shadow-2xl group-hover:shadow-yellow-500/20 group-hover:border-yellow-500/40 transition-all duration-500 group-hover:-translate-y-2">
                                                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full z-20 shadow-xl border-2 border-slate-900">
                                                                        {award.count}x
                                                                    </div>
                                                                    <span className="text-5xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-125 transition-all duration-500">
                                                                        {award.icon}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-4 text-center">
                                                                    <p className="text-white text-[11px] font-black uppercase tracking-widest mb-1 group-hover:text-yellow-500 transition-colors">
                                                                        {award.title}
                                                                    </p>
                                                                    <p className="text-slate-500 text-[8px] font-bold uppercase tracking-tighter italic opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {award.reason}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem]">
                                                        <BarChart3 size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                                                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">No honors recorded in current formats</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {playerDetailTab === 'wagonwheel' && (
                                            <div className="py-10 px-6 bg-slate-950/40 border border-slate-800/60 rounded-[2rem] relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
                                                <div className="absolute top-0 right-0 p-20 bg-emerald-500/5 blur-[100px] rounded-full -mr-10 -mt-10" />
                                                <div className="flex items-center gap-4 mb-8 px-2 relative z-10">
                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                        <Target size={24} className="text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white text-lg font-black uppercase tracking-[0.2em]">Career Wagon Wheel</h4>
                                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">All-time shot direction map</p>
                                                    </div>
                                                </div>
                                                <div className="relative z-10 flex justify-center">
                                                    {currentStats.wagonWheel.length > 0 ? (
                                                        <WagonWheel
                                                            balls={currentStats.wagonWheel}
                                                            playerName={selectedPlayer?.name}
                                                            size={520}
                                                        />
                                                    ) : (
                                                        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-[2rem] w-full">
                                                            <Target size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                                                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">No wagon wheel data available yet</p>
                                                            <p className="text-slate-700 text-[9px] mt-1">Shot directions will appear after scoring matches with the wagon wheel picker</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`grid grid-cols-1 ${isTournamentOwner ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 animate-in slide-in-from-top-4 fade-in duration-500 fill-mode-both`}>
                                        {/* Left Side: Edit Controls */}
                                        {isTournamentOwner && (
                                        <div className="lg:col-span-2">
                                            <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden">
                                                <CardHeader className="bg-slate-800/30 border-b border-slate-800 p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500/10 rounded-xl">
                                                            <PencilLine className="text-blue-400" size={20} />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-xl font-black text-white tracking-tight">Studio Profile Editor</CardTitle>
                                                            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">Customizing Global Player Database entry</CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-8">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                                <User size={12} className="text-slate-400" /> Full Identity Name
                                                            </Label>
                                                            <Input
                                                                value={editPlayerName}
                                                                onChange={(e) => setEditPlayerName(e.target.value)}
                                                                className="h-14 bg-slate-800/30 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-white placeholder:text-slate-600"
                                                                placeholder="Enter Display Name"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                                <Zap size={12} className="text-yellow-500" /> Strategic Role
                                                            </Label>
                                                            <Select value={editPlayerRole} onValueChange={(v: any) => setEditPlayerRole(v)}>
                                                                <SelectTrigger className="h-14 bg-slate-800/30 border-slate-700/50 rounded-xl font-bold text-white hover:bg-slate-800/50 transition-all">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-900 border-slate-700 text-white rounded-xl shadow-2xl p-1">
                                                                    {ROLES.map(r => (
                                                                        <SelectItem key={r} value={r} className="rounded-lg h-10 font-bold hover:bg-slate-800 transition-colors cursor-pointer data-[state=checked]:bg-blue-600">
                                                                            {r}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                                <Crosshair size={12} className="text-blue-400" /> Batting Discipline
                                                            </Label>
                                                            <Select value={editPlayerBattingStyle} onValueChange={setEditPlayerBattingStyle}>
                                                                <SelectTrigger className="h-14 bg-slate-800/30 border-slate-700/50 rounded-xl font-bold text-white transition-all">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-900 border-slate-700 text-white rounded-xl p-1">
                                                                    <SelectItem value="Right-hand Bat">Right-hand Bat</SelectItem>
                                                                    <SelectItem value="Left-hand Bat">Left-hand Bat</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                                <Activity size={12} className="text-red-400" /> Bowling Technique
                                                            </Label>
                                                            <Select value={editPlayerBowlingStyle} onValueChange={setEditPlayerBowlingStyle}>
                                                                <SelectTrigger className="h-14 bg-slate-800/30 border-slate-700/50 rounded-xl font-bold text-white transition-all">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-900 border-slate-700 text-white rounded-xl p-1 max-h-60 overflow-y-auto">
                                                                    <SelectItem value="None" className="rounded-lg font-bold">None</SelectItem>
                                                                    <SelectItem value="Right-arm Fast" className="rounded-lg font-bold">Right-arm Fast</SelectItem>
                                                                    <SelectItem value="Right-arm Medium" className="rounded-lg font-bold">Right-arm Medium</SelectItem>
                                                                    <SelectItem value="Right-arm Off-break">Right-arm Off-spin</SelectItem>
                                                                    <SelectItem value="Right-arm Leg-break">Right-arm Leg-spin</SelectItem>
                                                                    <SelectItem value="Left-arm Fast">Left-arm Fast</SelectItem>
                                                                    <SelectItem value="Left-arm Medium">Left-arm Medium</SelectItem>
                                                                    <SelectItem value="Left-arm Orthodox">Left-arm Orthodox</SelectItem>
                                                                    <SelectItem value="Left-arm Unorthodox">Left-arm Chinaman</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4 pt-10 mt-8 border-t border-slate-800/60">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => setIsEditingPlayer(false)}
                                                            className="text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px]"
                                                        >
                                                            Discard Changes
                                                        </Button>
                                                        <div className="flex gap-4">
                                                            <Button onClick={handleUpdatePlayer} className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2">
                                                                <Check size={18} /> Apply Changes
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        )}

                                        {/* Right Side: Dynamic Card Preview (FIFA Style) */}
                                        <div className="lg:col-span-1">
                                            <div className="h-full bg-slate-950 border border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center relative shadow-2xl group/preview overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

                                                <h4 className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 mb-8 z-10">Real-time Preview</h4>

                                                {/* THE PLAYER CARD */}
                                                <div className="w-56 h-80 bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-slate-700/50 rounded-[2rem] shadow-2xl flex flex-col items-center p-6 relative group-hover/preview:scale-105 transition-all duration-700">
                                                    {/* Design Accents */}
                                                    <div className="absolute top-4 left-4 text-slate-600 font-black italic">SB</div>
                                                    <div className="absolute bottom-4 right-4 text-slate-600 font-black italic">PRO</div>

                                                    <div className="w-24 h-24 rounded-2xl bg-slate-950 flex items-center justify-center mb-6 overflow-hidden border border-white/5 shadow-inner">
                                                        {selectedPlayer?.photo ? (
                                                            <img src={selectedPlayer.photo} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={48} className="text-slate-800" />
                                                        )}
                                                    </div>

                                                    <div className="text-center space-y-1">
                                                        <p className="text-white font-black text-lg uppercase tracking-tight">{editPlayerName || "Player"}</p>
                                                        <p className="text-blue-400 font-black text-[9px] uppercase tracking-widest">{editPlayerRole}</p>
                                                    </div>

                                                    <div className="mt-6 pt-4 border-t border-slate-700/50 w-full grid grid-cols-2 gap-2">
                                                        <div className="text-center">
                                                            <p className="text-[8px] font-bold text-slate-500 uppercase">Bat</p>
                                                            <p className="text-[10px] font-black text-white">{editPlayerBattingStyle.split('-')[0]}</p>
                                                        </div>
                                                        <div className="text-center border-l border-slate-700/50">
                                                            <p className="text-[8px] font-bold text-slate-500 uppercase">Bowl</p>
                                                            <p className="text-[10px] font-black text-white">{editPlayerBowlingStyle === 'None' ? 'N/A' : 'Yes'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Glass Overlay Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/0 to-transparent rounded-[2rem] pointer-events-none" />
                                                </div>

                                                <p className="mt-8 text-[9px] font-bold text-slate-600 uppercase text-center px-4 leading-relaxed">
                                                    This card reflects how the player appears in global leaderboards and squad sheets
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                            { label: "Played", value: currentTeamStats.played, color: "text-blue-400", bg: "bg-blue-500/10" },
                            { label: "Won", value: currentTeamStats.won, color: "text-green-400", bg: "bg-green-500/10" },
                            { label: "Lost", value: currentTeamStats.lost, color: "text-red-400", bg: "bg-red-500/10" },
                            { label: "Total Runs", value: currentTeamStats.totalRuns, color: "text-purple-400", bg: "bg-purple-500/10" },
                            { label: "Upcoming", value: currentTeamStats.upcoming, color: "text-amber-400", bg: "bg-amber-500/10" },
                        ].map(stat => (
                            <Card key={stat.label} className={`${stat.bg} border-slate-700/50`}>
                                <CardContent className="p-4 text-center">
                                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                        {/* Squad by Role */}
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white text-lg flex items-center gap-2">
                                    <Users size={18} className="text-blue-400" /> Squad
                                    <span className="text-xs text-slate-500 font-normal ml-2">{players.length} players</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">

                                {ROLES.map(role => {
                                    const rolePlayers = grouped[role];
                                    if (rolePlayers.length === 0) return null;
                                    const rc = ROLE_COLORS[role];
                                    return (
                                        <div key={role}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-sm font-semibold ${rc.text} flex items-center gap-1.5`}>
                                                    <span>{rc.icon}</span> {role}s
                                                </span>
                                                <span className="text-xs text-slate-600">({rolePlayers.length})</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {rolePlayers.map((pName, idx) => (
                                                    <div key={pName}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border ${rc.bg} ${rc.border} hover:brightness-110 transition-all cursor-pointer group`}
                                                        onClick={() => {
                                                            const pModel = players.find(x => (typeof x === 'string' ? x : x.name) === pName);
                                                            const bStyle = typeof pModel === 'object' ? pModel?.battingStyle : undefined;
                                                            const bowlStyle = typeof pModel === 'object' ? pModel?.bowlingStyle : undefined;
                                                            const photo = typeof pModel === 'object' ? pModel?.photo : undefined;
                                                            fetchPlayerStats(pName, role, bStyle, bowlStyle, photo);
                                                        }}>
                                                        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold shrink-0 ${rc.bg} ${rc.text}`}>
                                                            {(() => {
                                                                const playerModel = players.find(x => (typeof x === 'string' ? x : x.name) === pName);
                                                                const photoUrl = typeof playerModel === 'object' && playerModel !== null ? (playerModel as any).photo : null;
                                                                if (photoUrl) {
                                                                    return <img src={photoUrl} alt={pName} className="w-full h-full object-cover" />;
                                                                }
                                                                return pName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                                            })()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium truncate">{pName}</p>
                                                            {pName === selectedTeam?.captain && (
                                                                <p className="text-[10px] text-yellow-500 flex items-center gap-1 font-bold">
                                                                    <Crown size={10} /> Captain
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {players.length === 0 && (
                                    <p className="text-slate-500 text-sm py-4 text-center">No players registered yet.</p>
                                )}

                                {/* Add Player Dialog */}
                                {isTournamentOwner && (
                                <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 py-6 text-slate-400 group">
                                            <Plus size={18} className="mr-2 group-hover:text-blue-400 transition-colors" /> Add Player to Squad
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-slate-700 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Add New Player</DialogTitle>
                                            <DialogDescription className="text-slate-400">Enter player details for {selectedTeam?.name || "the team"}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Player Name</Label>
                                                <div className="relative">
                                                    <Input placeholder="e.g. Virat Kohli" className="bg-slate-800 border-slate-700" value={addPlayerName} onChange={(e) => { setAddPlayerName(e.target.value); setShowSuggestions('add'); setTournamentConflict(null); }} onFocus={() => addPlayerName.trim().length >= 2 && setShowSuggestions('add')} autoComplete="off" />
                                                    {showSuggestions === 'add' && playerSuggestions.length > 0 && (
                                                        <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                                                            {playerSuggestions.map((s: any, i: number) => (
                                                                <button key={i} type="button" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 transition-colors text-left text-sm" onClick={() => {
                                                                    setAddPlayerName(s.name);
                                                                    setAddPlayerRole(s.role || 'Batsman');
                                                                    setAddPlayerBattingStyle(s.battingStyle || 'Right-hand Bat');
                                                                    setAddPlayerBowlingStyle(s.bowlingStyle || 'None');
                                                                    setShowSuggestions(null);
                                                                    // Check tournament conflict
                                                                    if (selectedTournament?._id) {
                                                                        playerApi.checkTournament(s.name, selectedTournament._id).then(r => {
                                                                            const d = r?.data || r;
                                                                            if (d?.conflict && d.teamId !== selectedTeam?._id) setTournamentConflict(d.teamName);
                                                                            else setTournamentConflict(null);
                                                                        }).catch(() => {});
                                                                    }
                                                                }}>
                                                                    {s.photo ? <img src={s.photo} className="w-7 h-7 rounded-full object-cover border border-slate-600" /> : <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><User size={14} className="text-emerald-400" /></div>}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white font-medium truncate">{s.name}</p>
                                                                        <p className="text-[10px] text-slate-500">{s.role} · {s.team?.name || 'Unknown Team'}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {tournamentConflict && (
                                                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">⚠️ Already in <span className="font-bold">{tournamentConflict}</span> in this tournament</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Select value={addPlayerRole} onValueChange={(v: any) => setAddPlayerRole(v)}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Batting Style</Label>
                                                    <Select value={addPlayerBattingStyle} onValueChange={setAddPlayerBattingStyle}>
                                                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                            <SelectItem value="Right-hand Bat">Right-hand Bat</SelectItem>
                                                            <SelectItem value="Left-hand Bat">Left-hand Bat</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Bowling Style</Label>
                                                    <Select value={addPlayerBowlingStyle} onValueChange={setAddPlayerBowlingStyle}>
                                                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                            <SelectItem value="None">None</SelectItem>
                                                            <SelectItem value="Right-arm Fast">Right-arm Fast</SelectItem>
                                                            <SelectItem value="Right-arm Medium">Right-arm Medium</SelectItem>
                                                            <SelectItem value="Right-arm Off-break">Right-arm Off-spin</SelectItem>
                                                            <SelectItem value="Right-arm Leg-break">Right-arm Leg-spin</SelectItem>
                                                            <SelectItem value="Left-arm Fast">Left-arm Fast</SelectItem>
                                                            <SelectItem value="Left-arm Medium">Left-arm Medium</SelectItem>
                                                            <SelectItem value="Left-arm Orthodox">Left-arm Orthodox</SelectItem>
                                                            <SelectItem value="Left-arm Unorthodox">Left-arm Chinaman</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsAddingPlayer(false)}>Cancel</Button>
                                            <Button onClick={handleAddPlayerToTeam} className="bg-blue-600 hover:bg-blue-700">Add Player</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                )}
                            </CardContent>
                        </Card>

                        {/* Team Matches */}
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white text-lg flex items-center gap-2">
                                    <Swords size={18} className="text-purple-400" /> Matches
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {teamMatches.length > 0 ? teamMatches.map(match => {
                                    const isHome = match.homeTeam?._id === selectedTeam?._id;
                                    const opponent = isHome ? match.awayTeam : match.homeTeam;
                                    const teamScore = isHome ? match.score?.team1 : match.score?.team2;
                                    const opponentScore = isHome ? match.score?.team2 : match.score?.team1;
                                    const isWin = match.status === 'Completed' && (match.result as any)?.winner === selectedTeam?._id;
                                    const isLoss = match.status === 'Completed' && (match.result as any)?.winner && (match.result as any)?.winner !== selectedTeam?._id;

                                    return (
                                        <div key={match._id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                            <div className={`w-2 h-10 rounded-full shrink-0 ${isWin ? 'bg-green-500' : isLoss ? 'bg-red-500' : 'bg-slate-600'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-white text-sm font-medium">{isHome ? "vs" : "@"} {opponent?.name}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${match.status === 'Completed' ? (isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400') :
                                                        match.status === 'Live' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                                                        }`}>
                                                        {match.status === 'Completed' ? (isWin ? 'WON' : isLoss ? 'LOST' : 'TIE') : match.status}
                                                    </span>
                                                </div>
                                                {match.status !== 'Upcoming' && (
                                                    <p className="text-slate-400 text-xs">
                                                        {teamScore?.runs}/{teamScore?.wickets} ({teamScore?.overs?.toFixed(1)} ov)
                                                        {" vs "}
                                                        {opponentScore?.runs}/{opponentScore?.wickets} ({opponentScore?.overs?.toFixed(1)} ov)
                                                    </p>
                                                )}
                                                {match.status === 'Upcoming' && (
                                                    <p className="text-slate-500 text-xs flex items-center gap-1">
                                                        <Calendar size={11} /> {new Date(match.date).toLocaleDateString()}
                                                        <MapPin size={11} className="ml-2" /> {match.venue}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-slate-500 text-sm text-center py-4">No matches yet for this team.</p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        );
    }

    // ── Tournament Detail View ──

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        if (initialTournamentId) {
                            navigate('/');
                        } else {
                            setView("list");
                            setSelectedTournament(null);
                        }
                    }} 
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{selectedTournament?.name || "Loading..."}</h2>
                    <p className="text-slate-400 text-sm">
                        {selectedTournament?.matchType === 'Test'
                            ? `${selectedTournament?.format || ""} • Test Match (${selectedTournament?.testDays || 5} Days)`
                            : `${selectedTournament?.format || ""} • ${selectedTournament?.matchType || 'T20'} (${selectedTournament?.overs || 20} Overs)`}
                    </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${selectedTournament?.status === 'Live' ? 'bg-green-500/20 text-green-400' : selectedTournament?.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {selectedTournament?.status || "Upcoming"}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="bg-slate-800/50 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40"
                >
                    <Share2 size={14} className="mr-2" /> Share
                </Button>
                {isTournamentOwner && selectedTournament?.status !== 'Completed' && (
                <Button variant="outline" size="sm" onClick={() => {
                    if (!selectedTournament) return;
                    setEditForm({
                        name: selectedTournament.name || "",
                        format: selectedTournament.format || "League",
                        matchType: selectedTournament.matchType || "T20",
                        overs: (selectedTournament.overs || 20).toString(),
                        testDays: (selectedTournament.testDays || 5).toString(),
                        oversPerSession: (selectedTournament.oversPerSession || 30).toString(),
                        startDate: selectedTournament.startDate ? selectedTournament.startDate.split('T')[0] : "",
                        endDate: selectedTournament.endDate ? selectedTournament.endDate.split('T')[0] : "",
                        groupStructure: selectedTournament.groupStructure || "None",
                        groupsCount: (selectedTournament.groupsCount || 1).toString(),
                        status: selectedTournament.status || "Upcoming"
                    });
                    setIsEditOpen(true);
                }} className="border-slate-700 text-slate-400 hover:text-white h-9 px-3">
                    <Settings2 size={16} className="mr-2" /> Edit
                </Button>
                )}
            </div>

            {/* Edit Tournament Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit Tournament</DialogTitle>
                        <DialogDescription className="text-slate-400">Update tournament details. Changes synchronize immediately.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tournament Name</Label>
                            <Input placeholder="Tournament Name" className="bg-slate-800 border-slate-700" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tournament Structure</Label>
                                <Select value={editForm.format} onValueChange={(v: any) => setEditForm({ ...editForm, format: v })}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="League">League</SelectItem>
                                        <SelectItem value="Knockout">Knockout</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Match Format</Label>
                                <Select value={editForm.matchType} onValueChange={(v: any) => {
                                    setEditForm(prev => {
                                        let newOvers = prev.overs;
                                        if (v === 'T10') newOvers = "10";
                                        else if (v === 'T20') newOvers = "20";
                                        else if (v === 'ODI') newOvers = "50";
                                        return { ...prev, matchType: v, overs: newOvers };
                                    });
                                }}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="T10">T10 (10 Overs)</SelectItem>
                                        <SelectItem value="T20">T20 (20 Overs)</SelectItem>
                                        <SelectItem value="ODI">ODI (50 Overs)</SelectItem>
                                        <SelectItem value="Test">Test Match</SelectItem>
                                        <SelectItem value="Custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {editForm.matchType === 'Test' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Number of Days</Label>
                                    <Input type="number" className="bg-slate-800 border-slate-700" value={editForm.testDays} onChange={(e) => setEditForm({ ...editForm, testDays: e.target.value })} min="1" max="5" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Overs per Session</Label>
                                    <Input type="number" className="bg-slate-800 border-slate-700" value={editForm.oversPerSession} onChange={(e) => setEditForm({ ...editForm, oversPerSession: e.target.value })} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Overs per Innings</Label>
                                <Input type="number" className={`bg-slate-800 border-slate-700 ${editForm.matchType !== 'Custom' ? 'opacity-50 cursor-not-allowed' : ''}`} value={editForm.overs} onChange={(e) => setEditForm({ ...editForm, overs: e.target.value })} disabled={editForm.matchType !== 'Custom'} />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input type="date" className="bg-slate-800 border-slate-700" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input type="date" className="bg-slate-800 border-slate-700" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                            <div className="space-y-2">
                                <Label>Group Structure</Label>
                                <Select value={editForm.groupStructure} onValueChange={(v: any) => setEditForm({ ...editForm, groupStructure: v })}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="None">None</SelectItem>
                                        <SelectItem value="Same Group">Same Group</SelectItem>
                                        <SelectItem value="Cross Group">Cross Group</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editForm.groupStructure !== 'None' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-1 duration-200">
                                    <Label>Number of Groups</Label>
                                    <Input type="number" min="2" max="8" className="bg-slate-800 border-slate-700" value={editForm.groupsCount} onChange={(e) => setEditForm({ ...editForm, groupsCount: e.target.value })} />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editForm.status} onValueChange={(v: any) => setEditForm({ ...editForm, status: v })}>
                                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                                    <SelectItem value="Live">Live</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditTournament} className="bg-yellow-600 hover:bg-yellow-700 text-white">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setDetailTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${detailTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.id === "teams" && <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">{tournamentTeams.length}</span>}
                        {tab.id === "matches" && <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded-full">{tournamentMatches.length}</span>}
                    </button>
                ))}
            </div>

            {/* Tab Content: Overview */}
            {detailTab === "overview" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Live Matches Quick Access */}
                    {tournamentMatches.filter(m => m.status === 'Live').length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Live Now</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tournamentMatches.filter(m => m.status === 'Live').map(match => (
                                    <Card
                                        key={match._id}
                                        onClick={() => setSelectedMatch(match)}
                                        className="bg-gradient-to-r from-slate-900 to-indigo-950 border-indigo-500/30 hover:border-indigo-500 transition-all cursor-pointer group relative overflow-hidden shadow-lg shadow-indigo-500/10"
                                    >
                                        <div className="absolute top-0 right-0 p-3">
                                            <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-lg shadow-red-500/20">
                                                <div className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
                                            </div>
                                        </div>
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex flex-col items-center gap-1 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-indigo-400">
                                                        {match.homeTeam?.acronym || getTeamAcronym(match.homeTeam?.name)}
                                                    </div>
                                                    <span className="text-xs font-bold text-white truncate max-w-[80px]">{match.homeTeam?.name || "TBA"}</span>
                                                </div>
                                                <div className="px-4 text-center">
                                                    <div className="text-slate-500 font-black text-xs mb-1 uppercase tracking-tighter">VS</div>
                                                    <div className="h-0.5 w-8 bg-slate-700 mx-auto" />
                                                </div>
                                                <div className="flex flex-col items-center gap-1 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-indigo-400">
                                                        {match.awayTeam?.acronym || getTeamAcronym(match.awayTeam?.name)}
                                                    </div>
                                                    <span className="text-xs font-bold text-white truncate max-w-[80px]">{match.awayTeam?.name || "TBA"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-indigo-500/10">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Score</span>
                                                    <div className="text-white font-black">
                                                        {match.score?.team1?.runs}/{match.score?.team1?.wickets} vs {match.score?.team2?.runs}/{match.score?.team2?.wickets}
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-[11px] font-bold group-hover:scale-105 transition-transform">
                                                    View Details <ChevronRight size={14} className="ml-1" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* News Highlights Quick View */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} className="text-yellow-400" /> Top Headlines
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setDetailTab("news")} className="text-blue-400 text-xs font-bold hover:text-white">
                                View Newsroom <ArrowRight size={12} className="ml-1" />
                            </Button>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => setDetailTab("news")}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Newspaper size={80} />
                            </div>
                            <div className="relative z-10 space-y-2">
                                <h4 className="text-white text-lg font-bold">
                                    {(tournamentMatches || []).filter(m => m.status === 'Completed').length > 0
                                        ? `Tournament Momentum: ${(tournamentMatches || []).filter(m => m.status === 'Completed').length} Matches Concluded`
                                        : `${selectedTournament?.name || "Tournament"} Pre-Match Analysis & Build-up`}
                                </h4>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                                    Stay updated with AI-generated narratives, tactical insights, and milestone breakdowns in the dedicated Tournament Newsroom.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-slate-900 border-slate-700">
                            <CardContent className="p-6 text-center">
                                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{tournamentTeams.length}</p>
                                <p className="text-slate-400 text-sm">Teams</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-700">
                            <CardContent className="p-6 text-center">
                                <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{tournamentMatches.length}</p>
                                <p className="text-slate-400 text-sm">Matches</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-700">
                            <CardContent className="p-6 text-center">
                                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                <p className="text-3xl font-bold text-white">{tournamentMatches.filter(m => m.status === 'Completed').length}</p>
                                <p className="text-slate-400 text-sm">Completed</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-700 md:col-span-3">
                            <CardContent className="p-6 space-y-3">
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                    <Calendar size={16} className="text-slate-500" />
                                    <span>{selectedTournament?.startDate ? new Date(selectedTournament.startDate).toLocaleDateString() : 'N/A'} — {selectedTournament?.endDate ? new Date(selectedTournament.endDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                    <Settings2 size={16} className="text-slate-500" />
                                    <span>
                                        {selectedTournament?.matchType === 'Test'
                                            ? `${selectedTournament?.format || 'League'} format • Test Match (${selectedTournament?.testDays || 5} Days / ${selectedTournament?.oversPerSession || 30} Overs per Session)`
                                            : `${selectedTournament?.format || 'League'} format • ${selectedTournament?.matchType || 'T20'} (${selectedTournament?.overs || 20} overs per innings)`}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {tournamentStats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                            {[
                                { 
                                    icon: "🏆", 
                                    label: "Matches Played", 
                                    value: String(tournamentMatches.filter(m => m.status === "Completed").length), 
                                    color: "text-yellow-400",
                                    bg: "from-yellow-500/10 to-transparent",
                                    border: "border-yellow-500/20"
                                },
                                { 
                                    icon: "⭐", 
                                    label: "Tournament MVP", 
                                    color: "text-amber-400", 
                                    value: tournamentStats.mvpRankings?.[0] ? `${tournamentStats.mvpRankings[0].total} pts — ${tournamentStats.mvpRankings[0].name.split(' ')[0]}` : "—",
                                    bg: "from-amber-600/10 to-transparent",
                                    border: "border-amber-600/20"
                                },
                                { 
                                    icon: "🏏", 
                                    label: "Highest Runs", 
                                    color: "text-blue-400", 
                                    value: tournamentStats.topRuns?.[0] ? `${tournamentStats.topRuns[0].runs} — ${tournamentStats.topRuns[0].name.split(' ')[0]}` : "—",
                                    bg: "from-blue-600/10 to-transparent",
                                    border: "border-blue-600/20"
                                },
                                { 
                                    icon: "🎯", 
                                    label: "Top Wickets", 
                                    color: "text-red-400", 
                                    value: tournamentStats.topWickets?.[0] ? `${tournamentStats.topWickets[0].wickets} — ${tournamentStats.topWickets[0].name.split(' ')[0]}` : "—",
                                    bg: "from-red-600/10 to-transparent",
                                    border: "border-red-600/20"
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => setDetailTab("stats")}
                                    className={`bg-slate-900/60 bg-gradient-to-br ${item.bg} border ${item.border} rounded-2xl p-4 sm:p-5 flex flex-col gap-1 hover:border-slate-500 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl shadow-lg relative overflow-hidden group`}
                                >
                                    <div className="absolute -right-2 -top-2 text-4xl opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">{item.icon}</div>
                                    <span className="text-2xl mb-1 drop-shadow-md">{item.icon}</span>
                                    <p className={`text-base sm:text-lg font-black truncate drop-shadow-sm ${item.color}`}>{item.value}</p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab Content: Points Table */}
            {detailTab === "table" && selectedTournament && (
                <div className="space-y-8 mt-6">
                    {selectedTournament?.groupStructure !== "None" && selectedTournament?.groups && selectedTournament?.groups?.length > 0 ? (
                        selectedTournament?.groups?.map((group, gIdx) => {
                            const groupTeams = (group.teams || []).map(t => typeof t === 'string' ? t : t._id);
                            const groupEntries = (selectedTournament?.pointsTable || []).filter(entry =>
                                groupTeams.includes(typeof entry.team === 'string' ? entry.team : entry.team?._id)
                            );

                            return (
                                <Card key={gIdx} className="bg-slate-900 border-slate-700">
                                    <CardHeader className="py-4 border-b border-slate-800">
                                        <CardTitle className="text-white text-lg flex items-center gap-2">
                                            <Trophy size={18} className="text-yellow-400" /> {group.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <PointsTableUI entries={groupEntries} tournamentOvers={selectedTournament?.overs || 20} matches={tournamentMatches} tournamentId={selectedTournament?._id} onRefresh={() => fetchTournamentDetails(selectedTournament?._id)} tournamentStatus={selectedTournament?.status} />
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <Card className="bg-slate-900 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white text-lg flex items-center gap-2">
                                    <Trophy size={18} className="text-yellow-400" /> Points Table
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <PointsTableUI entries={selectedTournament?.pointsTable || []} tournamentOvers={selectedTournament?.overs || 20} matches={tournamentMatches} tournamentId={selectedTournament?._id} onRefresh={() => fetchTournamentDetails(selectedTournament?._id)} tournamentStatus={selectedTournament?.status} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Tab Content: Stats */}
            {detailTab === "stats" && (
                <TournamentStatsTab
                    tournamentStats={tournamentStats}
                    tournamentMatches={tournamentMatches}
                    getPlayerTeam={getPlayerTeam}
                />
            )}

            {/* Tab Content: Newsroom */}
            {detailTab === "news" && (
                <TournamentNewsTab
                    tournament={selectedTournament}
                    matches={tournamentMatches}
                    teams={tournamentTeams}
                    stats={tournamentStats}
                />
            )}

            {/* Tab Content: Teams */}
            {detailTab === "teams" && (
                <div className="space-y-4">
                    {isTournamentOwner && selectedTournament?.status !== 'Completed' && (
                    <div className="flex gap-2">
                        {/* Create New Team */}
                        <div className="flex-1 flex gap-2">
                            <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700"><Plus size={16} className="mr-2" /> New Team</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Register New Team</DialogTitle>
                                        <DialogDescription className="text-slate-400">Create a team and add it to {selectedTournament?.name || "the tournament"}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                                        <div className="space-y-2">
                                            <Label>Team Name</Label>
                                            <Input placeholder="e.g. Mumbai Warriors" className="bg-slate-800 border-slate-700" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Image size={14} /> Team Logo (File)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    className="bg-slate-800 border-slate-700 flex-1 file:bg-slate-700 file:text-white file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 hover:file:bg-slate-600"
                                                    onChange={handleLogoUpload}
                                                />
                                            </div>
                                            {newTeamLogo && (
                                                <div className="flex items-center gap-3 mt-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                                                    <img src={newTeamLogo} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover border border-slate-600" />
                                                    <p className="text-xs text-slate-400 flex-1">Logo preview</p>
                                                    <button onClick={() => setNewTeamLogo("")} className="text-slate-500 hover:text-white"><X size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            {selectedTournament?.groupStructure !== "None" && (selectedTournament?.groupsCount || 0) > 1 && (
                                                <div className="space-y-2">
                                                    <Label>Assign to Group</Label>
                                                    <Select value={assignGroupIndex} onValueChange={setAssignGroupIndex}>
                                                        <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select Group" /></SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                            {selectedTournament?.groups?.map((g, i) => (
                                                                <SelectItem key={i} value={i.toString()}>{g.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label>Captain</Label>
                                                <Input placeholder="e.g. Rohit Sharma" className="bg-slate-800 border-slate-700" value={newTeamCaptain} onChange={(e) => setNewTeamCaptain(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Acronym (Max 5 chars)</Label>
                                                <Input placeholder="e.g. MI" maxLength={5} className="bg-slate-800 border-slate-700 uppercase" value={newTeamAcronym} onChange={(e) => setNewTeamAcronym(e.target.value.toUpperCase())} />
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t border-slate-800">
                                            <Label>Team Theme Color</Label>
                                            <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                                {PRESET_COLORS.map(c => (
                                                    <button
                                                        key={c.value}
                                                        onClick={() => setNewTeamColor(c.value)}
                                                        className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center ${newTeamColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                        style={{ backgroundColor: c.value }}
                                                    >
                                                        {newTeamColor === c.value && <CircleDot size={16} className="text-white" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-4 border-t border-slate-800">
                                            <Label>Add Players</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input placeholder="Player name" className="bg-slate-800 border-slate-700 w-full" value={newTeamPlayerInput} onChange={(e) => { setNewTeamPlayerInput(e.target.value); setShowSuggestions('new'); }} onFocus={() => newTeamPlayerInput.trim().length >= 2 && setShowSuggestions('new')} onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(null); addPlayer(); } }} autoComplete="off" />
                                                    {showSuggestions === 'new' && playerSuggestions.length > 0 && (
                                                        <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                                                            {playerSuggestions.map((s: any, i: number) => (
                                                                <button key={i} type="button" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 transition-colors text-left text-sm" onClick={() => {
                                                                    setNewTeamPlayerInput(s.name);
                                                                    setNewTeamPlayerRole(s.role || 'Batsman');
                                                                    setNewTeamPlayerBattingStyle(s.battingStyle || 'Right-hand Bat');
                                                                    setNewTeamPlayerBowlingStyle(s.bowlingStyle || 'None');
                                                                    setShowSuggestions(null);
                                                                }}>
                                                                    {s.photo ? <img src={s.photo} className="w-7 h-7 rounded-full object-cover border border-slate-600" /> : <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><User size={14} className="text-emerald-400" /></div>}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-white font-medium truncate">{s.name}</p>
                                                                        <p className="text-[10px] text-slate-500">{s.role} · {s.team?.name || 'Existing Player'}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <Select value={newTeamPlayerRole} onValueChange={(v: PlayerRole) => setNewTeamPlayerRole(v)}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-700 w-[130px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-500">Batting Style</Label>
                                                    <Select value={newTeamPlayerBattingStyle} onValueChange={setNewTeamPlayerBattingStyle}>
                                                        <SelectTrigger className="bg-slate-800 border-slate-700 h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                            <SelectItem value="Right-hand Bat">Right-hand Bat</SelectItem>
                                                            <SelectItem value="Left-hand Bat">Left-hand Bat</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-500">Bowling Style</Label>
                                                    <Select value={newTeamPlayerBowlingStyle} onValueChange={setNewTeamPlayerBowlingStyle}>
                                                        <SelectTrigger className="bg-slate-800 border-slate-700 h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                            <SelectItem value="None">None</SelectItem>
                                                            <SelectItem value="Right-arm Fast">Right-arm Fast</SelectItem>
                                                            <SelectItem value="Right-arm Medium">Right-arm Medium</SelectItem>
                                                            <SelectItem value="Right-arm Off-break">Right-arm Off-spin</SelectItem>
                                                            <SelectItem value="Right-arm Leg-break">Right-arm Leg-spin</SelectItem>
                                                            <SelectItem value="Left-arm Fast">Left-arm Fast</SelectItem>
                                                            <SelectItem value="Left-arm Medium">Left-arm Medium</SelectItem>
                                                            <SelectItem value="Left-arm Orthodox">Left-arm Orthodox</SelectItem>
                                                            <SelectItem value="Left-arm Unorthodox">Left-arm Chinaman</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button onClick={addPlayer} size="sm" className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs py-1 h-8">Add to Draft Squad</Button>
                                            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                                                {newTeamPlayers.map((p) => {
                                                    const rc = ROLE_COLORS[p.role];
                                                    return (
                                                        <span key={p.name} className={`px-2.5 py-1 ${rc.bg} ${rc.text} text-xs rounded-full flex items-center gap-1.5 border ${rc.border}`}>
                                                            {rc.icon} {p.name}
                                                            <span className="text-[10px] opacity-70">({p.role === "Wicket Keeper" ? "WK" : p.role === "All-Rounder" ? "AR" : p.role === "Batsman" ? "BAT" : "BOWL"})</span>
                                                            <button onClick={() => setNewTeamPlayers(newTeamPlayers.filter(x => x.name !== p.name))} className="hover:text-white ml-0.5">&times;</button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsAddTeamOpen(false)}>Cancel</Button>
                                        <Button onClick={handleCreateAndAddTeam} className="bg-blue-600 hover:bg-blue-700">Create & Add</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {selectedTournament?.groupStructure !== "None" && Number(selectedTournament?.groupsCount) > 1 && (
                                <Button variant="outline" onClick={handleShuffleGroups} className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                                    <Zap size={16} className="mr-2" /> Make Groups
                                </Button>
                            )}
                        </div>

                        {isTournamentOwner && (selectedTournament?.status as string) !== 'Completed' && unlinkedTeams.length > 0 && (
                            <Dialog open={isLinkTeamOpen} onOpenChange={setIsLinkTeamOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white"><Users size={16} className="mr-2" /> Add Existing Team</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                                    <DialogHeader><DialogTitle>Add Existing Team</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <Select value={selectedTeamToLink} onValueChange={setSelectedTeamToLink}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select a team" /></SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                {unlinkedTeams.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {selectedTournament?.groupStructure !== "None" && (selectedTournament?.groupsCount || 0) > 1 && (
                                            <div className="space-y-2">
                                                <Label>Assign to Group</Label>
                                                <Select value={assignGroupIndex} onValueChange={setAssignGroupIndex}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select Group" /></SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        {selectedTournament?.groups?.map((g, i) => (
                                                            <SelectItem key={i} value={i.toString()}>{g.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsLinkTeamOpen(false)}>Cancel</Button>
                                        <Button onClick={handleLinkExistingTeam} className="bg-blue-600 hover:bg-blue-700">Add to Tournament</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournamentTeams.map((team) => {
                            const stats = getTeamStats(team);
                            const players = team.players || [];
                            const grouped = groupPlayersByRole(players);
                            // Find which group this team belongs to
                            const groupName = selectedTournament?.groups?.find(g => g.teams.some(t => t._id === team._id))?.name;

                            return (
                                <Card key={team._id} onClick={() => openTeamDetail(team)}
                                    className="bg-slate-900 border-slate-700 transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-500/5"
                                    style={{ borderColor: team.color ? `${team.color}50` : undefined }}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            {team.logo ? (
                                                <img src={team.logo} alt={team.name} className="w-11 h-11 rounded-lg object-cover border border-slate-700" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-lg flex items-center justify-center border border-slate-700 font-black text-lg tracking-wider" style={{ backgroundColor: `${team.color || '#3b82f6'}20`, color: team.color || '#3b82f6' }}>
                                                    {team.acronym || getTeamAcronym(team.name)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-white text-base group-hover:text-blue-400 transition-colors truncate">{team.name}</CardTitle>
                                                <CardDescription className="text-slate-400 text-xs flex flex-col gap-0.5">
                                                    {groupName && <span className="text-blue-400 font-bold">{groupName}</span>}
                                                    {team.captain ? (
                                                        <span className="flex items-center gap-1"><Crown size={10} className="text-yellow-400" /> {team.captain}</span>
                                                    ) : "No captain set"}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-slate-500 text-sm">{players.length} players</p>
                                            {stats.played > 0 && (
                                                <div className="flex gap-2 text-xs">
                                                    <span className="text-green-400">{stats.won}W</span>
                                                    <span className="text-red-400">{stats.lost}L</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {ROLES.map(r => {
                                                const count = grouped[r].length;
                                                if (count === 0) return null;
                                                const rc = ROLE_COLORS[r];
                                                return (
                                                    <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded-full ${rc.bg} ${rc.text} border ${rc.border}`}>
                                                        {rc.icon} {count}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {tournamentTeams.length === 0 && (
                        <div className="py-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                            <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-400">No teams yet</h3>
                            <p className="text-slate-500 mt-1">Add teams to this tournament to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Tab Content: Matches */}
            {detailTab === "matches" && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
                            {(["All", "Live", "Upcoming", "Recent"] as MatchFilter[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setMatchFilter(f)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${matchFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {isTournamentOwner && selectedTournament?.status !== 'Completed' && (
                        tournamentTeams.length >= 2 ? (
                            <Dialog open={isScheduleOpen} onOpenChange={(open) => {
                                setIsScheduleOpen(open);
                                if (!open) { setMatchGroupIndex(""); setMatchHomeTeam(""); setMatchAwayTeam(""); setScheduleMatchType("League"); }
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"><Plus size={16} className="mr-2" /> Schedule Match</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                                    <DialogHeader><DialogTitle>Schedule Match — {selectedTournament?.name}</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Match Type</Label>
                                            <Select value={scheduleMatchType} onValueChange={(v: any) => setScheduleMatchType(v)}>
                                                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select type" /></SelectTrigger>
                                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                    <SelectItem value="League">League Match</SelectItem>
                                                    <SelectItem value="Semi Final">Semi Final</SelectItem>
                                                    <SelectItem value="Final">Final</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {selectedTournament?.groupStructure === "Same Group" && selectedTournament?.groups && selectedTournament?.groups?.length > 1 && (
                                            <div className="space-y-2">
                                                <Label>Select Group</Label>
                                                <Select value={matchGroupIndex} onValueChange={(v) => { setMatchGroupIndex(v); setMatchHomeTeam(""); setMatchAwayTeam(""); }}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Filter by Group" /></SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        <SelectItem value="All">All Teams</SelectItem>
                                                        {selectedTournament?.groups?.map((g, i) => (
                                                            <SelectItem key={i} value={i.toString()}>{g.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Home Team</Label>
                                                <Select value={matchHomeTeam} onValueChange={setMatchHomeTeam}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select team" /></SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        {tournamentTeams
                                                            .filter(t => {
                                                                if ((matchType as string) !== 'League' && selectedTournament?.knockedOutTeams?.includes(t._id)) return false;
                                                                if (matchGroupIndex === "" || matchGroupIndex === "All") return true;
                                                                const group = selectedTournament?.groups?.[parseInt(matchGroupIndex)];
                                                                return group?.teams.some(gt => gt._id === t._id);
                                                            })
                                                            .map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Away Team</Label>
                                                <Select value={matchAwayTeam} onValueChange={setMatchAwayTeam}>
                                                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Select team" /></SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                        {tournamentTeams
                                                            .filter(t => {
                                                                if ((matchType as string) !== 'League' && selectedTournament?.knockedOutTeams?.includes(t._id)) return false;
                                                                if (matchGroupIndex === "" || matchGroupIndex === "All") return true;
                                                                const group = selectedTournament?.groups?.[parseInt(matchGroupIndex)];
                                                                return group?.teams.some(gt => gt._id === t._id);
                                                            })
                                                            .map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2"><Label>Venue</Label><Input placeholder="e.g. Wankhede Stadium" className="bg-slate-800 border-slate-700" value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Date & Time</Label><Input type="datetime-local" className="bg-slate-800 border-slate-700" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} /></div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                                        <Button onClick={handleScheduleMatch} className="bg-purple-600 hover:bg-purple-700">Schedule</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs flex items-center gap-2">
                                <Zap size={14} /> Add at least 2 teams to schedule matches
                            </div>
                        )
                        )}
                    </div>

                    <div className="space-y-4">
                        {tournamentMatches
                            .filter(m => {
                                if (matchFilter === "All") return true;
                                if (matchFilter === "Recent") return m.status === "Completed";
                                return m.status === matchFilter;
                            })
                            .map((match) => {
                                const isLive = match.status === 'Live';
                                const s1 = match.score?.team1;
                                const s2 = match.score?.team2;

                                let testBreakStatus: string | null = null;
                                if (isLive && match.tournament?.matchType === "Test") {
                                    const sessionOvers = match.tournament.oversPerSession || 30;
                                    const currentInningsScore = match.currentInnings === 1 ? s1 : s2;
                                    if (currentInningsScore) {
                                        const overs = currentInningsScore.overs || 0;
                                        if (overs > 0 && Number.isInteger(overs) && overs % sessionOvers === 0) {
                                            if (match.testSession === 2) testBreakStatus = "Lunch";
                                            else if (match.testSession === 3) testBreakStatus = "Tea";
                                            else if (match.testSession === 1) testBreakStatus = `Stumps`;
                                            else testBreakStatus = "Break";
                                        }
                                    }
                                }

                                return (
                                    <Card
                                        key={match._id}
                                        className="bg-slate-900 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group"
                                        onClick={() => setSelectedMatch(match)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 md:gap-8 flex-1">
                                                    <div className="text-center w-24">
                                                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 border-2 overflow-hidden shadow-inner"
                                                            style={{ backgroundColor: match.homeTeam?.color ? `${match.homeTeam.color}20` : '#1e293b', borderColor: match.homeTeam?.color || '#475569' }}>
                                                            {match.homeTeam?.logo ? <img src={match.homeTeam.logo} className="w-full h-full object-cover" /> : <span className="font-black text-sm tracking-wider" style={{ color: match.homeTeam?.color || '#60a5fa' }}>{match.homeTeam?.acronym || getTeamAcronym(match.homeTeam?.name)}</span>}
                                                        </div>
                                                        <p className="text-white font-bold text-xs truncate">{match.homeTeam?.name}</p>
                                                        {(isLive || match.status === 'Completed') && s1 && (
                                                            <p className={`text-sm font-black mt-0.5 ${isLive ? 'text-blue-400' : 'text-slate-300'}`}>{s1.runs}/{s1.wickets}</p>
                                                        )}
                                                        {(isLive || match.status === 'Completed') && s1 && (
                                                            <p className="text-slate-600 text-[10px]">({fmtOv(s1.overs)} ov)</p>
                                                        )}
                                                    </div>
                                                    <div className="text-center px-4">
                                                        <p className="text-slate-600 font-black text-xl italic tracking-tighter">VS</p>
                                                        <div className="flex flex-col gap-1 items-center mt-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isLive && testBreakStatus ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : isLive ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : match.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                                {isLive && testBreakStatus ? testBreakStatus : isLive ? 'LIVE' : match.status}
                                                            </span>
                                                            {match.matchType && match.matchType !== 'League' && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                                                    {match.matchType.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-center w-24">
                                                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 border-2 overflow-hidden shadow-inner"
                                                            style={{ backgroundColor: match.awayTeam?.color ? `${match.awayTeam.color}20` : '#1e293b', borderColor: match.awayTeam?.color || '#475569' }}>
                                                            {match.awayTeam?.logo ? <img src={match.awayTeam.logo} className="w-full h-full object-cover" /> : <span className="font-black text-sm tracking-wider" style={{ color: match.awayTeam?.color || '#f87171' }}>{match.awayTeam?.acronym || getTeamAcronym(match.awayTeam?.name)}</span>}
                                                        </div>
                                                        <p className="text-white font-bold text-xs truncate">{match.awayTeam?.name}</p>
                                                        {(isLive || match.status === 'Completed') && s2 && (
                                                            <p className={`text-sm font-black mt-0.5 ${isLive ? 'text-red-400' : 'text-slate-300'}`}>{s2.runs}/{s2.wickets}</p>
                                                        )}
                                                        {(isLive || match.status === 'Completed') && s2 && (
                                                            <p className="text-slate-600 text-[10px]">({fmtOv(s2.overs)} ov)</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center md:items-start gap-1 text-[11px] text-slate-400 border-x border-slate-800 px-6 py-1">
                                                    <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-600" /> {match.venue}</div>
                                                    <div className="flex items-center gap-2"><Calendar size={12} className="text-slate-600" /> {new Date(match.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                                    {match.result?.winner && (
                                                        <div className="flex items-center gap-1 text-green-400 font-medium">
                                                            <Trophy size={11} />
                                                            {match.result.winner === match.homeTeam?._id ? match.homeTeam?.name : match.awayTeam?.name} {match.result.margin ? (match.result.margin.toLowerCase().startsWith('won by') ? match.result.margin : `won by ${match.result.margin}`) : 'won'}
                                                        </div>
                                                    )}
                                                </div>

                                                {isTournamentOwner && selectedTournament?.status !== 'Completed' && (
                                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        {match.status !== 'Completed' && (
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-lg h-9" onClick={(e) => { e.stopPropagation(); window.open(`/score/${match._id}`, '_blank'); }}>
                                                                <Play size={14} className="mr-1.5 fill-current" /> Score
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="ghost" className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 p-0" onClick={() => handleDeleteMatch(match._id)}>
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                        {tournamentMatches.filter(m => {
                            if (matchFilter === "All") return true;
                            if (matchFilter === "Recent") return m.status === "Completed";
                            return m.status === matchFilter;
                        }).length === 0 && (
                                <div className="py-16 text-center bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-800">
                                    {matchFilter === "Live" ? <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" /> : <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />}
                                    <h3 className="text-lg font-medium text-slate-400">No {matchFilter !== "All" ? matchFilter.toLowerCase() : ""} matches found</h3>
                                    <p className="text-slate-500 mt-1">
                                        {matchFilter === "Upcoming" ? "Schedule new fixtures to get started." :
                                            matchFilter === "Live" ? "Matches will appear here once scoring starts." :
                                                matchFilter === "Recent" ? "Completed matches will appear here." :
                                                    "Schedule fixtures to see them listed here."}
                                    </p>
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* Tab Content: Performance Lab */}
            {detailTab === "lab" && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center gap-2"><Zap className="text-yellow-400" size={20} /> Performance Lab</h3>
                        <p className="text-slate-500 text-sm mt-1">Select a match to analyse ball-by-ball performance, run rates, batting & bowling charts.</p>
                    </div>
                    {tournamentMatches.length === 0 ? (
                        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-800">
                            <Zap className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-400">No matches yet</h3>
                            <p className="text-slate-500 mt-1">Schedule and score matches to unlock performance analytics.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tournamentMatches.map((match) => {
                                const hasData = match.status === 'Live' || match.status === 'Completed';
                                return (
                                    <div
                                        key={match._id}
                                        onClick={() => { if (hasData) setSelectedMatch(match); }}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${hasData ? 'bg-slate-900 border-slate-700 hover:border-yellow-500/40 cursor-pointer group' : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden font-black text-sm tracking-widest" style={{ backgroundColor: `${match.homeTeam?.color || '#3b82f6'}20`, color: match.homeTeam?.color || '#3b82f6' }}>
                                                {match.homeTeam?.logo ? <img src={match.homeTeam.logo} className="w-full h-full object-cover" /> : match.homeTeam?.acronym || getTeamAcronym(match.homeTeam?.name)}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">{match.homeTeam?.name} vs {match.awayTeam?.name}</p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin size={10} /> {match.venue}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${match.status === 'Live' ? 'bg-red-500/20 text-red-400 animate-pulse' : match.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        {match.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {hasData ? (
                                            <div className="flex items-center gap-2 text-yellow-400 group-hover:text-yellow-300">
                                                <span className="text-xs font-medium hidden sm:inline">Analyse</span>
                                                <BarChart3 size={16} />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600">Score first</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

