import React, { useState } from 'react';
import { CricketSidebar } from './CricketSidebar';
import { PerformanceLab } from './PerformanceLab';

export function CricketPerformanceDashboard() {
    const [activePlayer, setActivePlayer] = useState<any>(null);

    const handleSelectPlayer = (player: any) => {
        setActivePlayer(player);
    };

    return (
        <div className="flex min-h-[900px] w-full bg-[#0B1120] text-slate-200 p-6 gap-8 rounded-xl">
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
