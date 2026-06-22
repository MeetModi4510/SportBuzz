import React from 'react';

interface OppositionStatsProps {
    data: { team: string; average: number }[];
}

export function OppositionStats({ data }: OppositionStatsProps) {
    // Top 5 teams to display (as per UI screenshot)
    const topTeams = ['Australia', 'England', 'South Africa', 'Pakistan', 'New Zealand', 'Sri Lanka', 'West Indies'];
    
    const displayData = data
        .filter(d => topTeams.includes(d.team) && d.average > 0)
        .slice(0, 5)
        .sort((a, b) => b.average - a.average);

    const maxAverage = Math.max(...displayData.map(d => d.average), 80); // Base max on highest avg or 80

    return (
        <div className="dark:bg-[#141A25] bg-white p-6 rounded-2xl border dark:border-blue-500/10 border-slate-200 shadow-lg mt-6">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-full">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <div>
                    <h3 className="dark:text-white text-slate-900 font-semibold">vs Opposition</h3>
                    <p className="dark:text-slate-400 text-slate-500 text-xs">Batting average against top teams</p>
                </div>
            </div>

            <div className="space-y-4">
                {displayData.map((stat) => (
                    <div key={stat.team} className="flex items-center gap-4">
                        <div className="w-24 text-sm dark:text-slate-300 text-slate-700 font-medium">
                            {stat.team}
                        </div>
                        <div className="flex-1 h-3 dark:bg-[#1E293B] bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#2563EB] rounded-full"
                                style={{ width: `${(stat.average / maxAverage) * 100}%` }}
                            />
                        </div>
                        <div className="w-12 text-right text-sm dark:text-[#60A5FA] text-blue-600 font-bold">
                            {stat.average.toFixed(1)}
                        </div>
                    </div>
                ))}
                {displayData.length === 0 && (
                    <div className="dark:text-slate-500 text-slate-600 text-sm italic">Not enough data against top teams.</div>
                )}
            </div>
        </div>
    );
}
