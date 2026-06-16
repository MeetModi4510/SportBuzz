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
        <div className="bg-[#141A25] p-6 rounded-2xl border border-blue-500/10 shadow-lg h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-full">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-white font-semibold">Attribute Radar</h3>
                    <p className="text-slate-400 text-xs">Core skill breakdown</p>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#2A3441" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1E293B', borderRadius: '8px' }}
                            itemStyle={{ color: '#60A5FA' }}
                        />
                        <Radar
                            name="Attributes"
                            dataKey="A"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
