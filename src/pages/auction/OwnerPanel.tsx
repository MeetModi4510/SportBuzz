import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auctionApi, playerApi } from "@/services/api";
import { getSocket } from "@/services/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  TrendingUp, 
  User, 
  Shield, 
  Users, 
  AlertTriangle, 
  Trophy, 
  Home, 
  LogOut, 
  BadgeCheck, 
  LayoutGrid, 
  PieChart, 
  Gavel, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Zap,
  Star,
  Loader2,
  TrendingDown,
  Target,
  BarChart3,
  Search,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OwnerPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", accessCode: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [soldData, setSoldData] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const getTeamLogo = (teamId?: string) => {
    if (!teamId || !auction) return null;
    const team = auction.teams.find((t: any) => t._id === teamId);
    return team?.logo || null;
  };

  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradeForm, setTradeForm] = useState<any>({
    toTeamId: "",
    fromPlayers: [],
    toPlayers: [],
    cash: 0,
    tradeType: "PlayerSwap"
  });

  const fetchTrades = async () => {
    try {
      const res: any = await (auctionApi as any).getTrades(id!);
      if (res.success) setTrades(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    if (isLoggedIn) fetchTrades();
  }, [id, isLoggedIn]);

  const handleTradeResponse = async (tradeId: string, status: 'Accepted' | 'Rejected') => {
    try {
      const res: any = await (auctionApi as any).respondToTrade(id!, tradeId, status);
      if (res.success) {
        toast.success(`Trade ${status.toLowerCase()} successfully`);
        fetchTrades();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const submitTradeProposal = async () => {
    if (!tradeForm.toTeamId) {
      toast.error("Please select a target team");
      return;
    }
    
    // Auto-calculate trade type based on inputs
    let actualType = "PlayerSwap";
    if (tradeForm.cash !== 0) {
      actualType = tradeForm.fromPlayers.length > 0 || tradeForm.toPlayers.length > 0 ? "PlayerCash" : "CashOnly";
    }

    try {
      const res: any = await (auctionApi as any).createTrade(id!, {
        ...tradeForm,
        fromTeamId: myTeam._id,
        tradeType: actualType
      });
      if (res.success) {
        toast.success("Trade proposal dispatched!");
        fetchTrades();
        setTradeForm({ toTeamId: "", fromPlayers: [], toPlayers: [], cash: 0, tradeType: "PlayerSwap" });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to propose trade");
    }
  };
  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€"
  };
  const symbol = auction?.currency ? currencySymbols[auction.currency] : "$";

  useEffect(() => {
    const saved = localStorage.getItem(`auction_auth_${id}`);
    if (saved) {
      const { email, accessCode } = JSON.parse(saved);
      handleLogin(email, accessCode);
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleLogin = async (email: string, accessCode: string) => {
    setLoading(true);
    try {
      const res: any = await auctionApi.ownerLogin(id!, email, accessCode);
      if (res.success) {
        setAuction(res.auction);
        setMyTeam(res.team);
        setIsLoggedIn(true);
        localStorage.setItem(`auction_auth_${id}`, JSON.stringify({ email, accessCode }));
        toast.success(`Logged in as ${res.team.name}`);
        
        // Join socket room
        const socket = getSocket();
        
        // Clean up old listeners first
        socket.off("connect");
        socket.off("bid_update");
        socket.off("auction_update");
        socket.off("trade_update");
        socket.off("player_sold");

        const joinRoom = () => {
          socket.emit("join_auction", id);
        };

        joinRoom();

        socket.on("connect", () => {
          joinRoom();
          // Re-fetch auction state on reconnect (without re-running full login)
          auctionApi.ownerLogin(id!, email, accessCode).then((r: any) => {
            if (r.success) {
              setAuction(r.auction);
              const team = r.auction.teams.find((t: any) => t.captainEmail === email);
              if (team) setMyTeam(team);
            }
          }).catch(() => {});
        });

        socket.on("bid_update", (data: any) => {
          setAuction((prev: any) => {
            if (!prev) return prev;
            const newHistory = prev.bidHistory ? [...prev.bidHistory, data] : [data];
            return { ...prev, currentBid: data, bidHistory: newHistory };
          });
        });
        socket.on("auction_update", (data: any) => {
           setAuction(data);
           const team = data.teams.find((t: any) => t.captainEmail === email);
           if (team) setMyTeam(team);
        });

        socket.on("trade_update", () => {
            fetchTrades();
        });

         socket.on("player_sold", (data: any) => {
            setSoldData(data);
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#22c55e', '#ffffff', '#fbbf24']
            });
            setTimeout(() => setSoldData(null), 5000);
         });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Login failed");
      localStorage.removeItem(`auction_auth_${id}`);
    } finally {
      setLoading(false);
    }
  };

  // Polling fallback for OwnerPanel - syncs auction state every 5 seconds
  useEffect(() => {
    if (!isLoggedIn || !id) return;
    const saved = localStorage.getItem(`auction_auth_${id}`);
    if (!saved) return;
    const { email, accessCode } = JSON.parse(saved);
    
    const pollInterval = setInterval(async () => {
      try {
        const res: any = await auctionApi.ownerLogin(id!, email, accessCode);
        if (res.success) {
          setAuction(res.auction);
          const team = res.auction.teams.find((t: any) => t.captainEmail === email);
          if (team) setMyTeam(team);
        }
      } catch {}
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [isLoggedIn, id]);

  useEffect(() => {
    if (auction?.currentPlayer?.name) {
      fetchPlayerStats(auction.currentPlayer.name);
    } else {
      setPlayerStats(null);
    }
  }, [auction?.currentPlayer?.name]);

  const fetchPlayerStats = async (playerName: string) => {
    setLoadingStats(true);
    try {
      const res: any = await playerApi.getStats(playerName);
      if (res.success) {
        setPlayerStats(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch player stats", e);
      setPlayerStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const placeBid = async (amount: number) => {
    if (amount <= auction.currentBid.amount) {
      toast.error("Bid must be higher than current bid");
      return;
    }
    if (amount > myTeam.budgetRemaining) {
      toast.error("Insufficient budget!");
      return;
    }

    const advice = getBudgetAdvice(amount);
    if (advice?.level === 'critical') {
      if (!window.confirm("CRITICAL WARNING: This bid will deplete your budget significantly. Are you absolutely sure you want to proceed?")) {
        return;
      }
    }

    setBidding(true);
    try {
      const res: any = await auctionApi.placeBid(id!, { teamId: myTeam._id, amount });
      if (res.success) {
        // Socket will handle the UI update
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to place bid");
    } finally {
      setBidding(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`auction_auth_${id}`);
    setIsLoggedIn(false);
    setMyTeam(null);
    setAuction(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Team Captain Login</CardTitle>
            <CardDescription>Enter your credentials to access the bidding console.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input 
                placeholder="Email Address" 
                value={loginData.email} 
                onChange={e => setLoginData({...loginData, email: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Access Code" 
                value={loginData.accessCode}
                onChange={e => setLoginData({...loginData, accessCode: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <Button className="w-full" onClick={() => handleLogin(loginData.email, loginData.accessCode)}>
              Login to Console
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAISuggestion = (bidAmount: number) => {
    if (!currentPlayer || !myTeam || !auction) return null;
    
    const remainingPlayersNeeded = Math.max(1, auction.minPlayersPerTeam - myTeam.players.length);
    const maxSafeBid = myTeam.budgetRemaining / remainingPlayersNeeded;
    
    const poolPlayer = auction.playerPool?.find((p: any) => p.name === currentPlayer.name);
    const rating = poolPlayer?.rating || 75;
    const basePrice = currentPlayer.basePrice || 1000000;
    
    const valueScore = rating / (basePrice / 1000000);
    
    let status = "✅ Good Deal";
    let color = "text-blue-400 bg-blue-500/10 border-blue-500/20";
    let icon = <TrendingUp size={14} />;

    if (valueScore > 10 && bidAmount <= maxSafeBid) {
      status = "🔥 Must Buy";
      color = "text-orange-400 bg-orange-500/10 border-orange-500/20";
      icon = <Zap size={14} className="fill-orange-400" />;
    } else if (bidAmount > maxSafeBid || valueScore < 4) {
      status = "⚠️ Overpriced";
      color = "text-red-400 bg-red-500/10 border-red-500/20";
      icon = <AlertTriangle size={14} />;
    }

    const suggestedBid = Math.min(maxSafeBid, Math.max(bidAmount + 100000, basePrice * 1.25));

    return { status, color, icon, suggestedBid, maxSafeBid };
  };

  const getBudgetAdvice = (nextBid: number) => {
    if (!auction || !myTeam) return null;
    
    const playersNeeded = Math.max(1, auction.minPlayersPerTeam - myTeam.players.length);
    const avgAllowance = myTeam.budgetRemaining / playersNeeded;
    
    if (nextBid > avgAllowance * 2.5) {
      return {
        level: 'critical',
        message: `CRITICAL: High budget depletion risk. Winning this leaves only ${symbol}${((myTeam.budgetRemaining - nextBid) / 1000000).toFixed(2)}M for ${playersNeeded - 1} remaining slots.`,
        icon: <TrendingDown size={14} />,
        color: 'text-red-400 bg-red-500/10 border-red-500/20'
      };
    } else if (nextBid > avgAllowance * 1.5) {
      return {
        level: 'high',
        message: `STRATEGIC RISK: Bidding 150%+ of average allowance (${symbol}${(avgAllowance/1000000).toFixed(2)}M). Ensure this player is core to your strategy.`,
        icon: <Zap size={14} />,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      };
    }
    
    return null;
  };

  const currentPlayer = auction?.currentPlayer;
  const currentBid = auction?.currentBid;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 relative overflow-hidden font-sans">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => window.location.href = '/auctions'} className="h-10 w-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700">
                <ArrowLeft size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="h-10 w-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700">
                <Home size={18} />
              </Button>
            </div>
            <div className="w-14 h-14 bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-blue-500/10 border border-slate-700">
              {myTeam.logo ? (
                <img src={myTeam.logo} alt={myTeam.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                   {myTeam.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{myTeam.name}</h1>
              <div className="flex items-center gap-2">
                 <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black tracking-[0.2em] uppercase">CAPTAIN CONSOLE</Badge>
                 <span className="text-xs text-slate-500 font-bold">• {myTeam.players.length} / {auction.minPlayersPerTeam} SQUAD</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 pr-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Max Bid Power</p>
              <div className="flex items-baseline justify-end gap-1">
                 <span className="text-sm font-black text-blue-500">{symbol}</span>
                 <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                   {((myTeam.budgetRemaining - (Math.max(0, auction.minPlayersPerTeam - myTeam.players.length - 1) * 100000)) / 1000000).toFixed(2)}
                 </p>
                 <span className="text-sm font-black text-blue-500 underline decoration-2 underline-offset-4">M</span>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Avg / Slot</p>
              <p className="text-xl font-black text-green-400">{symbol}{( (myTeam.budgetRemaining / Math.max(1, (auction.minPlayersPerTeam - myTeam.players.length))) / 1000000).toFixed(2)}M</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-10 w-10 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-2">
              <LogOut size={20} />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="bid" className="w-full">
           <div className="flex justify-start mb-6">
              <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-2xl h-12 shadow-2xl">
                 <TabsTrigger value="bid" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Zap size={14} className="mr-2" /> Action Center
                 </TabsTrigger>
                  <TabsTrigger value="market" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                     <PieChart size={14} className="mr-2" /> Strategy Hub
                  </TabsTrigger>
                  <TabsTrigger value="trade" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                     <Users size={14} className="mr-2" /> Trade Nexus
                  </TabsTrigger>
                  {auction && auction.status === 'Completed' && (
                     <Button 
                        variant="ghost" 
                        onClick={() => navigate(`/auction/analytics/${id}`)}
                        className="rounded-xl px-6 h-10 hover:bg-blue-500/10 text-blue-400 font-black uppercase tracking-widest text-[10px] border border-blue-500/20 ml-2"
                     >
                        <BarChart3 size={14} className="mr-2" /> View Analytics
                     </Button>
                  )}
               </TabsList>
            </div>

           <TabsContent value="bid" className="mt-0 space-y-6 outline-none">
              <div className="grid gap-6 lg:grid-cols-12 auto-rows-min">
                 {/* Main Control Panel */}
                 <div className="lg:col-span-8 space-y-6">
                    <Card className="bg-slate-900/40 backdrop-blur-2xl border-slate-800/60 overflow-hidden rounded-[2.5rem] shadow-2xl relative">
                       <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                <CardContent className="p-8 space-y-8">
                   {currentPlayer?.name ? (
                     <div className="space-y-8">
                        {/* Player Profile Header */}
                        <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-950/40 p-8 rounded-3xl border border-slate-800/50">
                           <div className="relative group">
                              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity" />
                              <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl relative overflow-hidden">
                                {currentPlayer.photo ? (
                                  <img src={currentPlayer.photo} className="w-full h-full object-cover" />
                                ) : (
                                  <User size={64} className="text-slate-700" />
                                )}
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center border-2 border-slate-950 shadow-lg">
                                 <Zap size={20} className="text-white fill-white" />
                              </div>
                           </div>
                           
                           <div className="text-center md:text-left flex-1 space-y-4">
                              <div>
                                 <h2 className="text-4xl font-black tracking-tight text-white mb-1 uppercase">{currentPlayer.name}</h2>
                                 <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                    <Badge className="bg-blue-600 hover:bg-blue-600 px-3 py-1 text-[10px] font-black tracking-[0.2em]">{currentPlayer.role}</Badge>
                                    <Badge variant="outline" className="border-slate-700 bg-slate-900/50 text-slate-400 px-3 py-1 text-[10px] font-bold uppercase">{currentPlayer.category}</Badge>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/30 px-3 py-1 rounded-full">
                                       <Target size={12} className="text-blue-500" /> BASE: {symbol}{(currentPlayer.basePrice / 1000000).toFixed(2)}M
                                    </div>
                                 </div>
                              </div>

                              {/* Stats Grid */}
                              {loadingStats ? (
                                <div className="flex items-center gap-4 text-slate-500">
                                   <Loader2 className="animate-spin" size={16} />
                                   <span className="text-xs font-bold uppercase tracking-widest">Loading career analytics...</span>
                                </div>
                              ) : playerStats ? (
                                 <div className="space-y-4 w-full">
                                    <div className="grid grid-cols-4 gap-2 w-full">
                                       {[
                                          { label: 'Runs', val: playerStats.runs || '0' },
                                          { label: 'Avg', val: playerStats.average || '0.0' },
                                          { label: 'S/R', val: playerStats.strikeRate || '0.0' },
                                          { label: 'Wkts', val: playerStats.wickets || '0' }
                                       ].map((s, idx) => (
                                          <div key={idx} className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 text-center">
                                             <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">{s.label}</p>
                                             <p className="text-sm font-black text-blue-400">{s.val}</p>
                                          </div>
                                       ))}
                                    </div>

                                    {/* Analytical Insights (Strengths & Weaknesses) */}
                                    {playerStats.traits && playerStats.traits.length > 0 && (
                                       <div className="space-y-3">
                                          <div className="flex items-center gap-2 opacity-40">
                                             <div className="h-px flex-1 bg-slate-700" />
                                             <span className="text-[8px] font-black uppercase tracking-[0.2em]">Analytical Insights</span>
                                             <div className="h-px flex-1 bg-slate-700" />
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                             {/* Strengths */}
                                             <div className="space-y-1.5">
                                                <p className="text-[7px] font-black text-green-500 uppercase tracking-widest pl-1">Key Strengths</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                   {playerStats.traits.filter((t: any) => t.type === 'strength').map((t: any, idx: number) => (
                                                      <Badge key={idx} className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] py-0.5 px-2 font-bold flex items-center gap-1 normal-case">
                                                         <span>{t.icon}</span> {t.title}
                                                      </Badge>
                                                   ))}
                                                   {playerStats.traits.filter((t: any) => t.type === 'strength').length === 0 && (
                                                      <span className="text-[8px] text-slate-600 italic pl-1">No standout strengths detected</span>
                                                   )}
                                                </div>
                                             </div>

                                             {/* Weaknesses */}
                                             <div className="space-y-1.5">
                                                <p className="text-[7px] font-black text-red-500 uppercase tracking-widest pl-1">Critical Blind Spots</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                   {playerStats.traits.filter((t: any) => t.type === 'weakness').map((t: any, idx: number) => (
                                                      <Badge key={idx} className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] py-0.5 px-2 font-bold flex items-center gap-1 normal-case">
                                                         <span>{t.icon}</span> {t.title}
                                                      </Badge>
                                                   ))}
                                                   {playerStats.traits.filter((t: any) => t.type === 'weakness').length === 0 && (
                                                      <span className="text-[8px] text-slate-600 italic pl-1">No major weaknesses identified</span>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                               ) : (
                                <p className="text-[10px] text-slate-600 font-bold uppercase italic tracking-widest">Global player profile not found in database</p>
                              )}
                           </div>
                        </div>

                         {/* AI Bidding Suggestion */}
                         {getAISuggestion(currentBid.amount) && (
                            <div className={`p-5 rounded-[2rem] border-2 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-700 bg-slate-950/40 mb-6 border-slate-800/50 shadow-2xl relative overflow-hidden group`}>
                               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                  <BarChart3 size={60} />
                               </div>
                               <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${getAISuggestion(currentBid.amount)?.color.split(' ')[1]} shadow-lg`}>
                                        {getAISuggestion(currentBid.amount)?.icon}
                                     </div>
                                     <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tactical Radar</span>
                                        <span className="text-[11px] font-black text-white uppercase tracking-tight italic">AI Strategic Advisor</span>
                                     </div>
                                  </div>
                                  <Badge className={`${getAISuggestion(currentBid.amount)?.color} border-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg`}>
                                     {getAISuggestion(currentBid.amount)?.status}
                                  </Badge>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/50 relative z-10">
                                  <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
                                     <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <Target size={8} /> Target Entry
                                     </p>
                                     <p className="text-lg font-black text-blue-400 italic tabular-nums">{symbol}{(getAISuggestion(currentBid.amount)!.suggestedBid / 1000000).toFixed(2)}M</p>
                                  </div>
                                  <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50 text-right">
                                     <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                                        Budget Ceiling <Shield size={8} />
                                     </p>
                                     <p className="text-lg font-black text-slate-400 italic tabular-nums">{symbol}{(getAISuggestion(currentBid.amount)!.maxSafeBid / 1000000).toFixed(2)}M</p>
                                  </div>
                               </div>
                            </div>
                         )}

                        {/* Budget Strategy Advisor */}
                        {getBudgetAdvice(currentBid.amount + 100000) && (
                           <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 mb-6 ${getBudgetAdvice(currentBid.amount + 100000)?.color}`}>
                              <div className="shrink-0">{getBudgetAdvice(currentBid.amount + 100000)?.icon}</div>
                              <p className="text-[10px] font-black uppercase tracking-tight leading-relaxed">
                                 {getBudgetAdvice(currentBid.amount + 100000)?.message}
                              </p>
                           </div>
                        )}

                        {/* Bid Interface Core */}
                        <div className="grid md:grid-cols-2 gap-6">
                           {/* Reduced Price Display */}
                           <div className="bg-slate-950/80 p-8 rounded-[2rem] border-2 border-blue-500/20 text-center relative overflow-hidden group/bid shadow-2xl ring-4 ring-blue-500/5">
                              <div className="absolute inset-x-0 -top-10 h-20 bg-blue-500/5 blur-3xl rounded-full animate-pulse pointer-events-none" />
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 relative z-10 opacity-70">Live High Bid</p>
                              <div className="flex items-center justify-center gap-2 relative z-10 mb-4 scale-105">
                                 <span className="text-2xl font-black text-blue-500 italic mb-1">{symbol}</span>
                                 <span className="text-6xl font-black text-white leading-none tracking-tighter tabular-nums drop-shadow-lg">
                                    {((currentBid.amount || 0) / 1000000).toFixed(2)}
                                 </span>
                                 <span className="text-2xl font-black text-blue-500 italic mb-1 underline decoration-blue-500 decoration-4 underline-offset-4">M</span>
                              </div>
                               <div className="flex items-center justify-center gap-3 relative z-10">
                                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden">
                                     {currentBid.teamLogo ? <img src={currentBid.teamLogo} className="w-full h-full object-cover" /> : (currentBid.teamName || "T").charAt(0)}
                                  </div>
                                  <Badge variant="outline" className="h-8 px-4 rounded-lg border-blue-500/30 bg-blue-500/5 text-blue-400 font-black text-[10px] uppercase tracking-widest italic shadow-lg shadow-blue-500/5">
                                     {currentBid.teamName || "NO BIDS YET"}
                                  </Badge>
                               </div>
                           </div>

                           {/* Granular Control Console */}
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Precision Bidding Controls</p>
                              <div className="grid grid-cols-2 gap-3">
                                 {[
                                    { inc: 100000, label: '+ 0.1M' },
                                    { inc: 250000, label: '+ 0.25M' },
                                    { inc: 500000, label: '+ 0.5M' },
                                    { inc: 1000000, label: '+ 1.0M' }
                                 ].map((opt, idx) => (
                                    <Button 
                                       key={idx}
                                       className={`h-14 font-black flex flex-col items-center justify-center transition-all ${
                                          idx === 2 ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 col-span-1' : 
                                          idx === 3 ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 col-span-1' :
                                          'bg-slate-800/80 hover:bg-slate-700 border border-slate-700'
                                       }`}
                                       onClick={() => placeBid(currentBid.amount + opt.inc)}
                                       disabled={bidding}
                                    >
                                       <span className="text-xs opacity-60 font-medium">INCREMENT</span>
                                       <span className="text-lg tracking-tighter italic">{symbol}{opt.label.replace('+ ', '').replace(symbol, '')}</span>
                                    </Button>
                                 ))}
                              </div>
                              <Button 
                                 className="w-full h-10 bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white"
                                 onClick={() => placeBid(currentBid.amount + 100000)}
                                 disabled={bidding}
                              >
                                 Smallest Jump (+ {symbol}0.1M)
                              </Button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="py-24 text-center space-y-4 bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-800 border-dashed animate-pulse">
                           <Loader2 className="animate-spin text-slate-700" size={32} />
                        </div>
                        <p className="text-sm font-black text-slate-600 uppercase tracking-[0.3em]">Waiting for Global Draw...</p>
                     </div>
                   )}
                </CardContent>
              </Card>

              {/* Bid History & Momentum */}
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/60 rounded-[2rem] overflow-hidden">
                <CardHeader className="py-4 border-b border-slate-800/50">
                   <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                         <BarChart3 size={14} className="text-blue-500" /> Bidding Momentum
                      </CardTitle>
                      <Badge variant="outline" className="border-slate-800 text-slate-500 text-[8px]">{auction.bidHistory?.length || 0} TOTAL BIDS</Badge>
                   </div>
                </CardHeader>
                <CardContent className="p-4">
                   <ScrollArea className="h-[120px] w-full pr-4">
                      <div className="space-y-2">
                         {auction.bidHistory && auction.bidHistory.length > 0 ? (
                           auction.bidHistory.slice().reverse().map((bid: any, idx: number) => (
                             <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${idx === 0 ? 'bg-blue-600/10 border-blue-500/30 scale-[1.02]' : 'bg-slate-950/40 border-slate-800/20 opacity-60 hover:opacity-100'}`}>
                                 <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black overflow-hidden shrink-0 ${idx === 0 ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-slate-800'}`}>
                                       {bid.teamLogo ? <img src={bid.teamLogo} className="w-full h-full object-cover" /> : bid.teamName?.charAt(0)}
                                    </div>
                                    <span className="font-black text-xs text-white uppercase tracking-tight">{bid.teamName}</span>
                                 </div>
                                <div className="flex items-center gap-3">
                                   <span className={`font-black italic text-sm ${idx === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{symbol}{(bid.amount / 1000000).toFixed(2)}M</span>
                                   {idx === 0 && <TrendingUp size={12} className="text-blue-500" />}
                                </div>
                             </div>
                           ))
                         ) : (
                           <p className="text-center py-8 text-slate-700 text-[10px] font-black uppercase tracking-widest italic">Awaiting first tactical bid</p>
                         )}
                      </div>
                   </ScrollArea>
                </CardContent>
              </Card>
           </div>

           {/* Squad & Intelligence Zone */}
           <div className="lg:col-span-4 space-y-6">
              {/* My Dynamic Squad */}
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/60 rounded-[2rem] overflow-hidden shadow-2xl">
                <CardHeader className="pb-2">
                   <div className="flex justify-between items-center">
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Users size={14} className="text-blue-500" /> My Squad ({myTeam.players.length})
                      </CardTitle>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[8px] font-black uppercase">
                        {symbol}{((myTeam.players.reduce((sum: number, p: any) => sum + (p.price || 0), 0)) / 1000000).toFixed(2)}M SPENT
                      </Badge>
                   </div>
                </CardHeader>
                <CardContent className="space-y-3">
                   <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                         {myTeam.players.map((p: any, i: number) => (
                           <div key={i} className="flex justify-between items-center p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50 group hover:border-blue-500/30 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-[10px] text-slate-600 border border-slate-800">
                                   {i + 1}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="font-black text-xs text-white uppercase truncate max-w-[120px]">{p.name}</p>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{p.role}</p>
                                 </div>
                              </div>
                              <p className="text-blue-400 font-black italic text-xs tabular-nums">{symbol}{((p.price || 0) / 1000000).toFixed(2)}M</p>
                           </div>
                         ))}
                         {myTeam.players.length === 0 && (
                           <div className="py-20 text-center space-y-3 opacity-20 capitalize">
                              <Shield size={40} className="mx-auto text-slate-500" />
                              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500">Awaiting squad formation...</p>
                           </div>
                         )}
                      </div>
                   </ScrollArea>
                </CardContent>
              </Card>

              {/* Competition Intelligence Radar */}
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/60 rounded-[2rem] overflow-hidden shadow-2xl">
                <CardHeader className="pb-2">
                   <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <TrendingDown size={14} className="text-red-500" /> Market Intelligence
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {auction.teams.filter((t: any) => t._id !== myTeam._id).map((t: any, i: number) => {
                     const isHighBudget = t.budgetRemaining > myTeam.budgetRemaining;
                     return (
                       <div key={i} className="group p-3 rounded-2xl bg-slate-950/20 border border-transparent hover:border-slate-800/50 hover:bg-slate-950/40 transition-all">
                          <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isHighBudget ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{t.name}</span>
                             </div>
                             <span className={`text-[10px] font-black tabular-nums ${isHighBudget ? 'text-red-400' : 'text-slate-400'}`}>
                               {symbol}{(t.budgetRemaining / 1000000).toFixed(1)}M
                             </span>
                          </div>
                          <div className="flex gap-1 overflow-hidden h-1.5 bg-slate-900 rounded-full ring-2 ring-slate-950/50">
                             <div className={`transition-all duration-1000 ${isHighBudget ? 'bg-red-600/60 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-blue-600/60'}`} 
                                  style={{ width: `${(t.players.length / auction.minPlayersPerTeam) * 100}%` }} />
                          </div>
                          <div className="flex justify-between mt-1 opacity-40 text-[7px] font-black uppercase tracking-widest">
                             <span>{t.players.length} Bought</span>
                             <span>{auction.minPlayersPerTeam - t.players.length} Needed</span>
                          </div>
                       </div>
                     );
                   })}
                </CardContent>
              </Card>

              {/* Quick Info Tip */}
              <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-500/10 text-center">
                 <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Winning Strategy Tip</p>
                 <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    "Monitor the Market Intelligence radar carefully. Red alerts indicate teams with higher budgets who can outbid you for Marquee players."
                 </p>
              </div>
           </div>
           </div>
            </TabsContent>

            <TabsContent value="trade" className="mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
               <div className="grid lg:grid-cols-12 gap-8">
                  {/* Trade Creation Logic */}
                  <div className="lg:col-span-7 space-y-6">
                     <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                        <CardHeader className="p-8 border-b border-slate-800/50 flex justify-between items-center">
                           <div>
                              <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Propose New Trade</CardTitle>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Player exchanges & Cash deals</p>
                           </div>
                           {auction.tradeDeadline && (
                              <div className="text-right">
                                 <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Trade Deadline</p>
                                 <p className={`text-xs font-black ${new Date() > new Date(auction.tradeDeadline) ? 'text-red-500' : 'text-orange-500'}`}>
                                    {new Date(auction.tradeDeadline).toLocaleString()}
                                 </p>
                              </div>
                           )}
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 relative">
                           {auction.status !== 'Completed' && (
                              <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem]">
                                 <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 mb-6">
                                    <Zap size={32} className="text-orange-500" />
                                 </div>
                                 <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Trade Protocol Locked</h3>
                                 <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs">
                                    The Trade Nexus activates automatically once the Live Auction is officially marked as <span className="text-orange-500 italic">Completed</span> by the Commissioner.
                                 </p>
                              </div>
                           )}

                           {auction.tradeDeadline && new Date() > new Date(auction.tradeDeadline) && (
                              <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem]">
                                 <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
                                    <AlertTriangle size={32} className="text-red-500" />
                                 </div>
                                 <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Deadline Expired</h3>
                                 <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs">
                                    The official trade window has closed. No further proposals can be initialized for this session.
                                 </p>
                              </div>
                           )}
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Franchise</label>
                              <select 
                                 className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-14 px-6 text-sm font-bold text-white focus:ring-2 ring-orange-500/20 outline-none appearance-none"
                                 value={tradeForm.toTeamId}
                                 onChange={(e) => setTradeForm({...tradeForm, toTeamId: e.target.value, toPlayers: []})}
                              >
                                 <option value="">Select a team...</option>
                                 {auction.teams.filter((t: any) => t._id !== myTeam._id).map((t: any) => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                 ))}
                              </select>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8">
                              {/* Give Players */}
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                    <ArrowRight size={10} /> Players to Give
                                 </p>
                                 <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {myTeam.players.map((p: any) => (
                                       <div key={p.name} className={`flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border transition-all ${tradeForm.fromPlayers.some((fp: any) => fp.name === p.name) ? 'border-red-500/40 bg-red-500/5' : 'border-slate-800/50'}`}>
                                          <input 
                                             type="checkbox" 
                                             checked={tradeForm.fromPlayers.some((fp: any) => fp.name === p.name)}
                                             onChange={(e) => {
                                                const next = e.target.checked 
                                                   ? [...tradeForm.fromPlayers, { playerId: p._id, name: p.name, role: p.role }]
                                                   : tradeForm.fromPlayers.filter((fp: any) => fp.name !== p.name);
                                                setTradeForm({...tradeForm, fromPlayers: next});
                                             }}
                                             className="w-5 h-5 rounded-lg border-slate-800 bg-slate-900 text-red-500 focus:ring-red-500/20"
                                          />
                                          <div className="min-w-0">
                                             <p className="text-xs font-black text-slate-200 uppercase truncate">{p.name}</p>
                                             <p className="text-[8px] text-slate-500 font-bold uppercase">{p.role}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Request Players */}
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <ArrowLeft size={10} /> Players to Request
                                 </p>
                                 <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {tradeForm.toTeamId ? (
                                       auction.teams.find((t: any) => t._id === tradeForm.toTeamId)?.players.map((p: any) => (
                                          <div key={p.name} className={`flex items-center gap-3 bg-slate-950 p-4 rounded-2xl border transition-all ${tradeForm.toPlayers.some((tp: any) => tp.name === p.name) ? 'border-green-500/40 bg-green-500/5' : 'border-slate-800/50'}`}>
                                             <input 
                                                type="checkbox" 
                                                checked={tradeForm.toPlayers.some((tp: any) => tp.name === p.name)}
                                                onChange={(e) => {
                                                   const next = e.target.checked 
                                                      ? [...tradeForm.toPlayers, { playerId: p._id, name: p.name, role: p.role }]
                                                      : tradeForm.toPlayers.filter((tp: any) => tp.name !== p.name);
                                                   setTradeForm({...tradeForm, toPlayers: next});
                                                }}
                                                className="w-5 h-5 rounded-lg border-slate-800 bg-slate-900 text-green-500 focus:ring-green-500/20"
                                             />
                                             <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-200 uppercase truncate">{p.name}</p>
                                                <p className="text-[8px] text-slate-500 font-bold uppercase">{p.role}</p>
                                             </div>
                                          </div>
                                       ))
                                    ) : (
                                       <div className="h-[150px] flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-[2rem] bg-slate-950/20">
                                          <Users size={24} className="text-slate-800 mb-2" />
                                          <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Select target franchise</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4 pt-6 border-t border-slate-800/50">
                              <div className="flex justify-between items-center px-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Adjustment</label>
                                 <Badge variant="outline" className="text-[8px] border-slate-800 text-slate-500 font-black uppercase">Positive = You Pay Out</Badge>
                              </div>
                              <div className="relative group">
                                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black text-lg group-focus-within:scale-110 transition-transform">{symbol}</div>
                                 <input 
                                    type="number" 
                                    step="100000"
                                    placeholder="0.00"
                                    value={tradeForm.cash}
                                    onChange={(e) => setTradeForm({...tradeForm, cash: Number(e.target.value)})}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-3xl h-16 pl-14 pr-8 text-lg font-black text-white outline-none focus:ring-4 ring-orange-500/10 transition-all tabular-nums"
                                 />
                                 <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest">MILLIONS</div>
                              </div>
                           </div>

                           <Button 
                              onClick={submitTradeProposal}
                              className="w-full h-20 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-orange-600/20 flex items-center justify-center gap-4 group transition-all"
                           >
                              Initialize Trade Protocol <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                           </Button>
                        </CardContent>
                     </Card>
                  </div>

                  {/* Trade Activity Feed */}
                  <div className="lg:col-span-5 space-y-6">
                     <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                        <CardHeader className="p-8 border-b border-slate-800/50">
                           <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                              <History size={20} className="text-orange-500" /> Negotiation Feed
                           </CardTitle>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Real-time franchise intelligence</p>
                        </CardHeader>
                        <CardContent className="p-0">
                           <ScrollArea className="h-[700px] w-full">
                              <div className="divide-y divide-slate-800/50">
                                 {trades.length > 0 ? trades.map((trade, i) => {
                                    const isIncoming = trade.toTeamId === myTeam._id;
                                    const isOutgoing = trade.fromTeamId === myTeam._id;

                                    return (
                                       <div key={i} className="p-8 space-y-6 hover:bg-slate-950/40 transition-all group">
                                          <div className="flex justify-between items-start">
                                             <div className="space-y-2">
                                                <Badge className={`${
                                                   trade.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                   trade.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                   'bg-red-500/10 text-red-500 border-red-500/20'
                                                } text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border`}>
                                                   {trade.status}
                                                </Badge>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">
                                                   {isOutgoing ? `Offer to ${trade.toTeamName}` : `Request from ${trade.fromTeamName}`}
                                                </p>
                                             </div>
                                             <span className="text-[9px] text-slate-600 font-black uppercase tabular-nums">
                                                {new Date(trade.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                             </span>
                                          </div>

                                          <div className="grid grid-cols-2 gap-6 bg-slate-950/80 p-6 rounded-[2rem] border border-slate-800 shadow-inner relative overflow-hidden">
                                             <div className="space-y-3 relative z-10">
                                                <p className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                   <ArrowRight size={8} /> Giving
                                                </p>
                                                <div className="space-y-1.5">
                                                   {trade.fromPlayers.map((p: any) => (
                                                      <p key={p.name} className="text-[11px] text-slate-300 font-black uppercase tracking-tight truncate">
                                                         {p.name}
                                                      </p>
                                                   ))}
                                                   {trade.cash > 0 && <p className="text-xs text-orange-400 font-black italic">{symbol}{(trade.cash/1000000).toFixed(2)}M Cash</p>}
                                                   {trade.fromPlayers.length === 0 && trade.cash <= 0 && <p className="text-[10px] text-slate-700 italic">None</p>}
                                                </div>
                                             </div>
                                             <div className="space-y-3 border-l border-slate-800 pl-6 relative z-10">
                                                <p className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                   <ArrowLeft size={8} /> Receiving
                                                </p>
                                                <div className="space-y-1.5">
                                                   {trade.toPlayers.map((p: any) => (
                                                      <p key={p.name} className="text-[11px] text-slate-300 font-black uppercase tracking-tight truncate">
                                                         {p.name}
                                                      </p>
                                                   ))}
                                                   {trade.cash < 0 && <p className="text-xs text-green-400 font-black italic">{symbol}{(Math.abs(trade.cash)/1000000).toFixed(2)}M Cash</p>}
                                                   {trade.toPlayers.length === 0 && trade.cash >= 0 && <p className="text-[10px] text-slate-700 italic">None</p>}
                                                </div>
                                             </div>
                                          </div>

                                          {isIncoming && trade.status === 'Pending' && (
                                             <div className="flex gap-3">
                                                <Button 
                                                   onClick={() => handleTradeResponse(trade._id, 'Accepted')}
                                                   className="flex-1 bg-green-600 hover:bg-green-700 h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl shadow-green-600/20"
                                                >
                                                   Accept Offer
                                                </Button>
                                                <Button 
                                                   onClick={() => handleTradeResponse(trade._id, 'Rejected')}
                                                   variant="outline"
                                                   className="flex-1 bg-slate-900 border-slate-800 hover:bg-red-600 hover:border-red-600 text-red-500 hover:text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                                >
                                                   Reject
                                                </Button>
                                             </div>
                                          )}

                                          {trade.status === 'Accepted' && (
                                             <div className="flex flex-col items-center gap-3 py-4 bg-blue-600/5 rounded-2xl border border-blue-500/20 animate-pulse">
                                                <BadgeCheck size={20} className="text-blue-500" />
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] text-center px-4">
                                                   Nexus Protocol: Awaiting Commissioner Approval
                                                </p>
                                             </div>
                                          )}
                                       </div>
                                    );
                                 }) : (
                                    <div className="py-32 text-center space-y-4">
                                       <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800 opacity-20 capitalize">
                                          <Users size={32} />
                                       </div>
                                       <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">No active negotiations detected</p>
                                    </div>
                                 )}
                              </div>
                           </ScrollArea>
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="market" className="mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
              <div className="grid lg:grid-cols-12 gap-6">
                 {/* Player Pool Explorer */}
                 <div className="lg:col-span-8 space-y-6">
                    <Card className="bg-slate-900/40 border-slate-800 overflow-hidden rounded-[2.5rem]">
                       <CardHeader className="p-8 border-b border-slate-800/50 bg-slate-900/20">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div>
                                <CardTitle className="text-xl font-black text-white italic tracking-tighter uppercase">Market Explorer</CardTitle>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Browse Global Player Pool</p>
                             </div>
                             <div className="flex gap-2">
                                <div className="relative">
                                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                   <input 
                                      type="text" 
                                      placeholder="Search name..." 
                                      className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 ring-blue-500/20 w-44"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                   />
                                </div>
                                <select 
                                   className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-slate-400 focus:outline-none"
                                   value={filterCategory}
                                   onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                   <option value="All">All Roles</option>
                                   <option value="Batsman">Batsmen</option>
                                   <option value="Bowler">Bowlers</option>
                                   <option value="All-Rounder">All-Rounders</option>
                                   <option value="Wicketkeeper">Wicketkeepers</option>
                                </select>
                             </div>
                          </div>
                       </CardHeader>
                       <CardContent className="p-0">
                          <ScrollArea className="h-[600px] w-full">
                             <div className="divide-y divide-slate-800/50">
                                {auction.playerPool
                                   .filter(p => {
                                      const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                                      const matchCat = filterCategory === "All" || p.role === filterCategory;
                                      return matchName && matchCat;
                                   })
                                   .map((p, i) => (
                                      <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-900/40 transition-all group">
                                         <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 font-black text-slate-500 shadow-inner group-hover:scale-110 transition-transform">
                                               {p.photo ? <img src={p.photo} className="w-full h-full object-cover rounded-2xl" /> : p.name.charAt(0)}
                                            </div>
                                            <div>
                                               <p className="font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors drop-shadow-md">{p.name}</p>
                                               <div className="flex items-center gap-2 mt-0.5">
                                                  <Badge className="text-[8px] h-4 px-1 bg-slate-800 text-slate-400 border-slate-700">{p.role}</Badge>
                                                  <span className="text-[10px] text-slate-600 font-black uppercase">{p.category}</span>
                                               </div>
                                            </div>
                                         </div>
                                         <div className="text-right flex items-center gap-6">
                                            <div>
                                               <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-0.5">Market Value</p>
                                               <p className="font-black text-blue-400 italic tabular-nums">
                                                  {symbol}{( (p.status === 'Sold' ? p.soldPrice : p.basePrice) / 1000000).toFixed(2)}M
                                               </p>
                                            </div>
                                            <div className="w-20 text-center">
                                               {p.status === 'Sold' ? (
                                                  <div className="flex flex-col items-end">
                                                     <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20 mb-1">
                                                        {getTeamLogo(p.soldTo) ? <img src={getTeamLogo(p.soldTo)!} className="w-full h-full object-cover" /> : <Shield size={12} className="text-green-500" />}
                                                     </div>
                                                     <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter italic">Acquired</span>
                                                  </div>
                                               ) : p.status === 'Unsold' ? (
                                                  <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-black uppercase tracking-widest">Unsold</Badge>
                                               ) : (
                                                  <Badge className="bg-slate-500/10 text-slate-500 border-slate-800 text-[10px] font-black uppercase tracking-widest">Available</Badge>
                                               )}
                                            </div>
                                         </div>
                                      </div>
                                   ))
                                }
                             </div>
                          </ScrollArea>
                       </CardContent>
                    </Card>
                 </div>

                 {/* Rival Intelligence */}
                 <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden">
                       <CardHeader className="p-8 border-b border-slate-800/50">
                          <CardTitle className="text-xl font-black text-white italic tracking-tighter uppercase">Rival Roster Spy</CardTitle>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">Click profile for live roster</p>
                       </CardHeader>
                       <CardContent className="p-4 space-y-4">
                          {auction.teams.map((t: any, i: number) => (
                             <div key={i} className={`bg-slate-950/40 rounded-3xl border border-slate-800 overflow-hidden transition-all duration-300 ${expandedTeam === t._id ? 'ring-2 ring-blue-500/20 shadow-2xl scale-[1.02]' : 'hover:bg-slate-900/40'}`}>
                                <div 
                                   className="p-5 cursor-pointer flex items-center justify-between"
                                   onClick={() => setExpandedTeam(expandedTeam === t._id ? null : t._id)}
                                >
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-110 transition-transform">
                                         {t.logo ? <img src={t.logo} className="w-full h-full object-cover" /> : <Users className="text-slate-600" size={16} />}
                                      </div>
                                      <div>
                                         <p className="text-sm font-black text-white uppercase tracking-tight">{t.name === myTeam.name ? "YOUR TEAM" : t.name}</p>
                                         <p className="text-[10px] text-slate-500 font-black uppercase">{t.players.length} / {auction.minPlayersPerTeam} Players</p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-sm font-black text-blue-400 italic tabular-nums">{symbol}{(t.budgetRemaining / 1000000).toFixed(2)}M</p>
                                      <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Left</p>
                                   </div>
                                </div>
                                
                                {expandedTeam === t._id && (
                                   <div className="p-5 border-t border-slate-800/50 bg-slate-900/30 animate-in slide-in-from-top duration-300">
                                      <div className="space-y-4">
                                         <div className="flex justify-between items-end mb-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Composition</p>
                                            <p className="text-[10px] font-black text-blue-500 uppercase">Avg Slot: {symbol}{ ( (t.budgetRemaining / Math.max(1, (auction.minPlayersPerTeam - t.players.length))) / 1000000).toFixed(2)}M</p>
                                         </div>
                                         <div className="space-y-2">
                                            {t.players.length > 0 ? t.players.map((p: any, j: number) => (
                                               <div key={j} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                                                  <div className="flex items-center gap-3">
                                                     <span className="text-[10px] text-slate-600 font-black tabular-nums">{j+1}</span>
                                                     <div>
                                                        <p className="text-xs font-black text-white uppercase truncate max-w-[120px]">{p.name}</p>
                                                        <p className="text-[8px] text-blue-500 font-black uppercase tracking-tighter opacity-70">{p.role}</p>
                                                     </div>
                                                  </div>
                                                  <p className="text-xs font-black text-slate-400 italic tracking-tighter">{symbol}{(p.price / 1000000).toFixed(2)}M</p>
                                               </div>
                                            )) : (
                                               <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                                                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Awaiting strategy opening</p>
                                               </div>
                                            )}
                                         </div>
                                      </div>
                                   </div>
                                )}
                             </div>
                          ))}
                       </CardContent>
                    </Card>
                 </div>
              </div>
           </TabsContent>
        </Tabs>
      </div>
      {/* Player Sold Celebration Modal */}
      <Dialog open={!!soldData} onOpenChange={() => setSoldData(null)}>
        <DialogContent className="bg-slate-900/95 border-blue-500/50 text-white text-center p-12 max-w-lg backdrop-blur-xl">
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/30">
              <Trophy size={48} className="text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-blue-400">SOLD! 🎉</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Congratulations to</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-lg font-black text-white">
                    {soldData?.teamLogo ? <img src={soldData.teamLogo} className="w-full h-full object-cover" /> : (soldData?.teamName || "T").charAt(0)}
                 </div>
                 <p className={`text-3xl font-black ${soldData?.teamId === myTeam._id ? 'text-green-400' : 'text-white'}`}>
                   {soldData?.teamId === myTeam._id ? 'YOUR TEAM!' : soldData?.teamName}
                 </p>
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-1 text-center">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{soldData?.playerName}</p>
              <p className="text-xs text-slate-500 italic">added to squad</p>
              <div className="pt-4">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sold For</p>
                <p className="text-5xl font-black text-green-400">{symbol}{(soldData?.amount / 1000000).toFixed(2)}M</p>
              </div>
            </div>

            <Button onClick={() => setSoldData(null)} className="w-full bg-blue-600 hover:bg-blue-700 h-14 font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20">
               Continue Bidding
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
