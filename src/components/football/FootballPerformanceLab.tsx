import React from 'react';
import { FootballPlayer, useFotmobPlayerProfile } from '../../hooks/useFootballSquads';
import { FotmobPlayerCard } from './FotmobPlayerCard';
import { Loader2 } from 'lucide-react';

interface FootballPerformanceLabProps {
    activePlayer: (FootballPlayer & { country: string }) | null;
}

export function FootballPerformanceLab({ activePlayer }: FootballPerformanceLabProps) {
    if (!activePlayer) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center border border-white/10 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-[60px] text-slate-500 min-h-[600px] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] relative overflow-hidden group w-full z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Glowing Radar Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent,transparent,rgba(16,185,129,0.1),transparent)] animate-[spin_8s_linear_infinite] rounded-full pointer-events-none"></div>

                <div className="relative flex items-center justify-center mb-10">
                    <div className="absolute w-40 h-40 border border-emerald-500/30 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                    <div className="absolute w-56 h-56 border border-teal-500/20 rounded-full animate-[ping_3s_ease-in-out_infinite_0.5s]"></div>
                    <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(16,185,129,0.5)] transform rotate-3 group-hover:rotate-0 transition-transform duration-500 relative z-10">
                        <svg className="w-12 h-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-8v4h8v-4zm-4-8a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 tracking-tighter drop-shadow-lg relative z-10">The Command Center</h2>
                <p className="text-sm mt-4 text-slate-300 max-w-sm text-center leading-relaxed font-bold uppercase tracking-[0.2em] relative z-10">Select a player from the roster rail above to initialize deep analytics</p>
            </div>
        );
    }

    return <ActivePlayerLab player={activePlayer} />;
}

const ActivePlayerLab = ({ player }: { player: FootballPlayer & { country: string } }) => {
    // Fetch live FotMob player profile data
    const { data: profile, isLoading, error } = useFotmobPlayerProfile(player.id);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full relative z-20">
                <Loader2 className="w-12 h-12 text-[#34D399] animate-spin mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Player Data...</h3>
                <p className="text-gray-400 text-sm">Fetching live statistics, traits, and shot maps from FotMob</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full relative z-20 text-center">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6">
                   <span className="text-red-400 text-3xl font-black">!</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Data Unavailable</h3>
                <p className="text-gray-400 text-sm max-w-md">Could not fetch detailed performance data for {player.name}. The API might be rate limited or the player ID is invalid.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full relative z-20">
            <FotmobPlayerCard key={profile.id} profile={profile} player={player} />
        </div>
    );
};
