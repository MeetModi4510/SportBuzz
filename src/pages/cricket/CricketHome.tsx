import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { MatchSection } from "../../components/MatchSection";
import { CricketNewsSection } from "../../components/cricket/CricketNewsSection";
import { CricketRankings } from "../../components/cricket/CricketRankings";
import { CricketTrendingPlayers } from "../../components/cricket/CricketTrendingPlayers";
import { useFeaturedLiveCricketMatches, useFeaturedUpcomingCricketMatches, useFeaturedRecentCricketMatches } from "../../hooks/useFeaturedMatches";
import { Loader2 } from "lucide-react";
import { Match } from "../../data/types";

export default function CricketHome() {
  const navigate = useNavigate();
  const { data: liveData, isLoading: liveLoading } = useFeaturedLiveCricketMatches();
  const { data: upcomingData, isLoading: upcomingLoading } = useFeaturedUpcomingCricketMatches(true);
  const { data: recentData, isLoading: recentLoading } = useFeaturedRecentCricketMatches(true);

  const isLoading = liveLoading || upcomingLoading || recentLoading;

  const currentMatches = useMemo(() => {
    const matches = [];
    if (liveData) {
      matches.push(...(liveData.test || []), ...(liveData.odi || []), ...(liveData.t20 || []));
    }
    if (upcomingData) {
      matches.push(...(upcomingData.test || []), ...(upcomingData.odi || []), ...(upcomingData.t20 || []));
    }
    if (recentData) {
      matches.push(...(recentData.test || []), ...(recentData.odi || []), ...(recentData.t20 || []));
    }
    return matches;
  }, [liveData, upcomingData, recentData]);

  const handleMatchClick = (matchId: string) => {
    navigate(`/match/${matchId}`, { state: { from: 'cricket-hub', section: 'matches' } });
  };

  return (
    <>
      <Helmet>
        <title>Cricket Center | SportsBuzz</title>
        <meta name="description" content="Live cricket scores, recent results, rankings, trending players and upcoming fixtures." />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        <main className="container mx-auto px-4 py-6 space-y-12">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/40 pb-4">
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-3">
              <span className="text-2xl">🏏</span> Cricket Center
            </h1>
          </div>

          {/* Matches Area */}
          <div className="min-h-[300px]">
             {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                </div>
              ) : (
                <MatchSection
                  title="Fixtures & Results"
                  sport="cricket"
                  matches={currentMatches}
                  onMatchClick={(match) => handleMatchClick(match.id)}
                  isLoading={false}
                />
              )}
          </div>

          {/* Deep Dive Content - Matches dashboard style layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12">
            <div className="lg:col-span-3">
              <CricketNewsSection />
            </div>
            <div className="lg:col-span-2">
              <CricketRankings />
            </div>
          </div>

          <div id="trending-players" className="mt-8">
            <CricketTrendingPlayers />
          </div>

        </main>
      </div>
    </>
  );
}
