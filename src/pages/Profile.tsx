import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { 
  Mail, Phone, MapPin, Edit2, X, ArrowLeft, User, Camera, Trash2,
  Activity, Share2, BarChart3, Award, Shield, Trophy, ChevronRight
} from "lucide-react";
import { StatCard } from "@/components/admin/DashboardCards";
import { useToast } from "@/hooks/use-toast";
import { userApi, activityApi } from "@/services/api";
import { CaptainTeamManagementModal } from "@/components/CaptainTeamManagementModal";
import { TeamProfileModal } from "@/components/TeamProfileModal";

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
  playingRole?: string;
  photoUrl?: string;
  stats?: UserStats;
  createdAt?: string;
  teams?: any[];
}

const BATTING_STYLES = ["Right-hand Bat", "Left-hand Bat"];
const BOWLING_STYLES = [
  "None",
  "Right-arm Fast", "Right-arm Medium", "Right-arm Off-spin", "Right-arm Leg-spin",
  "Left-arm Fast", "Left-arm Medium", "Left-arm Orthodox", "Left-arm Chinaman"
];

const StatCard = ({ icon: Icon, label, value }: any) => (
  <div className="relative overflow-hidden p-6 rounded-3xl bg-white/[0.01] border border-white/[0.03] flex items-start gap-5 hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300 group shadow-lg shadow-black/10">
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-blue-500/15" />
    
    <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-blue-400/80 group-hover:text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300 shrink-0">
      <Icon size={22} strokeWidth={1.5} />
    </div>
    <div className="flex-1 mt-0.5 relative">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1.5">{label}</p>
      <p className="text-3xl font-light text-white tracking-tight">{value}</p>
    </div>
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
    playingRole: "Batsman",
    photoUrl: "",
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [achievements, setAchievements] = useState<any[]>([]);
  const [imgError, setImgError] = useState(false);
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<any | null>(null);
  const [selectedTeamForProfile, setSelectedTeamForProfile] = useState<any | null>(null);

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      toast({ title: "Error", description: "Please enter a valid join code.", variant: "destructive" });
      return;
    }
    try {
      setIsJoiningTeam(true);
      const { teamApi } = await import('@/services/api');
      const response = await teamApi.join(joinCode.trim().toUpperCase()) as any;
      if (response.success) {
        toast({ title: "Success", description: response.message });
        setJoinCode("");
        setIsJoinTeamModalOpen(false);
        const profileRes = await userApi.getProfile() as any;
        if (profileRes.success) setUser(profileRes.data);
      }
    } catch (error: any) {
      toast({ 
        title: "Join Failed", 
        description: error?.response?.data?.message || "Invalid join code or error occurred.", 
        variant: "destructive" 
      });
    } finally {
      setIsJoiningTeam(false);
    }
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
            playingRole: profileData.playingRole || "Batsman",
          });
          
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
          const achRes = await activityApi.getAchievements() as any;
          if (achRes.success) {
            setAchievements(achRes.data.achievements);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        playingRole: formData.playingRole,
        battingStyle: formData.battingStyle,
        bowlingStyle: formData.bowlingStyle,
      }) as any;

      if (response.success) {
        const profileRes = await userApi.getProfile() as any;
        if (profileRes.success) setUser(profileRes.data);
        setIsEditing(false);
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const BASE_URL = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : (import.meta.env.PROD ? '' : '');
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
          toast({ title: "Photo Updated", description: "Your profile photo has been updated." });
          setImgError(false);
        }
      } catch (error) {
        console.error('Failed to upload photo:', error);
        toast({ title: "Upload Error", description: "Failed to update profile photo.", variant: "destructive" });
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
        toast({ title: "Photo Removed", description: "Your profile photo has been removed." });
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast({ title: "Error", description: "Failed to remove profile photo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>{user.fullName} | SportsBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-blue-500/30">
        
        {/* Top Navbar */}
        <div className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 h-9 rounded-full px-4 text-sm font-medium">
                <Share2 size={16} className="mr-2" /> Share Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
          
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-40 h-40 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative">
                {user.photoUrl && !imgError ? (
                  <img 
                    src={getImageUrl(user.photoUrl)!} 
                    alt={user.fullName} 
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User size={64} className="text-slate-700" />
                )}
                {/* Hover overlay for actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  <label className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                  {user.photoUrl && (
                    <button 
                      onClick={handleDeletePhoto}
                      className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-5">
              <div>
                <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-2">
                  {user.fullName || "Unnamed User"}
                </h1>
                <p className="text-slate-400 text-lg font-medium">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {user.playingRole && (
                  <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20">
                    {user.playingRole.toUpperCase()}
                  </span>
                )}
                {user.battingStyle && user.battingStyle !== "None" && (
                  <span className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700">
                    {user.battingStyle}
                  </span>
                )}
                {user.bowlingStyle && user.bowlingStyle !== "None" && (
                  <span className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700">
                    {user.bowlingStyle}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="pt-2">
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-black hover:bg-slate-200 rounded-full h-12 px-8 font-semibold text-sm transition-colors"
                >
                  <Edit2 size={16} className="mr-2" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 animate-in fade-in duration-500">
              <h2 className="text-2xl font-semibold text-white mb-8">Edit Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Full Name</Label>
                  <Input name="fullName" value={formData.fullName} onChange={handleChange} className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white" />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Phone Number</Label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white" />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Location</Label>
                  <Input name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white" />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Favorite Team</Label>
                  <Input name="favoriteTeam" value={formData.favoriteTeam} onChange={handleChange} placeholder="e.g. Manchester United" className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white" />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Batting Style</Label>
                  <Select value={formData.battingStyle} onValueChange={(v) => handleSelectChange('battingStyle', v)}>
                    <SelectTrigger className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-white/10 text-white rounded-xl">
                      {BATTING_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Playing Role</Label>
                  <Select value={formData.playingRole} onValueChange={(v) => handleSelectChange('playingRole', v)}>
                    <SelectTrigger className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-white/10 text-white rounded-xl">
                      {["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Bowling Style</Label>
                  <Select value={formData.bowlingStyle} onValueChange={(v) => handleSelectChange('bowlingStyle', v)}>
                    <SelectTrigger className="h-14 bg-[#09090b] border-white/10 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 px-4 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-white/10 text-white rounded-xl">
                      {BOWLING_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <Label className="text-sm font-medium text-slate-400">Bio</Label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us a little about yourself..."
                    className="w-full h-32 bg-[#09090b] border border-white/10 text-white rounded-xl p-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <Button onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-slate-200 h-12 rounded-full px-10 font-semibold transition-all">
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={() => {
                    setFormData({
                        ...user,
                        battingStyle: user.battingStyle || "Right-hand Bat",
                        bowlingStyle: user.bowlingStyle || "None",
                        playingRole: user.playingRole || "Batsman",
                    });
                    setIsEditing(false);
                  }} variant="ghost" className="h-12 rounded-full px-8 text-slate-400 hover:text-white font-medium">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              <div className="lg:col-span-2 space-y-8">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'stats', label: 'Statistics' },
                    { id: 'teams', label: 'My Teams' },
                    { id: 'achievements', label: 'Achievements' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white text-black shadow-lg shadow-white/5' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                      <h3 className="text-xl font-semibold text-white mb-6">About Me</h3>
                      <p className="text-slate-400 leading-relaxed text-base">
                        {user.bio || "No bio added yet."}
                      </p>
                      
                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><MapPin size={18} /></div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Location</p>
                            <p className="text-sm font-medium text-white">{user.location || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Phone size={18} /></div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                            <p className="text-sm font-medium text-white">{user.phone || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Shield size={18} /></div>
                          <div>
                            <p className="text-xs text-slate-500 mb-0.5">Favorite Team</p>
                            <p className="text-sm font-medium text-white">{user.favoriteTeam || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: STATS */}
                {activeTab === 'stats' && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <StatCard icon={BarChart3} label="Total Matches" value={user.stats?.totalPredictions || 0} />
                      <StatCard icon={Trophy} label="Global Rank" value={user.stats?.rank ? `#${user.stats.rank}` : "Unranked"} />
                      <StatCard icon={Award} label="Career XP" value={user.stats?.totalPoints || 0} />
                      <StatCard icon={Activity} label="Accuracy" value={`${user.stats?.accuracy || 0}%`} />
                    </div>
                  </div>
                )}

                {/* TAB: TEAMS */}
                {activeTab === 'teams' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-light tracking-tight text-white">My Squads</h3>
                      <Button 
                        onClick={() => setIsJoinTeamModalOpen(true)}
                        className="bg-blue-600/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-full h-10 px-6 font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-lg shadow-black/20"
                      >
                        Join Team
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {user.teams && user.teams.length > 0 ? (
                        user.teams.map((team: any) => {
                          const isCaptain = team.captainId === user.id || team.captainId === user._id;
                          return (
                            <div 
                              key={team._id} 
                              className="relative overflow-hidden p-6 rounded-3xl bg-white/[0.01] border border-white/[0.03] flex items-center gap-5 hover:bg-white/[0.03] hover:border-white/[0.06] transition-all duration-300 cursor-pointer group shadow-lg shadow-black/10"
                              onClick={() => setSelectedTeamForProfile(team)}
                            >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-blue-500/15" />
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} className="w-14 h-14 rounded-2xl object-cover border border-white/5 group-hover:border-white/20 transition-all duration-300 relative z-10 shadow-lg" />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-lg font-black text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300 relative z-10 shadow-lg tracking-wider">
                                  {team.acronym || team.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 relative z-10">
                                <h4 className="text-lg font-medium text-white mb-1.5 tracking-tight group-hover:text-blue-400 transition-colors">{team.name}</h4>
                                {isCaptain ? (
                                  <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_10px_rgba(234,179,8,0.1)]">Captain</span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Player</span>
                                )}
                              </div>
                              {isCaptain && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTeamForManagement(team);
                                  }}
                                  className="relative z-10 border-yellow-500/20 text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/20 hover:border-yellow-500/40 rounded-full text-xs font-bold uppercase tracking-wider px-5 h-9 transition-all duration-300 shadow-lg shadow-black/20"
                                >
                                  Manage
                                </Button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-20 text-center bg-white/[0.01] border border-white/[0.03] rounded-3xl shadow-lg shadow-black/10">
                          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" strokeWidth={1} />
                          <h4 className="text-white font-medium mb-1 tracking-tight text-lg">No Teams Yet</h4>
                          <p className="text-slate-500 text-sm">Ask your captain for a join code to get started.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: ACHIEVEMENTS */}
                {activeTab === 'achievements' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    {(achievements.length > 0 ? achievements : [
                      { title: "Profile Completed", description: "All basic info filled out", icon: "🎭", unlocked: user.fullName && user.bio, points: 100 },
                      { title: "First Action", description: "Participated in a match", icon: "🔥", unlocked: user.stats?.totalPredictions! > 0, points: 50 },
                      { title: "Early Adopter", description: "Joined during beta", icon: "🚀", unlocked: true, points: 200 },
                    ]).map((ach, idx) => (
                      <div key={idx} className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${ach.unlocked ? 'bg-white/[0.02] border-white/[0.05] shadow-lg shadow-black/10 hover:bg-white/[0.04] hover:border-white/[0.08]' : 'bg-white/[0.01] border-white/[0.02] opacity-50 grayscale hover:grayscale-0 hover:opacity-75'}`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-blue-500/15" />
                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <div className="flex items-start gap-4">
                            <div className="text-3xl bg-white/[0.02] w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300 shadow-lg shrink-0">
                              {ach.icon || "🏆"}
                            </div>
                            <div className="mt-1">
                              <h4 className="text-base font-semibold text-white mb-1 tracking-tight group-hover:text-blue-400 transition-colors">{ach.title}</h4>
                              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px]">{ach.description}</p>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2 mt-1">
                             {ach.points > 0 && (
                                <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${ach.unlocked ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                                  +{ach.points} XP
                                </span>
                             )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="relative overflow-hidden p-8 rounded-3xl bg-white/[0.01] border border-white/[0.03] shadow-lg shadow-black/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Level & Progress</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white text-lg font-light tracking-tight">Level {user.stats?.level || '1'}</span>
                    <span className="text-blue-400 text-sm font-bold tracking-wider">{user.stats?.totalPoints || 0} XP</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, ((user.stats?.totalPoints || 0) % 1000) / 10)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">Earn more XP by participating in matches.</p>
                </div>

                <Link to="/showcase" className="relative block overflow-hidden p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 hover:bg-blue-600/10 hover:border-blue-500/20 transition-all duration-300 group shadow-lg shadow-black/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-blue-600/5 pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h4 className="text-white font-medium mb-1 tracking-tight group-hover:text-blue-400 transition-colors">Showcase Room</h4>
                      <p className="text-slate-500 text-[11px] uppercase tracking-wider">View unlocked badges</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      <ChevronRight size={18} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Join Team Modal */}
      {isJoinTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Join Squad</h3>
              <button onClick={() => setIsJoinTeamModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-400">Access Code</Label>
                <Input 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. XJ92KP"
                  className="h-14 bg-[#09090b] border-white/10 text-center font-mono text-xl uppercase focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white rounded-xl"
                  maxLength={10}
                />
                <p className="text-xs text-slate-500 text-center">Enter the code provided by your captain.</p>
              </div>
              <Button 
                onClick={handleJoinTeam}
                disabled={isJoiningTeam || !joinCode.trim()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-all"
              >
                {isJoiningTeam ? "Joining..." : "Join Team"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Captain Team Management Modal */}
      {selectedTeamForManagement && (
        <CaptainTeamManagementModal
          team={selectedTeamForManagement}
          isOpen={!!selectedTeamForManagement}
          onClose={() => setSelectedTeamForManagement(null)}
          onTeamUpdated={(updatedTeam) => {
            // Update the team in the user's teams list
            if (user && user.teams) {
              const updatedTeams = user.teams.map((t: any) => t._id === updatedTeam._id ? updatedTeam : t);
              setUser({ ...user, teams: updatedTeams });
            }
          }}
          onTeamDeleted={(teamId) => {
            // Remove the team from the user's teams list
            if (user && user.teams) {
              const updatedTeams = user.teams.filter((t: any) => t._id !== teamId);
              setUser({ ...user, teams: updatedTeams });
            }
          }}
        />
      )}

      {selectedTeamForProfile && (
        <TeamProfileModal
          team={selectedTeamForProfile}
          isOpen={!!selectedTeamForProfile}
          onClose={() => setSelectedTeamForProfile(null)}
        />
      )}
    </>
  );
};

export default Profile;
