import React from 'react';
import { Activity, Shield, Swords, Target, TrendingUp, AlertTriangle, Crosshair, Map, Star } from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { LineupPlayerImage } from './LineupPlayerImage';

interface PerformanceLabTabProps {
    espnMatchId: string;
    matchDate: string;
    homeTeamName?: string;
    awayTeamName?: string;
    matchStatus: string;
    matchData: any; 
}

export function PerformanceLabTab({ matchStatus, matchData }: PerformanceLabTabProps) {
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

    // --- TOP PERFORMERS (MAN OF THE MATCH) ALGORITHM ---
    let topPerformers: any[] = [];
    if (rosters && rosters.length === 2) {
        const calculateRating = (pData: any) => {
            const statsMap: Record<string, string> = {};
            pData.stats?.forEach((s: any) => { statsMap[s.name] = s.value; });
            
            let rating = 6.0; 
            rating += (parseInt(statsMap['goals'] || '0') * 1.5) + (parseInt(statsMap['assists'] || '0') * 1.0) 
                    + (parseInt(statsMap['shots'] || '0') * 0.2) + (parseInt(statsMap['saves'] || '0') * 0.5) 
                    - (parseInt(statsMap['foulsCommitted'] || '0') * 0.1) - (parseInt(statsMap['redCards'] || '0') * 2.0);
            if (pData.starter) rating += 0.5;
            return Math.min(Math.max(rating, 3.0), 10.0);
        };

        const processTeamRoster = (teamRoster: any) => {
            const players = teamRoster.roster.map((pData: any) => ({
                id: pData.athlete.id,
                name: pData.athlete.shortName || pData.athlete.displayName,
                position: pData.athlete.position?.abbreviation || 'SUB',
                rating: calculateRating(pData),
                goals: parseInt(pData.stats?.find((s:any)=>s.name==='goals')?.value || '0'),
                assists: parseInt(pData.stats?.find((s:any)=>s.name==='assists')?.value || '0'),
                saves: parseInt(pData.stats?.find((s:any)=>s.name==='saves')?.value || '0'),
                team: teamRoster.team
            }));
            return players.sort((a: any, b: any) => b.rating - a.rating)[0]; // Return the top player
        };

        const homeTop = processTeamRoster(rosters.find((r:any) => r.team.id === homeTeamObj.id) || rosters[0]);
        const awayTop = processTeamRoster(rosters.find((r:any) => r.team.id === awayTeamObj.id) || rosters[1]);
        if (homeTop && awayTop) topPerformers = [homeTop, awayTop];
    }

    // --- RENDER HELPERS ---
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0f172a]/90 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[150px]">
                    <p className="font-bold text-xs uppercase text-white/70 mb-3 border-b border-white/10 pb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm font-semibold mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-white/90">{entry.name}</span>
                            </div>
                            <span className="text-white font-black">{entry.value}</span>
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
                <div className="flex justify-between text-[11px] font-bold mb-2 uppercase tracking-wider text-white/70">
                    <span className="text-blue-400">{homeVal}</span>
                    <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full">{label}</span>
                    <span className="text-red-400">{awayVal}</span>
                </div>
                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${homePct}%` }}></div>
                    <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${awayPct}%` }}></div>
                </div>
            </div>
        );
    };

    const getRatingColor = (val: number) => {
        if (val >= 8.0) return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (val >= 7.0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (val >= 6.0) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-white/70 bg-white/5 border-white/10';
    };

    return (
        <div className="space-y-6">
            
            {/* Top Performers (Player of the Match) Section */}
            {topPerformers.length === 2 && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-500/20">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        <h3 className="text-xl font-black uppercase tracking-wider text-amber-50">Top Performers</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {topPerformers.map((p: any, idx: number) => (
                            <div key={p.id} className="flex items-center gap-5 bg-black/20 p-4 rounded-2xl border border-white/5 transition-all hover:bg-black/40">
                                <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-amber-500/30 flex items-center justify-center overflow-hidden shrink-0 relative shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                    <LineupPlayerImage playerId={p.id} playerName={p.name} fallbackInitials={p.position} className="absolute inset-0" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <img src={idx === 0 ? homeLogo : awayLogo} alt="Team" className="w-4 h-4 object-contain" />
                                        <p className="font-black text-lg text-white truncate">{p.name}</p>
                                    </div>
                                    <p className="text-[11px] text-amber-200/60 uppercase font-bold tracking-widest mb-2">{p.position} • Key Influencer</p>
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                        {p.goals > 0 && <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">⚽ {p.goals}</span>}
                                        {p.assists > 0 && <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">🎯 {p.assists}</span>}
                                        {p.saves > 0 && <span className="text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">🧤 {p.saves}</span>}
                                    </div>
                                </div>
                                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${getRatingColor(p.rating)} shadow-lg`}>
                                    <span className="text-xs uppercase font-bold opacity-70 mb-0.5">RTG</span>
                                    <span className="text-lg font-black">{p.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Predictions & Pre-Match Analysis */}
            <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 rounded-3xl p-6 md:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-black uppercase tracking-wider text-white">Predictive Analysis</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                        <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-bold mb-6 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Win Probability Dashboard
                        </h4>
                        <div className="flex items-stretch justify-between gap-3 h-32">
                            <div className="flex flex-col justify-center items-center text-center flex-1 bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 p-4 rounded-2xl transition-all hover:bg-blue-500/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                <p className="text-4xl font-black text-blue-400 mb-2">{homeWinPct.toFixed(1)}%</p>
                                <div className="flex items-center justify-center gap-1.5 px-2">
                                    <img src={homeLogo} alt={homeTeamName} className="w-3.5 h-3.5 object-contain" />
                                    <p className="text-[10px] uppercase font-bold text-white/50 truncate max-w-[80px]">{homeTeamName}</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-center text-center flex-1 bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-4 rounded-2xl transition-all hover:bg-white/10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                                <p className="text-4xl font-black text-white/70 mb-2">{drawPct.toFixed(1)}%</p>
                                <p className="text-[10px] uppercase font-bold text-white/50 truncate w-full px-2">Draw</p>
                            </div>
                            <div className="flex flex-col justify-center items-center text-center flex-1 bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 p-4 rounded-2xl transition-all hover:bg-red-500/20 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                <p className="text-4xl font-black text-red-400 mb-2">{awayWinPct.toFixed(1)}%</p>
                                <div className="flex items-center justify-center gap-1.5 px-2">
                                    <img src={awayLogo} alt={awayTeamName} className="w-3.5 h-3.5 object-contain" />
                                    <p className="text-[10px] uppercase font-bold text-white/50 truncate max-w-[80px]">{awayTeamName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Team Momentum Comparison
                        </h4>
                        {renderProgressBar("Overall Form", "65%", "45%")}
                        {renderProgressBar("Attacking Power", "72%", "58%")}
                        {renderProgressBar("Defensive Solidity", "50%", "80%")}
                    </div>
                </div>
            </div>

            {/* Advanced Team Statistics Graphical Dashboard */}
            {statistics && (
                <div className="space-y-6">
                    {/* Top Row: Radar & Donut */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Radar Chart: Match Dominance */}
                        <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-black uppercase tracking-wider text-white">Dominance Footprint</h3>
                            </div>
                            <div className="w-full h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name={homeTeamName} dataKey={homeTeamName} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={2.5} />
                                        <Radar name={awayTeamName} dataKey={awayTeamName} stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} strokeWidth={2.5} />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 'bold' }} iconType="circle" />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Right Column: Donut & Small Stats */}
                        <div className="flex flex-col gap-6">
                            {/* Possession Donut Chart */}
                            <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 rounded-3xl p-6 flex items-center justify-between flex-1">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                                        <Crosshair className="w-5 h-5 text-purple-400" /> Battle for Possession
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                                            <div className="w-4 h-4 rounded-sm bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <img src={homeLogo} alt={homeTeamName} className="w-3.5 h-3.5 object-contain" />
                                                    <p className="text-[11px] text-blue-300 uppercase font-bold truncate">{homeTeamName}</p>
                                                </div>
                                                <span className="text-2xl font-black text-white">{homePossession}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                            <div className="w-4 h-4 rounded-sm bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <img src={awayLogo} alt={awayTeamName} className="w-3.5 h-3.5 object-contain" />
                                                    <p className="text-[11px] text-red-300 uppercase font-bold truncate">{awayTeamName}</p>
                                                </div>
                                                <span className="text-2xl font-black text-white">{awayPossession}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-[180px] h-[180px] shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                stroke="none"
                                                dataKey="value"
                                                animationDuration={1500}
                                                paddingAngle={5}
                                                cornerRadius={4}
                                            >
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#ef4444" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metric Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Offensive Output */}
                        <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 rounded-3xl p-6">
                            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                                <Swords className="w-4 h-4 text-orange-400" /> Offensive Output
                            </h4>
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={offensiveData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                                        <Bar dataKey={homeTeamName} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        <Bar dataKey={awayTeamName} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Playmaking & Distribution */}
                        <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 rounded-3xl p-6">
                            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                                <Map className="w-4 h-4 text-blue-400" /> Playmaking
                            </h4>
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                                        <Bar dataKey={homeTeamName} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        <Bar dataKey={awayTeamName} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Defensive Actions */}
                        <div className="bg-gradient-to-br from-secondary/40 to-secondary/10 border border-border/50 rounded-3xl p-6">
                            <h4 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-400" /> Defensive Actions
                            </h4>
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={defensiveData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                                        <Bar dataKey={homeTeamName} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        <Bar dataKey={awayTeamName} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
