import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from "../../lib/utils";
import { 
  useLivescoreLiveMatches, 
  useLivescoreMatchesByDate,
  LivescoreMatch 
} from "../../hooks/football/useLivescore6Queries";
import { useNavigate } from 'react-router-dom';
import { LivescoreMatchCard } from "./LivescoreMatchCard";

export const FootballMatchesLivescore = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'recent'>('live');

  // Generate Date Strings YYYYMMDD
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);
  const yesterdayStr = formatDate(yesterday);

  // Queries
  const { data: liveData, isLoading: liveLoading, refetch: refetchLive, isFetching: liveFetching } = useLivescoreLiveMatches(true);
  
  // Lazy load Upcoming/Recent
  const { data: todayData, isLoading: todayLoading, refetch: refetchToday, isFetching: todayFetching } = useLivescoreMatchesByDate(todayStr, activeTab === 'upcoming' || activeTab === 'recent');
  const { data: tomorrowData, isLoading: tomorrowLoading, refetch: refetchTomorrow, isFetching: tomorrowFetching } = useLivescoreMatchesByDate(tomorrowStr, activeTab === 'upcoming');
  
  const { data: yesterdayData, isLoading: yesterdayLoading, refetch: refetchYesterday, isFetching: yesterdayFetching } = useLivescoreMatchesByDate(yesterdayStr, activeTab === 'recent');

  const handleManualRefresh = () => {
    if (activeTab === 'live') refetchLive();
    if (activeTab === 'upcoming') { refetchToday(); refetchTomorrow(); }
    if (activeTab === 'recent') refetchYesterday();
  };

  const isRefreshing = liveFetching || todayFetching || tomorrowFetching || yesterdayFetching;
  const isLoading = (activeTab === 'live' && liveLoading) || 
                    (activeTab === 'upcoming' && (todayLoading || tomorrowLoading)) || 
                    (activeTab === 'recent' && (todayLoading || yesterdayLoading));

  // Grouping logic for rendering
  let sections: { title: string, matches: LivescoreMatch[] }[] = [];

  if (activeTab === 'live') {
    sections = [{ title: 'All Live Matches', matches: liveData?.data || [] }];
  } else if (activeTab === 'upcoming') {
    // Filter out live/completed from today
    const upcomingToday = (todayData?.data || []).filter(m => m.status === 'upcoming');
    const upcomingTomorrow = (tomorrowData?.data || []).filter(m => m.status === 'upcoming');
    if (upcomingToday.length > 0) sections.push({ title: 'Today', matches: upcomingToday });
    if (upcomingTomorrow.length > 0) sections.push({ title: 'Tomorrow', matches: upcomingTomorrow });
  } else if (activeTab === 'recent') {
    // Show completed matches from today and yesterday
    const completedToday = (todayData?.data || []).filter(m => m.status === 'completed');
    const completedYesterday = (yesterdayData?.data || []).filter(m => m.status === 'completed');
    if (completedToday.length > 0) sections.push({ title: 'Today', matches: completedToday });
    if (completedYesterday.length > 0) sections.push({ title: 'Yesterday', matches: completedYesterday });
  }

  // Get Last Updated timestamp
  const getLastUpdated = () => {
    if (activeTab === 'live') return liveData?.lastFetched;
    if (activeTab === 'upcoming') return todayData?.lastFetched || tomorrowData?.lastFetched;
    if (activeTab === 'recent') return yesterdayData?.lastFetched;
    return null;
  };

  const lastUpdated = getLastUpdated();

  return (
    <section className="space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center relative w-6 h-6">
            <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <div className="relative w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50">
            Football Matches.
          </h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 px-2">
          <div className="flex p-1 backdrop-blur-3xl rounded-full border bg-secondary/50 border-border">
            <button onClick={() => setActiveTab("live")} className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all", activeTab === 'live' ? 'bg-background text-emerald-500 shadow-lg scale-105 border border-border/50' : 'text-muted-foreground hover:text-foreground')}>Live</button>
            <button onClick={() => setActiveTab("upcoming")} className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all", activeTab === 'upcoming' ? 'bg-background text-foreground shadow-lg scale-105 border border-border/50' : 'text-muted-foreground hover:text-foreground')}>Upcoming</button>
            <button onClick={() => setActiveTab("recent")} className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-all", activeTab === 'recent' ? 'bg-background text-foreground shadow-lg scale-105 border border-border/50' : 'text-muted-foreground hover:text-foreground')}>Recent</button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-full hover:bg-secondary transition-colors text-foreground disabled:opacity-50 backdrop-blur-md"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Sync
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 || sections.every(s => s.matches.length === 0) ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground font-medium">No matches to display in this category.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">{section.title}</h3>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {section.matches.map(match => (
                  <div key={match.id} className="snap-start shrink-0 w-[300px] md:w-[350px]">
                    <LivescoreMatchCard 
                      match={match} 
                      onClick={(m) => navigate(`/football/match/${m.apiId}`)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdated && (
         <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground/60 italic font-medium">
               Last updated on {new Date(lastUpdated).toLocaleString()}
            </p>
         </div>
      )}

    </section>
  );
};
