import React, { useState } from 'react';
import { X, Clock, Target, Footprints, Shield, AlertTriangle, ArrowDownLeft, ArrowUpRight, Star, Activity, Trophy, Zap, Sparkles, Award, ArrowRightLeft } from 'lucide-react';
import '@/styles/football-pitch.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SquadPlayer {
    id: string;
    name: string;
    role: string;
    number?: number;
    image?: string;
    isCaptain?: boolean;
    isSubstitute?: boolean;
    matchStats?: any;
    events?: {
        goals: number;
        assists: number;
        yellowCards: number;
        redCards: number;
        redCardMinute?: number;
        saves?: number;
        fouls?: number;
        shotsOnTarget?: number;
        corners?: number;
        teamGoalsConceded?: number;
        substitution?: { inMinute?: number; outMinute?: number; isInjured?: boolean };
    };
}

interface TeamInfo {
    id?: string;
    name: string;
    shortName?: string;
    logo?: string;
    primaryColor?: string;
}

interface FootballPitchLineupProps {
    homeTeam: TeamInfo;
    awayTeam: TeamInfo;
    homePlayers: SquadPlayer[];
    awayPlayers: SquadPlayer[];
    homeFormation?: string;
    awayFormation?: string;
    currentMinute?: number;
}

// ─── Formation Engine ─────────────────────────────────────────────────────────
function parseFormation(formation: string): number[] {
    const parts = formation.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
    return [1, ...parts];
}

function groupPlayersByRole(players: SquadPlayer[]): SquadPlayer[][] {
    const gk = players.filter(p => p.role === 'Goalkeeper');
    const def = players.filter(p => p.role === 'Defender');
    const mid = players.filter(p => p.role === 'Midfielder');
    const fwd = players.filter(p => p.role === 'Forward');
    return [gk, def, mid, fwd];
}

function distributePlayersToRows(
    players: SquadPlayer[],
    formation: string
): SquadPlayer[][] {
    const rowSizes = parseFormation(formation);
    const groups = groupPlayersByRole(players);
    const flatPlayers = groups.flat();
    const rows: SquadPlayer[][] = [];
    let idx = 0;

    for (const size of rowSizes) {
        const row: SquadPlayer[] = [];
        for (let i = 0; i < size && idx < flatPlayers.length; i++) {
            row.push(flatPlayers[idx++]);
        }
        rows.push(row);
    }
    return rows;
}

function getRowYPositions(rowCount: number, isHome: boolean): number[] {
    if (isHome) {
        const startY = 88;
        const endY = 55;
        return Array.from({ length: rowCount }, (_, i) => {
            if (rowCount === 1) return startY;
            return startY - (i * (startY - endY)) / (rowCount - 1);
        });
    } else {
        const startY = 12;
        const endY = 45;
        return Array.from({ length: rowCount }, (_, i) => {
            if (rowCount === 1) return startY;
            return startY + (i * (endY - startY)) / (rowCount - 1);
        });
    }
}

function getPlayerXPositions(count: number): number[] {
    if (count === 1) return [50];
    
    // For 2 players, use a larger margin to keep them more central
    const margin = count === 2 ? 35 : 14;
    const spread = 100 - margin * 2;
    
    return Array.from({ length: count }, (_, i) => {
        return margin + (i * spread) / (count - 1);
    });
}

// ─── Performance Logic ────────────────────────────────────────────────────────
const getRatingColor = (rating: number) => {
    if (rating >= 8.0) return '#22c55e'; // Exceptional
    if (rating >= 7.0) return '#eab308'; // Good
    if (rating >= 6.0) return '#f97316'; // Average
    return '#ef4444'; // Struggling
};

