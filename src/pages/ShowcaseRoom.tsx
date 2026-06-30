import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { 
  Trophy, Award, Zap, Sparkles, ArrowLeft, 
  Target, Shield, Medal, Star, Flame, Boxes, Cpu
} from "lucide-react";
import { activityApi, userApi } from "@/services/api";

const ShowcaseRoom = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [achRes, userRes] = await Promise.all([
          activityApi.getAchievements(),
          userApi.getProfile()
        ]) as any[];
        
        if (achRes.success) {
          setAchievements(achRes.data.achievements || []);
        }
        if (userRes.success) {
          setUser(userRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch showcase data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const defaultAchievements = [
    { id: "1", title: "Identity Master", description: "Complete all profile metadata", icon: <Boxes className="text-blue-400" />, unlocked: user?.fullName && user?.bio, rarity: "Common" },
    { id: "2", title: "Elite Analyst", description: "100+ Successful Operations", icon: <Cpu className="text-purple-400" />, unlocked: false, rarity: "Epic" },
    { id: "3", title: "Clutch King", description: "Last minute win prediction", icon: <Zap className="text-yellow-400" />, unlocked: true, rarity: "Legendary" },
    { id: "4", title: "Founding Member", description: "SportsBuzz Pioneer Badge", icon: <Shield className="text-emerald-400" />, unlocked: true, rarity: "Rare" },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Showcase - SportsBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-blue-500/30 pb-20">
        
        {/* Top Navbar */}
        <div className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Profile
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-16">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
                Showcase Room
              </h1>
              <p className="text-slate-400 text-lg font-medium">Achievements and milestones earned across your journey.</p>
            </div>

            <div className="flex items-center gap-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-white mb-1">{displayAchievements.filter(a => a.unlocked).length}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Unlocked</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div className="text-center px-4">
                <p className="text-3xl font-bold text-blue-400 mb-1">{user?.stats?.totalPoints || 0}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total XP</p>
              </div>
            </div>
          </div>

          {/* Trophy Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayAchievements.map((ach, idx) => (
              <div 
                key={ach.id || idx}
                className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                  ach.unlocked 
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] shadow-lg shadow-black/20' 
                    : 'bg-transparent border-white/5 opacity-40 grayscale'
                }`}
              >
                {/* Rarity Badge */}
                <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                   ach.rarity === 'Legendary' ? 'bg-amber-500/10 text-amber-500' :
                   ach.rarity === 'Epic' ? 'bg-purple-500/10 text-purple-500' :
                   ach.rarity === 'Rare' ? 'bg-blue-500/10 text-blue-500' :
                   'bg-white/5 text-slate-400'
                }`}>
                  {ach.rarity || 'Common'}
                </div>

                {/* Achievement Icon */}
                <div className="flex flex-col items-center text-center gap-5 mt-6">
                  <div className={`w-20 h-20 rounded-2xl bg-[#09090b] border border-white/5 flex items-center justify-center text-3xl shadow-inner ${ach.unlocked ? 'text-white' : 'text-slate-600'}`}>
                    {ach.icon || "🏆"}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-1">{ach.title}</h3>
                    <p className="text-sm text-slate-400 font-medium">{ach.description}</p>
                  </div>

                  {ach.unlocked && (
                    <div className="pt-2 flex items-center gap-2">
                       <Sparkles size={14} className="text-blue-500" />
                       <span className="text-xs font-semibold text-blue-400">Unlocked</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Call to Action */}
          <div className="mt-16 p-10 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold text-white mb-3">Keep Growing Your Legacy</h2>
              <p className="text-slate-400 text-base max-w-xl mx-auto">
                Participate in more matches and build your accuracy to earn exclusive badges and climb the ranks.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default ShowcaseRoom;
