import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SportFilter } from "@/components/SportFilter";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerComparison } from "@/components/PlayerComparison";
import { PlayerAnalysisPanel } from "@/components/PlayerAnalysisPanel";
import { TeamComparisonPanel } from "@/components/TeamComparisonPanel";
import { VenueAnalysisPanel } from "@/components/VenueAnalysisPanel";
import { SportIcon } from "@/components/SportIcon";
import { players, teams, venues } from "@/data/mockData";
import { Sport } from "@/data/types";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamLogo } from "@/components/TeamLogo";
import { cricketApi } from "@/services/api";
import { CricketPerformanceDashboard } from "@/components/cricket/CricketPerformanceDashboard";
import { FootballPerformanceDashboard } from "@/components/football/FootballPerformanceDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  TrendingUp,
  MapPin,
  Target,
  Zap,
  BarChart3,
  Loader2,
  GitCompare,
  ArrowLeft
} from "lucide-react";

const PerformanceLab = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { targetPlayerId?: string; targetPlayerName?: string; targetTeamName?: string; fromMatchUrl?: string } | null;
  
  const [activeSport, setActiveSport] = useState<Sport | "all">(state?.targetPlayerId ? "football" : "cricket");
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]);

  const filteredPlayers =
    activeSport === "all"
      ? players
      : players.filter((p) => p.sport === activeSport);

  // Chart data and visualization logic is handled by sub-components:
  // - PlayerAnalysisPanel (player stats + API data)
  // - TeamComparisonPanel
  // - VenueAnalysisPanel

  return (
    <>
      <Helmet>
        <title>Performance Lab - SportsBuzz Analytics</title>
        <meta
          name="description"
          content="Deep dive into player statistics, team comparisons, and venue analysis across all sports."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <section className="text-center space-y-4 py-6 relative">
            {state?.fromMatchUrl && (
              <button 
                onClick={() => navigate(state.fromMatchUrl!)}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-lg"
              >
                <ArrowLeft size={18} />
                <span className="font-semibold text-sm">Back to Match</span>
              </button>
            )}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full">
              <Zap className="text-primary" size={20} />
              <span className="text-sm font-medium text-primary uppercase tracking-wide">
                Performance Lab
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground">
              Deep Dive <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore player performance, team dynamics, and venue statistics.
            </p>
          </section>

          {/* Sport Filter Header */}
          <div className="flex justify-end mb-6">
            <SportFilter activeSport={activeSport} onSportChange={setActiveSport} />
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="players" className="w-full space-y-8">
            <div className="flex justify-between items-end border-b border-border/40">
              <TabsList className="w-full justify-start bg-transparent p-0 rounded-none h-12 gap-6 overflow-x-auto hide-scrollbar border-0">
                <TabsTrigger
                  value="players"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent flex items-center gap-2"
                >
                  <Users size={16} />
                  Player Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent flex items-center gap-2"
                >
                  <GitCompare size={16} />
                  Player VS Player
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent flex items-center gap-2"
                >
                  <Target size={16} />
                  Team Comparison
                </TabsTrigger>
                <TabsTrigger
                  value="venues"
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent flex items-center gap-2"
                >
                  <MapPin size={16} />
                  Venue Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="players" className="space-y-8 animate-fade-in pt-4">
              {activeSport === "cricket" ? (
                <div className="min-h-[900px] border border-border rounded-xl">
                   <CricketPerformanceDashboard />
                </div>
              ) : activeSport === "football" ? (
                <div className="min-h-[900px] border border-border rounded-xl">
                   <FootballPerformanceDashboard initialState={state} />
                </div>
              ) : (
                <PlayerAnalysisPanel activeSport={activeSport} />
              )}
            </TabsContent>

            {/* Player Comparison Tab */}
            <TabsContent value="comparison" className="space-y-8 animate-fade-in">
              <PlayerComparison activeSport={activeSport} />
            </TabsContent>

            {/* Team Comparison Tab */}
            <TabsContent value="teams" className="space-y-6 animate-fade-in">
              <TeamComparisonPanel />
            </TabsContent>

            {/* Venue Analysis Tab */}
            <TabsContent value="venues" className="space-y-6 animate-fade-in">
              <VenueAnalysisPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default PerformanceLab;
