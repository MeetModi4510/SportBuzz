import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { 
  Shield, 
  Users, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Trophy, 
  Flag, 
  Calendar,
  Activity,
  User
} from "lucide-react";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentManager } from "@/components/admin/TournamentManager";
import { TeamManager } from "@/components/admin/TeamManager";
import { MatchManager } from "@/components/admin/MatchManager";
import { UserManager } from "@/components/admin/UserManager";
import { PlayerManager } from "@/components/admin/PlayerManager";
import { PlatformSettings } from "@/components/admin/PlatformSettings";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { useSearchParams } from "react-router-dom";
import { adminApi } from "@/services/api";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  activeMatches: number;
  totalMatches: number;
  totalTournaments: number;
}

interface AdminDashboardProps {
  initialTab?: string;
  initialTournamentId?: string;
}

const AdminDashboard = ({ initialTab: propsInitialTab, initialTournamentId }: AdminDashboardProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("atab"); // Use 'atab' to avoid conflict with TournamentManager's 'tab'
  const activeTab = urlTab || propsInitialTab || "dashboard";

  const { id: urlId } = useParams<{ id: string }>();
  const tournamentId = initialTournamentId || urlId;
  const navigate = useNavigate();
  
  const setActiveTab = (t: string) => {
    const next = new URLSearchParams(searchParams);
    if (t === "dashboard") next.delete("atab");
    else next.set("atab", t);
    setSearchParams(next);
  };

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeMatches: 0,
    totalMatches: 0,
    totalTournaments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchStats = async () => {
    try {
      const response: any = await adminApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch admin stats:", error);
      const message = error.response?.data?.message || error.message || "Failed to load platform statistics";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userStr);
    // Check if user is admin or scorer
    if (user.role !== "admin" && user.role !== "scorer" && localStorage.getItem("isAdmin") !== "true") {
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchStats();
  }, [navigate]);

  if (!isAdmin) return null;

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - SportBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                <Shield className="text-red-500 w-10 h-10" />
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-2">Manage SportBuzz platform, Users & Tournaments</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Go to Website
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
              >
                <LogOut size={18} className="mr-2" />
                Exit Admin
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-slate-900 border border-slate-700 p-1 w-full md:w-auto h-auto flex-wrap">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <Trophy className="w-4 h-4 mr-2" />
                Tournaments
              </TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <Flag className="w-4 h-4 mr-2" />
                Teams
              </TabsTrigger>
              <TabsTrigger value="matches" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <Calendar className="w-4 h-4 mr-2" />
                Matches
              </TabsTrigger>
              <TabsTrigger value="players" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <User className="w-4 h-4 mr-2" />
                Players
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white px-6 py-2.5">
                <Activity className="w-4 h-4 mr-2" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/50 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">+12%</div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {isLoading ? "-" : stats.totalUsers}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-sm border-green-500/20 hover:border-green-500/40 transition-all group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="relative">
                        <Calendar className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-slate-900" />
                      </div>
                      <div className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">Live Now</div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Active Matches</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {isLoading ? "-" : stats.activeMatches}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/40 transition-all group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Flag className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-semibold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">Lifetime</div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Total Matches</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {isLoading ? "-" : stats.totalMatches}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 backdrop-blur-sm border-orange-500/20 hover:border-orange-500/40 transition-all group">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Trophy className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Total Tournaments</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {isLoading ? "-" : stats.totalTournaments}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Management Sections Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-700 shadow-xl overflow-hidden group">
                  <div className="h-1 bg-blue-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Users className="text-blue-500" />
                      Quick User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-400 text-sm">Review user roles, manage platform access, and monitor community growth.</p>
                    <Button 
                      onClick={() => setActiveTab("users")}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/20"
                    >
                      Manage All Users
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-900 border-slate-700 shadow-xl overflow-hidden">
                  <div className="h-1 bg-purple-500" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Settings className="text-purple-500" />
                      Platform Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-400 text-sm">Configure global settings, review audit logs, and monitor system health.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => setActiveTab("settings")}
                      >
                        Settings
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                        onClick={() => setActiveTab("logs")}
                      >
                        Audit Logs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">User Directory</h2>
                <Button onClick={fetchStats} variant="ghost" className="text-slate-400 hover:text-white">
                  Refresh Stats
                </Button>
              </div>
              <UserManager />
            </TabsContent>

            <TabsContent value="tournaments" className="animate-in slide-in-from-right-4 duration-500">
              <TournamentManager initialTournamentId={tournamentId} />
            </TabsContent>

            <TabsContent value="teams" className="animate-in slide-in-from-right-4 duration-500">
              <TeamManager />
            </TabsContent>

            <TabsContent value="matches" className="animate-in slide-in-from-right-4 duration-500">
              <MatchManager />
            </TabsContent>
            
            <TabsContent value="players" className="animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Player Directory</h2>
                <Button onClick={fetchStats} variant="ghost" className="text-slate-400 hover:text-white">
                  Refresh Data
                </Button>
              </div>
              <PlayerManager />
            </TabsContent>

            <TabsContent value="settings" className="animate-in slide-in-from-right-4 duration-500">
              <PlatformSettings />
            </TabsContent>

            <TabsContent value="logs" className="animate-in slide-in-from-right-4 duration-500">
              <AuditLogs />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
