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
  GitCompare
} from "lucide-react";

const PerformanceLab = () => {
  const [activeSport, setActiveSport] = useState<Sport | "all">("all");
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]);
  const [playerAnalysis, setPlayerAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (selectedPlayer.sport === "cricket") {
        setIsLoadingAnalysis(true);
        try {
          const response = await cricketApi.getPlayerAnalysis(selectedPlayer.id);
          if (response.success) {
            setPlayerAnalysis(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch player analysis:", error);
        } finally {
          setIsLoadingAnalysis(false);
        }
      } else {
        setPlayerAnalysis(null);
      }
    };
    fetchAnalysis();
  }, [selectedPlayer]);

  const filteredPlayers =
    activeSport === "all"
      ? players
      : players.filter((p) => p.sport === activeSport);

  // Mock data for charts
  const playerFormData = [
    { match: "M1", performance: 78 },
    { match: "M2", performance: 85 },
    { match: "M3", performance: 72 },
    { match: "M4", performance: 91 },
    { match: "M5", performance: 88 },
    { match: "M6", performance: 95 },
    { match: "M7", performance: 82 },
    { match: "M8", performance: 89 },
    { match: "M9", performance: 94 },
    { match: "M10", performance: 87 },
  ];

  const radarData = [
    { attribute: "Speed", value: 85, fullMark: 100 },
    { attribute: "Power", value: 90, fullMark: 100 },
    { attribute: "Accuracy", value: 78, fullMark: 100 },
    { attribute: "Stamina", value: 88, fullMark: 100 },
    { attribute: "Technique", value: 92, fullMark: 100 },
    { attribute: "Mental", value: 85, fullMark: 100 },
  ];

  const teamComparisonData = [
    { name: "Offense", team1: 85, team2: 78 },
    { name: "Defense", team1: 72, team2: 88 },
    { name: "Midfield", team1: 80, team2: 82 },
    { name: "Form", team1: 90, team2: 75 },
    { name: "Experience", team1: 88, team2: 85 },
  ];

  const venueData = [
    { name: "Avg Score", value: 285 },
    { name: "High Score", value: 420 },
    { name: "Low Score", value: 145 },
  ];

  const COLORS = [
    "hsl(142, 76%, 45%)",
    "hsl(217, 91%, 60%)",
    "hsl(25, 95%, 53%)",
    "hsl(84, 85%, 50%)",
  ];

  return (
    <>
      <Helmet>
        <title>Performance Lab - SportBuzz Analytics</title>
        <meta
          name="description"
          content="Deep dive into player statistics, team comparisons, and venue analysis across all sports."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <section className="text-center space-y-4 py-6">
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

          {/* Sport Filter */}
          <SportFilter activeSport={activeSport} onSportChange={setActiveSport} />

          {/* Main Tabs */}
          <Tabs defaultValue="players" className="space-y-8">
            <TabsList className="w-full justify-start bg-secondary/50 p-1.5 rounded-xl overflow-x-auto">
              <TabsTrigger
                value="players"
                className="flex items-center gap-2 px-6"
              >
                <        Users size={18} />
                Player Analysis
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="flex items-center gap-2 px-6"
              >
                <GitCompare size={18} />
                Player VS Player
              </TabsTrigger>
              <TabsTrigger
                value="teams"
                className="flex items-center gap-2 px-6"
              >
                <Target size={18} />
                Team Comparison
              </TabsTrigger>
              <TabsTrigger
                value="venues"
                className="flex items-center gap-2 px-6"
              >
                <MapPin size={18} />
                Venue Analysis
              </TabsTrigger>
            </TabsList>

            {/* Player Analysis Tab */}
            <TabsContent value="players" className="space-y-8 animate-fade-in">
              <PlayerAnalysisPanel />
            </TabsContent>

            {/* Player Comparison Tab */}
            <TabsContent value="comparison" className="space-y-8 animate-fade-in">
              <PlayerComparison />
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
