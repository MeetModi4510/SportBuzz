import React, { useState } from 'react';
import { FootballSidebar } from './FootballSidebar';
import { FootballPerformanceLab } from './FootballPerformanceLab';
import { FootballPlayer } from '../../hooks/useFootballSquads';

export function FootballPerformanceDashboard({ initialState }: { initialState?: any }) {
    const [activePlayer, setActivePlayer] = useState<(FootballPlayer & { country: string }) | null>(
        initialState?.targetPlayerId ? { id: initialState.targetPlayerId, name: initialState.targetPlayerName, country: initialState.targetTeamName } as any : null
    );

    const handleSelectPlayer = (player: FootballPlayer & { country: string }) => {
        setActivePlayer(player);
    };

    return (
        <div className="relative flex flex-col min-h-[900px] w-full dark:bg-[#0A0A0B] bg-slate-50 dark:text-zinc-200 text-slate-800 p-4 xl:p-6 gap-6 rounded-[2rem] overflow-hidden border dark:border-white/5 border-slate-200 shadow-2xl">
            {/* Clean Minimal Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 dark:bg-white/[0.01] bg-white/[0.4] backdrop-blur-[100px]"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] bg-indigo-900/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <FootballSidebar 
                activePlayerId={activePlayer?.id || null} 
                initialTeamName={initialState?.targetTeamName}
                onSelectPlayer={handleSelectPlayer} 
            />
            <FootballPerformanceLab 
                activePlayer={activePlayer} 
            />
        </div>
    );
}
