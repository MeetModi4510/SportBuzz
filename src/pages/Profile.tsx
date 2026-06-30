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
  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-5 hover:bg-white/[0.04] transition-colors">
    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
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
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<any>(null);

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
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-semibold text-white">My Squads</h3>
                      <Button 
                        onClick={() => setIsJoinTeamModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-full h-10 px-6 font-medium"
                      >
                        Join Team
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {user.teams && user.teams.length > 0 ? (
                        user.teams.map((team: any) => {
                          const isCaptain = team.captainId === user.id || team.captainId === user._id;
                          return (
                            <div key={team._id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-5 hover:bg-white/[0.04] transition-all">
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} className="w-14 h-14 rounded-full object-cover" />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400">
                                  {team.acronym || team.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="text-base font-semibold text-white mb-1">{team.name}</h4>
                                {isCaptain ? (
                                  <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">Captain</span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Player</span>
                                )}
                              </div>
                              {isCaptain && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTeamForManagement(team)}
                                  className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 rounded-full"
                                >
                                  Manage
                                </Button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-16 text-center bg-white/[0.01] border border-white/5 rounded-3xl">
                          <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                          <h4 className="text-white font-medium mb-1">No Teams Yet</h4>
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
                      <div key={idx} className={`p-6 rounded-2xl border transition-all ${ach.unlocked ? 'bg-white/[0.02] border-white/10' : 'bg-transparent border-white/5 opacity-50'}`}>
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{ach.icon || "🏆"}</div>
                          <div>
                            <h4 className="text-base font-semibold text-white mb-1">{ach.title}</h4>
                            <p className="text-sm text-slate-400">{ach.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-6">Level & Progress</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm font-medium">Level {user.stats?.level || '1'}</span>
                    <span className="text-blue-400 text-sm font-medium">{user.stats?.totalPoints || 0} XP</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((user.stats?.totalPoints || 0) % 1000) / 10)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Earn more XP by participating in matches.</p>
                </div>

                <Link to="/showcase" className="block p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-colors group">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">Showcase Room</h4>
                      <p className="text-slate-400 text-xs">View all your unlocked badges</p>
                    </div>
                    <ChevronRight className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={20} />
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
    </>
  );
};

export default Profile;
