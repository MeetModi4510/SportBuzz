import React, { useState } from 'react';
import { CricketSidebar } from './CricketSidebar';
import { PerformanceLab } from './PerformanceLab';

export function CricketPerformanceDashboard() {
    const [activePlayer, setActivePlayer] = useState<any>(null);

    const handleSelectPlayer = (player: any) => {
        setActivePlayer(player);
    };

    return (
        <div className="relative flex flex-col min-h-[900px] w-full dark:bg-[#0A0A0B] bg-white dark:text-zinc-200 text-zinc-800 p-4 xl:p-6 gap-6 rounded-[2rem] overflow-hidden border dark:border-white/5 border-black/5 shadow-2xl">
            {/* Clean Minimal Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] dark:bg-blue-500/[0.03] bg-blue-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] dark:bg-indigo-500/[0.02] bg-indigo-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 dark:bg-white/[0.01] bg-black/[0.01] backdrop-blur-[100px]"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] dark:bg-purple-900/5 bg-purple-500/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <CricketSidebar 
                activePlayerId={activePlayer?.espnId || null} 
                onSelectPlayer={handleSelectPlayer} 
            />
            <PerformanceLab 
                activePlayer={activePlayer} 
            />
        </div>
    );
}
