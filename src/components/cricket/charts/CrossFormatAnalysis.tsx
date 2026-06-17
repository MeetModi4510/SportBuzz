import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    RadialBarChart, RadialBar, PieChart, Pie, Cell, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface CrossFormatAnalysisProps {
    stats: {
        test: any;
        odi: any;
        t20i: any;
        ipl: any;
    };
    skillMode?: 'batting' | 'bowling';
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Ignore numeric labels (array indices) which Recharts uses by default for Pie/Radial charts
        const isNumericLabel = !isNaN(Number(label)) && label !== '';
        const title = isNumericLabel ? payload[0]?.payload?.name : (label || payload[0]?.payload?.name || 'Metric');

        return (
            <div className="bg-[#09090b] border border-white/[0.1] p-4 rounded-xl shadow-2xl z-50">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">{title}</p>
                {payload.map((entry: any, index: number) => {
                    if (entry.dataKey === 'bgTrack') return null;
                    return (
                        <div key={index} className="flex items-center gap-3 text-sm font-medium text-white mb-2 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill || '#fff' }}></div>
                            <span className="text-zinc-400">{entry.name}:</span>
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
                    <Pie
                        data={data}
                        cx="50%"
                        cy="70%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={38}
                        outerRadius={42}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                    >
                        <Cell key="cell-0" fill={color} />
                        <Cell key="cell-1" fill="rgba(255,255,255,0.03)" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center top-1/2 mt-1">
                <span className="text-xl font-bold text-white">{value > 0 ? value.toFixed(1) : '-'}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1 font-bold">{format}</span>
            </div>
        </div>
    );
};

export function CrossFormatAnalysis({ stats, skillMode = 'batting' }: CrossFormatAnalysisProps) {
    const safeStats = stats || {};
    const isBowling = skillMode === 'bowling';

    const titleRuns = isBowling ? 'RUNS CONCEDED' : 'CAREER RUNS';
    const titleAvg = isBowling ? 'BOWLING AVERAGE' : 'BATTING AVERAGE';
    const titleSR = isBowling ? 'BOWLING STRIKE RATE' : 'STRIKE RATE TELEMETRY';
    
    const rawData = [
        { name: 'Test', runs: parseInt(safeStats.test?.runs) || 0, avg: parseFloat(safeStats.test?.average) || 0, sr: parseFloat(safeStats.test?.strikeRate) || 0, fill: '#eab308', fifties: parseInt(safeStats.test?.fifties) || 0, hundreds: parseInt(safeStats.test?.hundreds) || 0 }, // amber-500
        { name: 'ODI', runs: parseInt(safeStats.odi?.runs) || 0, avg: parseFloat(safeStats.odi?.average) || 0, sr: parseFloat(safeStats.odi?.strikeRate) || 0, fill: '#3b82f6', fifties: parseInt(safeStats.odi?.fifties) || 0, hundreds: parseInt(safeStats.odi?.hundreds) || 0 }, // blue-500
        { name: 'T20I', runs: parseInt(safeStats.t20i?.runs) || 0, avg: parseFloat(safeStats.t20i?.average) || 0, sr: parseFloat(safeStats.t20i?.strikeRate) || 0, fill: '#ec4899', fifties: parseInt(safeStats.t20i?.fifties) || 0, hundreds: parseInt(safeStats.t20i?.hundreds) || 0 }, // pink-500
    ];
    
    const data = rawData.filter(d => d.runs > 0 || d.avg > 0 || d.sr > 0);
    const maxRuns = Math.max(...data.map(d => d.runs), 10000);

    const runsData = data.map(d => ({
        ...d,
        bgTrack: maxRuns
    }));

    const formatPieData = data.map(d => ({
        name: d.name,
        value: d.runs,
        fill: d.fill
    })).filter(d => d.value > 0);
    
    const totalRunsAllFormats = formatPieData.reduce((sum, d) => sum + d.value, 0);

    const hasMilestones = data.some(d => d.fifties > 0 || d.hundreds > 0);

    return (
        <div className="relative mt-8 pt-8 border-t border-white/[0.05]">
            <div className="relative z-10 flex flex-col mb-8">
                <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight">Performance Matrix</h2>
                <p className="text-zinc-500 text-[10px] mt-1 font-bold tracking-[0.2em] uppercase">Cross-Format Visual Analysis</p>
            </div>

            {/* Premium Gradients for Recharts */}
            <svg style={{ height: 0 }}>
                <defs>
                    <linearGradient id="colorTest" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ca8a04" />
                        <stop offset="100%" stopColor="#fef08a" />
                    </linearGradient>
                    <linearGradient id="colorODI" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#93c5fd" />
                    </linearGradient>
                    <linearGradient id="colorT20I" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#db2777" />
                        <stop offset="100%" stopColor="#fbcfe8" />
                    </linearGradient>
                    <linearGradient id="colorIPL" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#c4b5fd" />
                    </linearGradient>
                    <linearGradient id="colorBoundaries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#c4b5fd" />
                    </linearGradient>
                    <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#bae6fd" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 relative z-10">
                {/* 1. Career Runs Distribution (Donut PieChart) */}
                <div className="xl:col-span-1 bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h4 className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] mb-4 z-10 relative">{titleRuns}</h4>
                    <div className="h-64 relative flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={data} 
                                    cx="50%" cy="50%" 
                                    innerRadius="50%" outerRadius="80%" 
                                    paddingAngle={4} 
                                    dataKey="runs" 
                                    stroke="none" 
                                    cornerRadius={8}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`url(#color${entry.name})`} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                            <span className="text-3xl font-bold text-white tracking-tight">{data.reduce((sum, d) => sum + d.runs, 0).toLocaleString()}</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Total</span>
                        </div>
                    </div>
                </div>

                {/* 2. Average Radial Rings */}
                <div className="xl:col-span-1 bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <h4 className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] mb-4 z-10 relative">{titleAvg}</h4>
                    <div className="h-64 relative flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="100%" barSize={16} data={data} startAngle={90} endAngle={-270}>
                                <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} dataKey="avg" cornerRadius={8}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`url(#color${entry.name})`} />
                                    ))}
                                </RadialBar>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none bg-black/40 p-2 rounded-full backdrop-blur-sm">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">AVG</span>
                        </div>
                    </div>
                </div>

                {/* 3. Strike Rate Dashboards */}
                <div className="xl:col-span-2 bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden shadow-lg">
                    <h4 className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] mb-6">{titleSR}</h4>
                    <div className="flex flex-col sm:flex-row justify-around gap-6 h-60">
                        {data.map((d, i) => (
                            <div key={i} className="flex-1 bg-white/[0.01] rounded-2xl border border-white/[0.02] flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="h-32 w-full mb-4">
                                    <GaugeChart format={d.name} value={d.sr} color={`url(#color${d.name})`} max={d.name === 'Test' ? 100 : 200} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Milestone Frequency (RadarChart) */}
                {hasMilestones && (
                    <div className="xl:col-span-1 bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden group shadow-lg flex flex-col">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <h4 className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] mb-4 z-10 relative">Milestones (50s & 100s)</h4>
                        <div className="flex-1 min-h-[256px] h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                    <Radar name="50s" dataKey="fifties" stroke="#14b8a6" strokeWidth={3} fill="#14b8a6" fillOpacity={0.4} />
                                    <Radar name="100s" dataKey="hundreds" stroke="#f59e0b" strokeWidth={3} fill="#f59e0b" fillOpacity={0.5} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* 5. Format Runs Distribution Hologram */}
                {totalRunsAllFormats > 0 && (
                    <div className="md:col-span-2 xl:col-span-3 bg-[#0B0D14]/80 backdrop-blur-md border border-white/[0.03] p-5 rounded-3xl relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 min-w-[200px]">
                            <h4 className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] mb-1">FORMAT DISTRIBUTION</h4>
                            <p className="text-[11px] text-zinc-400 mb-4">{isBowling ? 'Runs conceded across formats' : 'Runs scored across formats'}</p>
                            
                            <div className="flex flex-col gap-3 mt-6">
                                {formatPieData.map((d, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.fill, color: d.fill }}></div>
                                            <span className="text-xs text-white font-medium">{d.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-white">{d.value.toLocaleString()}</span>
                                            <span className="text-[10px] text-zinc-500 ml-2">({Math.round((d.value/totalRunsAllFormats)*100)}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 h-64 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={formatPieData} cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" paddingAngle={5} dataKey="value" stroke="none" cornerRadius={6}>
                                        {formatPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold text-white tracking-tight">{totalRunsAllFormats.toLocaleString()}</span>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mt-2">Total {isBowling ? 'Conceded' : 'Runs'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

