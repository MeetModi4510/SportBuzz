import { useState, useEffect } from "react";
import { auctionApi } from "@/services/api";
import { getSocket } from "@/services/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gavel, User, TrendingUp, CheckCircle2, AlertCircle, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuctionControlProps {
  auction: any;
  onUpdate: () => void;
}

export const AuctionControl = ({ auction, onUpdate }: AuctionControlProps) => {
  const [loading, setLoading] = useState(false);
  const [currentBid, setCurrentBid] = useState(auction.currentBid);
  const socket = getSocket();
  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€"
  };
  const symbol = auction.currency ? currencySymbols[auction.currency] : "$";

  // Use the bid from props primarily, but keep a local back-up if needed
  const displayBid = auction.currentBid || currentBid;

  useEffect(() => {
    // We still join the room just for safety, or we could rely on the parent
    socket.emit("join_auction", auction._id);
    return () => {
      socket.emit("leave_auction", auction._id);
    };
  }, [auction._id]);

  const handleNextPlayer = async (category?: string) => {
    setLoading(true);
    try {
      const res: any = await auctionApi.nextPlayer(auction._id, category);
      if (res.success) {
        onUpdate();
        toast.success(`Next player: ${res.data.currentPlayer.name}`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to draw next player");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    setLoading(true);
    try {
      const res: any = await auctionApi.sell(auction._id);
      if (res.success) {
        onUpdate();
        toast.success(res.message);
      }
    } catch (e) {
      toast.error("Failed to finalize sale");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAuction = async () => {
    if (!window.confirm("Are you sure you want to finalize the auction and generate the tournament?")) return;
    setLoading(true);
    try {
      const res: any = await auctionApi.finalize(auction._id);
      if (res.success) {
        onUpdate();
        toast.success("Auction completed! Tournament matches generated.");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to finalize auction");
    } finally {
      setLoading(false);
    }
  };

  const handleUndoBid = async () => {
    if (!auction.bidHistory || auction.bidHistory.length === 0) {
      toast.error("No bids to undo");
      return;
    }
    
    setLoading(true);
    try {
      const res: any = await auctionApi.undoBid(auction._id);
      if (res.success) {
        onUpdate();
        toast.success("Last bid undone");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to undo bid");
    } finally {
      setLoading(false);
    }
  };

  const currentPlayer = auction.currentPlayer;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Current Player Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">Current Player</CardTitle>
              <CardDescription>Bidding in progress...</CardDescription>
            </div>
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              {currentPlayer?.category || "No Session"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentPlayer?.name ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <User size={32} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{currentPlayer.name}</h3>
                  <p className="text-slate-400">{currentPlayer.role}</p>
                  <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-semibold">
                    Base: {symbol}{(currentPlayer.basePrice / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-8 rounded-[2rem] border-2 border-blue-500/20 text-center relative overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="absolute inset-x-0 -top-10 h-20 bg-blue-500/5 blur-3xl rounded-full" />
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-4 relative z-10 opacity-70">Current Live Bid</p>
                <div className="flex items-center justify-center gap-2 relative z-10 mb-4 scale-110">
                  <span className="text-2xl font-black text-blue-500 italic mb-2">{symbol}</span>
                  <span className="text-6xl font-black text-white leading-none tracking-tighter drop-shadow-2xl tabular-nums">
                    {(displayBid.amount / 1000000).toFixed(2)}
                  </span>
                  <span className="text-2xl font-black text-blue-500 italic mb-2 underline decoration-blue-500 decoration-4">M</span>
                </div>
                <div className="relative z-10">
                  <Badge variant="secondary" className="px-4 py-1 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-black text-xs uppercase tracking-widest border border-blue-500/20 italic flex items-center gap-2 mx-auto w-fit">
                    {displayBid.teamLogo ? (
                       <img src={displayBid.teamLogo} className="w-4 h-4 rounded-sm object-cover" />
                    ) : (
                       <Users size={12} className="text-blue-500/50" />
                    )}
                    {displayBid.teamName || "AWAITING BID"}
                  </Badge>
                </div>
              </div>

              {/* Bid History */}
              {auction.bidHistory && auction.bidHistory.length > 0 && (
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-left">Recent Bids</p>
                   </div>
                  <ScrollArea className="h-[100px] w-full pr-4 border border-slate-800 rounded-lg p-2 bg-slate-950/20">
                    <div className="space-y-2">
                      {auction.bidHistory.slice().reverse().map((bid: any, idx: number) => (
                        <div key={idx} className={`flex justify-between items-center p-2 rounded border text-xs ${idx === 0 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/40 border-slate-800/10 opacity-50'}`}>
                          <div className="flex items-center gap-2">
                             <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black overflow-hidden shrink-0 ${idx === 0 ? 'bg-blue-600' : 'bg-slate-800'}`}>
                                {bid.teamLogo ? <img src={bid.teamLogo} className="w-full h-full object-cover" /> : bid.teamName?.charAt(0)}
                             </div>
                             <span className="font-bold text-white uppercase text-[10px]">{bid.teamName}</span>
                          </div>
                          <span className={`font-black italic ${idx === 0 ? 'text-blue-400' : 'text-slate-400'}`}>{symbol}{(bid.amount / 1000000).toFixed(2)}M</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                   onClick={handleUndoBid} 
                   disabled={loading || !auction.bidHistory || auction.bidHistory.length === 0} 
                   variant="outline" 
                   className="flex-1 h-12 border-slate-700 hover:bg-slate-800 font-bold uppercase tracking-wider"
                >
                  Undo Bid
                </Button>
                <Button onClick={handleSell} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-lg">
                  {displayBid.teamId ? "SOLD" : "UNSOLD"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <Gavel size={32} />
              </div>
              <p className="text-slate-500">Wait for the auctioneer to draw a player.</p>
              <Button onClick={() => handleNextPlayer()} disabled={loading} className="gap-2">
                Draw From Pool
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Actions Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
          <CardDescription>Control the flow of the entire auction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Next Player Rounds</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleNextPlayer('Batsman')} disabled={loading || currentPlayer}>Batsmen</Button>
              <Button variant="outline" onClick={() => handleNextPlayer('Bowler')} disabled={loading || currentPlayer}>Bowlers</Button>
              <Button variant="outline" onClick={() => handleNextPlayer('All-Rounder')} disabled={loading || currentPlayer}>All-rounders</Button>
              <Button variant="outline" onClick={() => handleNextPlayer()} disabled={loading || currentPlayer}>Any Random</Button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Auction Completion</h4>
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg space-y-3">
              <div className="flex gap-2">
                <AlertCircle size={16} className="text-yellow-500 shrink-0" />
                <p className="text-xs text-slate-400">
                  Total teams must meet the minimum requirement of <strong>{auction.minPlayersPerTeam} players</strong> before finalization.
                </p>
              </div>
              <Button onClick={handleFinalizeAuction} disabled={loading || auction.status === 'Completed'} className="w-full bg-slate-100 text-slate-900 hover:bg-white font-bold gap-2">
                <Trophy size={18} /> Finalize & Generate Tournament
              </Button>
            </div>
          </div>

          <div className="space-y-2">
             <h4 className="text-sm font-semibold text-slate-400">Auction Summary</h4>
             <div className="space-y-1">
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Total Players in Pool:</span>
                   <span className="text-white">{auction.playerPool.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Completed:</span>
                   <span className="text-white">{auction.playerPool.filter((p: any) => p.status !== 'Available').length}</span>
                </div>
                <Progress value={(auction.playerPool.filter((p: any) => p.status !== 'Available').length / auction.playerPool.length) * 100} className="h-1.5 mt-2" />
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