const derivePlayerPerformance = (p: SquadPlayer, currentMinute: number = 90) => {
    if (p.matchStats && Object.keys(p.matchStats).length > 0) return p.matchStats;

    const events = p.events || { 
        goals: 0, 
        assists: 0, 
        yellowCards: 0, 
        redCards: 0, 
        saves: 0, 
        fouls: 0, 
        shotsOnTarget: 0, 
        teamGoalsConceded: 0,
        substitution: undefined 
    };
    
    let minutes = 0;
    const redCardMin = events.redCardMinute;

    if (!p.isSubstitute) {
        // Starters: minute they went off (sub or red) or total current time
        const exitMin = events.substitution?.outMinute || redCardMin;
        minutes = exitMin ? exitMin : currentMinute;
    } else {
        // Substitutes: if they came on, calculate time played
        if (events.substitution?.inMinute !== undefined) {
            const inMin = events.substitution.inMinute;
            const outMin = events.substitution.outMinute || redCardMin || currentMinute;
            minutes = Math.max(0, outMin - inMin);
        }
    }

    // Weighted Performance Rating (Synthetic)
    let rating = 6.0;
    const goals = events.goals || 0;
    const assists = events.assists || 0;
    const yellowCards = events.yellowCards || 0;
    const redCards = events.redCards || 0;
    const saves = events.saves || 0;
    const fouls = events.fouls || 0;
    const shotsOnTarget = events.shotsOnTarget || 0;
    const teamGoalsConceded = events.teamGoalsConceded || 0;

    // Role detection
    const isGK = p.role?.toLowerCase().includes('keeper');
    const isDEF = p.role?.toLowerCase().includes('defender');

    // Offensive Impact
    if (isGK) rating += (goals * 2.0); // Rare and amazing
    else if (isDEF) rating += (goals * 1.5);
    else rating += (goals * 1.0);

    rating += (assists * 0.8);
    rating += (shotsOnTarget * 0.3);

    // Defensive Impact
    if (isGK) {
        rating += (saves * 0.5);
    }
    
    // Disciplinary
    rating -= (fouls * 0.2);
    rating -= (yellowCards * 0.5);
    rating -= (redCards * 2.5);

    // Contextual: Defense & Clean Sheet
    if (isGK || isDEF) {
        // Penalty for goals conceded
        rating -= (teamGoalsConceded * 0.4);

        // Clean Sheet Bonus (Min 60 mins played and 0 conceded)
        if (teamGoalsConceded === 0 && minutes >= 60) {
            rating += 1.0;
        }
    }
    
    const validMinutes = isNaN(minutes) ? 0 : minutes;
    if (validMinutes > 45) rating += 0.4;
    if (validMinutes > 80) rating += 0.3;
    
    // Safety check for NaN
    const finalRating = isNaN(rating) ? 6.0 : Math.min(10.0, Math.max(1.0, Number(rating.toFixed(1))));
    
    return {
        rating: finalRating,
        minutesPlayed: validMinutes,
        goals,
        assists,
        yellowCards,
        redCards,
        saves,
        fouls,
        shotsOnTarget,
        substitutedIn: events.substitution?.inMinute,
        substitutedOut: events.substitution?.outMinute,
        isInjured: events.substitution?.isInjured || false,
    };
};

