import React, { useState } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine, Brush, LabelList } from 'recharts';

interface OversData {
    available: boolean;
    team1?: { name: string, color: string };
    team2?: { name: string, color: string };
    data?: any[];
}

interface OversGraphProps {
    data: OversData | null;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-cbHdrBkgDark/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl">
                <div className="text-white/70 text-xs mb-2 font-bold uppercase tracking-widest">Over {payload[0].payload.over}</div>
                {payload.map((entry: any, index: number) => {
                    const isTeam1 = entry.dataKey === entry.payload.team1Name;
                    const fallbackT1 = entry.payload.isTeam1Wicket ? 1 : 0;
                    const fallbackT2 = entry.payload.isTeam2Wicket ? 1 : 0;
                    const wicketsCount = isTeam1 
                        ? (entry.payload.team1WicketsCount !== undefined ? entry.payload.team1WicketsCount : fallbackT1) 
                        : (entry.payload.team2WicketsCount !== undefined ? entry.payload.team2WicketsCount : fallbackT2);
                    
                    return (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1" style={{ color: entry.color }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                <span className="font-bold">{entry.name}:</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm">{entry.value}</span>
                                {wicketsCount > 0 && (
                                    <div className="flex gap-0.5 ml-1" title={`${wicketsCount} wicket(s) fell in this over`}>
                                        {Array.from({ length: wicketsCount }).map((_, i) => (
                                            <div key={i} className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ outline: `2px solid ${entry.color}` }}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
    return null;
};

// Custom Label for Wicket Dots using LabelList
const renderWicketDot = (props: any, teamKey: string, color: string) => {
    const { x, y, width, value } = props;
    if (!value) return null;

    const fallbackT1 = value.isTeam1Wicket ? 1 : 0;
    const fallbackT2 = value.isTeam2Wicket ? 1 : 0;
    const count = teamKey === 'team1' 
        ? (value.team1WicketsCount !== undefined ? value.team1WicketsCount : fallbackT1) 
        : (value.team2WicketsCount !== undefined ? value.team2WicketsCount : fallbackT2);
    
    if (count > 0) {
        const dots = [];
        for (let i = 0; i < count; i++) {
            dots.push(
                <circle 
                    key={i}
                    cx={x + width / 2} 
                    cy={y - 7 - (i * 10)} 
                    r={3.5} 
                    fill={color} 
                    stroke="#ffffff" 
                    strokeWidth={1.2} 
                />
            );
        }
        return <g>{dots}</g>;
    }
    return null;
};

export const OversGraph: React.FC<OversGraphProps> = ({ data }) => {
    const [activeFilter, setActiveFilter] = useState<'both' | 'team1' | 'team2'>('both');

    if (!data || !data.available || !data.data || data.data.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 p-12">
                <div className="mb-2 text-white font-bold">Overs Graph Unavailable</div>
                <div className="text-xs text-white/50 max-w-sm">
                    This graph is not available for this match or the data has not been published yet.
                </div>
            </div>
        );
    }

    const t1 = data.team1;
    const t2 = data.team2;

    if (!t1 || !t2) return null;

    const chartData = data.data.map(d => ({
        ...d,
        team1Name: t1.name,
        team2Name: t2.name
    }));

    let totalRuns = 0;
    chartData.forEach(d => {
        totalRuns += (d[t1.name] || 0) + (d[t2.name] || 0);
    });
    const avgRunRate = (totalRuns / (chartData.length * 2)).toFixed(1);
    
    const startIndex = Math.max(0, chartData.length - 15);
    const endIndex = chartData.length - 1;

    return (
        <div className="w-full flex flex-col items-center mt-2">
            <div className="flex items-center gap-2 mb-6 bg-white/5 p-1 rounded-xl border border-white/10 z-10">
                <button 
                    onClick={() => setActiveFilter('both')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeFilter === 'both' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                >
                    Both
                </button>
                <button 
                    onClick={() => setActiveFilter('team1')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeFilter === 'team1' ? 'bg-white/20 shadow-sm' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                    style={activeFilter === 'team1' ? { color: t1.color } : {}}
                >
                    {t1.name}
                </button>
                <button 
                    onClick={() => setActiveFilter('team2')}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeFilter === 'team2' ? 'bg-white/20 shadow-sm' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                    style={activeFilter === 'team2' ? { color: t2.color } : {}}
                >
                    {t2.name}
                </button>
            </div>

            <div className="w-full h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 25, right: 30, left: -20, bottom: 65 }}
                        barGap={2}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis 
                            dataKey="over" 
                            stroke="#ffffff50" 
                            tick={{ fontSize: 10, fill: '#ffffff80' }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: "Overs", position: "insideBottom", offset: -25, fontSize: 12, fill: "#ffffff80" }}
                            tickMargin={8}
                        />
                        <YAxis 
                            stroke="#ffffff50" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: "Runs", angle: -90, position: "insideLeft", offset: 25, fontSize: 12, fill: "#ffffff80" }}
                            tickFormatter={(val) => `${val}`}
                        />
                        <Tooltip cursor={{ fill: '#ffffff10' }} content={<CustomTooltip />} />
                        <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ paddingTop: '35px' }} />
                        
                        <Brush 
                            dataKey="over" 
                            height={15} 
                            y={420}
                            stroke="#ffffff50" 
                            fill="#ffffff05" 
                            tickFormatter={() => ''} 
                            startIndex={startIndex}
                            endIndex={endIndex}
                        />

                        <ReferenceLine y={avgRunRate} stroke="#ffffff40" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Avg RR', fill: '#ffffff60', fontSize: 10 }} />

                        {(activeFilter === 'both' || activeFilter === 'team1') && (
                            <Bar 
                                dataKey={t1.name} 
                                fill={t1.color} 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                                animationDuration={1500}
                            >
                                <LabelList dataKey={(d: any) => d} content={(props) => renderWicketDot(props, 'team1', t1.color)} />
                                {
                                    chartData.map((entry, index) => (
                                        <Cell key={`cell-t1-${index}`} fill={t1.color} />
                                    ))
                                }
                            </Bar>
                        )}
                        {(activeFilter === 'both' || activeFilter === 'team2') && (
                            <Bar 
                                dataKey={t2.name} 
                                fill={t2.color} 
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                                animationDuration={1500}
                            >
                                <LabelList dataKey={(d: any) => d} content={(props) => renderWicketDot(props, 'team2', t2.color)} />
                                {
                                    chartData.map((entry, index) => (
                                        <Cell key={`cell-t2-${index}`} fill={t2.color} />
                                    ))
                                }
                            </Bar>
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-6 border-t border-white/5 w-full pt-4 text-[10px] uppercase tracking-widest text-white/40">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white bg-transparent"></div> Wicket
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 border-t border-dashed border-white/40"></div> Avg RR
                </div>
            </div>
        </div>
    );
};
