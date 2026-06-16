import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    RadialBarChart, RadialBar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface CrossFormatAnalysisProps {
    stats: {
        test: any;
        odi: any;
        t20i: any;
        ipl: any;
    }
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0B1120]/90 backdrop-blur-xl border border-blue-500/20 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">{label || payload[0]?.payload?.name || 'Metric'}</p>
                {payload.map((entry: any, index: number) => {
                    // Ignore background track entries in tooltip
                    if (entry.dataKey === 'bgTrack') return null;
                    return (
                        <div key={index} className="flex items-center gap-3 text-base font-bold text-white mb-1 last:mb-0">
                            <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: entry.color || entry.payload?.fill || '#fff', backgroundColor: entry.color || entry.payload?.fill || '#fff' }}></div>
                            <span className="text-slate-300 font-medium">{entry.name}:</span>
                            <span style={{ color: entry.color || entry.payload?.fill || '#fff' }}>{entry.value}</span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

// Custom Gauge for Strike Rate
const GaugeChart = ({ format, value, color, max = 200 }: { format: string, value: number, color: string, max?: number }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const data = [
        { name: 'SR', value: percentage },
        { name: 'Empty', value: 100 - percentage }
    ];
    
    return (
        <div className="flex flex-col items-center justify-center relative h-full w-full py-4">
            <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                    <defs>
                        <filter id={`glow-${format}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={38}
                        outerRadius={48}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={20}
                    >
                        <Cell key="cell-0" fill={color} filter={`url(#glow-${format})`} />
                        <Cell key="cell-1" fill="rgba(255,255,255,0.05)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center top-1/2 mt-1">
                <span className="text-2xl font-black text-white drop-shadow-md">{value > 0 ? value.toFixed(1) : '-'}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-1 font-bold">{format}</span>
            </div>
        </div>
    );
};

export function CrossFormatAnalysis({ stats }: CrossFormatAnalysisProps) {
    const safeStats = stats || {};
    
    const rawData = [
        { name: 'Test', runs: parseInt(safeStats.test?.runs) || 0, avg: parseFloat(safeStats.test?.average) || 0, sr: parseFloat(safeStats.test?.strikeRate) || 0, fill: '#ef4444' },
        { name: 'ODI', runs: parseInt(safeStats.odi?.runs) || 0, avg: parseFloat(safeStats.odi?.average) || 0, sr: parseFloat(safeStats.odi?.strikeRate) || 0, fill: '#3b82f6' },
        { name: 'T20I', runs: parseInt(safeStats.t20i?.runs) || 0, avg: parseFloat(safeStats.t20i?.average) || 0, sr: parseFloat(safeStats.t20i?.strikeRate) || 0, fill: '#10b981' },
    ];
    
    const data = rawData.filter(d => d.runs > 0 || d.avg > 0 || d.sr > 0);
    const maxRuns = Math.max(...data.map(d => d.runs), 10000);

    // Runs data with background track
    const runsData = data.map(d => ({
        ...d,
        bgTrack: maxRuns
    }));

    // Boundary data
    const odiFours = parseInt(safeStats.odi?.fours) || 0;
    const odiSixes = parseInt(safeStats.odi?.sixes) || 0;
    const odiTotalRuns = parseInt(safeStats.odi?.runs) || 0;
    const boundaryRuns = (odiFours * 4) + (odiSixes * 6);
    const nonBoundaryRuns = Math.max(0, odiTotalRuns - boundaryRuns);

    const pieData = [
        { name: 'Boundaries', value: boundaryRuns, fill: 'url(#donutGrad1)' },
        { name: 'Running', value: nonBoundaryRuns, fill: 'url(#donutGrad2)' },
    ];

    return (
        <div className="relative mt-8 p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-[#0F172A] to-[#0B1120] border border-blue-500/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Ultra Premium Background Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none mix-blend-screen"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Performance Matrix</h2>
                    <p className="text-slate-400 text-sm mt-2 font-medium tracking-wide uppercase">Cross-format visual analysis</p>
                </div>
                <div className="mt-4 sm:mt-0 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Live Data</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                {/* 1. Runs Progress Tracker */}
                <div className="bg-[#141A25]/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Career Runs</h4>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={runsData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barSize={12}>
                                <XAxis type="number" hide domain={[0, maxRuns]} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontSize: 13, fontWeight: 700 }} width={60} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 8 }} />
                                {/* Background Track Bar */}
                                <Bar dataKey="bgTrack" fill="rgba(255,255,255,0.03)" radius={[10, 10, 10, 10]} />
                                {/* Actual Value Bar overlaid */}
                                <Bar dataKey="runs" radius={[10, 10, 10, 10]} style={{ transform: 'translateY(-12px)' }}>
                                    {runsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0 0 6px ${entry.fill}80)` }} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Average Radial Rings */}
                <div className="bg-[#141A25]/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-bl from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 z-10 relative">Batting Average</h4>
                    <div className="h-60 relative flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                                cx="45%" cy="50%" innerRadius="30%" outerRadius="100%" 
                                barSize={14} data={data} startAngle={90} endAngle={-270}
                            >
                                <RadialBar
                                    background={{ fill: 'rgba(255,255,255,0.03)' }}
                                    dataKey="avg"
                                    cornerRadius={10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    iconSize={12} 
                                    layout="vertical" 
                                    verticalAlign="middle" 
                                    align="right"
                                    wrapperStyle={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', opacity: 0.8 }}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Strike Rate Dashboards */}
                <div className="bg-[#141A25]/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group xl:col-span-2 hover:border-blue-500/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Strike Rate Telemetry</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-44">
                        {data.map((d, i) => (
                            <div key={i} className="bg-[#0B1120]/60 rounded-3xl border border-slate-800/50 relative overflow-hidden shadow-inner flex items-center justify-center">
                                <GaugeChart format={d.name} value={d.sr} color={d.fill} max={d.name === 'Test' ? 100 : 200} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Run Distribution Hologram */}
                <div className="bg-[#141A25]/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group xl:col-span-2 hover:border-blue-500/30 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">ODI Shot Distribution</h4>
                    </div>
                    
                    {odiTotalRuns > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="h-[280px] w-full relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="donutGrad1" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#d946ef" />
                                            </linearGradient>
                                            <linearGradient id="donutGrad2" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#0ea5e9" />
                                            </linearGradient>
                                            <filter id="neonShadow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#3b82f6" floodOpacity="0.1" />
                                            </filter>
                                        </defs>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={85}
                                            outerRadius={120}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={20}
                                            filter="url(#neonShadow)"
                                        >
                                            <Cell key="cell-0" fill="url(#donutGrad1)" />
                                            <Cell key="cell-1" fill="url(#donutGrad2)" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                
                                {/* Futuristic Center Display */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="w-36 h-36 rounded-full border border-blue-500/10 flex flex-col items-center justify-center backdrop-blur-sm bg-[#0B1120]/40 shadow-[inset_0_0_30px_rgba(37,99,235,0.1)]">
                                        <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{odiTotalRuns}</span>
                                        <span className="text-[9px] uppercase tracking-[0.3em] text-slate-400 font-bold mt-2">Total Runs</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Glass Legend (Now positioned safely below the chart) */}
                            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 bg-[#0B1120]/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-[90%] sm:w-auto mt-4 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#d946ef] shadow-[0_0_10px_#8b5cf6]"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Boundaries</span>
                                        <span className="text-sm font-black text-white">{boundaryRuns} <span className="text-xs text-slate-400 font-medium">({Math.round((boundaryRuns/odiTotalRuns)*100)}%)</span></span>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-slate-800"></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#0ea5e9] shadow-[0_0_10px_#3b82f6]"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Running</span>
                                        <span className="text-sm font-black text-white">{nonBoundaryRuns} <span className="text-xs text-slate-400 font-medium">({Math.round((nonBoundaryRuns/odiTotalRuns)*100)}%)</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm font-medium uppercase tracking-widest">
                            No telemetry available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