// ─── Player Stats Dialog ─────────────────────────────────────────────────────
function PlayerStatsDialog({
    player,
    teamColor,
    onClose,
    currentMinute = 90,
}: {
    player: SquadPlayer;
    teamColor: string;
    onClose: () => void;
    currentMinute?: number;
}) {
    const stats = derivePlayerPerformance(player, currentMinute);
    const [imgError, setImgError] = useState(false);
    const hasImage = player.image && !imgError;

    // Generate analysis
    const getAnalysis = (p: SquadPlayer, s: any) => {
        const badges: { label: string; color: string }[] = [];
        const highlights: string[] = [];

        if (s.rating >= 9.0) badges.push({ label: 'MVP', color: 'text-yellow-400 border-yellow-400' });
        else if (s.rating >= 8.5) badges.push({ label: 'World Class', color: 'text-purple-400 border-purple-400' });

        if (s.goals >= 3) { badges.push({ label: 'Hat-trick', color: 'text-blue-400 border-blue-400' }); highlights.push(`scored a hat-trick`); }
        else if (s.goals === 2) { badges.push({ label: 'Brace', color: 'text-blue-400 border-blue-400' }); highlights.push(`scored a brace`); }
        else if (s.goals === 1) highlights.push(`found the net`);

        if (s.assists >= 2) { badges.push({ label: 'Playmaker', color: 'text-green-400 border-green-400' }); highlights.push(`provided ${s.assists} assists`); }
        else if (s.assists === 1) highlights.push(`provided an assist`);

        if (s.saves >= 5) { badges.push({ label: 'Wall', color: 'text-orange-400 border-orange-400' }); highlights.push(`made ${s.saves} crucial saves`); }
        if (s.tackles >= 4) { badges.push({ label: 'Rock', color: 'text-red-400 border-red-400' }); highlights.push(`won ${s.tackles} tackles`); }
        if (s.keyPasses >= 3) { badges.push({ label: 'Creator', color: 'text-pink-400 border-pink-400' }); highlights.push(`created ${s.keyPasses} chances`); }
        if (s.dribblesCompleted >= 4) { badges.push({ label: 'Wizard', color: 'text-purple-400 border-purple-400' }); highlights.push(`completed ${s.dribblesCompleted} dribbles`); }
        if (s.passAccuracy >= 90 && s.passes > 30) { badges.push({ label: 'Metronome', color: 'text-cyan-400 border-cyan-400' }); highlights.push(`maintained ${s.passAccuracy}% pass accuracy`); }

        let summary = '';
        if (highlights.length > 0) {
            summary = `${p.name.split(' ').pop()} had a stand-out game, as he ${highlights.join(' and ')}.`;
        } else if (s.rating >= 7.0) {
            summary = `${p.name.split(' ').pop()} put in a solid shift for the team today.`;
        } else {
            summary = `A quiet performance from ${p.name.split(' ').pop()} in this match.`;
        }

        return { badges, summary };
    };

    const { badges, summary } = getAnalysis(player, stats);

    // Stat row helper (updated with progress bar support)
    const StatRow = ({ icon, label, value, unit, max, color = 'bg-white' }: { icon?: React.ReactNode; label: string; value: any; unit?: string; max?: number; color?: string }) => {
        if (value === undefined || value === null) return null;
        return (
            <div className="py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                        <span className="text-white/40">{icon}</span>
                        <span className="text-sm text-white/70">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                        {value}{unit || ''}
                    </span>
                </div>
                {/* Progress Bar if max is provided */}
                {max && (
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const StatSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="mb-4">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-3">
                {title}
            </h4>
            <div className="space-y-0.5">
                {children}
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className="relative w-full max-w-sm bg-gradient-to-b from-[#1a1a2e] to-[#0f0f23] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X size={16} className="text-white/70" />
                </button>

                {/* Player Header */}
                <div
                    className="relative px-6 pt-6 pb-4 flex-shrink-0"
                    style={{
                        background: `linear-gradient(135deg, ${teamColor}22, ${teamColor}08)`,
                        borderBottom: `1px solid ${teamColor}30`,
                    }}
                >
                    <div className="flex items-center gap-4">
                        {/* Player Photo */}
                        <div className="relative flex-shrink-0">
                            {hasImage ? (
                                <img
                                    src={player.image}
                                    alt={player.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                    style={{ border: `3px solid ${teamColor}` }}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white bg-[#1a1a2e]"
                                    style={{ border: `3px solid ${teamColor}` }}
                                >
                                    {player.number || '?'}
                                </div>
                            )}
                            {player.isCaptain && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-black text-[10px] font-black flex items-center justify-center border border-black/20">
                                    C
                                </span>
                            )}
                        </div>

                        {/* Name & Role */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">
                                {player.number ? `#${player.number} ` : ''}{player.name}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {player.role}
                                </span>
                                {badges.map((b, i) => (
                                    <span
                                        key={i}
                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${b.color} bg-black/20`}
                                    >
                                        {b.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Rating Badge */}
                        {stats.rating && (
                            <div
                                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
                                style={{
                                    background: `${getRatingColor(stats.rating)}20`,
                                    color: getRatingColor(stats.rating),
                                    border: `1px solid ${getRatingColor(stats.rating)}40`,
                                }}
                            >
                                {stats.rating}
                            </div>
                        )}
                    </div>

                    {/* AI Analysis Summary */}
                    <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5">
                        <p className="text-xs text-white/80 italic leading-relaxed">
                            "{summary}"
                        </p>
                    </div>
                </div>

                {/* Player Analytics Dashboard */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-6">
                    {/* Performance Indicators */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-tighter text-white/40 mb-1">Time on Pitch</span>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-black italic text-white leading-none">{stats.minutesPlayed}</span>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Min</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(stats.minutesPlayed / 90) * 100}%` }} />
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-tighter text-white/40 mb-1">Match Influence</span>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-black italic text-white leading-none">{(stats.goals + stats.assists)}</span>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Events</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((stats.goals + stats.assists) / 3) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* General Overview */}
                    <StatSection title="Action Log">
                        <StatRow icon={<Clock size={14} />} label="Total Activity" value={stats.minutesPlayed} unit=" mins" max={100} color="bg-green-500" />
                        {stats.substitutedIn && <StatRow icon={<ArrowUpRight size={14} />} label="Substituted In" value={stats.substitutedIn} unit="'" />}
                        {stats.substitutedOut && <StatRow icon={<ArrowDownLeft size={14} />} label="Substituted Out" value={stats.substitutedOut} unit="'" />}
                    </StatSection>

                    {/* Attacking Dashboard */}
                    {(stats.goals > 0 || stats.assists > 0 || stats.shots) && (
                        <StatSection title="Final Third Analysis">
                            <StatRow icon={<Target size={14} className="text-orange-500" />} label="Goals Scored" value={stats.goals} color="bg-orange-500" max={3} />
                            <StatRow icon={<Footprints size={14} className="text-emerald-500" />} label="Assist Delivery" value={stats.assists} color="bg-emerald-500" max={3} />
                            {stats.shots && <StatRow icon={<Target size={14} />} label="Goal Attempts" value={stats.shots} />}
                        </StatSection>
                    )}

                    {/* Tactical Discipline */}
                    {(stats.yellowCards > 0 || stats.redCards > 0) && (
                        <StatSection title="Tactical Discipline">
                            <StatRow 
                                icon={<AlertTriangle size={14} className="text-yellow-400" />} 
                                label="Yellow Cards" 
                                value={stats.yellowCards} 
                                color="bg-yellow-400" 
                                max={2} 
                            />
                            <StatRow 
                                icon={<AlertTriangle size={14} className="text-red-500" />} 
                                label="Red Cards" 
                                value={stats.redCards} 
                                color="bg-red-500" 
                                max={1} 
                            />
                        </StatSection>
                    )}

                    {/* Placeholder for Advanced Tracker */}
                    {!stats.goals && !stats.assists && !stats.yellowCards && !stats.redCards && (
                        <div className="text-center py-6">
                            <Activity size={32} className="mx-auto text-white/10 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Stable Performance — No Cardable Events</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Player Node Component ───────────────────────────────────────────────────
function PlayerNode({
    player,
    x,
    y,
    teamColor,
    onClick,
    currentMinute,
}: {
    player: SquadPlayer;
    x: number;
    y: number;
    teamColor: string;
    onClick: () => void;
    currentMinute?: number;
}) {
    const stats = derivePlayerPerformance(player, currentMinute);
    const [imgError, setImgError] = useState(false);
    const hasImage = player.image && !imgError;
    const displayName = player.name.split(' ').pop() || player.name;

    const isRedCarded = (player.events?.redCards || 0) > 0;
    const isSubbedIn = player.events?.substitution?.inMinute !== undefined;

    return (
        <div
            className={`pitch-player transition-all duration-500 ${isRedCarded ? 'opacity-70 grayscale-[0.3] ring-2 ring-red-500/50' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, cursor: 'pointer' }}
            title={`${player.number ? '#' + player.number + ' ' : ''}${player.name}${player.isCaptain ? ' (C)' : ''}`}
            onClick={onClick}
        >
            <div className="pitch-player-avatar relative" style={{ '--team-color': teamColor } as React.CSSProperties}>
                {hasImage ? (
                    <img
                        src={player.image}
                        alt={player.name}
                        className="pitch-player-img"
                        style={{ borderColor: teamColor }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="pitch-player-number" style={{ borderColor: teamColor }}>
                        {player.number || '?'}
                    </div>
                )}
                
                {/* Status Badges */}
                <div className="absolute -top-1 -left-1 flex flex-col gap-0.5 z-10 pointer-events-none">
                    {/* Goals - Unified White/Black HUD */}
                    {(player.events?.goals || 0) > 0 && (
                        <div className="w-5 h-5 rounded-full bg-white border border-black/20 flex items-center justify-center shadow-lg transform -rotate-12 scale-110 animate-pulse">
                            <span className="text-[10px] leading-none text-black font-black">⚽</span>
                        </div>
                    )}
                    {/* Assists - Unified White/Black HUD */}
                    {(player.events?.assists || 0) > 0 && (
                        <div className="w-5 h-5 rounded-full bg-white border border-black/20 flex items-center justify-center shadow-lg transform rotate-12 scale-110">
                            <Footprints size={10} className="text-black" />
                        </div>
                    )}
                </div>

                <div className="absolute -bottom-1 -right-1 flex flex-col-reverse gap-0.5 z-10 pointer-events-none">
                    {/* Disciplinary */}
                    {isRedCarded && (
                        <div className="w-4 h-5 bg-red-600 rounded-sm border border-black/20 shadow-lg" title="Red Card" />
                    )}
                    {(player.events?.yellowCards || 0) > 0 && (
                        <div className="w-4 h-5 bg-yellow-400 rounded-sm border border-black/20 shadow-lg" title="Yellow Card" />
                    )}
                </div>

                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 z-10 pointer-events-none">
                    {/* Captain */}
                    {player.isCaptain && (
                        <span className="pitch-captain-badge">C</span>
                    )}
                    {/* Substitution Indicators */}
                    {player.events?.substitution?.inMinute !== undefined && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 border border-white/20 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                            <ArrowUpRight size={10} className="text-white" strokeWidth={3} />
                        </div>
                    )}
                    {player.events?.substitution?.outMinute !== undefined && (
                        <div className="w-5 h-5 rounded-full bg-red-500 border border-white/20 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                            <ArrowDownLeft size={10} className="text-white" strokeWidth={3} />
                        </div>
                    )}
                </div>

                {/* Rating Badge (Bottom-Left) */}
                <div className="absolute -bottom-1 -left-1 z-20 pointer-events-none">
                    <div 
                        className="h-5 px-1.5 rounded-md flex items-center justify-center text-[9px] font-black text-white shadow-xl border border-white/20 scale-110"
                        style={{ backgroundColor: getRatingColor(stats.rating) }}
                    >
                        {stats.rating}
                    </div>
                </div>
            </div>
            <span className="pitch-player-name">{displayName}</span>
        </div>
    );
}

// ─── Pitch Component ──────────────────────────────────────────────────────────
function PitchField({
    homePlayers,
    awayPlayers,
    homeFormation,
    awayFormation,
    homeColor,
    awayColor,
    currentMinute,
    onPlayerClick,
}: {
    homePlayers: SquadPlayer[];
    awayPlayers: SquadPlayer[];
    homeFormation: string;
    awayFormation: string;
    homeColor: string;
    awayColor: string;
    currentMinute?: number;
    onPlayerClick: (player: SquadPlayer, teamColor: string) => void;
}) {
    // Calculate Current XI: Starters not subbed out + Substitutes subbed in
    const getCurrentXI = (players: SquadPlayer[]) => {
        const onField = players.filter(p => {
            const hasStarted = !p.isSubstitute;
            const subEvents = p.events?.substitution;
            const isSubbedOut = subEvents?.outMinute !== undefined;
            const isSubbedIn = subEvents?.inMinute !== undefined;

            if (hasStarted) return !isSubbedOut;
            return isSubbedIn;
        });
        
        // Ensure we handle formation rendering correctly by padding/slicing up to 11
        // This keeps the tactical board stable during the transition
        return onField.slice(0, 11);
    };

    const homeXI = getCurrentXI(homePlayers);
    const awayXI = getCurrentXI(awayPlayers);

    const homeRows = distributePlayersToRows(homeXI, homeFormation);
    const awayRows = distributePlayersToRows(awayXI, awayFormation);

    const homeYPositions = getRowYPositions(homeRows.length, true);
    const awayYPositions = getRowYPositions(awayRows.length, false);

    return (
        <div className="football-pitch">
            {/* Cinematic Lighting Overlay */}
            <div className="pitch-lighting" />

            {/* Field Markings */}
            <div className="pitch-markings">
                <div className="pitch-center-line" />
                <div className="pitch-center-circle" />
                <div className="pitch-center-spot" />
                <div className="pitch-penalty-top" />
                <div className="pitch-penalty-bottom" />
                <div className="pitch-goal-top" />
                <div className="pitch-goal-bottom" />
                <div className="pitch-arc-top" />
                <div className="pitch-arc-bottom" />
                <div className="pitch-corner-tl" />
                <div className="pitch-corner-tr" />
                <div className="pitch-corner-bl" />
                <div className="pitch-corner-br" />
            </div>

            {/* Home Team - Bottom half */}
            {homeRows.map((row, ri) =>
                row.map((player, pi) => {
                    const xPositions = getPlayerXPositions(row.length);
                    return (
                        <PlayerNode
                            key={player.id}
                            player={player}
                            x={xPositions[pi]}
                            y={homeYPositions[ri]}
                            teamColor={homeColor}
                            currentMinute={currentMinute}
                            onClick={() => onPlayerClick(player, homeColor)}
                        />
                    );
                })
            )}

            {/* Away Team - Top half */}
            {awayRows.map((row, ri) =>
                row.map((player, pi) => {
                    const xPositions = getPlayerXPositions(row.length);
                    return (
                        <PlayerNode
                            key={player.id}
                            player={player}
                            x={xPositions[pi]}
                            y={awayYPositions[ri]}
                            teamColor={awayColor}
                            currentMinute={currentMinute}
                            onClick={() => onPlayerClick(player, awayColor)}
                        />
                    );
                })
            )}
        </div>
    );
}

// ─── Substitutes Panel ────────────────────────────────────────────────────────
function SubstitutesPanel({
    players,
    teamName,
    teamColor,
    teamLogo,
    currentMinute,
    onPlayerClick,
}: {
    players: SquadPlayer[];
    teamName: string;
    teamColor: string;
    teamLogo?: string;
    currentMinute?: number;
    onPlayerClick: (player: SquadPlayer) => void;
}) {
    const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

    if (players.length === 0) return null;

    return (
        <div className="football-subs-panel">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                {teamLogo && (
                    <img src={teamLogo} alt="" className="w-5 h-5 object-contain" />
                )}
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    {teamName} — Substitutes
                </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
                {players.map(p => {
                    const stats = derivePlayerPerformance(p, currentMinute);
                    return (
                    <div
                        key={p.id}
                        className={`football-sub-player cursor-pointer relative ${p.events?.substitution?.outMinute !== undefined && !p.isSubstitute ? 'opacity-50' : ''}`}
                        style={{ '--team-color': teamColor } as React.CSSProperties}
                        onClick={() => onPlayerClick(p)}
                    >
                        {p.image && !imgErrors.has(p.id) ? (
                            <img
                                src={p.image}
                                alt={p.name}
                                className="football-sub-avatar"
                                style={{ borderColor: teamColor }}
                                onError={() => setImgErrors(prev => new Set(prev).add(p.id))}
                            />
                        ) : (
                            <div className="football-sub-number" style={{ borderColor: teamColor }}>
                                {p.number || '?'}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-semibold text-white/90 truncate">
                                    {p.number ? `#${p.number} ` : ''}{p.name}
                                </span>
                                {/* Subbed In / Started and Subbed Out Status */}
                                {p.events?.substitution?.inMinute !== undefined && (
                                    <span className="flex items-center text-[8px] text-emerald-400 font-black px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                        <ArrowUpRight size={10} className="mr-0.5" strokeWidth={3} />
                                        IN {p.events.substitution.inMinute}'
                                    </span>
                                )}
                                {p.events?.substitution?.outMinute !== undefined && (
                                    <span className="flex items-center text-[8px] text-red-400 font-black px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
                                        <ArrowDownLeft size={10} className="mr-0.5" strokeWidth={3} />
                                        OUT {p.events.substitution.outMinute}'
                                        {p.events.substitution.isInjured && <Activity size={10} className="ml-1.5 text-red-500 animate-pulse" />}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-white/50 capitalize">{p.role}</span>
                                <div className="flex gap-1 ml-auto items-center">
                                    <div 
                                        className="h-4 px-1 rounded flex items-center justify-center text-[8px] font-black text-white"
                                        style={{ backgroundColor: getRatingColor(stats.rating) }}
                                    >
                                        {stats.rating}
                                    </div>
                                    {(p.events?.goals || 0) > 0 && (
                                        <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <span className="text-[8px] text-black font-black">⚽</span>
                                        </div>
                                    )}
                                    {(p.events?.assists || 0) > 0 && (
                                        <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Footprints size={8} className="text-black" />
                                        </div>
                                    )}
                                    {(p.events?.yellowCards || 0) > 0 && <div className="w-2 h-3 bg-yellow-400 rounded-[1px] border border-white/10" />}
                                    {(p.events?.redCards || 0) > 0 && <div className="w-2 h-3 bg-red-600 rounded-[1px] border border-white/10" />}
                                </div>
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function FootballPitchLineup({
    homeTeam,
    awayTeam,
    homePlayers,
    awayPlayers,
    homeFormation = '4-4-2',
    awayFormation = '4-4-2',
    currentMinute = 90,
}: FootballPitchLineupProps) {
    const [selectedPlayer, setSelectedPlayer] = useState<{ player: SquadPlayer; teamColor: string } | null>(null);

    const homeColor = homeTeam.primaryColor || '#3B82F6';
    const awayColor = awayTeam.primaryColor || '#EF4444';

    const adjustedHomeColor = homeColor.toLowerCase() === '#ffffff' || homeColor.toLowerCase() === '#fff'
        ? '#E0E0E0'
        : homeColor;
    const adjustedAwayColor = awayColor.toLowerCase() === '#ffffff' || awayColor.toLowerCase() === '#fff'
        ? '#E0E0E0'
        : awayColor;

    const homeSubs = homePlayers.filter(p => p.isSubstitute || p.events?.substitution?.outMinute !== undefined);
    const awaySubs = awayPlayers.filter(p => p.isSubstitute || p.events?.substitution?.outMinute !== undefined);

    const handlePlayerClick = (player: SquadPlayer, teamColor: string) => {
        setSelectedPlayer({ player, teamColor });
    };

    return (
        <div className="space-y-4">
            {/* Formation Headers */}
            <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden p-6 rounded-[2rem] bg-slate-900/60 border border-white/5 backdrop-blur-xl group hover:border-white/10 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-[50px] -mr-8 -mt-8" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center p-2">
                                {homeTeam.logo ? <img src={homeTeam.logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-lg" style={{ backgroundColor: homeColor }} />}
                            </div>
                            <div>
                                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400 mb-0.5">Home Contingent</h4>
                                <h3 className="text-base font-black italic uppercase tracking-tighter text-white">{homeTeam.shortName || homeTeam.name}</h3>
                            </div>
                        </div>
                        <div className="text-3xl font-black italic tracking-tighter text-white/10 group-hover:text-white/20 transition-colors uppercase">{homeFormation}</div>
                    </div>
                </div>

                <div className="relative overflow-hidden p-6 rounded-[2rem] bg-slate-900/60 border border-white/5 backdrop-blur-xl group hover:border-white/10 transition-all">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-red-600/10 blur-[50px] -ml-8 -mt-8" />
                    <div className="relative z-10 flex items-center justify-between flex-row-reverse">
                        <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center p-2">
                                {awayTeam.logo ? <img src={awayTeam.logo} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full rounded-lg" style={{ backgroundColor: awayColor }} />}
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500 mb-0.5">Away Contingent</h4>
                                <h3 className="text-base font-black italic uppercase tracking-tighter text-white">{awayTeam.shortName || awayTeam.name}</h3>
                            </div>
                        </div>
                        <div className="text-3xl font-black italic tracking-tighter text-white/10 group-hover:text-white/20 transition-colors uppercase">{awayFormation}</div>
                    </div>
                </div>
            </div>

            {/* Pitch Visualization */}
            <PitchField
                homePlayers={homePlayers}
                awayPlayers={awayPlayers}
                homeFormation={homeFormation}
                awayFormation={awayFormation}
                homeColor={adjustedHomeColor}
                awayColor={adjustedAwayColor}
                currentMinute={currentMinute}
                onPlayerClick={handlePlayerClick}
            />

            {/* Substitutes */}
            <div className="grid md:grid-cols-2 gap-3">
                <SubstitutesPanel
                    players={homeSubs}
                    teamName={homeTeam.shortName || homeTeam.name}
                    teamColor={adjustedHomeColor}
                    teamLogo={homeTeam.logo}
                    currentMinute={currentMinute}
                    onPlayerClick={(p) => handlePlayerClick(p, adjustedHomeColor)}
                />
                <SubstitutesPanel
                    players={awaySubs}
                    teamName={awayTeam.shortName || awayTeam.name}
                    teamColor={adjustedAwayColor}
                    teamLogo={awayTeam.logo}
                    currentMinute={currentMinute}
                    onPlayerClick={(p) => handlePlayerClick(p, adjustedAwayColor)}
                />
            </div>

            {/* Player Stats Dialog */}
            {selectedPlayer && (
                <PlayerStatsDialog
                    player={selectedPlayer.player}
                    teamColor={selectedPlayer.teamColor}
                    currentMinute={currentMinute}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
}
