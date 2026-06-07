import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../../components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { footballApiClient } from "../../services/football/apiClient";
import { cacheManager } from "../../utils/football/cacheManager";
import { Loader2, ArrowLeft } from "lucide-react";

type PlayerTab = "career" | "transfers" | "matches" | "analytics";

export default function PlayerProfile() {
  const { id, season } = useParams<{ id: string; season?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PlayerTab>("career");

  const currentYear = new Date().getFullYear();
  const fetchSeason = season || currentYear;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['football', 'player', id, fetchSeason],
    queryFn: async () => {
      if (!id) return null;
      const cacheKey = `player_${id}_${fetchSeason}`;
      const cached = cacheManager.get<any>(cacheKey);
      if (cached) return cached;

      const response = await footballApiClient.get('/players', { params: { id, season: fetchSeason } });
      const data = response.data.response?.[0];
      if (data) cacheManager.set(cacheKey, data, 24 * 60); // 24 hours
      return data || null;
    },
    refetchOnWindowFocus: false,
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <p className="text-xl font-semibold">Player not found</p>
          <button onClick={() => navigate('/football')} className="text-primary hover:underline">
            Back to Football Home
          </button>
        </div>
      </div>
    );
  }

  const player = profile.player;
  const stats = profile.statistics?.[0]; // Usually first item is current team stats

  return (
    <>
      <Helmet>
        <title>{player.name} | Player Profile</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        {/* Header */}
        <div className="bg-secondary/20 border-b border-border/40 pb-6 pt-4">
          <div className="container mx-auto px-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <img 
                src={player.photo} 
                alt={player.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-xl object-cover bg-secondary"
              />
              <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-foreground">
                  {player.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-sm font-medium">
                  {stats && (
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full border border-border/40">
                      <img src={stats.team.logo} alt={stats.team.name} className="w-4 h-4" />
                      <span>{stats.team.name}</span>
                    </div>
                  )}
                  <span className="text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full border border-border/40">
                    {player.nationality}
                  </span>
                  <span className="text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full border border-border/40">
                    {player.age} yrs
                  </span>
                  {stats?.games?.position && (
                    <span className="text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 font-bold">
                      {stats.games.position}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 mt-8">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-border/40 pb-2">
            {(["career", "transfers", "matches", "analytics"] as PlayerTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-t-lg text-sm font-semibold capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab 
                    ? "bg-primary/10 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "career" && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
              <div className="bg-secondary/10 border border-border/30 rounded-xl p-5 text-center flex flex-col gap-1">
                <span className="text-muted-foreground text-sm font-medium">Appearances</span>
                <span className="text-3xl font-black">{stats.games.appearences || 0}</span>
              </div>
              <div className="bg-secondary/10 border border-border/30 rounded-xl p-5 text-center flex flex-col gap-1">
                <span className="text-muted-foreground text-sm font-medium">Goals</span>
                <span className="text-3xl font-black">{stats.goals.total || 0}</span>
              </div>
              <div className="bg-secondary/10 border border-border/30 rounded-xl p-5 text-center flex flex-col gap-1">
                <span className="text-muted-foreground text-sm font-medium">Assists</span>
                <span className="text-3xl font-black">{stats.goals.assists || 0}</span>
              </div>
              <div className="bg-secondary/10 border border-border/30 rounded-xl p-5 text-center flex flex-col gap-1">
                <span className="text-muted-foreground text-sm font-medium">Rating</span>
                <span className="text-3xl font-black text-primary">{stats.games.rating ? parseFloat(stats.games.rating).toFixed(1) : '-'}</span>
              </div>
            </div>
          )}

          {activeTab !== "career" && (
            <div className="animate-in fade-in duration-300">
              <p className="text-center text-muted-foreground py-10 bg-secondary/10 rounded-xl border border-border/30">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} data loading to be implemented.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
