import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auctionApi, teamApi, playerApi } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Gavel, Users, User, Trash2, Plus, Save, Loader2, Play, ArrowLeft, Home, ChevronDown, Settings, Upload, Coins, BarChart3, Activity, PieChart, History, BadgeCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AuctionControl } from "@/components/auction/AuctionControl";
import { getSocket } from "@/services/socket";
import confetti from 'canvas-confetti';
import { Trophy } from "lucide-react";

export default function AuctioneerPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<any>(null);
  const auctionRef = useRef<any>(null);
  
  // Track auction in ref for socket listeners
  useEffect(() => {
    auctionRef.current = auction;
  }, [auction]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€"
  };
  const symbol = auction?.currency ? currencySymbols[auction.currency] : "$";

  // Form states for setup
  const [teams, setTeams] = useState<any[]>([]);
  const [newPlayers, setNewPlayers] = useState("");
  const [bulkCategory, setBulkCategory] = useState("Unsold");
  const [bulkRole, setBulkRole] = useState("All Rounder");
  const [bulkBasePrice, setBulkBasePrice] = useState("1"); // 1M default

  // Individual Player Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [individualRole, setIndividualRole] = useState("Batsman");
  const [individualCategory, setIndividualCategory] = useState("Unsold");
  const [individualBasePrice, setIndividualBasePrice] = useState("1.0");
  const [soldData, setSoldData] = useState<any>(null);
  const [viewingTeam, setViewingTeam] = useState<any>(null);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTeamIdx, setUploadingTeamIdx] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    budgetPerTeam: 0,
    minPlayersPerTeam: 0,
    maxPlayersPerTeam: 0,
    currency: "USD"
  });

  const [trades, setTrades] = useState<any[]>([]);

  const fetchTrades = async () => {
    try {
      const res: any = await (auctionApi as any).getTrades(id!);
      if (res.success) setTrades(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    if (id) fetchTrades();
  }, [id]);

  const handleApproveTrade = async (tradeId: string) => {
    try {
      const res: any = await (auctionApi as any).approveTrade(id!, tradeId);
      if (res.success) {
        toast.success("Trade approved and rosters updated!");
        fetchAuction(); // Refresh auction data for rosters
        fetchTrades(); // Refresh trades list
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Approval failed");
    }
  };

  useEffect(() => {
    if (id) {
      fetchAuction();
      
      const socket = getSocket();
      
      const handleConnect = () => {
        socket.emit("join_auction", id);
        fetchAuction(); // fresh payload to catch missed packets
      };

      socket.emit("join_auction", id);
      socket.on("connect", handleConnect);
      
      socket.on("bid_update", (data: any) => {
        setAuction((prev: any) => {
          if (!prev) return prev;
          const newBidHistory = prev.bidHistory ? [...prev.bidHistory, data] : [data];
          return {
            ...prev,
            currentBid: data,
            bidHistory: newBidHistory
          };
        });
        
        // Add to persistent Live Activity
        setLiveActivity(prev => [{
          type: 'bid',
          ...data,
          playerName: auctionRef.current?.currentPlayer?.name || "",
          timestamp: new Date()
        }, ...prev].slice(0, 20));
      });

      socket.on("auction_update", (data: any) => {
        setAuction(data);
        setTeams(data.teams);
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
        
        // Add Sold event to Live Activity
        setLiveActivity(prev => [{
          type: 'sold',
          ...data,
          timestamp: new Date()
        }, ...prev].slice(0, 20));

        setTimeout(() => setSoldData(null), 5000);
      });

      return () => {
        socket.off("connect", handleConnect);
        socket.off("bid_update");
        socket.off("auction_update");
        socket.off("trade_update");
        socket.off("player_sold");
        socket.emit("leave_auction", id);
      };
    }
  }, [id]);

  const fetchAuction = async () => {
    try {
      const res: any = await auctionApi.get(id!);
      if (res.success) {
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        const currentUserId = user?.id || user?._id;
        const auctionCreatorId = res.data.createdBy?._id || res.data.createdBy;
        if (user && String(auctionCreatorId) !== String(currentUserId)) {
            toast.error("You are not the creator of this auction");
            navigate(`/auction/live/${id}`);
            return;
        }

        setAuction(res.data);
        setTeams(res.data.teams);

        // Seed Live Activity from recently sold players
        if (res.data.playerPool && liveActivity.length === 0) {
           const recentSales = res.data.playerPool
             .filter((p: any) => p.status === 'Sold')
             .sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
             .slice(0, 5)
             .map((p: any) => {
                const team = res.data.teams.find((t: any) => t._id === p.soldTo);
                return {
                   type: 'sold',
                   playerName: p.name,
                   teamName: team?.name || "Unknown Team",
                   teamLogo: team?.logo,
                   amount: p.soldPrice,
                   timestamp: p.updatedAt || new Date()
                };
             });
           setLiveActivity(recentSales);
        }
      }
    } catch (e) {
      toast.error("Failed to load auction details");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = () => {
    setEditForm({
      name: auction.name,
      budgetPerTeam: auction.budgetPerTeam,
      minPlayersPerTeam: auction.minPlayersPerTeam,
      maxPlayersPerTeam: auction.maxPlayersPerTeam,
      currency: auction.currency || "USD"
    });
    setIsEditing(true);
  };

  const getTeamName = (teamId: string) => {
    if (!teamId || !auction?.teams) return "N/A";
    const team = auction.teams.find((t: any) => t._id === teamId || t.name === teamId);
    return team?.name || teamId;
  };

  const handleUpdateSettings = async () => {
    try {
      setSaving(true);
      const res: any = await auctionApi.update(id!, editForm);
      if (res.success) {
        toast.success("Auction settings updated!");
        setAuction(res.data);
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeadline = async (dateIso: string) => {
    try {
      setSaving(true);
      const res: any = await auctionApi.update(id!, { tradeDeadline: dateIso });
      if (res.success) {
        toast.success("Trade window updated");
        setAuction(res.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update deadline");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTeams = async () => {
    setSaving(true);
    try {
      const teamUpdates = teams.map((t, index) => ({
        index,
        name: t.name,
        captainEmail: t.captainEmail,
        logo: t.logo
      }));
      const res: any = await auctionApi.updateTeams(id!, teamUpdates);
      if (res.success) {
        toast.success("Teams updated successfully");
        setAuction(res.data);
      }
    } catch (e) {
      toast.error("Failed to update teams");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
     if (!window.confirm("Are you sure you want to remove this player from the auction?")) return;
     try {
        const res: any = await auctionApi.deletePlayer(id!, playerId);
        if (res.success) {
           toast.success("Player removed from pool");
           setAuction(res.data);
        }
     } catch (e) {
        toast.error("Failed to delete player");
     }
  };

  const handleClearPool = async () => {
    if (!window.confirm("Are you sure? This will remove ALL players from the pool.")) return;
    try {
      const res: any = await auctionApi.clearPlayers(id!);
      if (res.success) {
        toast.success("Player pool cleared!");
        setAuction(res.data);
      }
    } catch (e) {
      toast.error("Failed to clear pool");
    }
  };

  const handleBulkAddSet = async () => {
    if (!newPlayers.trim()) return;
    
    // Split names by newline
    const names = newPlayers.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;

    const players = names.map(name => ({
      name,
      role: bulkRole,
      basePrice: parseFloat(bulkBasePrice) * 1000000,
      category: bulkCategory,
      status: 'Available'
    }));

    try {
      const res: any = await auctionApi.addPlayers(id!, players);
      if (res.success) {
        toast.success(`${players.length} ${bulkCategory} (${bulkRole}) added!`);
        setAuction(res.data);
        setNewPlayers("");
      }
    } catch (e) {
      toast.error("Failed to add player set");
    }
  };

  const handleAddPlayers = async () => {
    try {
      // Basic manual test: expect JSON array
      const players = JSON.parse(newPlayers);
      if (!Array.isArray(players)) throw new Error("Must be an array");
      
      const res: any = await auctionApi.addPlayers(id!, players);
      if (res.success) {
        toast.success(`${players.length} players added!`);
        setAuction(res.data);
        setNewPlayers("");
      }
    } catch (e: any) {
      toast.error("Invalid JSON format. Expected: [{name, role, basePrice, category}]");
    }
  };

  const handleSearchPlayers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res: any = await playerApi.search(q);
      if (res.success) {
        setSuggestions(res.data);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error("Search failed", e);
    }
  };

  const selectSuggestion = (p: any) => {
    setSelectedProfile(p);
    setSearchQuery(p.name);
    setIndividualRole(p.role || "Batsman");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddIndividual = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a player name");
      return;
    }

    try {
      setSaving(true);
      let playerName = searchQuery.trim();
      let role = individualRole;

      // If no profile selected but name exists, try to create or find again
      if (!selectedProfile) {
        try {
          // If we want to strictly follow "create new profile", we call playerApi.create
          // But first we should check if they already exist globally
          const createRes: any = await playerApi.create({
            name: playerName,
            role: individualRole,
            battingStyle: "Right-hand Bat",
            bowlingStyle: "None"
          });
          if (createRes.success) {
            toast.success("New player profile created");
          }
        } catch (e: any) {
          // Profile might already exist, which is fine
          console.log("Profile create skipped or already exists");
        }
      }

      const playerToAdd = {
        name: playerName,
        role: role,
        basePrice: parseFloat(individualBasePrice) * 1000000,
        category: individualCategory
      };

      const res: any = await auctionApi.addPlayers(id!, [playerToAdd]);
      if (res.success) {
        toast.success(`${playerName} added to auction pool`);
        setAuction(res.data);
        setSearchQuery("");
        setSelectedProfile(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add player");
    } finally {
      setSaving(false);
    }
  };

  const triggerLogoUpload = (idx: number) => {
    setUploadingTeamIdx(idx);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingTeamIdx === null || !id) return;

    const teamId = teams[uploadingTeamIdx]._id;
    if (!teamId) {
       toast.error("Please save teams first before uploading logos");
       return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res: any = await auctionApi.uploadTeamLogo(id, teamId, formData);
      if (res.success) {
        const newTeams = [...teams];
        newTeams[uploadingTeamIdx].logo = res.data.logo;
        setTeams(newTeams);
        toast.success("Logo uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      setUploadingTeamIdx(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStartAuction = async () => {
    try {
      const res: any = await auctionApi.start(id!);
      if (res.success) {
        toast.success("Auction is now LIVE!");
        setAuction(res.data);
      }
    } catch (e) {
      toast.error("Failed to start auction");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!auction) return <div className="p-10 text-center">Auction not found</div>;
  
  const soldCount = auction.playerPool.filter((p: any) => p.status === 'Sold').length;
  const totalPlayers = auction.playerPool.length;
  const soldPercent = (soldCount / Math.max(1, totalPlayers)) * 100;
  
  const totalBudget = auction.teams.length * auction.budgetPerTeam;
  const spentBudget = auction.teams.reduce((sum: number, t: any) => sum + (auction.budgetPerTeam - t.budgetRemaining), 0);
  const spentPercent = (spentBudget / Math.max(1, totalBudget)) * 100;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6 space-y-8 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex gap-2 mr-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/auctions")} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                <ArrowLeft size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all" title="Go to Dashboard">
                <Home size={20} />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-2xl shadow-lg shadow-blue-900/20">
               <Gavel className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter leading-none">
                {auction.name}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                   <span className={`flex h-1.5 w-1.5 rounded-full ${auction.status === 'Live' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                   <span className={`text-[10px] font-black uppercase tracking-widest ${auction.status === 'Live' ? 'text-red-500' : 'text-blue-500'}`}>{auction.status}</span>
                </div>
                <span className="text-slate-700 text-xs font-black">•</span>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60 italic">Command Center</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {auction.status === 'Setup' && (
               <Button onClick={handleStartAuction} size="lg" className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 px-8 h-14 border-0">
                 <Play className="fill-white mr-2" size={18} /> Launch Live Auction
               </Button>
             )}
             <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 rounded-xl transition-all gap-2 h-14 px-5 font-black uppercase tracking-widest text-[10px]"
                onClick={() => window.open(`/auction/live/${id}`, '_blank')}
             >
                <Activity size={14} className="text-blue-400" /> Spectator View
             </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-1.5 h-14 rounded-2xl w-full sm:w-auto">
            <TabsTrigger value="overview" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">Overview</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">Teams & Access</TabsTrigger>
            <TabsTrigger value="players" className="rounded-xl px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">Player Pool</TabsTrigger>
            <TabsTrigger value="trades" className="rounded-xl px-8 h-full data-[state=active]:bg-orange-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all">Trade Hub</TabsTrigger>
            <TabsTrigger value="control" disabled={auction.status !== 'Live'} className="rounded-xl px-8 h-full data-[state=active]:bg-red-600 data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-20">Live Control</TabsTrigger>
            {auction.status === 'Completed' && (
               <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/auction/analytics/${id}`)}
                  className="rounded-xl px-8 h-12 hover:bg-blue-500/10 text-blue-400 font-black uppercase tracking-widest text-[10px] border border-blue-500/20 ml-2"
               >
                  <BarChart3 size={14} className="mr-2" /> View Reports
               </Button>
            )}
          </TabsList>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleLogoUpload} 
          className="hidden" 
          accept="image/*" 
        />

        <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-500 outline-none">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl rounded-full -mr-12 -mt-12" />
               <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                     <Users size={20} />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase border-slate-800 text-slate-500">Global Pool</Badge>
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Total Players</p>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-4xl font-black text-white italic tracking-tighter">{totalPlayers}</h3>
                     <span className="text-slate-600 font-bold text-xs uppercase">Profiles</span>
                  </div>
               </div>
            </Card>

            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-[2.5rem] p-8 hover:border-green-500/30 transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full -mr-12 -mt-12" />
               <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400">
                     <User size={20} />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase border-slate-800 text-slate-500">{soldPercent.toFixed(0)}% Complete</Badge>
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Sold Players</p>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-4xl font-black text-white italic tracking-tighter">{soldCount}</h3>
                     <span className="text-slate-600 font-bold text-xs uppercase">Assigned</span>
                  </div>
               </div>
            </Card>

            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-[2.5rem] p-8 hover:border-purple-500/30 transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 blur-2xl rounded-full -mr-12 -mt-12" />
               <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
                     <Coins size={20} />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase border-slate-800 text-slate-500">Avg / Slot</Badge>
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Team Budget</p>
                  <div className="flex items-baseline gap-2">
                     <span className="text-lg font-black text-purple-400 italic">{symbol}</span>
                     <h3 className="text-4xl font-black text-white italic tracking-tighter">{(auction.budgetPerTeam / 1000000).toFixed(1)}</h3>
                     <span className="text-purple-400 font-black text-lg underline decoration-purple-600 decoration-2 italic">M</span>
                  </div>
               </div>
            </Card>

            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-2xl rounded-full -mr-12 -mt-12" />
               <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                     <BarChart3 size={20} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 rounded-lg hover:bg-slate-800 transition-all">
                     <Settings size={14} className="text-slate-500" />
                  </Button>
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Market Health</p>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-4xl font-black text-white italic tracking-tighter">{auction.teams.length}</h3>
                     <span className="text-slate-600 font-bold text-xs uppercase">Teams</span>
                  </div>
               </div>
            </Card>
          </div>

          <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
               <Card className="bg-slate-900/20 backdrop-blur-3xl border border-slate-800 rounded-[3rem] p-10 relative overflow-hidden">
                  {/* Decorative Mesh */}
                  <div className="absolute inset-0 bg-blue-500/[0.02] mix-blend-overlay pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600/10 rounded-[1.5rem] flex items-center justify-center border border-blue-500/20">
                           <BarChart3 className="text-blue-500 w-7 h-7" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none mb-1">Budget Allocation</h2>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Market Spend tracking</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 opacity-60">Total Value Spent</p>
                        <p className="text-3xl font-black text-green-400 italic leading-none">{symbol}{(spentBudget / 1000000).toFixed(2)}M</p>
                     </div>
                  </div>

                  <div className="space-y-8 relative z-10">
                     <div className="space-y-4">
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{spentPercent.toFixed(1)}%</p>
                              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Global Liquid Capital Used</p>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-lg font-black text-slate-400 italic leading-none">{(totalBudget / 1000000).toFixed(0)}M</p>
                              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Total Valuation</p>
                           </div>
                        </div>
                        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex gap-1.5 p-1 border border-slate-800/50">
                           <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 relative group" 
                              style={{ width: `${spentPercent}%` }}
                           >
                              <div className="absolute inset-y-0 right-0 w-2 h-full bg-white/20 blur-sm" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-800/50">
                        {['Marquee', 'Batsman', 'Bowler', 'All-Rounder'].map((cat) => {
                           const count = auction.playerPool.filter((p: any) => p.category === cat || p.category.includes(cat)).length;
                           const soldCat = auction.playerPool.filter((p: any) => (p.category === cat || p.category.includes(cat)) && p.status === 'Sold').length;
                           return (
                              <div key={cat} className="space-y-2 p-4 bg-slate-900/40 rounded-3xl border border-slate-800 group hover:border-blue-500/20 transition-all">
                                 <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest text-center">{cat}</p>
                                 <div className="flex items-center justify-center gap-2">
                                    <p className="text-xl font-black text-white tracking-tighter leading-none">{soldCat}</p>
                                    <span className="text-slate-700 font-black text-xs">/</span>
                                    <p className="text-lg font-black text-slate-600 tracking-tighter leading-none">{count}</p>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800 rounded-[3rem] p-8 h-full relative overflow-hidden flex flex-col">
                  <div className="flex items-center gap-3 mb-8 relative z-10">
                     <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                        <Activity className="text-purple-500 w-5 h-5" />
                     </div>
                     <h2 className="text-lg font-black uppercase tracking-tighter italic text-white">Live Activity</h2>
                  </div>

                  <ScrollArea className="flex-1 -mx-2 pr-4 relative z-10">
                     <div className="space-y-4">
                        {liveActivity && liveActivity.length > 0 ? (
                           liveActivity.map((item: any, idx: number) => (
                              <div key={idx} className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all animate-in slide-in-from-right-4 duration-500 ${item.type === 'sold' ? 'bg-green-500/10 border-green-500/20 shadow-lg shadow-green-950/20' : 'bg-slate-950/40 border-slate-800 hover:border-blue-500/20'}`}>
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black overflow-hidden shrink-0 ${item.type === 'sold' ? 'bg-green-600 ring-4 ring-green-500/20' : (idx === 0 ? 'bg-blue-600 ring-4 ring-blue-500/10' : 'bg-slate-800')}`}>
                                    {item.teamLogo ? <img src={item.teamLogo} className="w-full h-full object-cover" /> : item.teamName?.charAt(0)}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                       <div className="flex items-center gap-1.5">
                                          <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'sold' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
                                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">{item.type === 'sold' ? 'Player SOLD' : 'New Bid'}</p>
                                       </div>
                                       <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs font-black text-white uppercase truncate">
                                       {item.playerName && <span className="text-blue-400 mr-1">{item.playerName}</span>}
                                       <span className="text-slate-500 mx-1">→</span>
                                       {item.teamName}
                                    </p>
                                    <p className={`text-sm font-black italic leading-none mt-1 ${item.type === 'sold' ? 'text-green-400' : 'text-blue-400'}`}>{symbol}{(item.amount / 1000000).toFixed(2)}M</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="py-20 text-center opacity-30 flex flex-col items-center">
                              <PieChart size={32} className="mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Waiting for Activity</p>
                           </div>
                        )}
                     </div>
                  </ScrollArea>
                  
                  <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                     <div className="p-4 bg-blue-600/5 rounded-3xl border border-blue-500/10 text-center">
                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                           "All statistics shown here are updated in real-time as bids are placed and players are sold."
                        </p>
                     </div>
                  </div>
               </Card>
            </div>
          </div>

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Auction Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Auction Name</label>
                  <Input 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Budget / Team ({symbol}M)</label>
                    <Input 
                      type="number"
                      value={editForm.budgetPerTeam / 1000000}
                      onChange={e => setEditForm({...editForm, budgetPerTeam: parseFloat(e.target.value) * 1000000})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Currency</label>
                    <select 
                      value={editForm.currency}
                      onChange={e => setEditForm({...editForm, currency: e.target.value})}
                      className="w-full bg-slate-800 border-slate-700 rounded-md h-10 p-2 text-sm"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Min Players / Team</label>
                    <Input 
                      type="number"
                      value={editForm.minPlayersPerTeam}
                      onChange={e => setEditForm({...editForm, minPlayersPerTeam: parseInt(e.target.value)})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500">Max Players / Team</label>
                    <Input 
                      type="number"
                      value={editForm.maxPlayersPerTeam}
                      onChange={e => setEditForm({...editForm, maxPlayersPerTeam: parseInt(e.target.value)})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateSettings} disabled={saving} className="w-full mt-4">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                  Save All Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="teams">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>Assign team names and captain emails for dashboard access.</CardDescription>
              </div>
              <Button onClick={handleUpdateTeams} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead>No.</TableHead>
                      <TableHead>Logo URL</TableHead>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Captain Email</TableHead>
                      <TableHead>Access Code</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, idx) => (
                    <TableRow key={idx} className="border-slate-800">
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 relative group cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setViewingTeam(team)}>
                                {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Users size={14} className="m-2 text-slate-600" />}
                                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 flex items-center justify-center transition-all">
                                   <Plus size={10} className="text-white opacity-0 group-hover:opacity-100" />
                                </div>
                                {uploadingLogo && uploadingTeamIdx === idx && (
                                   <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                      <Loader2 className="animate-spin text-blue-500" size={12} />
                                   </div>
                                )}
                             </div>
                             <div className="flex flex-col gap-1">
                                <Input 
                                  value={team.logo || ""} 
                                  placeholder="URL..."
                                  onChange={(e) => {
                                    const newTeams = [...teams];
                                    newTeams[idx].logo = e.target.value;
                                    setTeams(newTeams);
                                  }}
                                  className="bg-slate-800 border-slate-700 h-7 text-[10px] w-28"
                                />
                                <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   onClick={() => triggerLogoUpload(idx)}
                                   className="h-6 gap-1 text-[9px] text-slate-400 hover:text-white hover:bg-slate-800 px-1"
                                >
                                   <Upload size={10} /> {team.logo ? 'Change' : 'Upload'}
                                </Button>
                             </div>
                          </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={team.name} 
                          onChange={(e) => {
                            const newTeams = [...teams];
                            newTeams[idx].name = e.target.value;
                            setTeams(newTeams);
                          }}
                          className="bg-slate-800 border-slate-700"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={team.captainEmail} 
                          onChange={(e) => {
                            const newTeams = [...teams];
                            newTeams[idx].captainEmail = e.target.value;
                            setTeams(newTeams);
                          }}
                          className="bg-slate-800 border-slate-700"
                        />
                      </TableCell>
                      <TableCell>
                        <code className="bg-slate-800 p-1 px-2 rounded text-blue-400">{team.accessCode}</code>
                      </TableCell>
                      <TableCell>{symbol}{(team.budgetRemaining / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>
                         <Button variant="outline" size="sm" onClick={() => setViewingTeam(team)} className="h-8 border-slate-700 hover:bg-slate-800 text-xs">
                            View Summary
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Add Players</CardTitle>
                  <CardDescription>Add players individually or in bulk sets.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearPool} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 size={14} className="mr-1" /> Clear Pool
                </Button>
              </CardHeader>
                <CardContent className="space-y-6">
                  {/* SEARCH & ADD INDIVIDUAL PLAYER */}
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-400 italic">Add Individual Player</p>
                    
                    <div className="relative">
                      <label className="text-[10px] text-slate-500 uppercase font-black">Search or Enter Name</label>
                      <Input 
                        placeholder="Search existing profile or enter new name..."
                        value={searchQuery}
                        onChange={(e) => handleSearchPlayers(e.target.value)}
                        className="bg-slate-900 border-slate-700 h-10 mt-1"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-xl overflow-hidden">
                          {suggestions.map((p, idx) => (
                            <div 
                              key={idx}
                              className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0 flex items-center justify-between"
                              onClick={() => selectSuggestion(p)}
                            >
                              <div>
                                <div className="text-sm font-bold text-white">{p.name}</div>
                                <div className="text-[10px] text-slate-500">{p.role} • {p.team?.name || 'Global'}</div>
                              </div>
                              {p.isGlobal && <Badge variant="outline" className="text-[8px] bg-blue-500/10 text-blue-400 border-blue-500/20">Profile exists</Badge>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-black">Assigned Category</label>
                          <select 
                            value={individualCategory} 
                            onChange={(e) => setIndividualCategory(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 rounded-md text-sm p-2"
                          >
                             {["Unsold", "Marquee", "Set 1", "Set 2", "Batsmen", "Bowlers", "All-Rounders", "Wicketkeepers"].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-black">Role</label>
                          <select 
                            value={individualRole} 
                            onChange={(e) => setIndividualRole(e.target.value)}
                            className="w-full bg-slate-800 border-slate-700 rounded-md text-sm p-2"
                          >
                             {["All Rounder", "Batsman", "Bowler", "Wicket Keeper"].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] text-slate-500 uppercase font-black">Base Price ({symbol} Millions)</label>
                       <Input 
                         type="number" 
                         step="0.1" 
                         value={individualBasePrice} 
                         onChange={(e) => setIndividualBasePrice(e.target.value)}
                         className="bg-slate-800 border-slate-700 h-9"
                       />
                    </div>

                    <Button onClick={handleAddIndividual} disabled={saving} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                       {saving ? <Loader2 className="animate-spin" size={18} /> : (selectedProfile ? <Gavel size={18} /> : <Plus size={18} />)}
                       {selectedProfile ? "Add Profile to Pool" : "Create Profile & Add"}
                    </Button>
                  </div>

                  <hr className="border-slate-800" />

                  {/* LEGACY BULK ADD Section (Collapsed or Secondary) */}
                  <details className="group">
                    <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-300 list-none flex items-center gap-2">
                       <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                       OR QUICK ADD BY SET (LEGACY)
                    </summary>
                    <div className="mt-4 p-4 bg-slate-950/30 rounded-xl border border-slate-800 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 uppercase font-black">Category</label>
                              <select 
                                value={bulkCategory} 
                                onChange={(e) => setBulkCategory(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 rounded-md text-sm p-2"
                              >
                                {["Unsold", "Marquee", "Set 1", "Set 2", "Batsmen", "Bowlers", "All-Rounders", "Wicketkeepers"].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 uppercase font-black">Role</label>
                              <select 
                                value={bulkRole} 
                                onChange={(e) => setBulkRole(e.target.value)}
                                className="w-full bg-slate-800 border-slate-700 rounded-md text-sm p-2"
                              >
                                {["All Rounder", "Batsman", "Bowler", "Wicket Keeper"].map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 uppercase font-black">Player Names (One per line)</label>
                          <textarea 
                            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-md p-3 font-sans text-sm outline-none"
                            placeholder="Virat Kohli&#10;MS Dhoni"
                            value={newPlayers}
                            onChange={(e) => setNewPlayers(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleBulkAddSet} variant="secondary" className="w-full gap-2">
                          Add Set
                        </Button>
                    </div>
                  </details>

                 <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-black text-center italic">OR Paste JSON ARRAY</p>
                    <Button variant="outline" onClick={handleAddPlayers} className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white">
                       Import via JSON Array
                    </Button>
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Player Pool ({auction.playerPool.length})</CardTitle>
                </div>
                <div className="flex gap-2">
                   <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">{auction.playerPool.filter((p: any) => p.status === 'Sold').length} Sold</Badge>
                   <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">{auction.playerPool.filter((p: any) => p.status === 'Available').length} Available</Badge>
                </div>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {auction.playerPool.map((p: any, i: number) => {
                    const isSold = p.status === 'Sold';
                    return (
                      <div key={i} className={`
                        p-4 rounded-2xl border transition-all duration-300 group
                        ${isSold ? 'bg-slate-950 border-green-500/30 shadow-inner shadow-green-950/20' : 'bg-slate-900/40 border-slate-800 hover:border-blue-500/30'}
                      `}>
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline" className={`text-[9px] font-black tracking-widest px-1.5 ${p.category === 'Marquee' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                            {p.category}
                          </Badge>
                          <div className="flex gap-1">
                             {isSold && <Badge className="bg-green-600 text-[8px] font-black h-4">SOLD</Badge>}
                             {!isSold && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeletePlayer(p._id)}
                                  className="h-6 w-6 text-slate-600 hover:text-red-500 hover:bg-red-500/10"
                                >
                                   <Trash2 size={12} />
                                </Button>
                             )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end">
                           <div className="min-w-0 flex-1">
                              <h4 className="text-base font-black text-white truncate group-hover:text-blue-400 transition-colors uppercase leading-none">
                                {p.name}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{p.role}</p>
                           </div>
                           <div className="text-right ml-4">
                              <p className="text-[9px] font-black text-slate-600 uppercase">Price</p>
                              <p className={`text-sm font-black italic ${isSold ? 'text-green-400' : 'text-blue-400'}`}>
                                {symbol}{((isSold ? p.soldPrice : p.basePrice) / 1000000).toFixed(1)}M
                              </p>
                           </div>
                        </div>

                        {isSold && (
                          <div className="mt-3 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[8px] font-black text-white">
                                  {getTeamName(p.soldTo).charAt(0)}
                               </div>
                               <span className="text-[10px] font-black text-slate-400 uppercase truncate max-w-[80px]">{getTeamName(p.soldTo)}</span>
                            </div>
                            <Gavel size={10} className="text-slate-700" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
 
        <TabsContent value="trades" className="space-y-6 animate-in fade-in zoom-in-95 duration-500 outline-none">
           {/* Trade Deadline Management */}
           <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
              <CardContent className="p-8 flex flex-col md:flex-row items-end gap-6">
                 <div className="flex-1 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Global Trade Deadline</Label>
                    <Input 
                       type="datetime-local" 
                       value={auction?.tradeDeadline ? new Date(new Date(auction.tradeDeadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                       onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                             const date = new Date(val);
                             handleSaveDeadline(date.toISOString());
                          }
                       }}
                       className="bg-slate-950 border-slate-800 h-14 rounded-2xl text-white font-black px-6 focus:ring-2 ring-orange-500/20"
                    />
                 </div>
                 <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 h-14 px-6 min-w-[200px]">
                    <div className={`w-3 h-3 rounded-full ${auction?.tradeDeadline && new Date() > new Date(auction.tradeDeadline) ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                    <div>
                       <p className="text-[8px] text-slate-500 font-black uppercase leading-none mb-1">Protocol Status</p>
                       <p className="text-[10px] font-black uppercase text-white tracking-widest">
                          {auction?.tradeDeadline && new Date() > new Date(auction.tradeDeadline) ? 'Nexus Terminal Offline' : 'Accepting Proposals'}
                       </p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="bg-slate-900/40 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
              <CardHeader className="p-8 border-b border-slate-800/50 flex flex-row justify-between items-center">
                 <div>
                    <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Trade Commissioner Panel</CardTitle>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Review and finalize accepted franchise deals</p>
                 </div>
                 <Badge className="bg-orange-500 text-white border-0 font-black uppercase text-[10px] px-4 py-1.5 rounded-full shadow-lg shadow-orange-900/40">
                    {trades.filter(t => t.status === 'Accepted').length} Pending Approval
                 </Badge>
              </CardHeader>
              <CardContent className="p-0">
                 <ScrollArea className="h-[600px] w-full">
                    <Table>
                       <TableHeader>
                          <TableRow className="border-slate-800/50 hover:bg-transparent">
                             <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6 pl-8">Negotiation Chain</TableHead>
                             <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Assets: Party A</TableHead>
                             <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Assets: Party B</TableHead>
                             <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6 text-right pr-8">Actions</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {trades.length > 0 ? trades.map((trade, i) => (
                             <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/10 transition-colors">
                                <TableCell className="py-8 pl-8">
                                   <div className="space-y-2">
                                      <p className="text-sm font-black text-white uppercase tracking-tight">{trade.fromTeamName} <span className="text-slate-600 mx-1">↔</span> {trade.toTeamName}</p>
                                      <div className="flex items-center gap-3">
                                         <Badge variant="outline" className={`${trade.status === 'Accepted' ? 'border-blue-500/50 text-blue-400 bg-blue-500/5' : 'border-slate-800 text-slate-500'} text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md`}>
                                            {trade.status === 'Accepted' ? 'READY FOR EXECUTION' : trade.status}
                                         </Badge>
                                         <span className="text-[9px] text-slate-600 font-black uppercase tabular-nums">{new Date(trade.createdAt).toLocaleDateString()}</span>
                                      </div>
                                   </div>
                                </TableCell>
                                <TableCell className="py-8">
                                   <div className="space-y-1.5">
                                      {trade.fromPlayers.map((p: any) => (
                                         <div key={p.name} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-tight">{p.name}</p>
                                         </div>
                                      ))}
                                      {trade.cash > 0 && <p className="text-xs text-orange-400 font-black italic mt-2">{symbol}{(trade.cash/1000000).toFixed(2)}M Cash</p>}
                                      {trade.fromPlayers.length === 0 && trade.cash <= 0 && <span className="text-[10px] text-slate-700 italic font-black uppercase">Liquid Zero</span>}
                                   </div>
                                </TableCell>
                                <TableCell className="py-8">
                                   <div className="space-y-1.5">
                                      {trade.toPlayers.map((p: any) => (
                                         <div key={p.name} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                                            <p className="text-xs font-black text-slate-300 uppercase tracking-tight">{p.name}</p>
                                         </div>
                                      ))}
                                      {trade.cash < 0 && <p className="text-xs text-green-400 font-black italic mt-2">{symbol}{(Math.abs(trade.cash)/1000000).toFixed(2)}M Cash</p>}
                                      {trade.toPlayers.length === 0 && trade.cash >= 0 && <span className="text-[10px] text-slate-700 italic font-black uppercase">Liquid Zero</span>}
                                   </div>
                                </TableCell>
                                <TableCell className="py-8 text-right pr-8">
                                   {trade.status === 'Accepted' && (
                                      <Button 
                                         onClick={() => handleApproveTrade(trade._id)}
                                         className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-[0.15em] px-8 h-12 rounded-2xl shadow-xl shadow-blue-900/40 group transition-all"
                                      >
                                         Executive Approval
                                      </Button>
                                   )}
                                   {trade.status === 'Approved' && (
                                      <div className="flex items-center justify-end gap-2 text-green-500">
                                         <BadgeCheck size={16} />
                                         <span className="text-[10px] font-black uppercase tracking-widest">Assets Transferred</span>
                                      </div>
                                   )}
                                </TableCell>
                             </TableRow>
                          )) : (
                             <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="py-32 text-center opacity-30">
                                   <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                                      <Activity size={32} className="text-slate-700" />
                                   </div>
                                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">No Historical Trade Records Found</p>
                                </TableCell>
                             </TableRow>
                          )}
                       </TableBody>
                    </Table>
                 </ScrollArea>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="control">
           <AuctionControl auction={auction} onUpdate={fetchAuction} />
        </TabsContent>
      </Tabs>
      {/* Player Sold Celebration Modal */}
      <Dialog open={!!soldData} onOpenChange={() => setSoldData(null)}>
        <DialogContent className="bg-slate-900/95 border-blue-500/50 text-white text-center p-12 max-w-lg backdrop-blur-xl">
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/30">
              <Trophy size={48} className="text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-blue-400 font-sans">SOLD! 🎉</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Player successfully assigned to</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-lg font-black text-white">
                    {soldData?.teamLogo ? <img src={soldData.teamLogo} className="w-full h-full object-cover" /> : (soldData?.teamName || "T").charAt(0)}
                 </div>
                 <p className="text-3xl font-black text-white">{soldData?.teamName}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{soldData?.playerName}</p>
              <div className="pt-4">
                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Final Amount</p>
                <p className="text-4xl font-black text-green-400">{symbol}{(soldData?.amount / 1000000).toFixed(2)}M</p>
              </div>
            </div>

            <Button onClick={() => setSoldData(null)} className="w-full bg-blue-600 hover:bg-blue-700 h-12 font-bold uppercase tracking-wider">
               Ready for Next Drawing
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Summary Modal */}
      <Dialog open={!!viewingTeam} onOpenChange={() => setViewingTeam(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
                   {viewingTeam?.logo ? <img src={viewingTeam.logo} className="w-full h-full object-cover" /> : <Users size={32} className="m-4 text-slate-600" />}
                </div>
                <div>
                   <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{viewingTeam?.name}</DialogTitle>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Team Auction Summary</p>
                </div>
             </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto py-6 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Budget Spent</p>
                   <p className="text-xl font-black text-white">{symbol}{((auction.budgetPerTeam - (viewingTeam?.budgetRemaining || 0)) / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Remaining</p>
                   <p className="text-xl font-black text-green-400">{symbol}{((viewingTeam?.budgetRemaining || 0) / 1000000).toFixed(2)}M</p>
                </div>
             </div>

             <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Players Bought ({viewingTeam?.players?.length || 0})</p>
                <div className="bg-slate-950/30 rounded-2xl border border-slate-800 divide-y divide-slate-800/50">
                   {viewingTeam?.players && viewingTeam.players.length > 0 ? viewingTeam.players.map((p: any, i: number) => (
                      <div key={i} className="p-4 flex justify-between items-center group hover:bg-slate-800/30 transition-colors">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-600 font-black">{i + 1}</span>
                            <div>
                               <p className="font-black text-white uppercase text-sm leading-none">{p.name}</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{p.role} • {p.category}</p>
                            </div>
                         </div>
                         <p className="font-black text-blue-400 italic">{symbol}{(p.price / 1000000).toFixed(2)}M</p>
                      </div>
                   )) : (
                      <div className="p-12 text-center text-slate-600 font-bold uppercase text-xs tracking-[0.2em]">No players bought yet</div>
                   )}
                </div>
             </div>
          </div>
          
          <div className="pt-4 border-t border-slate-800">
             <Button onClick={() => setViewingTeam(null)} className="w-full bg-slate-800 hover:bg-slate-700">Close Summary</Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
