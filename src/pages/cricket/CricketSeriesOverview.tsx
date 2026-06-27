import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Trophy, Calendar, Users, BarChart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalIplSeasons } from '@/hooks/cricket/useCricketSeries';

import SeriesMatches from '@/components/cricket/series/SeriesMatches';
import SeriesStandings from '@/components/cricket/series/SeriesStandings';
import SeriesSquads from '@/components/cricket/series/SeriesSquads';
import SeriesStats from '@/components/cricket/series/SeriesStats';
import SeriesAllTimeStats from '@/components/cricket/series/SeriesAllTimeStats';

type TabType = 'matches' | 'standings' | 'squads' | 'stats' | 'all-time-stats';

export default function CricketSeriesOverview() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('matches');
    const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
    
    const { data: seasons, isLoading: isLoadingSeasons } = useLocalIplSeasons();

    // Default to the most recent season (which is first in the list usually)
    const [selectedSeason, setSelectedSeason] = useState<any>(null);

    useEffect(() => {
        if (seasons && seasons.length > 0 && !selectedSeason) {
            setSelectedSeason(seasons[0]);
        }
    }, [seasons]);

    const handleSeasonChange = (id: string) => {
        const season = seasons?.find((s: any) => s.id === id);
        if (season) setSelectedSeason(season);
        setIsSeasonDropdownOpen(false);
    };

    const tabs = [
        { id: 'matches', label: 'Matches', icon: Calendar },
        { id: 'standings', label: 'Points Table', icon: Trophy },
        { id: 'squads', label: 'Squads', icon: Users },
        { id: 'stats', label: 'Stats', icon: BarChart },
        { id: 'all-time-stats', label: 'All Time Stats', icon: Trophy },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-[120rem] w-full mx-auto p-4 md:p-8 lg:p-12 xl:px-16">
                
                {/* Hero Section */}
                <div className="relative rounded-[2.5rem] border border-border/40 mb-10 shadow-2xl group">
                    {/* Dynamic Backgrounds */}
                    <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-purple-900/20 to-primary/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-card/80 backdrop-blur-3xl"></div>
                        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/30 rounded-full blur-[100px] group-hover:bg-primary/40 transition-colors duration-1000"></div>
                        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] group-hover:bg-blue-600/30 transition-colors duration-1000"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    </div>
                    
                    <div className="relative h-auto md:h-72 p-8 md:p-12 flex items-center">
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between w-full gap-8">
                            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
                                {/* Logo Wrapper */}
                                <div className="relative group/logo shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-500 rounded-3xl blur-xl opacity-50 group-hover/logo:opacity-80 transition-opacity duration-500"></div>
                                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white flex items-center justify-center shadow-2xl border border-white/20 p-5 transform group-hover/logo:scale-[1.02] transition-transform duration-500">
                                        <img 
                                            src="https://upload.wikimedia.org/wikipedia/en/8/84/Indian_Premier_League_Official_Logo.svg" 
                                            alt="IPL Logo" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                                
                                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-black mb-4 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                                        <Trophy size={16} className="text-primary" />
                                        <span className="uppercase tracking-widest">Indian Premier League</span>
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60 drop-shadow-sm mb-2">
                                        {selectedSeason ? selectedSeason.name : "IPL Series"}
                                    </h1>
                                    <p className="text-muted-foreground font-medium text-lg max-w-xl">
                                        Complete coverage, stats, and standings for the ultimate T20 league.
                                    </p>
                                </div>
                            </div>
                            
                            {/* Season Selector */}
                            {seasons && seasons.length > 0 && (
                                <div className="relative shrink-0 mt-4 md:mt-0 z-50">
                                    <div 
                                        className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 hover:border-primary/50 transition-all duration-300 shadow-2xl cursor-pointer group"
                                        onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                                    >
                                        <Calendar className="text-primary group-hover:scale-110 transition-transform duration-300" size={20} />
                                        <div className="flex flex-col pr-8">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-0.5">Select Season</span>
                                            <span className="text-white font-bold text-xl">
                                                {selectedSeason ? `${selectedSeason.year} Season` : 'Select...'}
                                            </span>
                                        </div>
                                        {/* Custom chevron */}
                                        <div className={cn("absolute right-6 top-1/2 -translate-y-1/2 text-white/50 transition-transform duration-300", isSeasonDropdownOpen ? "rotate-180 text-primary" : "")}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>

                                    {/* Custom Dropdown Menu */}
                                    {isSeasonDropdownOpen && (
                                        <>
                                            {/* Invisible overlay to catch outside clicks */}
                                            <div className="fixed inset-0 z-40" onClick={() => setIsSeasonDropdownOpen(false)}></div>
                                            
                                            <div className="absolute top-full right-0 mt-3 w-full md:min-w-[260px] max-h-80 overflow-y-auto bg-[#0A0D14]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] z-50 p-2 scrollbar-hide animate-in fade-in slide-in-from-top-4 duration-200">
                                                {seasons.map((s: any) => (
                                                    <div 
                                                        key={s.id} 
                                                        onClick={() => handleSeasonChange(s.id)}
                                                        className={cn(
                                                            "px-4 py-3 rounded-xl cursor-pointer font-bold text-lg transition-all duration-200 flex items-center justify-between group/item",
                                                            selectedSeason?.id === s.id 
                                                                ? "bg-primary/20 text-primary" 
                                                                : "text-white/70 hover:bg-white/5 hover:text-white"
                                                        )}
                                                    >
                                                        <span className="transform group-hover/item:translate-x-1 transition-transform duration-200">{s.year} Season</span>
                                                        {selectedSeason?.id === s.id && (
                                                            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
                                    isActive 
                                        ? "bg-primary text-primary-foreground shadow-md" 
                                        : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="min-h-[500px]">
                    {isLoadingSeasons ? (
                        <div className="flex items-center justify-center h-64">
                            <Activity className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : selectedSeason ? (
                        <>
                            {activeTab === 'matches' && <SeriesMatches season={selectedSeason.year} />}
                            {activeTab === 'standings' && <SeriesStandings season={selectedSeason.year} />}
                            {activeTab === 'squads' && <SeriesSquads season={selectedSeason.year} />}
                            {activeTab === 'stats' && <SeriesStats season={selectedSeason.year} />}
                            {activeTab === 'all-time-stats' && <SeriesAllTimeStats teams={seasons[0]?.teams || []} />}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            Failed to load season data.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
