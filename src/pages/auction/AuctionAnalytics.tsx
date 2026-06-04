import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auctionApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  DollarSign, 
  ArrowLeft, 
  PieChart, 
  Shield,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

export default function AuctionAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [auction, setAuction] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const auctionRes: any = await (auctionApi as any).get(id!);
      const analyticsRes: any = await (auctionApi as any).getAnalytics(id!);
      
      if (auctionRes.success && analyticsRes.success) {
        setAuction(auctionRes.data);
        setData(analyticsRes.data);
      }
    } catch (e) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const { globalMetrics, teamMetrics } = data;
  const currencySymbols: any = { USD: "$", INR: "₹", GBP: "£", EUR: "€" };
  const symbol = currencySymbols[auction?.currency || "USD"];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-2xl bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                <BarChart3 className="text-blue-500" size={32} />
                Auction Intelligence
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-1">
                Post-Event Strategic Breakdown • {auction?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Badge className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                Finalized {globalMetrics.totalSold} Signings
             </Badge>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Market Turnover', val: `${symbol}${(globalMetrics.totalSpent / 1000000).toFixed(2)}M`, icon: <DollarSign />, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Avg Sale Value', val: `${symbol}${(globalMetrics.averagePrice / 1000000).toFixed(2)}M`, icon: <TrendingUp />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Top Acquisition', val: globalMetrics.mostExpensive?.name || 'N/A', sub: `${symbol}${((globalMetrics.mostExpensive?.soldPrice || 0) / 1000000).toFixed(2)}M`, icon: <Trophy />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Value Signing', val: globalMetrics.cheapestHighValue?.name || 'N/A', sub: `Rating ${globalMetrics.cheapestHighValue?.rating || 0}`, icon: <Zap />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((item, i) => (
            <Card key={i} className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:border-blue-500/30 transition-all shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${item.bg} ${item.color} shadow-lg`}>
                    {item.icon}
                  </div>
                  <BarChart3 size={12} className="text-slate-700" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                <div className="space-y-0.5">
                  <p className={`text-2xl font-black tracking-tight ${item.color} leading-none`}>{item.val}</p>
                  {item.sub && <p className="text-[10px] text-slate-500 font-bold uppercase">{item.sub}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Breakdown Section */}
        <div className="grid lg:grid-cols-3 gap-8">
           {/* Team Efficiency League */}
           <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 border-b border-slate-800/50">
                 <div className="flex justify-between items-center">
                    <div>
                       <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Strategic Efficiency League</CardTitle>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Value Delivered per Million Spent</p>
                    </div>
                    <Badge variant="outline" className="border-slate-800 text-[8px] font-black uppercase">Normalized Score</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="space-y-6">
                    {teamMetrics.sort((a: any, b: any) => b.efficiency - a.efficiency).map((team: any, i: number) => (
                       <div key={i} className="space-y-3 p-4 rounded-3xl bg-slate-950/40 border border-slate-800/50 group hover:bg-slate-950 transition-all">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-lg border border-slate-800 text-slate-500">
                                   {i + 1}
                                </div>
                                <div>
                                   <p className="font-black text-white uppercase tracking-tight">{team.name}</p>
                                   <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{team.playerCount} Players • {symbol}{(team.totalSpent/1000000).toFixed(1)}M Spent</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-2xl font-black text-blue-400 tabular-nums italic">{team.efficiency}</p>
                                <p className="text-[8px] text-slate-600 font-black uppercase">Efficiency Score</p>
                             </div>
                          </div>
                          <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 ring-1 ring-slate-800">
                             <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                                style={{ width: `${Math.min(100, (team.efficiency / teamMetrics[0].efficiency) * 100)}%` }}
                             />
                          </div>
                          <div className="flex justify-between items-center px-1">
                             <div className="flex gap-3">
                                {Object.entries(team.squadRoles).map(([role, count]: any, idx) => (
                                   <span key={idx} className="text-[8px] font-black text-slate-500 uppercase">
                                      {count} {role.substring(0, 3)}
                                   </span>
                                ))}
                             </div>
                             <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">
                                Left: {symbol}{(team.budgetRemaining/1000000).toFixed(2)}M
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>

           {/* Market High-Performers */}
           <div className="space-y-8">
              <Card className="bg-slate-900/40 border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <CardHeader className="p-8 border-b border-slate-800/50">
                    <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Market Records</CardTitle>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Historical Highs from this session</p>
                 </CardHeader>
                 <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                       <div className="divide-y divide-slate-800/50">
                          {auction.playerPool
                            .filter((p: any) => p.status === 'Sold')
                            .sort((a: any, b: any) => b.soldPrice - a.soldPrice)
                            .slice(0, 10)
                            .map((p: any, i: number) => (
                              <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-900/40 transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-blue-500 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                                       #{i + 1}
                                    </div>
                                    <div>
                                       <p className="font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{p.name}</p>
                                       <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{p.role} • Rating {p.rating || 0}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-sm font-black text-white italic tabular-nums">{symbol}{(p.soldPrice / 1000000).toFixed(2)}M</p>
                                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">
                                       By {auction.teams.find((t: any) => t._id === p.soldTo)?.name}
                                    </span>
                                 </div>
                              </div>
                            ))
                          }
                       </div>
                    </ScrollArea>
                 </CardContent>
              </Card>

              {/* Recruitment Strategy Map */}
              <Card className="bg-slate-900/40 border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <CardHeader className="p-8 border-b border-slate-800/50">
                    <CardTitle className="text-xl font-black text-white italic uppercase tracking-tighter">Role Allocation</CardTitle>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Global workforce distribution</p>
                 </CardHeader>
                 <CardContent className="p-8">
                    <div className="grid grid-cols-2 gap-4">
                       {['Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role, i) => {
                          const count = auction.playerPool.filter((p: any) => p.status === 'Sold' && p.role === role).length;
                          const total = auction.playerPool.filter((p: any) => p.status === 'Sold').length;
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          return (
                             <div key={i} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center text-center group hover:border-blue-500/30 transition-all">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{role}s</p>
                                <div className="text-2xl font-black text-white mb-1">{count}</div>
                                <div className="w-full h-1 bg-slate-900 rounded-full mt-2 overflow-hidden">
                                   <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{ width: `${percentage}%` }} />
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center pt-8 border-t border-slate-800/50">
           <Button 
              className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 group transition-all"
              onClick={() => navigate(`/live/${id}`)}
          >
             Back to Live Room <ArrowRight className="group-hover:translate-x-1 transition-transform" />
           </Button>
        </div>
      </div>
    </div>
  );
}
