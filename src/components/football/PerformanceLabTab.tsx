import React, { useState } from 'react';
import { Activity, Shield, Swords, Target, TrendingUp, AlertTriangle, Crosshair, Map, Star, Info } from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, ReferenceLine,
    AreaChart, Area, RadialBarChart, RadialBar, ComposedChart, ReferenceDot
} from 'recharts';
import { LineupPlayerImage } from './LineupPlayerImage';
import { FootballTeamLogo } from './FootballTeamLogo';

interface PerformanceLabTabProps {
    espnMatchId: string;
    matchDate: string;
    homeTeamName?: string;
    awayTeamName?: string;
    matchStatus: string;
    matchData: any; 
}

interface SlantClashRowProps {
    label: string;
    homeValue: number;
    awayValue: number;
    homeColor?: string;
    awayColor?: string;
}

const SlantClashRow = ({ label, homeValue, awayValue, homeColor = "#0ea5e9", awayColor = "#f43f5e" }: SlantClashRowProps) => {
    const total = homeValue + awayValue || 1;
    // Limit width so numbers never get completely crushed
    const baseHomePct = (homeValue / total) * 100;
    const homePct = Math.max(15, Math.min(85, baseHomePct));
    const awayPct = 100 - homePct;

    return (
        <div className="flex w-full h-11 bg-[#09090b] border border-white/[0.05] rounded overflow-hidden relative group">
            {/* Home Side */}
            <div 
                className="h-full flex items-center px-4 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ 
                    width: `calc(${homePct}% + 6px)`,
                    backgroundColor: `${homeColor}15`,
                    clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                    borderRight: `2px solid ${homeColor}`
                }}
            >
                <span className="text-base font-black tracking-tighter" style={{ color: homeColor, textShadow: `0 0 12px ${homeColor}80` }}>{homeValue}</span>
            </div>

            {/* Absolute Centered Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="px-3 py-0.5 bg-[#09090b]/90 backdrop-blur-md shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/[0.08] rounded-sm">
                    <span className="text-[10px] uppercase font-black text-zinc-300 tracking-widest">{label}</span>
                </div>
            </div>

            {/* Away Side */}
            <div 
                className="h-full flex items-center justify-end px-4 ml-auto transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ 
                    width: `calc(${awayPct}% + 6px)`,
                    backgroundColor: `${awayColor}15`,
                    clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)',
                    borderLeft: `2px solid ${awayColor}`,
                    marginLeft: '-12px'
                }}
            >
                <span className="text-base font-black tracking-tighter" style={{ color: awayColor, textShadow: `0 0 12px ${awayColor}80` }}>{awayValue}</span>
            </div>
        </div>
    );
};

