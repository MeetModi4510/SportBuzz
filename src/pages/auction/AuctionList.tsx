import { useState, useEffect } from "react";
import { auctionApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Gavel, Trash2, Bell, BellOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AuctionList() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setCurrentUser(JSON.parse(userStr));
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res: any = await auctionApi.list();
      if (res.success) setAuctions(res.data);
    } catch (e) {
      toast.error("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this auction?")) return;
    try {
      const res: any = await auctionApi.delete(id);
      if (res.success) {
        toast.success("Auction deleted");
        fetchAuctions();
      }
    } catch (e) {
      toast.error("Failed to delete auction");
    }
  };

  const handleFollow = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res: any = await auctionApi.follow(id);
      if (res.success) {
        toast.success(res.isFollowing ? "Following auction" : "Unfollowed auction");
        fetchAuctions();
      }
    } catch (e) {
      toast.error("Failed to update follow status");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {auctions.map(auction => {
          const currentUserId = currentUser?.id || currentUser?._id;
          const auctionCreatorId = auction.createdBy?._id || auction.createdBy;
          const isCreator = currentUser && String(auctionCreatorId) === String(currentUserId);
          const isFollowing = auction.followers?.some((f: any) => String(f) === String(currentUserId));

          return (
            <Card key={auction._id} className="bg-slate-900 border-slate-800 hover:border-blue-500/50 transition-all group overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start gap-2">
                  <span className="truncate flex-1">{auction.name}</span>
                  <div className="flex items-center gap-1">
                    {!isCreator && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 ${isFollowing ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}
                            onClick={(e) => handleFollow(e, auction._id)}
                        >
                            {isFollowing ? <Bell size={16} fill="currentColor" /> : <BellOff size={16} />}
                        </Button>
                    )}
                    {isCreator && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-500"
                            onClick={(e) => handleDelete(e, auction._id)}
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}
                    <Gavel className="text-slate-600 group-hover:text-blue-500 transition-colors ml-1" size={18} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Teams: {auction.teams.length}</span>
                  <span className="capitalize px-2 py-0.5 bg-slate-800 rounded text-slate-300 font-medium">{auction.status}</span>
                </div>
                 <div className="flex gap-2">
                   {isCreator ? (
                     <>
                       <Button 
                           onClick={() => window.open(`/auction/manage/${auction._id}`, '_blank')} 
                           className="flex-1 bg-blue-600 hover:bg-blue-700"
                       >
                         Manage
                       </Button>
                       {auction.status === 'Live' && (
                         <Button 
                             onClick={() => window.open(`/auction/live/${auction._id}`, '_blank')} 
                             variant="outline"
                             className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white"
                         >
                           Watch Live
                         </Button>
                       )}
                     </>
                   ) : (
                     <Button 
                         onClick={() => window.open(`/auction/live/${auction._id}`, '_blank')} 
                         className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300"
                     >
                       Watch Live
                     </Button>
                   )}
                   
                   {!isCreator && (
                     <Button 
                       variant="outline"
                       className="border-slate-700 hover:bg-slate-800 text-slate-400 group-hover:text-blue-400"
                       onClick={() => window.open(`/auction/owner/${auction._id}`, '_blank')}
                       title="Captain Login"
                     >
                       <Shield size={16} />
                     </Button>
                   )}
                 </div>
              </CardContent>
            </Card>
          );
        })}
        {auctions.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
            No auctions found. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
