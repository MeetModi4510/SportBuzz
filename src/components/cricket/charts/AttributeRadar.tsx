import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface AttributeRadarProps {
    attributes: {
        batting: number;
        bowling: number;
        running: number;
        temperament: number;
        fitness: number;
        leadership: number;
    }
}

export function AttributeRadar({ attributes }: AttributeRadarProps) {
    const safeAttrs = attributes || { batting: 0, bowling: 0, running: 0, temperament: 0, fitness: 0, leadership: 0 };

    const data = [
        { subject: 'Batting', A: safeAttrs.batting, fullMark: 100 },
        { subject: 'Bowling', A: safeAttrs.bowling, fullMark: 100 },
        { subject: 'Running', A: safeAttrs.running, fullMark: 100 },
        { subject: 'Temperament', A: safeAttrs.temperament, fullMark: 100 },
        { subject: 'Fitness', A: safeAttrs.fitness, fullMark: 100 },
        { subject: 'Leadership', A: safeAttrs.leadership, fullMark: 100 },
    ];

    return (
        <div className="dark:bg-[#0B0D14]/80 bg-white/80 backdrop-blur-md p-5 rounded-3xl border dark:border-white/[0.03] border-slate-200 shadow-lg h-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border dark:border-white/[0.05] border-slate-200">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-[10px] font-extrabold dark:text-zinc-300 text-zinc-700 uppercase tracking-[0.2em]">Attribute Radar</h3>
                    <p className="text-zinc-500 text-[9px] uppercase tracking-widest mt-0.5">Core skill breakdown</p>
                </div>
            </div>

            <div className="h-[220px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: '#27272a', borderRadius: '12px' }}
                            itemStyle={{ color: '#60A5FA', fontWeight: 600 }}
                        />
                        <Radar
                            name="Attributes"
                            dataKey="A"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fill="url(#radarGradient)"
                            fillOpacity={0.6}
                        />
                        <defs>
                            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                            </linearGradient>
                        </defs>
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
