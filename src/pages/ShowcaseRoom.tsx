import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { 
  Trophy, Award, Zap, Sparkles, ChevronLeft, 
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
    { id: "4", title: "Founding Member", description: "SportBuzz Pioneer Badge", icon: <Shield className="text-emerald-400" />, unlocked: true, rarity: "Rare" },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-blue-500 animate-pulse font-black uppercase tracking-[0.5em]">Initializing Showcase...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Holographic Showcase - SportBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-[#02010a] text-slate-200 overflow-x-hidden selection:bg-purple-500/30">
        {/* Cyber Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[size:40px_40px] bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)]" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
            <div className="space-y-4 text-center md:text-left">
              <Button 
                onClick={() => navigate("/profile")}
                variant="ghost" 
                className="text-slate-500 hover:text-white group -ml-4"
              >
                <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Identity
              </Button>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
                Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 animate-gradient">Showcase</span>
              </h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">Operational Achievements & Career Milestones</p>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 backdrop-blur-xl flex items-center gap-10 shadow-2xl">
              <div className="text-center">
                <p className="text-4xl font-black text-white leading-none mb-1">{displayAchievements.filter(a => a.unlocked).length}</p>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Unlocked</p>
              </div>
              <div className="w-[1px] h-12 bg-slate-800" />
              <div className="text-center">
                <p className="text-4xl font-black text-blue-500 leading-none mb-1">{user?.stats?.totalPoints || 0}</p>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global XP</p>
              </div>
            </div>
          </div>

          {/* Trophy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayAchievements.map((ach, idx) => (
              <div 
                key={ach.id || idx}
                className={`group relative p-8 rounded-[3rem] border transition-all duration-700 hover:scale-105 active:scale-95 cursor-default overflow-hidden ${
                  ach.unlocked 
                    ? 'bg-slate-900/40 border-slate-800 hover:border-blue-500/50 shadow-2xl' 
                    : 'bg-slate-950/20 border-slate-900/50 opacity-40 grayscale'
                }`}
              >
                {/* Hologram Base */}
                <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Rarity Badge */}
                <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border ${
                   ach.rarity === 'Legendary' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                   ach.rarity === 'Epic' ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' :
                   ach.rarity === 'Rare' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                   'bg-slate-500/10 border-slate-500/30 text-slate-500'
                }`}>
                  {ach.rarity || 'Common'}
                </div>

                {/* Achievement Icon */}
                <div className="relative z-10 flex flex-col items-center text-center gap-6 py-4">
                  <div className={`w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center text-4xl shadow-inner relative group-hover:rotate-12 transition-transform duration-700 ${ach.unlocked ? 'animate-float' : ''}`}>
                    {ach.icon || "🏆"}
                    {ach.unlocked && (
                      <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full animate-pulse pointer-events-none" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-tight">{ach.title}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{ach.description}</p>
                  </div>

                  {ach.unlocked ? (
                    <div className="pt-4 flex items-center gap-2">
                       <Sparkles size={12} className="text-blue-500" />
                       <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Verified Achievement</span>
                    </div>
                  ) : (
                    <div className="pt-4 flex items-center gap-2 opacity-30">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Locked Transmission</span>
                    </div>
                  )}
                </div>

                {/* Decorative Serial */}
                <div className="absolute bottom-2 right-6 font-mono text-[7px] text-slate-800 group-hover:text-slate-700 transition-colors uppercase">
                   UID_TOKEN_0x{Math.random().toString(16).slice(2, 8).toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Call to Action */}
          <div className="mt-20 p-12 rounded-[4rem] bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute inset-0 cyber-grid opacity-5" />
            <h2 className="text-3xl font-black text-white tracking-tighter mb-4">Advance Your Legacy</h2>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium">Continue participating in global operations to unlock more exclusive trophies and ascend the Hall of Fame.</p>
            <div className="mt-8 flex justify-center gap-4">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <div className="w-2 h-2 rounded-full bg-purple-500" />
               <div className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-gradient {
              background-size: 200% 200%;
              animation: gradient 5s ease infinite;
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-15px) rotate(5deg); }
            }
            .animate-float {
              animation: float 6s ease-in-out infinite;
            }
            .cyber-grid {
              background-image: 
                linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px);
              background-size: 20px 20px;
            }
          `}
        </style>
      </div>
    </>
  );
};

export default ShowcaseRoom;
