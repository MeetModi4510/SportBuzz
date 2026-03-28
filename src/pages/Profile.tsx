import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { 
  Mail, Phone, MapPin, Edit2, Save, X, ArrowLeft, User, Camera, Trash2,
  Target, Activity, Share2, PencilLine, TrendingUp, Zap, Home,
  BarChart3, Crosshair, Award, Sparkles, Globe, ChevronRight, Shield, Calendar,
  Fingerprint, Scan, Cpu, Radio, Network, Database, Boxes, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { userApi, activityApi } from "@/services/api";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";

interface UserStats {
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  level: string;
  rank?: number;
  accuracy?: string;
}

interface UserData {
  _id?: string;
  email: string;
  fullName: string;
  phone?: string;
  location?: string;
  favoriteTeam?: string;
  bio?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  photoUrl?: string;
  stats?: UserStats;
  createdAt?: string;
}

const BATTING_STYLES = ["Right-hand Bat", "Left-hand Bat"];
const BOWLING_STYLES = [
  "None",
  "Right-arm Fast", "Right-arm Medium", "Right-arm Off-spin", "Right-arm Leg-spin",
  "Left-arm Fast", "Left-arm Medium", "Left-arm Orthodox", "Left-arm Chinaman"
];

// ════════════════════════════════════════════
// SHOCKER UI COMPONENTS (CYBERNETIC HUD)
// ════════════════════════════════════════════

const DNAHelix = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 200" className={className}>
    <defs>
      <linearGradient id="dna-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    {[...Array(10)].map((_, i) => (
      <g key={i} className="animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
        <circle cx={50 + Math.sin(i) * 20} cy={20 * i + 10} r="2" fill="url(#dna-grad)" />
        <circle cx={50 - Math.sin(i) * 20} cy={20 * i + 10} r="2" fill="url(#dna-grad)" />
        <line 
          x1={50 + Math.sin(i) * 20} y1={20 * i + 10} 
          x2={50 - Math.sin(i) * 20} y2={20 * i + 10} 
          stroke="url(#dna-grad)" strokeWidth="0.5" strokeDasharray="2 2"
        />
      </g>
    ))}
  </svg>
);

const IdentityScanner = ({ id }: { id?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3.3rem]">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
    
    {/* Top Right ID Badge (to match user request) */}
    {id && (
      <div className="absolute top-4 right-4 px-2 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-400/50">
        ID: {id}
      </div>
    )}

    <div className="absolute bottom-4 left-4 font-mono text-[8px] text-blue-400 opacity-50 space-y-1">
      <div className="flex gap-2"><span>[ID_AUTH]</span> <span>0x{Math.random().toString(16).slice(2, 8).toUpperCase()}</span></div>
      <div className="flex gap-2"><span>[BIOS]</span> <span>STABLE</span></div>
    </div>
  </div>
);

