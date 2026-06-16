import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface CrossFormatAnalysisProps {
    stats: {
        test: any;
        odi: any;
        t20i: any;
        ipl: any;
    }
}

export function CrossFormatAnalysis({ stats }: CrossFormatAnalysisProps) {
    const safeStats = stats || {};
    
    const data = [
        { name: 'Test', runs: parseInt(safeStats.test?.runs) || 0, avg: parseFloat(safeStats.test?.average) || 0, sr: parseFloat(safeStats.test?.strikeRate) || 0 },
        { name: 'ODI', runs: parseInt(safeStats.odi?.runs) || 0, avg: parseFloat(safeStats.odi?.average) || 0, sr: parseFloat(safeStats.odi?.strikeRate) || 0 },
        { name: 'T20I', runs: parseInt(safeStats.t20i?.runs) || 0, avg: parseFloat(safeStats.t20i?.average) || 0, sr: parseFloat(safeStats.t20i?.strikeRate) || 0 },
    ];

    // Calculate total boundary runs vs non-boundary runs for ODI (as an example)
    const odiFours = parseInt(safeStats.odi?.fours) || 0;
    const odiSixes = parseInt(safeStats.odi?.sixes) || 0;
    const odiTotalRuns = parseInt(safeStats.odi?.runs) || 0;
    const boundaryRuns = (odiFours * 4) + (odiSixes * 6);
    const nonBoundaryRuns = Math.max(0, odiTotalRuns - boundaryRuns);

    const pieData = [
        { name: 'Boundary Runs', value: boundaryRuns, color: '#F59E0B' },
        { name: 'Non-Boundary Runs', value: nonBoundaryRuns, color: '#6366F1' },
    ];

    return (
        <div className="bg-[#141A25] p-6 rounded-2xl border border-blue-500/10 shadow-lg mt-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-full">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-white font-semibold">Cross-Format Analysis</h3>
                    <p className="text-slate-400 text-xs">Performance metrics breakdown and visualizations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Runs by Format */}
                <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Runs by Format</h4>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#1E293B' }} contentStyle={{ backgroundColor: '#141A25', borderColor: '#334155' }} />
                                <Bar dataKey="runs" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#EF4444', '#3B82F6', '#10B981'][index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Average by Format */}
                <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Average by Format</h4>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#1E293B' }} contentStyle={{ backgroundColor: '#141A25', borderColor: '#334155' }} />
                                <Bar dataKey="avg" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#EF4444', '#3B82F6', '#10B981'][index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Strike Rate */}
                <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Strike Rate</h4>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#141A25', borderColor: '#334155' }} />
                                <Line type="monotone" dataKey="sr" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Boundary Analysis */}
                <div className="bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Boundary Analysis — ODI</h4>
                    <div className="h-40 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#141A25', borderColor: '#334155' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div> Boundaries: {boundaryRuns}</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#6366F1]"></div> Running: {nonBoundaryRuns}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
