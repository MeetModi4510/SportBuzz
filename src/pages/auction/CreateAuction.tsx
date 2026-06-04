import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auctionApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function CreateAuction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    budgetPerTeam: 50000000,
    minPlayersPerTeam: 11,
    maxPlayersPerTeam: 18,
    teamCount: 8,
    currency: "USD"
  });

  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    GBP: "£",
    EUR: "€"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await auctionApi.create(formData);
      if (res.success) {
        toast.success("Auction created successfully!");
        navigate(`/auction/manage/${res.data._id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create auction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/auctions")} className="gap-2">
        <ArrowLeft size={16} /> Back to List
      </Button>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Auction</CardTitle>
          <CardDescription>Setup your IPL-style auction rules and team count.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Auction Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Summer Premier League 2026" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teamCount">Number of Teams</Label>
                <Input 
                  id="teamCount" 
                  type="number" 
                  value={formData.teamCount}
                  onChange={(e) => setFormData({...formData, teamCount: parseInt(e.target.value)})}
                  min={2}
                  max={20}
                  required
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget Per Team ({currencySymbols[formData.currency]})</Label>
              <Input 
                id="budget" 
                type="number" 
                value={formData.budgetPerTeam}
                onChange={(e) => setFormData({...formData, budgetPerTeam: parseInt(e.target.value)})}
                required
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPlayers">Min Players Per Team</Label>
                <Input 
                  id="minPlayers" 
                  type="number" 
                  value={formData.minPlayersPerTeam}
                  onChange={(e) => setFormData({...formData, minPlayersPerTeam: parseInt(e.target.value)})}
                  min={1}
                  required
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max Players (Optional)</Label>
                <Input 
                  id="maxPlayers" 
                  type="number" 
                  value={formData.maxPlayersPerTeam}
                  onChange={(e) => setFormData({...formData, maxPlayersPerTeam: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 mt-6" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Initialize Auction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
