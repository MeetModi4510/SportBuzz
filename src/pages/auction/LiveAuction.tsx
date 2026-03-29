import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auctionApi, playerApi } from "@/services/api";
import { getSocket } from "@/services/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gavel, User, Trophy, TrendingUp, Users, Shield, History, Home, ArrowLeft, LayoutGrid, PieChart, Star, LineChart } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import confetti from 'canvas-confetti';
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function LiveAuction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<any>(null);
  const auctionRef = useRef<any>(null);
  auctionRef.current = auction;
  const [loading, setLoading] = useState(true);
  const [lastBidder, setLastBidder] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [soldData, setSoldData] = useState<any>(null);
  const [playerDetail, setPlayerDetail] = useState<any>(null);
  const [liveBlog, setLiveBlog] = useState<any[]>([]);
  const [viewingBlogItem, setViewingBlogItem] = useState<any>(null);

  const getNewsHeadline = (player: any, teamName: string, amount: number) => {
    if (!player) return `${teamName} signs a new player for ${(amount/1000000).toFixed(1)}M`;
    const priceM = amount / 1000000;
    const role = player.role?.toLowerCase() || "";
    
    const marqueeHeadlines = [
       `THE CROWN JEWEL: ${teamName} Secures ${player.name}!`,
       `RECORD BREAKER! ${player.name} joins ${teamName} in Mega Deal`,
       `AUCTION STUNNER: ${teamName} Goes All In for ${player.name}!`,
       `THE HIGHLANDER: ${player.name} is now the face of ${teamName}!`
    ];

    const bigHeadlines = [
       `BANK BUSTER! ${teamName} Splurges ${priceM.toFixed(1)}M for ${player.name}`,
       `MARKET SHAKER: ${player.name} moves to ${teamName} for Big Bucks`,
       `WAR CHEST OPENED: ${teamName} wins intense battle for ${player.name}`
    ];

    const bargainHeadlines = [
       `TACTICAL STEAL! ${teamName} Snaps up ${player.name} at Bargain Price`,
       `SMART BUSINESS: ${player.name} joins ${teamName} in massive value deal`,
       `HIDDEN GEM! ${teamName} picks up ${player.name} for just ${priceM.toFixed(1)}M`
    ];

    if (player.category === 'Marquee' || priceM > 12) {
       return marqueeHeadlines[Math.floor(Math.random() * marqueeHeadlines.length)];
    }

    if (priceM > 8) {
       return bigHeadlines[Math.floor(Math.random() * bigHeadlines.length)];
    }

    if (priceM < 2.5) {
       return bargainHeadlines[Math.floor(Math.random() * bargainHeadlines.length)];
    }

    if (role.includes('bowler')) {
       return `${teamName} Bolsters Pace Attack with ${player.name} Signing`;
    }

    if (role.includes('batsman')) {
       return `POWER HITTER ALERT! ${player.name} to Lead ${teamName}'s Batting Order`;
    }

    return `${player.name} Signs with ${teamName} for ${priceM.toFixed(1)}M`;
  };

  const generateNarrativeSummary = (item: any) => {
    if (!item) return "";
    const symbol = currencySymbols[auction?.currency || 'USD'];
    const price = (item.amount / 1000000).toFixed(2);
    const role = item.player?.role?.toLowerCase() || 'player';
    const isMarquee = item.player?.category === 'Marquee';
    
    // Scenarios
    const bids = item.battleHistory || [];
    const uniqueTeams = Array.from(new Set(bids.filter((b: any) => b.teamName).map((b: any) => b.teamName)));
    
    if (bids.length <= 1) {
      const quickTemplates = [
        `A swift and clinical acquisition by **${item.teamName}**. **${item.playerName}** was secured at the opening bid of **${symbol}${price}M**, with no other franchises able to mount a challenge. It was a clear statement of intent.`,
        `**${item.teamName}** moved with lightning speed to secure **${item.playerName}**. At **${symbol}${price}M**, this ${role} represents a steal for the franchise, catching the room off-guard with a decisive opening bid.`,
        `The hammer fell quickly for **${item.playerName}**. **${item.teamName}** stood their ground with a professional **${symbol}${price}M** offer, and with no counter-bids, they've successfully added a vital ${role} to their roster.`,
        `Quiet efficiency from the **${item.teamName}** table. They identified **${item.playerName}** as a key target and secured the signing for **${symbol}${price}M** without facing a rival challenge in this session.`
      ];
      return quickTemplates[Math.floor(Math.random() * quickTemplates.length)];
    }

    // Special Marquee Case
    if (isMarquee && bids.length > 10) {
       return `THE SHOWSTOPPER! **${item.playerName}**'s auction was the highlight of the day. A marathon battle involving **${uniqueTeams.length}** franchises saw record-breaking intensity. After an exhausting sequence of counter-offers, **${item.teamName}** won the crown jewel for a historic **${symbol}${price}M**.`;
    }

    // Battle Narrative construction
    const firstBid = bids[0];
    const opener = firstBid.teamName || 'the opening franchise';
    
    let lead = "";
    const leadTemplates = [
      `The room buzzed as **${item.playerName}**'s name appeared. **${opener}** set the tone with an initial **${symbol}${(firstBid.amount/1000000).toFixed(2)}M** bid. `,
      `Anticipation was high for **${item.playerName}**. The auctioneer barely finished the introduction before **${opener}** jumped in at **${symbol}${(firstBid.amount/1000000).toFixed(2)}M**. `,
      `**${item.playerName}** immediately triggered a shift in the room's energy. **${opener}** threw down the first card at **${symbol}${(firstBid.amount/1000000).toFixed(2)}M**. `
    ];
    lead = leadTemplates[Math.floor(Math.random() * leadTemplates.length)];

    let middle = "";
    if (uniqueTeams.length > 2) {
       const multiTemplates = [
         `What followed was a chaotic multi-team skirmish. **${uniqueTeams.slice(0, 3).join(', ')}** and others traded blows in a relentless pursuit, driving the valuation into the stratosphere. `,
         `A three-way tactical battle erupted almost instantly. **${uniqueTeams[0]}**, **${uniqueTeams[1]}**, and **${uniqueTeams[2]}** refused to yield, each bid raising the stakes of this ${role}'s future. `,
         `It was a total free-for-all for **${item.playerName}**. Multiple paddles were raised simultaneously as the competing franchises vied for dominance. `
       ];
       middle = multiTemplates[Math.floor(Math.random() * multiTemplates.length)];
    } else {
       const duelTemplates = [
         `It quickly narrowed down to a classic heavyweight duel. **${uniqueTeams[0]}** and **${uniqueTeams[1]}** went head-to-head, matching each other's valuations with surgical precision. `,
         `A fierce tug-of-war emerged between **${uniqueTeams[0]}** and **${uniqueTeams[1]}**. Each side seemed determined to outlast the other, pushing the price far beyond initial estimates. `,
         `The rest of the room watched in silence as **${uniqueTeams[0]}** and **${uniqueTeams[1]}** locked horns over **${item.playerName}**. It was a true test of nerves. `
       ];
       middle = duelTemplates[Math.floor(Math.random() * duelTemplates.length)];
    }

    let conclusion = "";
    const concTemplates = [
      `Ultimately, **${item.teamName}** delivered the finishing blow. With a decisive **${symbol}${price}M** bid, they silenced the room and claimed a massive victory.`,
      `The gavel finally came down as **${item.teamName}** stood tall. Their **${symbol}${price}M** investment marks one of the most significant moves of the day.`,
      `Exhausting their rivals, **${item.teamName}** secured the ${role} for **${symbol}${price}M**. It's a high-stakes signing that could define their tournament journey.`,
      `**${item.teamName}** held their nerve the longest, securing **${item.playerName}** for **${symbol}${price}M**. The management's persistence has paid off with a world-class addition.`
    ];
    conclusion = concTemplates[Math.floor(Math.random() * concTemplates.length)];

    return lead + middle + conclusion;
  };

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€"
  };
  const symbol = auction?.currency ? currencySymbols[auction.currency] : "$";

  const getTeamName = (teamId: string) => {
    if (!teamId || !auction?.teams) return "N/A";
    const team = auction.teams.find((t: any) => t._id === teamId || t.name === teamId);
    return team?.name || teamId;
  };

  const getTeamLogo = (teamId?: string) => {
    if (!teamId || !auction) return null;
    const team = auction.teams.find((t: any) => t._id === teamId);
    return team?.logo || null;
  };

  const getMarketAnalytics = () => {
    if (!auction) return null;
    const soldPlayers = auction.playerPool.filter((p: any) => p.status === 'Sold');
    if (soldPlayers.length === 0) return null;

    const costliest = [...soldPlayers].sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];
    const topSpender = [...auction.teams].sort((a, b) => {
       const aSpent = auction.budgetPerTeam - a.budgetRemaining;
       const bSpent = auction.budgetPerTeam - b.budgetRemaining;
       return bSpent - aSpent;
    })[0];

    const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    const avgPrice = totalSpent / soldPlayers.length;

    if (!topSpender || !costliest) return null;

    return { costliest, topSpender, avgPrice, totalSpent };
  };

  const analytics = getMarketAnalytics();

  const fetchPlayerStats = async (name: string) => {
    setStatsLoading(true);
    try {
      const res: any = await playerApi.getStats(name);
      if (res.success) {
        setPlayerStats(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch player stats", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAuction = async () => {
    try {
      const res: any = await auctionApi.get(id!);
      if (res.success) {
        setAuction(res.data);
        
        // Seed Live Blog from existing sold players
        const soldPlayers = res.data.playerPool
          .filter((p: any) => p.status === 'Sold')
          .sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
          .map((p: any) => {
             const team = res.data.teams.find((t: any) => t._id === p.soldTo);
             return {
                id: p._id,
                playerName: p.name,
                teamName: team?.name || "Unknown",
                teamLogo: team?.logo,
                amount: p.soldPrice,
                player: p,
                headline: getNewsHeadline(p, team?.name || "Unknown", p.soldPrice),
                timestamp: p.updatedAt || new Date(),
                battleHistory: p.bidHistory || []
             };
          });
        setLiveBlog(soldPlayers);
      }
    } catch (e) {
      toast.error("Failed to load live auction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuction();
    const socket = getSocket();
    
    const handleConnect = () => {
      socket.emit("join_auction", id);
      fetchAuction(); // fetch any state changes missed while disconnected
    };
    
    // Explicitly join on mount
    socket.emit("join_auction", id);
    // Bind auto-rejoin if socket drops and recovers
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
      setLastBidder(data.teamId);
    });

    socket.on("player_sold", (data: any) => {
      setAuction((prev: any) => {
        if (!prev) return prev;
        
        // Find player details for headline
        const player = prev.playerPool.find((p: any) => p.name === data.playerName);
        
        // Add to Live Blog
        setLiveBlog(blog => [{
           id: Date.now(),
           ...data,
           player, // for details
           headline: getNewsHeadline(player, data.teamName, data.amount),
           timestamp: new Date(),
           battleHistory: data.bidHistory || []
        }, ...blog]);

        return prev;
      });

      setSoldData(data);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#22c55e', '#ffffff', '#fbbf24']
      });
      setTimeout(() => setSoldData(null), 5000);
    });

    socket.on("auction_update", (data: any) => {
      setAuction(data);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("bid_update");
      socket.off("player_sold");
      socket.off("auction_update");
      socket.emit("leave_auction", id);
    };
  }, [id]);

  useEffect(() => {
    if (auction?.currentPlayer?.name) {
      fetchPlayerStats(auction.currentPlayer.name);
    } else {
      setPlayerStats(null);
    }
  }, [auction?.currentPlayer?.name]);

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-medium animate-pulse">Initializing Live Stream...</p>
    </div>
  );

  if (!auction) return <div className="p-10 text-center text-slate-500 font-bold bg-slate-950 min-h-screen">Auction not found</div>;

  const currentPlayer = auction.currentPlayer;
  const currentBid = auction.currentBid;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Background Atmospheric Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-green-600/5 blur-[100px] rounded-full animate-pulse decoration-infinite" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header - Premium Look */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 backdrop-blur-2xl shadow-2xl shadow-black/50">
          <div className="flex items-center gap-6">
            <div className="flex gap-2 mr-2 text-white">
              <Button variant="ghost" size="icon" onClick={() => navigate("/auctions")} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                <ArrowLeft size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                <Home size={20} />
              </Button>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-[1.5rem] shadow-lg shadow-blue-900/40 ring-4 ring-blue-500/10">
               <Gavel className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent uppercase tracking-tighter leading-none">
                {auction.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                   <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                   <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
                </div>
                <span className="text-slate-700 text-xs font-black">•</span>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">{auction.status} PHASE</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Button 
               variant="outline" 
               size="sm" 
               className="hidden sm:flex border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all gap-2 rounded-xl h-11 px-5 font-black uppercase tracking-widest text-[10px]"
               onClick={() => window.open(`/auction/owner/${id}`, '_blank')}
             >
                <Shield size={14} /> Team Console
             </Button>
             <div className="hidden md:flex divide-x divide-slate-800/50 bg-slate-950/60 rounded-2xl border border-slate-800/50 overflow-hidden shadow-inner">
                <div className="px-8 py-3 text-center transition-colors hover:bg-slate-900/40">
                   <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Sold Count</p>
                   <p className="text-2xl font-black text-white">{auction.playerPool.filter((p: any) => p.status === 'Sold').length}</p>
                </div>
                <div className="px-8 py-3 text-center transition-colors hover:bg-slate-900/40">
                   <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Highest Bid</p>
                   <p className="text-2xl font-black text-blue-400 italic">{symbol}{((currentBid?.amount || 0) / 1000000).toFixed(2)}M</p>
                </div>
             </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <Tabs defaultValue="live" className="w-full">
           <div className="flex justify-center mb-8">
              <TabsList className="bg-slate-900/80 border border-slate-800 p-1.5 h-14 rounded-2xl backdrop-blur-xl">
                 <TabsTrigger value="live" className="rounded-xl px-8 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                    <TrendingUp size={16} /> <span className="hidden sm:inline">Live Auction</span>
                 </TabsTrigger>
                 <TabsTrigger value="pool" className="rounded-xl px-8 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                    <LayoutGrid size={16} /> <span className="hidden sm:inline">Player Pool</span>
                 </TabsTrigger>
                 <TabsTrigger value="squads" className="rounded-xl px-8 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                    <Users size={16} /> <span className="hidden sm:inline">Team Roster</span>
                 </TabsTrigger>
                 <TabsTrigger value="blog" className="rounded-xl px-8 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                    <History size={16} /> <span className="hidden sm:inline">Live Blog</span>
                 </TabsTrigger>
              </TabsList>
           </div>
           <TabsContent value="live" className="mt-0 animate-in fade-in zoom-in-95 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                 {/* Left: Player Card (Showcase) */}
                 <div className="lg:col-span-9 space-y-8">
                   {currentPlayer?.name ? (
                     <div className="relative group overflow-hidden rounded-[3rem] border border-blue-500/10 bg-slate-950/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-blue-500/30">
                       {/* Subtle Inner Glow */}
                       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                       <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />

                       <div className="absolute top-0 right-0 p-10 z-10">
                          <Badge className="bg-gradient-to-r from-blue-600 to-blue-800 text-[11px] px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 border-0">
                             {currentPlayer.category}
                          </Badge>
                       </div>
                       <div className="flex flex-col xl:flex-row min-h-[500px]">
                           {/* Left Side: Spotlight & Identity */}
                           <div className="xl:w-[28%] p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden border-r border-blue-500/10">
                              {/* Mesh Background for Profile */}
                              <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-blue-600/5 blur-[80px] rounded-full opacity-40" />
                              
                              <div className="relative z-10 group/photo">
                                 <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-125 animate-pulse transition-transform group-hover/photo:scale-[1.5] duration-700" />
                                 <div className="relative w-44 h-44 bg-gradient-to-br from-slate-800 to-slate-950 rounded-[2.5rem] flex items-center justify-center border-4 border-slate-700/50 shadow-2xl overflow-hidden ring-4 ring-blue-500/5 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                    {currentPlayer.photo ? (
                                      <img src={currentPlayer.photo} alt={currentPlayer.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={80} className="text-slate-700 opacity-50" />
                                    )}
                                 </div>
                              </div>

                              <div className="space-y-4 relative z-10">
                                 <div className="space-y-1">
                                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none uppercase drop-shadow-2xl">
                                       {currentPlayer.name}
                                    </h2>
                                    <p className="text-slate-500 font-extrabold uppercase tracking-[0.2em] text-[10px] opacity-70">{currentPlayer.role}</p>
                                 </div>
                                 <div className="inline-block px-4 py-1.5 bg-blue-500/10 rounded-xl text-[9px] font-black border border-blue-500/20 text-blue-400 uppercase tracking-widest shadow-inner">
                                    Base {symbol}{(currentPlayer.basePrice / 1000000).toFixed(2)}M
                                 </div>
                              </div>
                           </div>

                           {/* Middle Section: Stats & Bidding */}
                           <div className="xl:flex-grow p-10 bg-slate-950/20 flex flex-col relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                              
                              <div className="relative z-10 flex flex-col h-full gap-8">
                                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center gap-3">
                                       <TrendingUp className="text-blue-500 w-4 h-4" />
                                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Career Insight (Overall)</h3>
                                    </div>

                                    <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-2xl px-10 py-5 rounded-[2rem] border-2 border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15)] group/bid ring-4 ring-blue-500/5 animate-in zoom-in-95 duration-500">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-white shadow-lg overflow-hidden shrink-0">
                                             {currentBid?.teamLogo ? <img src={currentBid.teamLogo} className="w-full h-full object-cover" /> : getTeamName(currentBid?.teamId || "").charAt(0)}
                                          </div>
                                          <div className="flex flex-col">
                                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1 opacity-70">Current High Bid</p>
                                             <p className="text-sm font-black text-blue-400 uppercase truncate max-w-[150px] italic tracking-tight">
                                                {currentBid?.teamName || "AWAITING OPENING BID"}
                                             </p>
                                          </div>
                                       </div>
                                       <div className="h-14 w-px bg-slate-800/50" />
                                       <div className="flex items-baseline gap-2 relative">
                                          {/* Pulse Effect for new bids */}
                                          <div className="absolute inset-x-0 -inset-y-2 bg-blue-500/10 blur-2xl rounded-full animate-pulse opacity-50" />
                                          <span className="text-2xl font-black text-blue-500 italic relative z-10">{symbol}</span>
                                          <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] relative z-10 tabular-nums">
                                             {((currentBid?.amount || 0) / 1000000).toFixed(2)}
                                          </span>
                                          <span className="text-2xl font-black text-blue-500 underline decoration-blue-500 decoration-4 italic relative z-10">M</span>
                                       </div>
                                    </div>
                                 </div>

                                 {statsLoading ? (
                                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                      {[1,2,3,4,5,6,7,8].map(i => (
                                        <div key={i} className="h-20 bg-slate-900/40 rounded-2xl border border-slate-800/30 animate-pulse" />
                                      ))}
                                   </div>
                                 ) : playerStats ? (
                                   <div className="space-y-6">
                                      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                         {/* Batting Stats */}
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Runs</p>
                                            <p className="text-2xl font-black text-white tabular-nums">{playerStats.overall.batting.runs}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Batting Avg</p>
                                            <p className="text-2xl font-black text-blue-400 italic tabular-nums">{playerStats.overall.batting.average}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Strike Rate</p>
                                            <p className="text-2xl font-black text-purple-400 italic tabular-nums">{playerStats.overall.batting.strikeRate}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Highest Score</p>
                                            <p className="text-2xl font-black text-orange-400 italic tabular-nums">{playerStats.overall.batting.highestScore}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">50s/100s</p>
                                            <p className="text-2xl font-black text-yellow-400 italic tabular-nums">
                                               {playerStats.overall.batting.fifties}/{playerStats.overall.batting.hundreds}
                                            </p>
                                         </div>

                                         {/* Bowling Stats */}
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-green-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Wickets</p>
                                            <p className="text-2xl font-black text-green-400 italic tabular-nums">{playerStats.overall.bowling.wickets}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-green-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Economy</p>
                                            <p className="text-2xl font-black text-green-400 italic tabular-nums">{playerStats.overall.bowling.economy}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-green-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Best Figs</p>
                                            <p className="text-lg font-black text-green-400 italic truncate">{playerStats.overall.bowling.bestFigures}</p>
                                         </div>

                                         {/* Fielding & Other */}
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-cyan-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Catches</p>
                                            <p className="text-2xl font-black text-cyan-400 italic tabular-nums">{playerStats.overall.fielding.catches}</p>
                                         </div>
                                         <div className="bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all group/stat">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1 opacity-60">Matches</p>
                                             <p className="text-2xl font-black text-white tabular-nums">{playerStats.matchesPlayed}</p>
                                          </div>
                                       </div>

                                      {/* Bidding History Snapshot (Compressed) */}
                                      {auction.bidHistory && auction.bidHistory.length > 0 && (
                                        <div className="pt-4 border-t border-slate-800/30">
                                           <div className="flex gap-4 overflow-hidden items-center">
                                               <History size={14} className="text-slate-500" />
                                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-4">Live Bidding Log (Recent)</p>
                                                <div className="flex gap-3">
                                                   {auction.bidHistory.slice(-4).reverse().map((bid: any, idx: number) => (
                                                      <div key={idx} className={`px-4 py-2.5 rounded-xl border text-xs font-black italic transition-all flex items-center gap-3 ${idx === 0 ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-slate-900/40 border-slate-800/30 text-slate-500 opacity-60'}`}>
                                                         <div className="w-6 h-6 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                                                            {bid.teamLogo ? <img src={bid.teamLogo} className="w-full h-full object-cover" /> : (bid.teamName || "T").charAt(0)}
                                                         </div>
                                                         <span className="truncate max-w-[120px]">{bid.teamName}</span>
                                                         <span className={idx === 0 ? 'text-white' : ''}>· {symbol}{(bid.amount / 1000000).toFixed(2)}M</span>
                                                      </div>
                                                   ))}
                                                </div>
                                            </div>
                                        </div>
                                      )}
                                   </div>
                                 ) : (
                                   <div className="flex-1 flex items-center justify-center bg-slate-950/20 rounded-3xl border border-dashed border-slate-800/50">
                                      <div className="text-center">
                                         <PieChart size={32} className="mx-auto text-slate-800 mb-2" />
                                         <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">No Data Available</p>
                                      </div>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                    <div className="h-[500px] flex flex-col items-center justify-center rounded-[2.5rem] bg-slate-900/30 border-2 border-dashed border-slate-800 space-y-4">
                       <Gavel size={40} className="text-slate-700 animate-bounce" />
                       <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Next Player Loading...</p>
                    </div>
                  )}

                   {analytics && (
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Costliest Player Card */}
                        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-[2rem] border border-yellow-500/20 shadow-lg shadow-yellow-500/5 relative overflow-hidden group hover:border-yellow-500/40 transition-all duration-500">
                           <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-500/5 blur-2xl rounded-full" />
                           <p className="text-[9px] text-yellow-500/60 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                              <Star size={10} className="fill-yellow-500" /> Market High
                           </p>
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 shadow-inner">
                                 {getTeamLogo(analytics.costliest.soldTo) ? <img src={getTeamLogo(analytics.costliest.soldTo)!} className="w-full h-full object-cover" /> : <div className="p-2 text-slate-500"><Shield size={24} /></div>}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-black text-white truncate uppercase tracking-tight leading-none mb-1">{analytics.costliest.name}</p>
                                 <p className="text-xl font-black text-yellow-400 tabular-nums italic">{symbol}{(analytics.costliest.soldPrice / 1000000).toFixed(2)}M</p>
                              </div>
                           </div>
                        </div>

                        {/* Top Spender Card */}
                        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-[2rem] border border-blue-500/20 group hover:border-blue-500/40 transition-all duration-500">
                           <p className="text-[9px] text-blue-400 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                              <TrendingUp size={10} /> Top Spender
                           </p>
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                                 {analytics.topSpender.logo ? <img src={analytics.topSpender.logo} className="w-full h-full object-cover" /> : <div className="p-2 text-slate-500 font-black">{analytics.topSpender.name.charAt(0)}</div>}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs font-black text-slate-400 truncate uppercase tracking-tight mb-1">{analytics.topSpender.name}</p>
                                 <p className="text-xl font-black text-blue-400 tabular-nums italic">
                                    {symbol}{((auction.budgetPerTeam - analytics.topSpender.budgetRemaining) / 1000000).toFixed(2)}M
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Average Value Card */}
                        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-800 group hover:border-slate-700 transition-all duration-500">
                           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                              <LineChart size={10} /> Avg / Member
                           </p>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-600 uppercase">Market Average</p>
                              <p className="text-2xl font-black text-white tabular-nums italic">{symbol}{(analytics.avgPrice / 1000000).toFixed(2)}M</p>
                           </div>
                        </div>

                        {/* Inventory Card */}
                        <div className="bg-slate-900/60 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-800 group hover:border-slate-700 transition-all duration-500">
                           <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-3 flex items-center gap-2">
                              <PieChart size={10} /> Pipeline
                           </p>
                           <div className="space-y-2">
                              <div className="flex justify-between items-end">
                                 <p className="text-2xl font-black text-white tabular-nums leading-none">
                                    {Math.round((auction.playerPool.filter((p: any) => p.status === 'Sold').length / auction.playerPool.length) * 100)}%
                                 </p>
                                 <p className="text-[8px] font-black text-slate-500 uppercase">Allocated</p>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                                 <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(auction.playerPool.filter((p: any) => p.status === 'Sold').length / auction.playerPool.length) * 100}%` }} />
                                 <div className="h-full bg-slate-700 transition-all duration-1000" style={{ width: `${(auction.playerPool.filter((p: any) => p.status === 'Available').length / auction.playerPool.length) * 100}%` }} />
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {auction.playerPool.filter((p: any) => p.status === 'Sold').slice(-3).reverse().map((p: any, i: number) => (
                        <Card key={i} className="bg-slate-900/40 border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-all group">
                           <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                              {getTeamLogo(p.soldTo) ? <img src={getTeamLogo(p.soldTo)!} className="w-full h-full object-cover" /> : <Shield size={20} className="text-slate-600" />}
                           </div>
                           <div className="min-w-0">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Recent Sale</p>
                             <p className="font-black text-white truncate max-w-[120px]">{p.name}</p>
                             <p className="text-xs text-blue-400 font-black">{symbol}{(p.soldPrice / 1000000).toFixed(1)}M • {getTeamName(p.soldTo)}</p>
                          </div>
                       </Card>
                     ))}
                  </div>
                </div>

                {/* Right: Team Standings */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-slate-950/40 backdrop-blur-3xl border border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    {/* Header Overlay */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-50" />
                    
                    <div className="bg-slate-900/30 p-8 border-b border-slate-800/50">
                      <div className="flex items-center gap-3">
                         <Trophy size={20} className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                         <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Live Board</h2>
                      </div>
                    </div>
                    
                    <div className="max-h-[660px] overflow-auto custom-scrollbar">
                       <div className="divide-y divide-slate-800/50">
                          {auction.teams.sort((a: any, b: any) => b.budgetRemaining - a.budgetRemaining).map((team: any, i: number) => (
                             <div key={i} className="group p-6 flex items-center justify-between hover:bg-slate-900/60 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-2xl bg-slate-800 border-2 flex items-center justify-center text-xs font-black text-white shadow-lg overflow-hidden transition-transform group-hover:scale-110 ${i < 3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-slate-700/50'}`}>
                                      {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : team.name.charAt(0)}
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-sm font-black text-white uppercase truncate tracking-tight group-hover:text-blue-400 transition-colors leading-none mb-1.5">{team.name}</p>
                                      <div className="flex items-center gap-1.5">
                                         <Badge variant="outline" className="text-[8px] font-black h-4 px-1.5 border-slate-700 text-slate-500">{team.players.length} SQ</Badge>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={`text-lg font-black italic tabular-nums tracking-tighter ${team.budgetRemaining > 10000000 ? 'text-green-400' : 'text-blue-400'}`}>
                                      {symbol}{(team.budgetRemaining / 1000000).toFixed(1)}M
                                   </p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    {/* Bottom Indicator */}
                    <div className="p-6 bg-slate-900/30 border-t border-slate-800/50 flex items-center justify-center">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] opacity-40 animate-pulse">Tracking Live Data</p>
                    </div>
                  </div>
                </div>
              </div>
           </TabsContent>

            <TabsContent value="pool" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {/* Global Leaderboard Header */}
               <div className="mb-12 bg-slate-900/30 backdrop-blur-2xl rounded-[3rem] border border-slate-800/50 p-8 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
                           <Trophy className="text-blue-500 w-8 h-8 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Market Masters</h2>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Top 10 Most Expensive Signings</p>
                        </div>
                     </div>
                     <div className="flex gap-4 overflow-x-auto pb-2 w-full md:w-auto custom-scrollbar">
                        {auction.playerPool
                           .filter((p: any) => p.status === 'Sold')
                           .sort((a: any, b: any) => (b.soldPrice || 0) - (a.soldPrice || 0))
                           .slice(0, 10).map((p: any, i: number) => (
                              <div key={i} className="flex-shrink-0 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 min-w-[180px] hover:border-blue-500/30 transition-all group">
                                 <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-slate-600">#{i+1}</span>
                                    <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-700">
                                       {getTeamLogo(p.soldTo) ? <img src={getTeamLogo(p.soldTo)!} className="w-full h-full object-cover" /> : <Shield className="p-1 text-slate-600" size={12} />}
                                    </div>
                                 </div>
                                 <p className="text-xs font-black text-white truncate uppercase mb-1">{p.name}</p>
                                 <p className="text-sm font-black text-blue-400 tabular-nums italic">{symbol}{(p.soldPrice / 1000000).toFixed(2)}M</p>
                              </div>
                           ))
                        }
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {auction.playerPool.map((p: any, i: number) => {
                    const isSold = p.status === 'Sold';
                    return (
                       <Card 
                          key={i} 
                          onClick={() => setPlayerDetail(p)}
                          className={`
                            relative overflow-hidden transition-all duration-500 group cursor-pointer
                            bg-slate-900/40 backdrop-blur-xl border-slate-800/80 
                            hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-900/20 hover:scale-[1.02]
                            ${isSold ? 'ring-1 ring-green-500/20 bg-gradient-to-br from-slate-950 to-green-950/20' : ''}
                       `}>
                          {/* Status Ribbon */}
                          {isSold && (
                             <div className="absolute top-0 right-0 z-10">
                                <div className="bg-green-500 text-[10px] font-black uppercase text-white px-4 py-1 rounded-bl-xl shadow-lg animate-in slide-in-from-top slide-in-from-right duration-500">
                                   SOLD
                                </div>
                             </div>
                          )}

                          <CardHeader className="p-6 pb-2">
                             <div className="flex justify-between items-start mb-4">
                                <Badge variant="outline" className={`
                                   text-[10px] font-black uppercase px-2 shadow-sm
                                   ${p.category === 'Marquee' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                     p.category.startsWith('Set') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                     'bg-slate-500/10 text-slate-400 border-slate-800'}
                                `}>
                                   {p.category}
                                </Badge>
                                <div className="flex flex-col items-end">
                                   <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Base Price</span>
                                   <span className="text-blue-400 font-black text-lg">{symbol}{(p.basePrice / 1000000).toFixed(1)}M</span>
                                </div>
                             </div>
                             
                             <CardTitle className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tighter leading-none mb-1">
                                {p.name}
                             </CardTitle>
                             <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">{p.role}</p>
                          </CardHeader>

                          <CardContent className="p-6 pt-4">
                             <div className={`
                                rounded-2xl p-4 transition-all duration-500
                                ${isSold ? 'bg-slate-950/80 border border-green-500/20' : 'bg-slate-950/50 border border-slate-800/50'}
                             `}>
                                {isSold ? (
                                   <div className="space-y-4">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-white shadow-lg overflow-hidden">
                                            {getTeamLogo(p.soldTo) ? <img src={getTeamLogo(p.soldTo)!} className="w-full h-full object-cover" /> : getTeamName(p.soldTo).charAt(0)}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Bought By</p>
                                            <p className="text-sm font-black text-white uppercase truncate">{getTeamName(p.soldTo)}</p>
                                         </div>
                                      </div>
                                      <div className="flex justify-between items-end pt-3 border-t border-slate-800/50">
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sold For</span>
                                         <span className="text-2xl font-black text-green-400 italic leading-none">{symbol}{(p.soldPrice / 1000000).toFixed(2)}M</span>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="flex items-center justify-between text-slate-600 italic text-xs py-2">
                                      <div className="flex items-center gap-2">
                                         <History size={14} className="animate-pulse" />
                                         <span className="font-bold uppercase tracking-widest">Bidding Pending</span>
                                      </div>
                                      <Gavel size={14} />
                                   </div>
                                )}
                             </div>
                          </CardContent>

                          {/* Decorative Inner Glow */}
                          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isSold ? 'bg-gradient-to-tr from-green-500/5 to-transparent' : 'bg-gradient-to-tr from-blue-500/5 to-transparent'}`} />
                       </Card>
                    );
                 })}
              </div>
           </TabsContent>

           <TabsContent value="squads" className="mt-0 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                 {auction.teams.map((team: any, i: number) => (
                    <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-800/80 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                       {/* Background Logo Watermark */}
                       <div className="absolute -right-10 -bottom-10 w-64 h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                          {team.logo ? <img src={team.logo} className="w-full h-full object-contain grayscale" /> : <Users size={120} className="w-full h-full" />}
                       </div>

                       <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 relative z-10">
                          <div className="flex items-center gap-6">
                             <div className="w-20 h-20 rounded-[2rem] bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-black text-white shadow-2xl overflow-hidden">
                                {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : team.name.charAt(0)}
                             </div>
                             <div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none mb-2">{team.name}</h3>
                                <div className="flex items-center gap-3">
                                   <Badge variant="outline" className="text-green-400 border-green-400/20 bg-green-400/5 px-3 py-1 text-sm font-black italic">
                                      {symbol}{(team.budgetRemaining / 1000000).toFixed(2)}M Left
                                   </Badge>
                                   <Badge variant="outline" className="text-blue-400 border-blue-400/20 bg-blue-400/5 px-3 py-1 text-sm font-black">
                                      {team.players.length} Players
                                   </Badge>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                          {team.players.length > 0 ? team.players.map((p: any, j: number) => (
                             <div key={j} className="flex justify-between items-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition-all hover:bg-slate-900/60 group/item">
                                <div className="min-w-0">
                                   <p className="text-sm font-black text-white uppercase truncate group-hover/item:text-blue-400 transition-colors">{p.name}</p>
                                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.role}</p>
                                </div>
                                <span className="text-sm font-black text-blue-400 italic bg-blue-400/5 px-3 py-1 rounded-lg border border-blue-400/10">
                                   {symbol}{(p.price / 1000000).toFixed(1)}M
                                </span>
                             </div>
                          )) : (
                             <div className="col-span-full py-12 text-center bg-slate-950/40 rounded-[2rem] border border-dashed border-slate-800">
                                <Users size={32} className="mx-auto text-slate-700 mb-2" />
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em]">Building Squad...</p>
                             </div>
                          )}
                       </div>
                    </Card>
                 ))}
              </div>
           </TabsContent>

           <TabsContent value="blog" className="mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
              <div className="max-w-4xl mx-auto space-y-6 pb-20">
                 <div className="text-center space-y-2 mb-10">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Auction News Feed</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Live Chronicles of the Marketplace</p>
                 </div>
                 
                 {liveBlog.length > 0 ? (
                    liveBlog.map((item, idx) => (
                       <Card key={item.id} className="bg-slate-900/40 backdrop-blur-2xl border-slate-800/60 overflow-hidden rounded-[2rem] group hover:border-blue-500/30 transition-all duration-500 shadow-2xl relative">
                          {/* Time Badge */}
                          <div className="absolute top-6 right-8 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
                             {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          <CardContent className="p-0">
                             <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                                   {item.player?.photo ? (
                                      <img src={item.player.photo} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                                   ) : (
                                      <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-800">
                                         <User size={80} />
                                      </div>
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                                   <div className="absolute bottom-4 left-6">
                                      <Badge className="bg-blue-600/90 hover:bg-blue-600 border-0 text-[10px] font-black px-4 py-1.5 rounded-lg shadow-xl uppercase">
                                         {item.player?.category || 'Standard'}
                                      </Badge>
                                   </div>
                                </div>
                                
                                <div className="p-8 md:w-2/3 flex flex-col justify-center space-y-4">
                                   <div className="flex items-center gap-3 opacity-60">
                                      <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                         {item.teamLogo ? <img src={item.teamLogo} className="w-full h-full object-cover" /> : <Shield size={12} />}
                                      </div>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.teamName} Signature</span>
                                   </div>
                                   
                                   <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                      {item.headline}
                                   </h3>
                                   
                                   <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                      <div className="flex items-baseline gap-1">
                                         <span className="text-xs font-black text-blue-500">{symbol}</span>
                                         <span className="text-2xl font-black text-white italic tabular-nums">{(item.amount / 1000000).toFixed(2)}</span>
                                         <span className="text-sm font-black text-blue-500 underline decoration-2 underline-offset-4">M</span>
                                      </div>
                                      
                                      <Button 
                                         variant="ghost" 
                                         size="sm" 
                                         className="rounded-xl bg-slate-950/60 text-slate-400 hover:text-white hover:bg-blue-600 transition-all group/btn gap-2 font-black uppercase tracking-widest text-[9px]"
                                         onClick={() => setViewingBlogItem(item)}
                                      >
                                         Read Full Intel <Star size={12} className="group-hover/btn:fill-white" />
                                      </Button>
                                   </div>
                                </div>
                             </div>
                          </CardContent>
                       </Card>
                    ))
                 ) : (
                    <div className="py-40 text-center space-y-6 bg-slate-900/20 rounded-[3rem] border border-dashed border-slate-800/50">
                       <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto border-2 border-slate-800 border-dashed animate-pulse">
                          <History className="text-slate-700" size={40} />
                       </div>
                       <div className="space-y-2">
                          <p className="text-sm font-black text-slate-600 uppercase tracking-[0.4em]">Chronicles Awaiting Entries</p>
                          <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">The story of this auction has yet to be written.</p>
                       </div>
                    </div>
                 )}
              </div>
           </TabsContent>
        </Tabs>

        {/* Decorative Elements */}
        <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
      </div>

      {/* Player Sold Celebration Modal */}
      <Dialog open={!!soldData} onOpenChange={() => setSoldData(null)}>
        <DialogContent className="bg-slate-900/95 border-blue-500/50 text-white text-center p-12 max-w-lg backdrop-blur-xl rounded-[2rem]">
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <Trophy size={48} className="text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">SOLD! 🎉</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Congratulations to</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                 <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-lg font-black text-white">
                    {soldData?.teamLogo ? <img src={soldData.teamLogo} className="w-full h-full object-cover" /> : (soldData?.teamName || "T").charAt(0)}
                 </div>
                 <p className="text-3xl font-black text-white">{soldData?.teamName}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-1 shadow-inner">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Player Added to Squad</p>
              <p className="text-2xl font-black text-white uppercase">{soldData?.playerName}</p>
              <div className="pt-4 mt-4 border-t border-slate-800/50">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Winning Bid</p>
                <p className="text-4xl font-black text-green-400">{symbol}{((soldData?.amount || 0) / 1000000).toFixed(2)}M</p>
              </div>
            </div>

            <Button onClick={() => setSoldData(null)} className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 text-lg">
               Next Player!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blog Detail Modal / Battle Summary */}
      <Dialog open={!!viewingBlogItem} onOpenChange={() => setViewingBlogItem(null)}>
        <DialogContent className="bg-slate-950/95 border-blue-500/30 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
           {viewingBlogItem && (
             <div className="space-y-8 overflow-auto pr-4 custom-scrollbar">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                   <div className="w-full md:w-1/3 aspect-square bg-slate-900 rounded-[2.5rem] overflow-hidden border-4 border-slate-800 shadow-2xl relative group">
                      {viewingBlogItem.player?.photo ? (
                         <img src={viewingBlogItem.player.photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-800"><User size={120} /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                   </div>
                   
                   <div className="flex-1 space-y-6">
                      <div>
                         <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">Official Signing Summary</Badge>
                         <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2">{viewingBlogItem.playerName}</h2>
                         <div className="flex items-center gap-4">
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs pb-1 border-b-2 border-blue-500">{viewingBlogItem.player?.role}</p>
                            <span className="text-slate-700">•</span>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">{viewingBlogItem.player?.category}</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Final Purchase Price</p>
                            <p className="text-3xl font-black text-green-400 italic">{symbol}{(viewingBlogItem.amount / 1000000).toFixed(2)}M</p>
                         </div>
                         <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 group">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">New Franchise</p>
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                                  {viewingBlogItem.teamLogo ? <img src={viewingBlogItem.teamLogo} className="w-full h-full object-cover" /> : <Shield size={14} />}
                               </div>
                               <p className="text-xl font-black text-white uppercase truncate">{viewingBlogItem.teamName}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 opacity-40">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">The Narrative Chronicles</span>
                      <div className="h-px flex-1 bg-slate-800" />
                   </div>
                   
                   <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-blue-500/20 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Gavel size={120} />
                      </div>
                      <p className="text-xl md:text-2xl font-medium text-slate-400 leading-relaxed italic relative z-10 selection:bg-blue-500/50" 
                         dangerouslySetInnerHTML={{ 
                            __html: generateNarrativeSummary(viewingBlogItem)
                               .replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-black uppercase tracking-tight">$1</span>') 
                         }}
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 opacity-40">
                      <History size={16} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Bidding Sequence Log</span>
                      <div className="h-px flex-1 bg-slate-800" />
                   </div>
                   
                   <div className="grid gap-3">
                      {viewingBlogItem.battleHistory && viewingBlogItem.battleHistory.length > 0 ? (
                         viewingBlogItem.battleHistory.slice().reverse().map((bid: any, bIdx: number) => (
                            <div key={bIdx} className={`flex items-center justify-between p-4 rounded-2xl border ${bIdx === 0 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-950/40 border-slate-800/40 opacity-60'}`}>
                               <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black overflow-hidden ${bIdx === 0 ? 'bg-blue-600' : 'bg-slate-800'}`}>
                                     {bid.teamLogo ? <img src={bid.teamLogo} className="w-full h-full object-cover" /> : bid.teamName?.charAt(0)}
                                  </div>
                                  <span className="font-black text-xs uppercase text-white tracking-tight">{bid.teamName}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <span className={`font-black italic text-sm ${bIdx === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{symbol}{(bid.amount / 1000000).toFixed(2)}M</span>
                                  {bIdx === 0 && <Badge className="bg-green-500/20 text-green-400 border-green-500/20 text-[8px] font-black uppercase">Final Bid</Badge>}
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="p-8 text-center bg-slate-950/40 rounded-3xl border border-dashed border-slate-800">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest italic">A decisive victory with no recorded counter-bids in this session.</p>
                         </div>
                      )}
                   </div>
                </div>

                <Button onClick={() => setViewingBlogItem(null)} className="w-full bg-slate-100 hover:bg-white text-slate-950 h-14 rounded-2xl font-black uppercase tracking-widest shadow-2xl transition-all">
                   Close Intellectual Report
                </Button>
             </div>
           )}
        </DialogContent>
      </Dialog>

      {/* Player Detail Modal */}
      <Dialog open={!!playerDetail} onOpenChange={() => setPlayerDetail(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-8 rounded-[3rem]">
          <div className="flex-1 overflow-auto pr-2 space-y-8">
             <div className="flex items-center gap-8 border-b border-slate-800 pb-8">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl relative overflow-hidden">
                   {playerDetail?.photo ? <img src={playerDetail.photo} className="w-full h-full object-cover" /> : <User size={48} className="text-slate-600" />}
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <div>
                         <Badge variant="outline" className="bg-blue-600/10 text-blue-400 border-blue-500/20 mb-2 uppercase tracking-widest text-[10px] font-black">{playerDetail?.category}</Badge>
                         <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">{playerDetail?.name}</h2>
                         <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">{playerDetail?.role}</p>
                      </div>
                      <div className="text-right">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            playerDetail?.status === 'Sold' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                            playerDetail?.status === 'Unsold' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                            'bg-blue-600/10 text-blue-400 border-blue-500/30'
                         }`}>
                            {playerDetail?.status}
                         </span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800">
                   <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Base Price</p>
                   <p className="text-xl font-black text-blue-400">{symbol}{((playerDetail?.basePrice || 0) / 1000000).toFixed(1)}M</p>
                </div>
                {playerDetail?.status === 'Sold' && (
                   <>
                      <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800">
                         <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Sold Price</p>
                         <p className="text-xl font-black text-green-400">{symbol}{((playerDetail?.soldPrice || 0) / 1000000).toFixed(2)}M</p>
                      </div>
                      <div className="col-span-2 bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-white overflow-hidden">
                            {getTeamLogo(playerDetail.soldTo) ? <img src={getTeamLogo(playerDetail.soldTo)!} className="w-full h-full object-cover" /> : getTeamName(playerDetail.soldTo).charAt(0)}
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-0.5">Bought By</p>
                            <p className="text-lg font-black text-white uppercase truncate">{getTeamName(playerDetail.soldTo)}</p>
                         </div>
                      </div>
                   </>
                )}
             </div>

             {playerDetail?.bidHistory && playerDetail.bidHistory.length > 0 && (
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <History size={18} className="text-blue-500" />
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Bidding History</h3>
                   </div>
                   <div className="bg-slate-950/30 rounded-[2rem] border border-slate-800 overflow-hidden divide-y divide-slate-800/50">
                      {playerDetail.bidHistory.slice().reverse().map((bid: any, idx: number) => (
                         <div key={idx} className="p-5 flex justify-between items-center bg-slate-900/20">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">
                                  {playerDetail.bidHistory.length - idx}
                               </div>
                               <div>
                                  <p className="font-black text-white uppercase text-sm leading-none">{bid.teamName}</p>
                                  <p className="text-[9px] text-slate-500 mt-1">{new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                               </div>
                            </div>
                            <p className="font-black text-blue-400 italic text-lg">{symbol}{(bid.amount / 1000000).toFixed(2)}M</p>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800">
             <Button onClick={() => setPlayerDetail(null)} className="w-full bg-slate-800 hover:bg-slate-700 h-14 rounded-2xl font-black uppercase tracking-widest">Close Record</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
