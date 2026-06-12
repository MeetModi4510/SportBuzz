import React from 'react';
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
  
  const hasLiveMatches = liveData && liveData.data && liveData.data.length > 0;
  const loadOthers = !liveLoading && !hasLiveMatches;

  // Lazy load Upcoming/Recent only if no live matches
  const { data: todayData, isLoading: todayLoading, refetch: refetchToday, isFetching: todayFetching } = useLivescoreMatchesByDate(todayStr, loadOthers);
  const { data: tomorrowData, isLoading: tomorrowLoading, refetch: refetchTomorrow, isFetching: tomorrowFetching } = useLivescoreMatchesByDate(tomorrowStr, loadOthers);
  const { data: yesterdayData, isLoading: yesterdayLoading, refetch: refetchYesterday, isFetching: yesterdayFetching } = useLivescoreMatchesByDate(yesterdayStr, loadOthers);

  const handleManualRefresh = () => {
    refetchLive();
    if (loadOthers) {
      refetchToday();
      refetchTomorrow();
      refetchYesterday();
    }
  };

  const isRefreshing = liveFetching || todayFetching || tomorrowFetching || yesterdayFetching;
  const isLoading = liveLoading || (loadOthers && (todayLoading || tomorrowLoading || yesterdayLoading));

  // Grouping logic for rendering
  let sections: { title: string, matches: LivescoreMatch[] }[] = [];

  if (hasLiveMatches) {
    sections = [{ title: 'Live Matches', matches: liveData.data }];
  } else if (!isLoading) {
    const upcomingToday = (todayData?.data || []).filter(m => m.status === 'upcoming');
    const upcomingTomorrow = (tomorrowData?.data || []).filter(m => m.status === 'upcoming');
    const allUpcoming = [...upcomingToday, ...upcomingTomorrow].slice(0, 2);
    
    const completedToday = (todayData?.data || []).filter(m => m.status === 'completed');
    const completedYesterday = (yesterdayData?.data || []).filter(m => m.status === 'completed');
    const allRecent = [...completedToday, ...completedYesterday].slice(0, 2);
    
    const combinedMatches = [...allUpcoming, ...allRecent];
    
    if (combinedMatches.length > 0) {
      sections.push({ title: 'Featured Matches', matches: combinedMatches });
    }
  }

  // Get Last Updated timestamp
  const lastUpdated = hasLiveMatches 
    ? liveData?.lastFetched 
    : (todayData?.lastFetched || tomorrowData?.lastFetched || yesterdayData?.lastFetched);

  return (
    <section className="space-y-6">
      {/* Header */}
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
        
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border rounded-full hover:bg-secondary transition-colors text-foreground disabled:opacity-50 backdrop-blur-md"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          Sync
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 || sections.every(s => s.matches.length === 0) ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground font-medium">No matches available right now.</p>
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
