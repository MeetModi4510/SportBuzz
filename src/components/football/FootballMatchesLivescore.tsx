import React, { useState } from 'react';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "../../lib/utils";
import { 
  useEspnLiveMatches,
  useEspnUpcomingMatches,
  useEspnRecentMatches,
} from "../../hooks/football/useEspnQueries";
import { useNavigate } from 'react-router-dom';
import { LivescoreMatchCard } from "./LivescoreMatchCard";

interface FootballMatchesLivescoreProps {
  variant?: 'dashboard' | 'hub';
}

export const FootballMatchesLivescore = ({ variant = 'dashboard' }: FootballMatchesLivescoreProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'live' | 'recent' | 'upcoming'>('live');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [recentSelectedDateIndex, setRecentSelectedDateIndex] = useState(0);

  // ─── Queries ─────────────────────────────────────────────────────────
  // Live: always enabled (loads on page mount)
  const { data: liveData, isLoading: liveLoading, refetch: refetchLive, isFetching: liveFetching } =
    useEspnLiveMatches(true);

  // Upcoming: only enabled when user clicks "Upcoming"
  const { data: upcomingData, isLoading: upcomingLoading, refetch: refetchUpcoming, isFetching: upcomingFetching } =
    useEspnUpcomingMatches(filter === 'upcoming');

  // Recent: only enabled when user clicks "Recent"
  const { data: recentData, isLoading: recentLoading, refetch: refetchRecent, isFetching: recentFetching } =
    useEspnRecentMatches(filter === 'recent');

  // ─── Derived state ────────────────────────────────────────────────────
  const liveMatches  = liveData?.data     || [];
  const hasLive      = liveMatches.length > 0;

  const handleManualRefresh = () => {
    refetchLive();
    if (filter === 'upcoming') refetchUpcoming();
    if (filter === 'recent')   refetchRecent();
  };

  const isRefreshing = liveFetching || upcomingFetching || recentFetching;
  const isLoading =
    (filter === 'live'     && liveLoading) ||
    (filter === 'upcoming' && upcomingLoading) ||
    (filter === 'recent'   && recentLoading);

  // ─── Date grouping logic ──────────────────────────────────────────────
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    ) {
      return 'Today';
    }
    if (
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate()
    ) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getUpcomingDates = () => {
    if (!upcomingData?.data) return [];
    const dates = new Set<string>();
    upcomingData.data.forEach((match: any) => {
      // Assuming match.startTime holds the date
      if (match.startTime) {
        const d = new Date(match.startTime);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return Array.from(dates);
  };

  const uniqueDates = getUpcomingDates();

  const getRecentDates = () => {
    if (!recentData?.data) return [];
    const dates = new Set<string>();
    recentData.data.forEach((match: any) => {
      // Assuming match.startTime holds the date
      if (match.startTime) {
        const d = new Date(match.startTime);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return Array.from(dates);
  };

  const uniqueRecentDates = getRecentDates();

  // ─── Build sections ───────────────────────────────────────────────────
  let sections: { title: string; matches: any[] }[] = [];

  if (variant === 'dashboard') {
    if (hasLive) {
      sections = [{ title: 'Live Matches', matches: liveMatches }];
    } else if (!liveLoading) {
      // Fall back to showing a mix of recent + upcoming when nothing is live
      const upcoming = (upcomingData?.data || []).slice(0, 2);
      const recent   = (recentData?.data   || []).slice(0, 2);
      const combined = [...upcoming, ...recent];
      if (combined.length > 0) {
        sections = [{ title: 'Featured Matches', matches: combined }];
      }
    }
  } else {
    // Hub variant
    if (filter === 'live') {
      if (hasLive) sections = [{ title: 'Live Matches', matches: liveMatches }];
    } else if (filter === 'upcoming') {
      const allMatches = upcomingData?.data || [];
      
      if (uniqueDates.length > 0) {
        // Ensure index is within bounds
        const safeIndex = Math.min(Math.max(selectedDateIndex, 0), uniqueDates.length - 1);
        const selectedDateStr = uniqueDates[safeIndex];
        
        const matches = allMatches.filter((m: any) => {
          if (!m.startTime) return false;
          const d = new Date(m.startTime);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateStr;
        });

        if (matches.length > 0) sections = [{ title: 'Upcoming Matches', matches }];
      } else {
         if (allMatches.length > 0) sections = [{ title: 'Upcoming Matches', matches: allMatches }];
      }
    } else if (filter === 'recent') {
      const allMatches = recentData?.data || [];
      
      if (uniqueRecentDates.length > 0) {
        // Ensure index is within bounds
        const safeIndex = Math.min(Math.max(recentSelectedDateIndex, 0), uniqueRecentDates.length - 1);
        const selectedDateStr = uniqueRecentDates[safeIndex];
        
        const matches = allMatches.filter((m: any) => {
          if (!m.startTime) return false;
          const d = new Date(m.startTime);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDateStr;
        });

        if (matches.length > 0) sections = [{ title: 'Recent Matches', matches }];
      } else {
         if (allMatches.length > 0) sections = [{ title: 'Recent Matches', matches: allMatches }];
      }
    }
  }

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
        
        <div className="flex items-center gap-4">
          {variant === 'hub' && (
            <div className="flex p-1 bg-secondary/60 backdrop-blur-xl rounded-full border border-border/50 overflow-x-auto max-w-full hide-scrollbar shadow-inner">
              <button 
                onClick={() => setFilter("live")} 
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300",
                  filter === 'live' ? 'bg-emerald-500 text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                )}
              >
                🔴 Live
              </button>
              <button 
                onClick={() => setFilter("recent")} 
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300",
                  filter === 'recent' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                )}
              >
                Recent
              </button>
              <button 
                onClick={() => setFilter("upcoming")} 
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-300",
                  filter === 'upcoming' ? 'bg-[#00c6ff] text-background shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                )}
              >
                Upcoming
              </button>
            </div>
          )}
          
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

      {/* Date Navigation Bar for Upcoming Matches */}
      {variant === 'hub' && filter === 'upcoming' && uniqueDates.length > 0 && (
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-between bg-secondary/30 backdrop-blur-md border border-border/50 rounded-full px-6 py-2.5 w-full max-w-full">
            <button 
              onClick={() => setSelectedDateIndex(prev => Math.max(0, prev - 1))}
              disabled={selectedDateIndex === 0}
              className="p-1 rounded-full hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-sm font-bold tracking-wide uppercase text-foreground">
                {formatDateLabel(
                  upcomingData?.data?.find((m: any) => {
                    const d = new Date(m.startTime);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === uniqueDates[selectedDateIndex];
                  })?.startTime || new Date().toISOString()
                )}
              </span>
            </div>

            <button 
              onClick={() => setSelectedDateIndex(prev => Math.min(uniqueDates.length - 1, prev + 1))}
              disabled={selectedDateIndex === uniqueDates.length - 1}
              className="p-1 rounded-full hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={18} className="text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Date Navigation Bar for Recent Matches */}
      {variant === 'hub' && filter === 'recent' && uniqueRecentDates.length > 0 && (
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-between bg-secondary/30 backdrop-blur-md border border-border/50 rounded-full px-6 py-2.5 w-full max-w-full">
            <button 
              onClick={() => setRecentSelectedDateIndex(prev => Math.max(0, prev - 1))}
              disabled={recentSelectedDateIndex === 0}
              className="p-1 rounded-full hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={18} className="text-foreground" />
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-sm font-bold tracking-wide uppercase text-foreground">
                {formatDateLabel(
                  recentData?.data?.find((m: any) => {
                    const d = new Date(m.startTime);
                    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === uniqueRecentDates[recentSelectedDateIndex];
                  })?.startTime || new Date().toISOString()
                )}
              </span>
            </div>

            <button 
              onClick={() => setRecentSelectedDateIndex(prev => Math.min(uniqueRecentDates.length - 1, prev + 1))}
              disabled={recentSelectedDateIndex === uniqueRecentDates.length - 1}
              className="p-1 rounded-full hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={18} className="text-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 || sections.every(s => s.matches.length === 0) ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-foreground/5 rounded-2xl border border-border">
          <p className="text-muted-foreground font-medium text-sm">
            {filter === 'live'
              ? 'No live matches right now. Try "Recent" or "Upcoming".'
              : `No ${filter} matches available.`}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">{section.title}</h3>
                <span className="text-xs text-muted-foreground/50 font-medium">({section.matches.length})</span>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {section.matches.map(match => (
                  <div key={match.id} className="snap-start shrink-0 w-[300px] md:w-[350px]">
                    <LivescoreMatchCard 
                      match={match} 
                      onClick={(m) => navigate(`/football/match/${m.id}`)} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