const QuantumStatCard = ({ icon: Icon, label, value, subValue, color }: any) => (
  <div className="relative group/stat p-6 rounded-[2.5rem] bg-[#020617]/40 border border-slate-800/50 hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover/stat:opacity-10 transition-opacity">
      <Icon size={80} />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
      <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center ${color} shadow-inner`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-4xl font-black text-white tracking-tighter mb-1">{value}</p>
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">{label}</p>
          {subValue && <span className="text-[8px] font-mono text-blue-400 animate-pulse">{subValue}</span>}
        </div>
      </div>
    </div>
    <div className="absolute top-2 left-2 w-1 h-1 bg-slate-800 rounded-full" />
    <div className="absolute top-2 right-2 w-1 h-1 bg-slate-800 rounded-full" />
    <div className="absolute bottom-2 left-2 w-1 h-1 bg-slate-800 rounded-full" />
    <div className="absolute bottom-2 right-2 w-1 h-1 bg-slate-800 rounded-full" />
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    email: "",
    fullName: "",
    phone: "",
    location: "",
    favoriteTeam: "",
    bio: "",
    battingStyle: "Right-hand Bat",
    bowlingStyle: "None",
    photoUrl: "",
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("traits");
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activitySummary, setActivitySummary] = useState<any>(null);
  const [imgError, setImgError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20;
    const y = (clientY / innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile() as any;
        if (response.success) {
          const profileData = response.data;
          setUser(profileData);
          setFormData({
            ...profileData,
            battingStyle: profileData.battingStyle || "Right-hand Bat",
            bowlingStyle: profileData.bowlingStyle || "None",
          });
          
          // Fetch stats separately to get rank/points
          try {
            const statsRes = await userApi.getStats() as any;
            if (statsRes.success) {
              setUser(prev => prev ? { ...prev, stats: statsRes.data } : null);
            }
          } catch (e) {
            console.error("Failed to fetch stats:", e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchProfile();
      
      const fetchActivityData = async () => {
        try {
          const [achRes, sumRes] = await Promise.all([
            activityApi.getAchievements(),
            activityApi.getSummary()
          ]) as any[];
          
          if (achRes.success) {
            setAchievements(achRes.data.achievements);
          }
          if (sumRes.success) {
            setActivitySummary(sumRes.data);
          }
        } catch (e) {
          console.error("Failed to fetch activity data:", e);
        }
      };
      fetchActivityData();
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await userApi.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        favoriteTeam: formData.favoriteTeam,
        bio: formData.bio,
        battingStyle: formData.battingStyle,
        bowlingStyle: formData.bowlingStyle,
      }) as any;

      if (response.success) {
        setUser(prev => ({ ...prev, ...response.data }));
        setIsEditing(false);
        toast({
          title: "Identity Synchronized",
          description: "Your global profile has been professionally updated.",
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Sync Error",
        description: "Failed to update profile. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // For local uploads if any
    const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        setIsSaving(true);
        const response = await userApi.updateProfile({ photoUrl: base64String }) as any;
        if (response.success) {
          setUser(prev => prev ? { ...prev, photoUrl: base64String } : null);
          setFormData(prev => ({ ...prev, photoUrl: base64String }));
          toast({
            title: "Identity Visualized",
            description: "Your profile photo has been successfully updated.",
          });
          setImgError(false);
        }
      } catch (error) {
        console.error('Failed to upload photo:', error);
        toast({
          title: "Upload Error",
          description: "Failed to update profile photo.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    try {
      setIsSaving(true);
      const response = await userApi.updateProfile({ photoUrl: null }) as any;
      if (response.success) {
        setUser(prev => prev ? { ...prev, photoUrl: undefined } : null);
        setFormData(prev => ({ ...prev, photoUrl: undefined }));
        setImgError(false);
        toast({
          title: "Identity Redacted",
          description: "Your profile photo has been removed.",
        });
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast({
        title: "Deletion Error",
        description: "Failed to remove profile photo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Database...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>{user.fullName} | Global Profile • SportBuzz</title>
        <style>
          {`
            @keyframes scan {
              0%, 100% { top: 0%; opacity: 0; }
              50% { top: 100%; opacity: 1; }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            .glass-etched {
              background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255,255,255,0.1);
              box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37);
            }
            .cyber-grid {
              background-image: 
                linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px);
              background-size: 20px 20px;
            }
          `}
        </style>
      </Helmet>

      <div 
        className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30 font-sans cursor-default overflow-x-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* Background Ambient Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10 space-y-10">
          {/* Header Actions Area */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3 ml-auto">
               <Button 
                 onClick={() => navigate("/")}
                 variant="outline" 
                 size="sm" 
                 className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 rounded-2xl h-12 px-6 transition-all duration-500"
               >
                  <Home size={14} className="mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
               </Button>
               <Button variant="outline" size="sm" className="bg-slate-900/50 border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-2xl h-12 px-6">
                  <Share2 size={14} className="mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Transmit ID</span>
               </Button>
            </div>
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
            {/* ════════════════════════════════════════════ */}
            {/* SHOCKER 3D HOLOGRAPHIC HEADER */}
            {/* ════════════════════════════════════════════ */}
            <div 
              className="relative perspective-[1000px] transition-transform duration-200 ease-out"
              style={{ 
                transform: `rotateX(${-mousePos.y * 0.5}deg) rotateY(${mousePos.x * 0.5}deg)`
              }}
            >
              <div className="relative overflow-hidden rounded-[3rem] bg-[#0f172a]/80 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl group/header">
                {/* Cyber Grid Overlay */}
                <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
                
                {/* Dynamic Glow Orbs */}
                <div 
                  className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full transition-all duration-700 pointer-events-none"
                  style={{ 
                    left: `calc(50% + ${mousePos.x * 10}px)`, 
                    top: `calc(50% + ${mousePos.y * 10}px)`,
                    transform: 'translate(-50%, -50%)' 
                  }}
                />

                <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center gap-16">
                  {/* Biometric Avatar Unit */}
                  <div className="relative scale-110 md:scale-125 transition-transform duration-700 group-hover/header:translate-z-20">
                    <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3.5rem] bg-gradient-to-tr from-blue-600/20 via-slate-900 to-purple-600/20 p-[2px] shadow-2xl relative">
                      <div className="w-full h-full rounded-[3.4rem] bg-[#020617] flex items-center justify-center overflow-hidden border border-white/5 relative">
                        {user.photoUrl && !imgError ? (
                          <img 
                            src={getImageUrl(user.photoUrl)!} 
                            alt={user.fullName} 
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                          />
                        ) : (
                          <User 
                            size={100} 
                            className="text-slate-800 group-hover/header:text-blue-500/50 transition-colors duration-1000" 
                          />
                        )}
                        <IdentityScanner id={user._id?.slice(-3).toUpperCase()} />
                      </div>
                      
                      {/* Outer Rotating HUD Rings */}
                      <div className="absolute -inset-4 rounded-[4.5rem] border border-blue-500/10 animate-[spin_20s_linear_infinite]" />
                      <div className="absolute -inset-8 rounded-[5.5rem] border border-dashed border-purple-500/5 animate-[spin_40s_linear_infinite_reverse]" />
                      
                      {/* Photo Trigger Module */}
                      <div className="absolute -bottom-2 -right-2 flex flex-col gap-2 z-20">
                        <label className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:bg-blue-500 hover:scale-110 active:scale-90 transition-all cursor-pointer border border-blue-400/50">
                          <Camera size={24} />
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                        {user.photoUrl && (
                          <button 
                            onClick={handleDeletePhoto}
                            className="w-14 h-14 rounded-2xl bg-slate-900 text-red-500 flex items-center justify-center shadow-2xl hover:bg-red-500/10 hover:scale-110 active:scale-90 transition-all border border-red-500/30"
                          >
                            <Trash2 size={24} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary Data Terminal */}
                  <div className="flex-1 text-center md:text-left space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[8px] font-black uppercase tracking-[0.3em] flex items-center gap-2 animate-pulse">
                          <Radio size={10} /> Live Data Stream
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">REF_ID: SBX-{user._id?.slice(-6).toUpperCase()}</span>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none group-hover/header:tracking-tight transition-all duration-700">
                          {user.fullName || "SYSTEM IDENTITY"}
                        </h1>
                        <Link to="/showcase" className="pb-2">
                          <span className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-400 border border-blue-500/30 backdrop-blur-xl flex items-center gap-3 hover:bg-blue-500/20 transition-all cursor-pointer group/level">
                            <Zap size={14} className="animate-pulse group-hover/level:scale-110 transition-transform" /> {user.stats?.level || 'ROOKIE'}
                          </span>
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <div className="group/chip relative px-6 py-3 rounded-2xl bg-[#0f172a]/80 border border-blue-500/30 overflow-hidden hover:border-blue-500 transition-all duration-500">
                           <div className="absolute inset-0 bg-blue-500/5 group-hover/chip:bg-blue-500/10 transition-colors" />
                           <div className="relative flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                                {user.battingStyle || "RIGHT-HAND BAT"}
                              </span>
                           </div>
                        </div>

                        <div className="group/chip relative px-6 py-3 rounded-2xl bg-[#0f172a]/80 border border-purple-500/30 overflow-hidden hover:border-purple-500 transition-all duration-500">
                           <div className="absolute inset-0 bg-purple-500/5 group-hover/chip:bg-purple-500/10 transition-colors" />
                           <div className="relative flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">
                                {user.bowlingStyle || "NONE"}
                              </span>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Analytics Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-10 border-t border-slate-800/50">
                        <QuantumStatCard 
                          icon={BarChart3} 
                          label="Total Matches" 
                          value={user.stats?.totalPredictions || 0} 
                          subValue="PRO_LEVEL" 
                          color="text-blue-400" 
                        />
                        <QuantumStatCard 
                          icon={Trophy} 
                          label="Clutch Rank" 
                          value={`#${user.stats?.rank || '31'}`} 
                          subValue="TOP_5%" 
                          color="text-yellow-400" 
                        />
                        <div className="hidden md:block">
                          <QuantumStatCard 
                            icon={Zap} 
                            label="Career XP" 
                            value={user.stats?.totalPoints || 0} 
                            subValue="LEVEL_CAP" 
                            color="text-purple-400" 
                          />
                        </div>
                    </div>
                  </div>

                  {/* UI Control Module */}
                  <div className="flex flex-col gap-4">
                    {!isEditing && (
                      <Button 
                        size="lg" 
                        className="bg-white text-black hover:bg-white/90 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] h-20 px-12 group/btn transition-all duration-500 relative overflow-hidden"
                        onClick={() => setIsEditing(true)}
                      >
                        <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                        <span className="relative z-10 flex items-center gap-4 group-hover/btn:text-white transition-colors">
                          <Edit2 size={24} /> Edit DNA
                        </span>
                      </Button>
                    )}
                    <span className="text-center text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] py-2 border border-slate-800 rounded-xl">
                      SportBuzz Studio Certified
                    </span>
                  </div>
                </div>
              </div>
              
              {/* HUD Decorative Elements */}
              <div className="absolute top-6 left-6 flex items-center gap-6 pointer-events-auto">
                {/* Fixed Back Button inside the 3D container for stability */}
                <button
                  onClick={() => navigate("/")}
                  className="group/back flex items-center gap-3 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-500 shadow-2xl backdrop-blur-md"
                >
                  <ArrowLeft size={14} className="text-slate-500 group-hover/back:text-blue-400 transition-colors" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover/back:text-blue-400">Back to HQ</span>
                </button>

                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  <div className="w-8 h-1.5 bg-slate-800 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-4 pointer-events-none">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════ */}
            {/* PROFILE CONTENT SECTION */}
            {/* ════════════════════════════════════════════ */}
            {isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-6 fade-in duration-700 fill-mode-both">
                {/* Edit Controls */}
                <div className="lg:col-span-2 space-y-8">
                  <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-[3rem] overflow-hidden border-t-blue-500/20">
                    <CardHeader className="bg-slate-800/20 border-b border-slate-800 p-10">
                       <div className="flex items-center gap-5">
                          <div className="p-4 bg-blue-500/10 rounded-[1.5rem]">
                             <PencilLine className="text-blue-400" size={28} />
                          </div>
                          <div>
                             <CardTitle className="text-3xl font-black text-white tracking-tight">Studio Identity Mixer</CardTitle>
                             <CardDescription className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mt-2">Precision Editing for Global Database</CardDescription>
                          </div>
                       </div>
                    </CardHeader>
                    <CardContent className="p-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div className="space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <User size={14} className="text-slate-400" /> Professional Alias
                          </Label>
                          <Input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="h-16 bg-slate-800/30 border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-lg text-white placeholder:text-slate-700 px-6"
                          />
                        </div>

                        <div className="space-y-4 opacity-70">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <Mail size={14} className="text-slate-400" /> Primary Email Token
                          </Label>
                          <Input
                            value={user.email}
                            disabled
                            className="h-16 bg-slate-800/10 border-slate-700/20 rounded-2xl font-bold text-slate-500 cursor-not-allowed px-6"
                          />
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <Phone size={14} className="text-slate-400" /> Communication Line
                          </Label>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (555) 001-MODE"
                            className="h-16 bg-slate-800/30 border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 px-6"
                          />
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <MapPin size={14} className="text-slate-400" /> Geographic Coordinates
                          </Label>
                          <Input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. London, UK"
                            className="h-16 bg-slate-800/30 border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 px-6"
                          />
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <Target size={14} className="text-blue-500" /> Batting Mechanics
                          </Label>
                          <Select value={formData.battingStyle} onValueChange={(v) => handleSelectChange('battingStyle', v)}>
                            <SelectTrigger className="h-16 bg-slate-800/30 border-slate-700/50 rounded-2xl font-bold text-white px-6">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-2xl">
                              {BATTING_STYLES.map(s => <SelectItem key={s} value={s} className="rounded-xl font-bold py-3">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <Activity size={14} className="text-red-500" /> Bowling Arsenal
                          </Label>
                          <Select value={formData.bowlingStyle} onValueChange={(v) => handleSelectChange('bowlingStyle', v)}>
                            <SelectTrigger className="h-16 bg-slate-800/30 border-slate-700/50 rounded-2xl font-bold text-white px-6">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white rounded-2xl">
                              {BOWLING_STYLES.map(s => <SelectItem key={s} value={s} className="rounded-xl font-bold py-3">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <Shield size={14} className="text-indigo-500" /> Favorite Organization
                          </Label>
                          <Input
                            name="favoriteTeam"
                            value={formData.favoriteTeam}
                            onChange={handleChange}
                            placeholder="Declare your allegiance..."
                            className="h-16 bg-slate-800/30 border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 px-6 font-bold"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-4">
                          <Label className="text-[11px] uppercase font-black tracking-[0.25em] text-slate-500 flex items-center gap-3 ml-1">
                             <Edit2 size={14} className="text-slate-400" /> Personal Narrative
                          </Label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows={5}
                            className="w-full bg-slate-800/30 border border-slate-700/50 text-white rounded-3xl p-6 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium leading-relaxed resize-none"
                            placeholder="Tell the story of your sporting journey..."
                          />
                        </div>

                        {/* ADDED: Photo upload option inside the edit form */}
                        <div className="md:col-span-2 p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                 <h4 className="text-sm font-black text-white uppercase tracking-wider">Profile Visualization</h4>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update your biometric identity photo</p>
                              </div>
                              <label className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-900/40">
                                 <Camera size={14} /> Upload New Photo
                                 <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                              </label>
                           </div>
                        </div>
                      </div>

                      <div className="flex gap-5 pt-12">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all"
                        >
                          {isSaving ? "Synchronizing..." : "Sync Profile Changes"}
                        </Button>
                        <Button
                          onClick={() => {
                            setFormData({
                                ...user,
                                battingStyle: user.battingStyle || "Right-hand Bat",
                                bowlingStyle: user.bowlingStyle || "None",
                            });
                            setIsEditing(false);
                          }}
                          variant="outline"
                          className="h-16 px-10 border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px]"
                        >
                          Abort
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Side: Pro Review */}
                <div className="space-y-8">
                   <Card className="bg-gradient-to-br from-[#0f172a] to-[#020617] border-slate-800 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden group border-t-purple-500/20">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 pointer-events-none">
                         <Sparkles size={160} />
                      </div>
                      <div className="relative z-10 space-y-6">
                         <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center">
                            <Sparkles className="text-blue-400" size={32} />
                         </div>
                         <h3 className="text-2xl font-black text-white tracking-tight">Profile Integrity</h3>
                         <p className="text-slate-400 text-sm leading-relaxed font-medium">Your profile defines your identity across the SportBuzz ecosystem. This data powers advanced matchup simulations and leaderboard visibility.</p>
                         <div className="pt-6 space-y-4">
                            {[
                               { label: "Global Sync Locked", color: "bg-blue-500" },
                               { label: "AI Style Verified", color: "bg-purple-500" },
                               { label: "Legacy Recognition", color: "bg-green-500" }
                            ].map((item, i) => (
                               <div key={i} className="flex items-center gap-4 text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">
                                  <div className={`w-2 h-2 rounded-full ${item.color} shadow-lg shadow-${item.color.split('-')[1]}-500/50`} /> {item.label}
                               </div>
                            ))}
                         </div>
                      </div>
                   </Card>

                   <div className="p-10 rounded-[3.5rem] bg-amber-500/5 border border-amber-500/10 text-center space-y-6 group hover:border-amber-500/30 transition-all">
                      <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                         <Zap size={40} className="text-amber-500" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Current Status</p>
                         <h3 className="text-3xl font-black text-white tracking-tighter">Level {user.stats?.level || '1'}</h3>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-amber-500 rounded-full w-2/5 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">Next Milestone: Level Up in 450 XP</p>
                   </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Identity Information */}
                <div className="lg:col-span-2 space-y-10">
                  {/* ════════════════════════════════════════════ */}
                  {/* SHOCKER TAB NAVIGATION */}
                  {/* ════════════════════════════════════════════ */}
                  <div className="flex flex-wrap items-center justify-center bg-[#0f172a]/50 border border-slate-800 p-2 rounded-[2rem] backdrop-blur-xl mb-10 overflow-hidden relative group/tabs">
                    <div className="absolute inset-0 cyber-grid opacity-10" />
                    {[
                      { id: 'traits', label: 'Traits & DNA', icon: <Fingerprint size={16} /> },
                      { id: 'performance', label: 'Performance Hub', icon: <Activity size={16} /> },
                      { id: 'halloffame', label: 'Hall of Fame', icon: <Award size={16} /> }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[150px] flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative z-10 ${
                          activeTab === tab.id 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        {tab.icon} {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* ════════════════════════════════════════════ */}
                  {/* TAB CONTENT: TRAITS & DNA */}
                  {/* ════════════════════════════════════════════ */}
                  {activeTab === 'traits' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                      <div className="p-12 rounded-[3.5rem] bg-slate-900/40 border border-slate-800 relative overflow-hidden group/traits">
                        <div className="absolute -right-20 -top-20 opacity-[0.05] group-hover/traits:opacity-10 transition-opacity">
                          <DNAHelix className="w-64 h-64" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                          <Fingerprint className="text-blue-500" /> Neural DNA Profile
                        </h3>
                        <div className="space-y-8 relative z-10">
                          <p className="text-slate-400 text-lg leading-relaxed font-medium italic border-l-2 border-blue-500/30 pl-6">
                            "{user.bio || "Biological narrative data stream not initialized. Manual update required."}"
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 flex items-center gap-4 hover:border-blue-500/30 transition-all">
                              <Target className="text-blue-500" size={18} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Batting DNA</p>
                                <p className="text-[10px] font-black text-white truncate">{user.battingStyle || "RIGHT-HAND"}</p>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#020617] border border-slate-800 flex items-center gap-4 hover:border-red-500/30 transition-all">
                              <Activity className="text-red-500" size={18} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bowling DNA</p>
                                <p className="text-[10px] font-black text-white truncate">{user.bowlingStyle || "NONE"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-12 rounded-[3.5rem] bg-slate-900/40 border border-slate-800 space-y-8 relative overflow-hidden group/skills">
                        <div className="absolute inset-0 cyber-grid opacity-5" />
                        <h3 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-4 flex items-center gap-4">
                          <Scan className="text-purple-500" /> Archetype Sync
                        </h3>
                        <div className="space-y-6 relative z-10">
                          {[
                            { label: "Technical Consistency", val: Math.min(100, (user.stats?.totalPredictions || 0) * 5), color: "bg-blue-500" },
                            { label: "Strategic Intuition", val: Math.min(100, (user.stats?.totalPoints || 0) / 50), color: "bg-purple-500" },
                            { label: "Execution Precision", val: Math.round(parseFloat(user.stats?.accuracy as any || "0")), color: "bg-indigo-500" }
                          ].map((attr, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">{attr.label}</span>
                                <span className="text-white">{attr.val}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-[1px]">
                                <div className={`h-full ${attr.color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--tw-shadow-color),0.5)]`} style={{ width: `${attr.val}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════════════ */}
                  {/* TAB CONTENT: PERFORMANCE HUB */}
                  {/* ════════════════════════════════════════════ */}
                  {activeTab === 'performance' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <QuantumStatCard 
                          icon={TrendingUp} label="Total XP Earned" value={user.stats?.totalPoints || 0} 
                          subValue="GLOBAL ASSET" color="text-blue-500" 
                        />
                        <QuantumStatCard 
                          icon={Zap} label="Total Operations" value={user.stats?.totalPredictions || 0} 
                          subValue="STRATEGIC INTEL" color="text-yellow-500" 
                        />
                        <QuantumStatCard 
                          icon={BarChart3} label="Accuracy Rate" value={user.stats?.correctPredictions || 0} 
                          subValue={`${user.stats?.accuracy || 0}% WIN`} color="text-green-500" 
                        />
                        <QuantumStatCard 
                          icon={Crosshair} label="Current Rank" value={user.stats?.rank ? `#${user.stats.rank}` : "UNRANKED"} 
                          subValue="COMPETITIVE" color="text-purple-500" 
                        />
                      </div>
                      
                      <div className="p-10 rounded-[3.5rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group/signal">
                           <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
                           <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em]">Dynamic Performance Analytics</h4>
                           <div className="flex items-center gap-10">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Activity Frequency</p>
                                 <p className="text-2xl font-black text-white">{(user.stats?.totalPredictions || 0) > 0 ? (user.stats?.totalPredictions || 0) : '0.0'} ops</p>
                              </div>
                              <div className="w-64 h-20 relative px-4">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[
                                       { v: 30 }, { v: 45 }, { v: 25 }, { v: 55 }, { v: 40 }, { v: 65 }, { v: 50 }, { v: 75 }
                                    ]}>
                                       <Line 
                                          type="monotone" 
                                          dataKey="v" 
                                          stroke="#3b82f6" 
                                          strokeWidth={2} 
                                          dot={false}
                                          isAnimationActive={true}
                                          animationDuration={2000}
                                       />
                                       <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    </LineChart>
                                 </ResponsiveContainer>
                              </div>
                              <div className="space-y-1 text-right">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Model Consistency</p>
                                 <p className="text-2xl font-black text-green-500">{user.stats?.accuracy || '0.0'}%</p>
                              </div>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* ════════════════════════════════════════════ */}
                  {/* TAB CONTENT: HALL OF FAME */}
                  {/* ════════════════════════════════════════════ */}
                  {activeTab === 'halloffame' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                      {[
                        { title: "Legacy Founding Member", desc: "First 100 User Generation", icon: <Boxes />, color: "from-blue-600/20 to-indigo-600/20", borderColor: "border-blue-500/40" },
                        { title: "Elite Insight Analyst", desc: "100+ Successful Operations", icon: <Database />, color: "from-purple-600/20 to-pink-600/20", borderColor: "border-purple-500/40" },
                        { title: "Network Architect", desc: "Digital Footprint Synchronization", icon: <Network />, color: "from-amber-600/20 to-orange-600/20", borderColor: "border-amber-500/40" }
                      ].map((award, i) => (
                        <div key={i} className={`p-10 rounded-[3.5rem] bg-gradient-to-br ${award.color} border ${award.borderColor} relative group/award hover:scale-105 transition-all duration-700 overflow-hidden`}>
                          <div className="absolute inset-0 cyber-grid opacity-10" />
                          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover/award:opacity-20 transition-opacity transform rotate-12">
                            {award.icon}
                          </div>
                          <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center text-white mb-8 group-hover/award:scale-110 group-hover/award:rotate-12 transition-all">
                             {i === 0 ? <Award size={32} className="text-blue-400" /> : i === 1 ? <Sparkles size={32} className="text-purple-400" /> : <Shield size={32} className="text-amber-400" />}
                          </div>
                          <h4 className="text-2xl font-black text-white tracking-tighter mb-2 leading-tight">{award.title}</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{award.desc}</p>
                          <div className="pt-8 flex items-center gap-3">
                             <div className="w-8 h-[2px] bg-white opacity-20" />
                             <span className="text-[8px] font-mono text-white opacity-40 italic font-black uppercase">SPORTBUZZ_CERTIFIED.EXE</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ════════════════════════════════════════════ */}
                {/* ACHIEVEMENT / SHOWCASE SIDEBAR */}
                {/* ════════════════════════════════════════════ */}
                <div className="space-y-8">
                   <div className="bg-gradient-to-br from-slate-900 to-[#1e1b4b]/20 border border-slate-800 rounded-[3.5rem] p-10 space-y-8 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute inset-0 cyber-grid opacity-10" />
                      <div className="flex items-center justify-between relative z-10">
                         <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                           <Award size={20} className="text-amber-500" /> Milestones
                         </h3>
                         <span className="text-[9px] bg-[#020617] border border-slate-800 px-3 py-1.5 rounded-full font-black text-slate-500 uppercase tracking-widest shadow-inner">XP Showcase</span>
                      </div>
                      
                        <div className="space-y-6">
                           {(achievements.length > 0 ? achievements.slice(0, 3) : [
                              { title: "Identity Master", description: "Complete all profile metadata", icon: "🎭", unlocked: user.fullName && user.bio, points: 100 },
                              { title: "First Prediction", description: "Place your first match prediction", icon: "🔮", unlocked: user.stats?.totalPredictions! > 0, points: 50 },
                              { title: "Founding Member", description: "Digital footprint verified", icon: "🚀", unlocked: true, points: 200 },
                           ]).map((ach, idx) => (
                              <div key={idx} className={`space-y-3 transition-all duration-300 ${ach.unlocked ? 'opacity-100' : 'opacity-40'}`}>
                                 <div className="flex items-center gap-4">
                                    <span className="text-3xl drop-shadow-md">{ach.icon || "🏆"}</span>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-black text-white truncate tracking-tight">{ach.title}</p>
                                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">{ach.description}</p>
                                    </div>
                                    {ach.unlocked && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full ${ach.unlocked ? 'bg-blue-500' : 'bg-slate-700'} transition-all duration-1000 ease-out`} style={{ width: ach.unlocked ? '100%' : '10%' }} />
                                 </div>
                              </div>
                           ))}
                        </div>

                      <Link 
                        to="/showcase" 
                        className="w-full h-14 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                      >
                         <span className="text-blue-400 group-hover:text-blue-300 text-[10px] font-black uppercase tracking-[0.3em]">Enter Showcase Room</span>
                         <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </Link>
                   </div>

                   <Card className="bg-slate-900/40 border-slate-800 rounded-[3.5rem] p-10 text-center space-y-6 shadow-2xl backdrop-blur-sm group hover:border-slate-700 transition-all duration-500">
                      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-700 shadow-inner">
                         <Zap size={40} className="text-green-500" />
                      </div>
                      <div className="space-y-2">
                         <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">Operational Status</p>
                         <h3 className="text-3xl font-black text-white tracking-tighter">Level {user.stats?.level || '1'}</h3>
                      </div>
                      <p className="text-slate-500 text-[10px] font-bold leading-relaxed px-4">Maintain operational consistency to ascend the global leaderboards.</p>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                         <div 
                           className="h-full bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-1000" 
                           style={{ width: `${Math.min(100, ((user.stats?.totalPoints || 0) % 1000) / 10)}%` }} 
                         />
                      </div>
                   </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Background Text Decoration */}
        <div className="fixed bottom-0 left-0 w-full h-40 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden">
           <span className="text-[14rem] font-black whitespace-nowrap uppercase tracking-tighter select-none">SPORTBUZZ GLOBAL DB</span>
        </div>
      </div>
    </>
  );
};

export default Profile;


