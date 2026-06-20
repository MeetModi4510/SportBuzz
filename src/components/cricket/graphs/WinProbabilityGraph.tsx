import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WinProbData {
    available: boolean;
    team1?: { name: string, color: string };
    team2?: { name: string, color: string };
    data?: any[];
}

interface WinProbabilityGraphProps {
    data: WinProbData | null;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-cbHdrBkgDark/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl">
                <div className="text-white/70 text-xs mb-2">Over {payload[0].payload.over}</div>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="font-bold">{entry.name}:</span>
                        <span>{entry.value}%</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const WinProbabilityGraph: React.FC<WinProbabilityGraphProps> = ({ data }) => {
    if (!data || !data.available || !data.data || data.data.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 p-12">
                <div className="mb-2 text-white">Win Probability Data Unavailable</div>
                <div className="text-xs text-white/50 max-w-sm">
                    This graph is not available for this match or the data has not been published yet.
                </div>
            </div>
        );
    }

    const t1 = data.team1;
    const t2 = data.team2;

    if (!t1 || !t2) return null;

    return (
        <div className="w-full h-[350px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data.data}
                    margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                    <defs>
                        <linearGradient id={`color_${t1.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={t1.color} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={t1.color} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id={`color_${t2.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={t2.color} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={t2.color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                        dataKey="over" 
                        stroke="#ffffff50" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}`}
                        label={{ value: "Overs", position: "bottom", offset: 0, fontSize: 12, fill: "#ffffff80" }}
                    />
                    <YAxis 
                        stroke="#ffffff50" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(val) => `${val}%`}
                        label={{ value: "Win Probability", angle: -90, position: "insideLeft", offset: 15, fontSize: 12, fill: "#ffffff80" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Area 
                        type="monotone" 
                        dataKey={t1.name} 
                        stroke={t1.color} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill={`url(#color_${t1.name})`} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    />
                    <Area 
                        type="monotone" 
                        dataKey={t2.name} 
                        stroke={t2.color} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill={`url(#color_${t2.name})`} 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
