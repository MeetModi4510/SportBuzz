import React from 'react';

interface StatGridProps {
    stats: any;
    skillMode: 'batting' | 'bowling';
}

export function StatGrid({ stats, skillMode }: StatGridProps) {
    const StatBlock = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex flex-col border-l-2 border-blue-500/30 pl-4 py-1">
            <span className="text-xs text-slate-400 font-medium mb-1">{label}</span>
            <span className="text-2xl text-blue-400 font-bold tracking-tight">{value || '-'}</span>
        </div>
    );

    if (skillMode === 'bowling') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 mt-6">
                <StatBlock label="Matches" value={stats?.matches} />
                <StatBlock label="Innings" value={stats?.innings} />
                <StatBlock label="Wickets" value={stats?.wickets} />
                <StatBlock label="Best" value={stats?.best} />
                
                <StatBlock label="Average" value={stats?.average} />
                <StatBlock label="Economy" value={stats?.economy} />
                <StatBlock label="Strike Rate" value={stats?.strikeRate} />
                <StatBlock label="Runs Conc." value={stats?.runs} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 mt-6">
            <StatBlock label="Matches" value={stats?.matches} />
            <StatBlock label="Innings" value={stats?.innings} />
            <StatBlock label="Runs" value={stats?.runs?.toLocaleString()} />
            <StatBlock label="Highest" value={stats?.highestScore} />
            
            <StatBlock label="Average" value={stats?.average} />
            <StatBlock label="Strike Rate" value={stats?.strikeRate} />
            <StatBlock label="100s / 50s" value={`${stats?.hundreds || 0} / ${stats?.fifties || 0}`} />
            <StatBlock label="4s / 6s" value={`${stats?.fours || 0} / ${stats?.sixes || 0}`} />
        </div>
    );
}