export function PerformanceLabTab({ matchStatus, matchData }: PerformanceLabTabProps) {
    const [activeImpactTab, setActiveImpactTab] = useState('Attack Threat');
    if (!matchData) return null;

    const { boxscore, predictor, header, rosters } = matchData;

    // --- RELIABLE TEAM NAME & LOGO EXTRACTION ---
    const comp = header?.competitions?.[0];
    const homeTeamObj = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team || {};
    const awayTeamObj = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team || {};
    const homeTeamName = homeTeamObj.shortDisplayName || homeTeamObj.name || "Home Team";
    const awayTeamName = awayTeamObj.shortDisplayName || awayTeamObj.name || "Away Team";
    
    // Fallback to ESPN logos if the federation mapping didn't override it
    const homeLogo = homeTeamObj.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${homeTeamObj.id}.png`;
    const awayLogo = awayTeamObj.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${awayTeamObj.id}.png`;

    // --- PREDICTIONS & PRE-MATCH ANALYSIS ---
    let homeWinPct = predictor?.homeTeam?.gameProjection ?? 45.5;
    let awayWinPct = predictor?.awayTeam?.gameProjection ?? 25.5;
    let drawPct = 100 - homeWinPct - awayWinPct;
    if (drawPct < 0) drawPct = Math.abs(drawPct);

    // --- ADVANCED TEAM STATISTICS ---
    let statistics: any = null;
    if (boxscore?.teams && boxscore.teams.length === 2) {
        const bHome = boxscore.teams.find((t:any) => t.team.id === homeTeamObj.id) || boxscore.teams[0];
        const bAway = boxscore.teams.find((t:any) => t.team.id === awayTeamObj.id) || boxscore.teams[1];
        statistics = [
            { team: bHome.team, stats: bHome.statistics },
            { team: bAway.team, stats: bAway.statistics }
        ];
    }

    const parseVal = (str: string | number) => {
        if (!str) return 0;
        const match = str.toString().match(/^([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
    };

    const getStat = (teamIdx: number, labelToMatch: string) => {
        if (!statistics) return 0;
        const statObj = statistics[teamIdx].stats.find((s: any) => s.label.toLowerCase().includes(labelToMatch.toLowerCase()));
        return statObj ? parseVal(statObj.displayValue) : 0;
    };

    // --- RADAR DATA ---
    const radarData = [
        {
            subject: 'Possession',
            [homeTeamName]: getStat(0, 'possession') || 50,
            [awayTeamName]: getStat(1, 'possession') || 50,
            fullMark: 100,
        },
        {
            subject: 'Pass Accuracy',
            [homeTeamName]: getStat(0, 'pass completion %') * 100 || getStat(0, 'pass') / 10 || 50, 
            [awayTeamName]: getStat(1, 'pass completion %') * 100 || getStat(1, 'pass') / 10 || 50,
            fullMark: 100,
        },
        {
            subject: 'Attacking Threat',
            [homeTeamName]: Math.min(getStat(0, 'shots') * 5 + getStat(0, 'corner') * 2, 100),
            [awayTeamName]: Math.min(getStat(1, 'shots') * 5 + getStat(1, 'corner') * 2, 100),
            fullMark: 100,
        },
        {
            subject: 'Defensive Action',
            [homeTeamName]: Math.min(getStat(0, 'saves') * 10 + getStat(0, 'blocked') * 5 + getStat(0, 'clearance') * 2, 100) || 50,
            [awayTeamName]: Math.min(getStat(1, 'saves') * 10 + getStat(1, 'blocked') * 5 + getStat(1, 'clearance') * 2, 100) || 50,
            fullMark: 100,
        },
        {
            subject: 'Discipline',
            [homeTeamName]: Math.max(100 - (getStat(0, 'fouls') * 3), 0),
            [awayTeamName]: Math.max(100 - (getStat(1, 'fouls') * 3), 0),
            fullMark: 100,
        }
    ];

    // --- BAR CHARTS DATA ---
    const offensiveData = [
        { name: 'Total Shots', [homeTeamName]: getStat(0, 'shots'), [awayTeamName]: getStat(1, 'shots') },
        { name: 'Shots on Goal', [homeTeamName]: getStat(0, 'on goal'), [awayTeamName]: getStat(1, 'on goal') },
        { name: 'Corners', [homeTeamName]: getStat(0, 'corner'), [awayTeamName]: getStat(1, 'corner') },
        { name: 'Offsides', [homeTeamName]: getStat(0, 'offside'), [awayTeamName]: getStat(1, 'offside') },
    ];

    const distributionData = [
        { name: 'Passes', [homeTeamName]: getStat(0, 'passes'), [awayTeamName]: getStat(1, 'passes') },
        { name: 'Accurate Passes', [homeTeamName]: getStat(0, 'accurate passes'), [awayTeamName]: getStat(1, 'accurate passes') },
        { name: 'Crosses', [homeTeamName]: getStat(0, 'crosses'), [awayTeamName]: getStat(1, 'crosses') },
        { name: 'Long Balls', [homeTeamName]: getStat(0, 'long balls'), [awayTeamName]: getStat(1, 'long balls') },
    ];

    const defensiveData = [
        { name: 'Saves', [homeTeamName]: getStat(0, 'saves'), [awayTeamName]: getStat(1, 'saves') },
        { name: 'Clearances', [homeTeamName]: getStat(0, 'clearance'), [awayTeamName]: getStat(1, 'clearance') },
        { name: 'Fouls', [homeTeamName]: getStat(0, 'fouls'), [awayTeamName]: getStat(1, 'fouls') },
        { name: 'Yellow Cards', [homeTeamName]: getStat(0, 'yellow'), [awayTeamName]: getStat(1, 'yellow') },
    ];

    const homePossession = getStat(0, 'possession') || 50;
    const awayPossession = getStat(1, 'possession') || 50;
    const donutData = [
        { name: homeTeamName, value: homePossession },
        { name: awayTeamName, value: awayPossession }
    ];

    // --- MAN OF THE MATCH ---
    let topPerformers: any[] = [];
    
    // Attempt to extract the official Man of the Match from ESPN match details.
    // If not found, we do not show any random algorithmic performers.
    let motm: any = null;

    if (matchData.manOfTheMatch) {
        motm = matchData.manOfTheMatch;
    } else if (matchData.gameInfo?.manOfTheMatch) {
        motm = matchData.gameInfo.manOfTheMatch;
    } else if (matchData.keyEvents) {
        const motmEvent = matchData.keyEvents.find((e: any) => 
            e.type?.text?.toLowerCase() === 'man of the match' || 
            e.text?.toLowerCase().includes('man of the match')
        );
        if (motmEvent && motmEvent.participants && motmEvent.participants.length > 0) {
            motm = motmEvent.participants[0].athlete;
        }
    }

    if (motm) {
        topPerformers = [{
            id: motm.id,
            name: motm.shortName || motm.displayName,
            position: motm.position?.abbreviation || 'MOTM',
            rating: 10.0, // Official MOTM gets a perfect default
            goals: 0,
            assists: 0,
            saves: 0,
            team: null
        }];
    }

    // --- REAL MOMENTUM GRAPH GENERATOR ---
    const momentumData = React.useMemo(() => {
        const data = [];
        const rawPoints: Record<number, { home: number; away: number }> = {};
        const goalMinutes: Record<number, string> = {};
        let maxMinuteFound = 0;

        const processEvent = (min: number, teamId: string, teamName: string, typeText: string, text: string) => {
            if (min < 0 || min > 120) return;
            if (min > maxMinuteFound) maxMinuteFound = min;
            if (!rawPoints[min]) rawPoints[min] = { home: 0, away: 0 };

            typeText = typeText.toLowerCase();
            text = text.toLowerCase();
            teamName = teamName.toLowerCase();

            const isHome = teamId === homeTeamObj.id || teamName === homeTeamObj.name?.toLowerCase() || text.includes(homeTeamName.toLowerCase());
            const isAway = teamId === awayTeamObj.id || teamName === awayTeamObj.name?.toLowerCase() || text.includes(awayTeamName.toLowerCase());

            let pts = 0;
            const isActualGoal = typeText === 'goal' || typeText === 'penalty - scored' || typeText === 'own goal';

            if (isActualGoal) {
                pts = 50;
                let goalForTeam = isHome ? 'home' : (isAway ? 'away' : '');
                if (!goalForTeam && text.includes(homeTeamName.toLowerCase())) goalForTeam = 'home';
                if (!goalForTeam && text.includes(awayTeamName.toLowerCase())) goalForTeam = 'away';
                if (goalForTeam) goalMinutes[min] = goalForTeam;
            }
            else if (typeText.includes('missed') || typeText.includes('saved') || typeText.includes('shot') || typeText.includes('attempt') || text.includes('attempt') || text.includes('shot')) {
                pts = 20;
            }
            else if (typeText.includes('corner') || text.includes('corner')) {
                pts = 10;
            }
            else if (typeText.includes('foul') || text.includes('foul') || typeText.includes('offside') || text.includes('offside')) {
                pts = -5; // Negative momentum for the team committing it
            }
            else if (typeText.includes('yellow') || text.includes('yellow card')) {
                pts = -15;
            }
            else if (typeText.includes('red') || text.includes('red card')) {
                pts = -40;
            }
            else {
                pts = 5; // generic attacking event / free kick won
            }

            if (isHome) {
                rawPoints[min].home += pts;
            } else if (isAway) {
                rawPoints[min].away += pts;
            }
        };

        if (matchData.keyEvents) {
            matchData.keyEvents.forEach((e: any) => {
                const minText = e.clock?.time || e.time || '0';
                const min = parseInt(minText.toString().split("'")[0] || '0');
                const teamId = e.team?.id;
                const teamName = e.team?.displayName || '';
                processEvent(min, teamId, teamName, e.type?.text || '', e.text || '');
            });
        }
        
        if (matchData.commentary) {
            matchData.commentary.forEach((c: any) => {
                const minText = c.time?.displayValue || '0';
                const min = parseInt(minText.toString().split("'")[0] || '0');
                const teamId = c.play?.team?.id || c.team?.id;
                const teamName = c.play?.team?.displayName || c.team?.displayName || '';
                processEvent(min, teamId, teamName, c.play?.type?.text || '', c.text || c.play?.text || '');
            });
        }

        const maxMinute = Math.max(90, maxMinuteFound);
        let runningMomentum = 0;

        for (let i = 0; i <= maxMinute; i++) {
            let pts = 0;
            if (rawPoints[i]) {
                pts = rawPoints[i].home - rawPoints[i].away;
            }
            
            // Add current minute's points
            runningMomentum += pts;
            
            // Decay by 20% each minute to simulate momentum fading (smoothing)
            runningMomentum *= 0.8;
            
            // Clamp to [-100, 100]
            let displayPressure = Math.max(-100, Math.min(100, runningMomentum));
            
            data.push({
                minute: i,
                home: displayPressure,
                away: -displayPressure,
                value: displayPressure,
                isGoal: !!goalMinutes[i],
                goalTeam: goalMinutes[i]
            });
        }
        return data;
    }, [matchData, homeTeamObj.id, awayTeamObj.id, homeTeamName, awayTeamName]);

    // --- MATCH LEADERS ---
    let matchLeadersTabs: Record<string, any[]> = {
        'Attack Threat': [],
        'Defensive Action': [],
        'Discipline': []
    };
    try {
        if (matchData?.rosters) {
            let allPlayers: any[] = [];
            matchData.rosters.forEach((r: any) => {
                if (r.roster) {
                    r.roster.forEach((p: any) => {
                        allPlayers.push({
                            ...p,
                            teamName: r.team?.displayName || r.team?.name || 'Unknown',
                            teamId: r.team?.id
                        });
                    });
                }
            });

            const tabDefinitions = [
                {
                    tabName: 'Attack Threat',
                    stats: [
                        { key: 'totalGoals', label: 'Goals Scored' },
                        { key: 'goalAssists', label: 'Assists' },
                        { key: 'totalShots', label: 'Total Shots' },
                        { key: 'shotsOnTarget', label: 'Shots On Target' },
                        { key: 'offsides', label: 'Offsides' }
                    ]
                },
                {
                    tabName: 'Defensive Action',
                    stats: [
                        { key: 'saves', label: 'Saves' },
                        { key: 'foulsSuffered', label: 'Fouls Suffered' },
                        { key: 'goalsConceded', label: 'Goals Conceded' }
                    ]
                },
                {
                    tabName: 'Discipline',
                    stats: [
                        { key: 'foulsCommitted', label: 'Fouls Committed' },
                        { key: 'yellowCards', label: 'Yellow Cards' },
                        { key: 'redCards', label: 'Red Cards' }
                    ]
                }
            ];

            tabDefinitions.forEach(tabDef => {
                const groupedCategories = tabDef.stats.map(statTarget => {
                    const playersWithStat = allPlayers.map(p => {
                        const statObj = p.stats?.find((s: any) => s.name === statTarget.key);
                        const val = statObj ? parseFloat(statObj.value || '0') : 0;
                        return {
                            id: String(p.athlete?.id || ''),
                            name: String(p.athlete?.shortName || p.athlete?.displayName || 'Unknown'),
                            position: String(p.position?.abbreviation || 'N/A'),
                            team: String(p.teamName),
                            teamId: String(p.teamId),
                            value: val
                        };
                    }).filter(p => p.value > 0);

                    const top3 = playersWithStat.sort((a, b) => b.value - a.value).slice(0, 3);
                    const maxValue = top3.length > 0 ? top3[0].value : 1;
                    
                    return {
                        categoryName: statTarget.label,
                        maxValue: maxValue,
                        players: top3
                    };
                }).filter(cat => cat.players.length > 0);

                matchLeadersTabs[tabDef.tabName] = groupedCategories;
            });
        }
    } catch (err) {
        console.error("Match Leaders Error:", err);
    }

    // --- FULL STATISTICS COMPARISON ---
    let allStatsCompare: any[] = [];
    if (statistics && statistics.length === 2 && statistics[0].stats && statistics[1].stats) {
        allStatsCompare = statistics[0].stats.map((s: any) => {
            const awayStat = statistics[1].stats.find((as: any) => as.name === s.name);
            return {
                label: s.displayName || s.label || s.name,
                homeValue: s.displayValue,
                awayValue: awayStat ? awayStat.displayValue : '0',
                homeNum: parseVal(s.displayValue),
                awayNum: parseVal(awayStat ? awayStat.displayValue : '0')
            };
        });
    }

    // --- RENDER HELPERS ---
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0f172a]/90 border border-white/[0.08] p-4 rounded-xl shadow-2xl  min-w-[150px]">
                    <p className="font-bold text-xs uppercase text-zinc-100  mb-3 border-b border-white/10 pb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm font-semibold mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-zinc-100 ">{entry.name}</span>
                            </div>
                            <span className="text-zinc-100  font-semibold tracking-tight">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const renderProgressBar = (label: string, homeVal: string, awayVal: string) => {
        const homeNum = parseFloat(homeVal.replace('%', ''));
        const awayNum = parseFloat(awayVal.replace('%', ''));
        const total = homeNum + awayNum || 1;
        const homePct = (homeNum / total) * 100;
        const awayPct = (awayNum / total) * 100;

        return (
            <div className="mb-5">
                <div className="flex justify-between text-[11px] font-bold mb-2 tracking-tight text-zinc-100 ">
                    <span className="text-zinc-300">{homeVal}</span>
                    <span className="text-[10px] text-zinc-100  bg-white/5 px-2 py-0.5 rounded-full">{label}</span>
                    <span className="text-zinc-400">{awayVal}</span>
                </div>
                <div className="h-2 w-full bg-[#18181b]/50 rounded-full overflow-hidden flex">
                    <div className="h-full bg-zinc-700 shadow-sm" style={{ width: `${homePct}%` }}></div>
                    <div className="h-full bg-zinc-800 shadow-sm" style={{ width: `${awayPct}%` }}></div>
                </div>
            </div>
        );
    };

    const getRatingColor = (val: number) => {
        if (val >= 8.0) return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (val >= 7.0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (val >= 6.0) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-zinc-100  bg-white/5 border-white/10';
    };

    return (
        <div className="space-y-6">
            
            {/* Top Performers (Player of the Match) Section */}
            {topPerformers.length > 0 && (
                <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                    
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-500/20">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        <h3 className="text-lg font-medium font-semibold tracking-tight tracking-tight text-amber-50">Top Performers</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {topPerformers.map((p: any, idx: number) => (
                            <div key={p.id} className="flex items-center gap-5 bg-black/20 p-4 rounded-2xl border border-white/[0.08] transition-all hover:bg-[#0f0f11]  shadow-none">
                                <div className="w-16 h-16 rounded-full bg-[#18181b]/50 border-2 border-white/[0.05] flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm text-zinc-500">
                                    <img src={idx === 0 ? homeLogo : awayLogo} className="absolute inset-0 w-full h-full object-contain opacity-20 blur-[2px] scale-75" />
                                    <LineupPlayerImage playerId={p.id} playerName={p.name} className="absolute inset-0 z-10 w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FootballTeamLogo logo={idx === 0 ? homeLogo : awayLogo} name={idx === 0 ? homeTeamName : awayTeamName} className="w-4 h-4 !w-4 !h-4 object-contain" />
                                        <p className="font-semibold tracking-tight text-lg text-zinc-100  truncate">{p.name}</p>
                                    </div>
                                    <p className="text-[11px] text-amber-200/60 uppercase font-bold tracking-widest mb-2">{p.position} • Man of the Match</p>
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                        {p.goals > 0 && <span className="text-emerald-400 bg-emerald-500/10 border border-white/[0.08] px-2 py-0.5 rounded-md">⚽ {p.goals}</span>}
                                        {p.assists > 0 && <span className="text-zinc-300 bg-zinc-800/20 border border-white/[0.08] px-2 py-0.5 rounded-md">🎯 {p.assists}</span>}
                                        {p.saves > 0 && <span className="text-orange-400 bg-orange-500/10 border border-white/[0.08] px-2 py-0.5 rounded-md">🧤 {p.saves}</span>}
                                    </div>
                                </div>
                                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${getRatingColor(p.rating)} shadow-none`}>
                                    <span className="text-xs uppercase font-bold opacity-70 mb-0.5">RTG</span>
                                    <span className="text-lg font-semibold tracking-tight">{p.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Player Impact Dashboard */}
            <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 relative overflow-hidden group mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-border/50 gap-4">
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-lg font-semibold tracking-tight text-zinc-100">Match MVPs & Player Impact</h3>
                    </div>
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
                        {['Attack Threat', 'Defensive Action', 'Discipline'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveImpactTab(tab)}
                                className={`flex-1 md:flex-none px-4 py-2 md:py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all ${activeImpactTab === tab ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {matchLeadersTabs[activeImpactTab]?.map((category: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/40 border border-white/[0.04] p-5 rounded-2xl flex flex-col relative group/card hover:bg-zinc-900/60 transition-colors">
                            <h4 className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 mb-5 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> {category.categoryName}
                            </h4>
                            <div className="space-y-4 flex-1">
                                {category.players.map((player: any, pIdx: number) => {
                                    const isHome = player.teamId === homeTeamObj?.id;
                                    const teamColor = isHome ? '#0ea5e9' : '#f43f5e';
                                    const barWidth = Math.max(5, (player.value / category.maxValue) * 100);
                                    
                                    return (
                                    <div key={pIdx} className="flex items-center gap-4 group/row">
                                        <div className="w-5 font-black text-xs text-zinc-600 opacity-60 text-right shrink-0">
                                            #{pIdx + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black shrink-0 relative flex items-center justify-center text-zinc-500">
                                            <img src={isHome ? homeLogo : awayLogo} className="absolute inset-0 w-full h-full object-contain opacity-20 blur-[1px] scale-75" />
                                            <LineupPlayerImage playerId={player.id} playerName={player.name} className="absolute inset-0 z-10 w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1.5">
                                                <span className="text-sm font-bold text-zinc-200 truncate pr-2 group-hover/row:text-white transition-colors">{player.name}</span>
                                                <span className="text-lg font-black drop-shadow-md" style={{ color: teamColor }}>{player.value}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/[0.02]">
                                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${barWidth}%`, backgroundColor: teamColor, boxShadow: `0 0 10px ${teamColor}80` }} />
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {(!matchLeadersTabs[activeImpactTab] || matchLeadersTabs[activeImpactTab].length === 0) && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-50">
                            <Info className="w-10 h-10 mb-4 text-zinc-600" />
                            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">No {activeImpactTab} Data Available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Match Flow / Momentum Graph Section */}
            <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                    <TrendingUp className="w-6 h-6 text-zinc-300" />
                    <h3 className="text-lg font-medium font-semibold tracking-tight tracking-tight text-zinc-100 ">Match Flow & Momentum</h3>
                </div>
                <div className="flex justify-between items-center px-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
                        <span className="text-xs font-bold uppercase text-zinc-100 ">{homeTeamName} Pressure</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-zinc-100 ">{awayTeamName} Pressure</span>
                        <div className="w-3 h-3 bg-zinc-800 rounded-sm"></div>
                    </div>
                </div>
                <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={momentumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                                    <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                                    <stop offset="50%" stopColor="#f43f5e" stopOpacity={0.05}/>
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="minute" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}'`} />
                            <YAxis domain={[-100, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip 
                                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                                contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: 'white', fontWeight: 'bold' }}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}
                                formatter={(value: number, name: string, props: any) => [
                                    Math.abs(Math.round(value)) + (props.payload.isGoal ? ' (GOAL!)' : ''), 
                                    value > 0 ? homeTeamName : awayTeamName
                                ]}
                                labelFormatter={(label) => `${label} Minute`}
                            />
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                            
                            {/* Two separate Line layers so the lines never artificially cross the 0-axis */}
                            <Line type="linear" dataKey="home" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#fff', strokeWidth: 2, stroke: '#0ea5e9' }} />
                            <Line type="linear" dataKey="away" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#fff', strokeWidth: 2, stroke: '#f43f5e' }} />
                            
                            {/* Goal Icons */}
                            {momentumData.filter(d => d.isGoal).map((d, idx) => (
                                <ReferenceDot 
                                    key={`goal-${idx}`} 
                                    x={d.minute} 
                                    y={d.goalTeam === 'home' ? d.home : d.away} 
                                    r={5} 
                                    fill="#fff" 
                                    stroke={d.goalTeam === 'home' ? '#0ea5e9' : '#f43f5e'} 
                                    strokeWidth={3} 
                                    isFront={true}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Predictions & Pre-Match Analysis */}
            <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 relative overflow-hidden group">
                
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-lg font-medium font-semibold tracking-tight tracking-tight text-zinc-100 ">Predictive Analysis</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="flex flex-col justify-center">
                        <h4 className="text-[11px] uppercase tracking-[0.2em] text-zinc-100 font-bold mb-6 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Win Probability Gauge
                        </h4>
                        <div className="w-full h-48 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="colorHome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                                        </linearGradient>
                                        <linearGradient id="colorAway" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <Pie 
                                        data={[
                                            { name: homeTeamName, value: homeWinPct, fill: "url(#colorHome)" },
                                            { name: 'Draw', value: drawPct, fill: "#52525b" },
                                            { name: awayTeamName, value: awayWinPct, fill: "url(#colorAway)" }
                                        ]} 
                                        cx="50%" cy="100%" startAngle={180} endAngle={0} 
                                        innerRadius={100} outerRadius={140} paddingAngle={3} dataKey="value" cornerRadius={6}
                                        stroke="none"
                                    />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: 'white', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute bottom-0 left-0 w-full flex justify-between px-4">
                                <div className="text-center flex flex-col items-center">
                                    <p className="text-2xl font-black text-[#0ea5e9] mb-1.5">{homeWinPct.toFixed(1)}%</p>
                                    <FootballTeamLogo logo={homeLogo} name={homeTeamName} className="w-8 h-8 !w-8 !h-8 object-contain opacity-80 mb-2" />
                                    <p className="text-[10px] uppercase text-zinc-500 font-bold truncate max-w-[80px] leading-none">{homeTeamName}</p>
                                </div>
                                <div className="text-center pb-6">
                                    <p className="text-xl font-bold text-zinc-400">{drawPct.toFixed(1)}%</p>
                                    <p className="text-[10px] uppercase text-zinc-600 font-bold">Draw</p>
                                </div>
                                <div className="text-center flex flex-col items-center">
                                    <p className="text-2xl font-black text-[#f43f5e] mb-1.5">{awayWinPct.toFixed(1)}%</p>
                                    <FootballTeamLogo logo={awayLogo} name={awayTeamName} className="w-8 h-8 !w-8 !h-8 object-contain opacity-80 mb-2" />
                                    <p className="text-[10px] uppercase text-zinc-500 font-bold truncate max-w-[80px] leading-none">{awayTeamName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <h4 className="text-[11px] uppercase tracking-[0.2em] text-zinc-100 font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Comparative Strength
                        </h4>
                        <div className="w-full h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Form', home: 65, away: 45 },
                                    { name: 'Attack', home: 72, away: 58 },
                                    { name: 'Defense', home: 50, away: 80 }
                                ]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" hide={true} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' }} width={60} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                    <Bar dataKey="home" name={homeTeamName} fill="url(#colorHome)" radius={[0, 4, 4, 0]} barSize={12} />
                                    <Bar dataKey="away" name={awayTeamName} fill="url(#colorAway)" radius={[0, 4, 4, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Team Statistics Graphical Dashboard */}
            {statistics && (
                <div className="space-y-6">
                    {/* Top Row: Radar & Donut */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Radar Chart: Match Dominance */}
                        <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 relative overflow-hidden">
                            
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-semibold tracking-tight tracking-tight text-zinc-100 ">Dominance Footprint</h3>
                            </div>
                            <div className="w-full h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <defs>
                                            <radialGradient id="radarHome" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.6}/>
                                                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                            </radialGradient>
                                            <radialGradient id="radarAway" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6}/>
                                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                            </radialGradient>
                                        </defs>
                                        <PolarGrid stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name={homeTeamName} dataKey={homeTeamName} stroke="#0ea5e9" fill="url(#radarHome)" fillOpacity={1} strokeWidth={2.5} dot={{ r: 4, fill: "#0ea5e9" }} />
                                        <Radar name={awayTeamName} dataKey={awayTeamName} stroke="#f43f5e" fill="url(#radarAway)" fillOpacity={1} strokeWidth={2.5} dot={{ r: 4, fill: "#f43f5e" }} />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} iconType="circle" />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Right Column: Cinematic Possession Arch */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-center items-center flex-1 relative overflow-hidden group">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <h3 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-8 flex items-center gap-2 z-10 w-full justify-center">
                                    <Crosshair className="w-4 h-4 text-purple-400" /> Battle for Possession
                                </h3>

                                <div className="relative w-full max-w-[400px] h-[200px] mb-2 mx-auto">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <defs>
                                                <filter id="archGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <Pie
                                                data={[
                                                    { name: homeTeamName, value: homePossession, fill: "#0ea5e9" },
                                                    { name: awayTeamName, value: awayPossession, fill: "#f43f5e" }
                                                ]}
                                                cx="50%"
                                                cy="100%" // Center at bottom for half circle
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={140}
                                                outerRadius={175}
                                                stroke="rgba(9,9,11,1)"
                                                strokeWidth={4}
                                                dataKey="value"
                                                animationDuration={1500}
                                                paddingAngle={2}
                                                cornerRadius={4}
                                                filter="url(#archGlow)"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    {/* Cinematic Typography Overlaid inside the Arch Hole */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[260px] flex justify-between items-end z-10">
                                        {/* Home Text (Left) */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl md:text-4xl font-black tracking-tighter leading-none" style={{ color: '#0ea5e9', textShadow: '0 0 25px rgba(14,165,233,0.6)' }}>
                                                {homePossession}<span className="text-lg md:text-xl text-[#0ea5e9]/70">%</span>
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-3">
                                                <FootballTeamLogo logo={homeLogo} name={homeTeamName} className="w-3.5 h-3.5 !w-3.5 !h-3.5 object-contain opacity-80" />
                                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest opacity-80">{homeTeamName}</span>
                                            </div>
                                        </div>

                                        {/* Center VS Indicator */}
                                        <div className="flex flex-col items-center justify-end pb-3 opacity-50 px-2 shrink-0">
                                            <div className="w-[1.5px] h-12 bg-gradient-to-b from-transparent via-white/60 to-transparent mb-1 rounded-full"></div>
                                            <span className="text-[9px] font-black tracking-[0.4em] text-zinc-400 uppercase ml-1">VS</span>
                                        </div>

                                        {/* Away Text (Right) */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl md:text-4xl font-black tracking-tighter leading-none" style={{ color: '#f43f5e', textShadow: '0 0 25px rgba(244,63,94,0.6)' }}>
                                                {awayPossession}<span className="text-lg md:text-xl text-[#f43f5e]/70">%</span>
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-3">
                                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest opacity-80">{awayTeamName}</span>
                                                <FootballTeamLogo logo={awayLogo} name={awayTeamName} className="w-3.5 h-3.5 !w-3.5 !h-3.5 object-contain opacity-80" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metric Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Offensive Output */}
                        <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6">
                            <h4 className="text-sm font-semibold tracking-tight text-zinc-100 mb-6 flex items-center gap-2">
                                <Swords className="w-4 h-4 text-orange-400" /> Offensive Output
                            </h4>
                            <div className="w-full flex flex-col gap-3">
                                {offensiveData.map((stat: any, idx: number) => (
                                    <SlantClashRow 
                                        key={idx} 
                                        label={stat.name} 
                                        homeValue={stat[homeTeamName] || 0} 
                                        awayValue={stat[awayTeamName] || 0} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Playmaking & Distribution */}
                        <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6">
                            <h4 className="text-sm font-semibold tracking-tight text-zinc-100 mb-6 flex items-center gap-2">
                                <Map className="w-4 h-4 text-zinc-300" /> Playmaking
                            </h4>
                            <div className="w-full flex flex-col gap-3">
                                {distributionData.map((stat: any, idx: number) => (
                                    <SlantClashRow 
                                        key={idx} 
                                        label={stat.name} 
                                        homeValue={stat[homeTeamName] || 0} 
                                        awayValue={stat[awayTeamName] || 0} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Defensive Actions */}
                        <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6">
                            <h4 className="text-sm font-semibold tracking-tight text-zinc-100 mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-400" /> Defensive Actions
                            </h4>
                            <div className="w-full flex flex-col gap-3">
                                {defensiveData.map((stat: any, idx: number) => (
                                    <SlantClashRow 
                                        key={idx} 
                                        label={stat.name} 
                                        homeValue={stat[homeTeamName] || 0} 
                                        awayValue={stat[awayTeamName] || 0} 
                                    />
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Tactical DNA Matrix */}
                    {allStatsCompare.length > 0 && (() => {
                        const getStat = (label: string, team: 'home' | 'away'): number => {
                            const stat = allStatsCompare.find(s => s.label.toLowerCase().includes(label.toLowerCase()));
                            if (!stat) return 0;
                            return team === 'home' ? (stat.homeNum || 0) : (stat.awayNum || 0);
                        };

                        const homePoss = getStat('possession', 'home');
                        const awayPoss = getStat('possession', 'away');
                        
                        // Fix for pass completion which might be decimal or percentage
                        let homePassAccRaw = getStat('pass completion %', 'home');
                        let awayPassAccRaw = getStat('pass completion %', 'away');
                        const homePassAcc = homePassAccRaw <= 1 ? homePassAccRaw * 100 : homePassAccRaw;
                        const awayPassAcc = awayPassAccRaw <= 1 ? awayPassAccRaw * 100 : awayPassAccRaw;
                        
                        const homeAttackRaw = getStat('shots', 'home') + getStat('corner kicks', 'home') * 2 + getStat('crosses', 'home');
                        const awayAttackRaw = getStat('shots', 'away') + getStat('corner kicks', 'away') * 2 + getStat('crosses', 'away');
                        const maxAttack = Math.max(homeAttackRaw, awayAttackRaw, 1);
                        
                        const homeDefRaw = getStat('saves', 'home') * 3 + getStat('clearances', 'home');
                        const awayDefRaw = getStat('saves', 'away') * 3 + getStat('clearances', 'away');
                        const maxDef = Math.max(homeDefRaw, awayDefRaw, 1);

                        const homeAggRaw = getStat('fouls', 'home') + getStat('yellow cards', 'home') * 3 + getStat('red cards', 'home') * 10;
                        const awayAggRaw = getStat('fouls', 'away') + getStat('yellow cards', 'away') * 3 + getStat('red cards', 'away') * 10;
                        const maxAgg = Math.max(homeAggRaw, awayAggRaw, 1);

                        const tacticalDNAData = [
                            {
                                pillar: "Control",
                                home: Math.min(((homePoss + homePassAcc) / 2) || 50, 100),
                                away: Math.min(((awayPoss + awayPassAcc) / 2) || 50, 100),
                            },
                            {
                                pillar: "Attack",
                                home: Math.min((homeAttackRaw / maxAttack) * 100 || 50, 100),
                                away: Math.min((awayAttackRaw / maxAttack) * 100 || 50, 100),
                            },
                            {
                                pillar: "Defense",
                                home: Math.min((homeDefRaw / maxDef) * 100 || 50, 100),
                                away: Math.min((awayDefRaw / maxDef) * 100 || 50, 100),
                            },
                            {
                                pillar: "Aggression",
                                home: Math.min((homeAggRaw / maxAgg) * 100 || 50, 100),
                                away: Math.min((awayAggRaw / maxAgg) * 100 || 50, 100),
                            }
                        ];

                        const getIdentity = (teamData: { pillar: string, val: number }[]) => {
                            const sorted = [...teamData].sort((a, b) => b.val - a.val);
                            const top = sorted[0];
                            if (top.val < 20) return "Passive";
                            if (top.pillar === "Control") return "Possession Dominance";
                            if (top.pillar === "Attack") return "All-Out Attack";
                            if (top.pillar === "Defense") return "Resilient Deep Block";
                            if (top.pillar === "Aggression") return "High Pressing / Physical";
                            return "Balanced Approach";
                        };

                        const homeIdentity = getIdentity(tacticalDNAData.map(d => ({ pillar: d.pillar, val: d.home })));
                        const awayIdentity = getIdentity(tacticalDNAData.map(d => ({ pillar: d.pillar, val: d.away })));

                        return (
                            <div className="bg-[#09090b] border border-white/[0.08] rounded-2xl p-6 md:p-8 mt-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-border/50 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-6 h-6 text-indigo-400" />
                                            <h3 className="text-xl font-black tracking-tight text-zinc-100">Tactical DNA Matrix</h3>
                                        </div>
                                        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                                            This algorithm dynamically analyzes 14 separate match statistics across four key tactical pillars (Control, Attack, Defense, Aggression) to generate a unique playstyle profile for each team.
                                        </p>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest hidden md:block text-right">Algorithmic<br/>Playstyle Analysis</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Home DNA */}
                                    <div className="flex flex-col xl:flex-row items-center gap-6 bg-zinc-900/40 border border-white/[0.04] rounded-xl p-6 relative group">
                                        <div className="absolute inset-0 bg-[#0ea5e9]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                        
                                        {/* Radar Left Side */}
                                        <div className="flex flex-col items-center w-full xl:w-[55%] shrink-0">
                                            <div className="flex items-center gap-3 mb-2 z-10">
                                                <FootballTeamLogo logo={homeLogo} name={homeTeamName} className="w-6 h-6 !w-6 !h-6 object-contain" />
                                                <span className="text-lg font-black tracking-tighter uppercase text-zinc-100">{homeTeamName}</span>
                                            </div>
                                            <div className="px-4 py-1 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 mb-2 z-10">
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#0ea5e9] shadow-[0_0_10px_rgba(14,165,233,0.5)]">{homeIdentity}</span>
                                            </div>
                                            
                                            <div className="w-full h-[220px] z-10">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={tacticalDNAData}>
                                                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                                        <PolarAngleAxis dataKey="pillar" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold' }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar name={homeTeamName} dataKey="home" stroke="#0ea5e9" strokeWidth={3} fill="#0ea5e9" fillOpacity={0.25} filter="url(#glow)" />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Breakdown Right Side */}
                                        <div className="flex flex-col w-full xl:w-[45%] gap-4 z-10 border-t xl:border-t-0 xl:border-l border-white/5 pt-4 xl:pt-0 xl:pl-6">
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Pillar Breakdown (out of 100)</span>
                                            {tacticalDNAData.map((data, idx) => (
                                                <div key={idx} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{data.pillar}</span>
                                                        <span className="text-sm font-black text-[#0ea5e9]">{Math.round(data.home)}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.02]">
                                                        <div className="h-full bg-[#0ea5e9] rounded-full shadow-[0_0_10px_rgba(14,165,233,0.8)]" style={{ width: `${Math.round(data.home)}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Away DNA */}
                                    <div className="flex flex-col xl:flex-row items-center gap-6 bg-zinc-900/40 border border-white/[0.04] rounded-xl p-6 relative group">
                                        <div className="absolute inset-0 bg-[#f43f5e]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                        
                                        {/* Radar Left Side */}
                                        <div className="flex flex-col items-center w-full xl:w-[55%] shrink-0">
                                            <div className="flex items-center gap-3 mb-2 z-10">
                                                <FootballTeamLogo logo={awayLogo} name={awayTeamName} className="w-6 h-6 !w-6 !h-6 object-contain" />
                                                <span className="text-lg font-black tracking-tighter uppercase text-zinc-100">{awayTeamName}</span>
                                            </div>
                                            <div className="px-4 py-1 rounded-full bg-[#f43f5e]/10 border border-[#f43f5e]/20 mb-2 z-10">
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#f43f5e] shadow-[0_0_10px_rgba(244,63,94,0.5)]">{awayIdentity}</span>
                                            </div>
                                            
                                            <div className="w-full h-[220px] z-10">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={tacticalDNAData}>
                                                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                                        <PolarAngleAxis dataKey="pillar" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'bold' }} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Radar name={awayTeamName} dataKey="away" stroke="#f43f5e" strokeWidth={3} fill="#f43f5e" fillOpacity={0.25} filter="url(#glow)" />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Breakdown Right Side */}
                                        <div className="flex flex-col w-full xl:w-[45%] gap-4 z-10 border-t xl:border-t-0 xl:border-l border-white/5 pt-4 xl:pt-0 xl:pl-6">
                                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Pillar Breakdown (out of 100)</span>
                                            {tacticalDNAData.map((data, idx) => (
                                                <div key={idx} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{data.pillar}</span>
                                                        <span className="text-sm font-black text-[#f43f5e]">{Math.round(data.away)}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.02]">
                                                        <div className="h-full bg-[#f43f5e] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.8)]" style={{ width: `${Math.round(data.away)}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Methodology Explanation */}
                                <div className="mt-8 pt-6 border-t border-white/[0.05]">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" /> Identity Algorithm Breakdown
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/[0.02]">
                                            <h5 className="text-[10px] font-black uppercase tracking-wider text-[#0ea5e9] mb-1.5">Possession Dominance</h5>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed">Assigned when <strong className="text-zinc-200">Control</strong> is highest. Averages Ball Possession and Pass Completion percentages.</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/[0.02]">
                                            <h5 className="text-[10px] font-black uppercase tracking-wider text-orange-400 mb-1.5">All-Out Attack</h5>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed">Assigned when <strong className="text-zinc-200">Attack</strong> is highest. Weights Shots, Crosses, and heavily values Corner Kicks.</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/[0.02]">
                                            <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1.5">Resilient Deep Block</h5>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed">Assigned when <strong className="text-zinc-200">Defense</strong> is highest. Weights Clearances and heavily values Goalkeeper Saves.</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/[0.02]">
                                            <h5 className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1.5">High Pressing / Physical</h5>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed">Assigned when <strong className="text-zinc-200">Aggression</strong> is highest. Calculated using a penalty formula for Fouls and Cards.</p>
                                        </div>
                                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-white/[0.02]">
                                            <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5">Passive</h5>
                                            <p className="text-[11px] text-zinc-400 leading-relaxed">Fallback identity if a team's highest pillar score fails to reach the 20/100 threshold.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
