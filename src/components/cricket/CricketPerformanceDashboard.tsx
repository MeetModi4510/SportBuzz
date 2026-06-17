import React, { useState } from 'react';
import { CricketSidebar } from './CricketSidebar';
import { PerformanceLab } from './PerformanceLab';

export function CricketPerformanceDashboard() {
    const [activePlayer, setActivePlayer] = useState<any>(null);

    const handleSelectPlayer = (player: any) => {
        setActivePlayer(player);
    };

    return (
        <div className="relative flex flex-col min-h-[900px] w-full bg-[#0A0A0B] text-zinc-200 p-4 xl:p-6 gap-6 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
            {/* Clean Minimal Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/[0.02] rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-[100px]"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] bg-purple-900/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

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
