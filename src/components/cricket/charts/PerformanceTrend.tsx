import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceTrendProps {
    data: { match: string; runs: number; opp?: string; raw?: string }[];
    skillMode?: 'batting' | 'bowling';
}

export function PerformanceTrend({ data, skillMode = 'batting' }: PerformanceTrendProps) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const row = payload[0].payload;
            return (
                <div className="bg-[#0B1120] border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-bold mb-1">{label} {row.opp ? `vs ${row.opp}` : ''}</p>
                    <p className="text-blue-400 font-semibold">
                        {skillMode === 'batting' ? 'Score: ' : 'Wickets: '}
                        {row.raw ? row.raw : row.runs}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#141A25] p-6 rounded-2xl border border-blue-500/10 shadow-lg mb-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-full">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-white font-semibold">Performance Trend</h3>
                    <p className="text-slate-400 text-xs">
                        {skillMode === 'batting' ? 'Runs scored over recent matches' : 'Wickets taken over recent matches'}
                    </p>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" vertical={false} />
                        <XAxis 
                            dataKey="match" 
                            stroke="#475569" 
                            tick={{ fill: '#94A3B8', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10} 
                        />
                        <YAxis 
                            stroke="#475569" 
                            tick={{ fill: '#94A3B8', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                            type="monotone" 
                            dataKey="runs" 
                            stroke={skillMode === 'batting' ? "#3B82F6" : "#8B5CF6"} 
                            strokeWidth={3}
                            dot={{ fill: skillMode === 'batting' ? '#3B82F6' : '#8B5CF6', stroke: '#0B1120', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, fill: skillMode === 'batting' ? '#60A5FA' : '#A78BFA' }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
