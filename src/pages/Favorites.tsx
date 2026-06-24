import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, Share2, Calendar, MapPin, Search, ChevronLeft, Activity, Trophy, Shield, Loader2, Users, User, Medal } from "lucide-react";
import { favoritesApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { useEspnMatchDetail } from "@/hooks/football/useEspnQueries";

// Mapping for country flags
const COUNTRY_CODES: Record<string, string> = {
  "England": "gb-eng", "Norway": "no", "Brazil": "br", "Ghana": "gh",
  "France": "fr", "Spain": "es", "Germany": "de", "Italy": "it",
  "Portugal": "pt", "Netherlands": "nl", "Argentina": "ar", "Belgium": "be",
  "Senegal": "sn", "Egypt": "eg", "South Korea": "kr", "Japan": "jp",
  "Uruguay": "uy", "Colombia": "co", "Croatia": "hr", "Morocco": "ma",
  "Switzerland": "ch", "Denmark": "dk", "Serbia": "rs", "Poland": "pl",
  "Sweden": "se", "Wales": "gb-wls", "Scotland": "gb-sct", "USA": "us",
  "Ivory Coast": "ci", "Nigeria": "ng", "Algeria": "dz", "Cameroon": "cm",
  "Chile": "cl", "Mexico": "mx", "Canada": "ca", "Australia": "au",
  "Curaçao": "cw", "Curacao": "cw"
};

const FEDERATION_LOGOS: Record<string, string> = {
  "Mexico": "https://a.espncdn.com/i/teamlogos/soccer/500/203.png",
  "South Korea": "https://a.espncdn.com/i/teamlogos/soccer/500/451.png",
  "Czechia": "https://a.espncdn.com/i/teamlogos/soccer/500/450.png",
  "South Africa": "https://a.espncdn.com/i/teamlogos/soccer/500/467.png",
  "Canada": "https://a.espncdn.com/i/teamlogos/soccer/500/206.png",
  "Switzerland": "https://a.espncdn.com/i/teamlogos/soccer/500/475.png",
  "Bosnia and Herzegovina": "https://a.espncdn.com/i/teamlogos/soccer/500/452.png",
  "Qatar": "https://a.espncdn.com/i/teamlogos/soccer/500/4398.png",
  "Brazil": "https://a.espncdn.com/i/teamlogos/soccer/500/205.png",
  "Morocco": "https://a.espncdn.com/i/teamlogos/soccer/500/2869.png",
  "Scotland": "https://a.espncdn.com/i/teamlogos/soccer/500/580.png",
  "Haiti": "https://a.espncdn.com/i/teamlogos/soccer/500/2654.png",
  "USA": "https://a.espncdn.com/i/teamlogos/soccer/500/660.png",
  "Australia": "https://a.espncdn.com/i/teamlogos/soccer/500/628.png",
  "Paraguay": "https://a.espncdn.com/i/teamlogos/soccer/500/210.png",
  "Germany": "https://a.espncdn.com/i/teamlogos/soccer/500/481.png",
  "Ivory Coast": "https://a.espncdn.com/i/teamlogos/soccer/500/4789.png",
  "Ecuador": "https://a.espncdn.com/i/teamlogos/soccer/500/209.png",
  "Curacao": "https://a.espncdn.com/i/teamlogos/soccer/500/11678.png",
  "Netherlands": "https://a.espncdn.com/i/teamlogos/soccer/500/449.png",
  "Japan": "https://a.espncdn.com/i/teamlogos/soccer/500/627.png",
  "Sweden": "https://a.espncdn.com/i/teamlogos/soccer/500/466.png",
  "Tunisia": "https://a.espncdn.com/i/teamlogos/soccer/500/659.png",
  "New Zealand": "https://a.espncdn.com/i/teamlogos/soccer/500/2666.png",
  "Iran": "https://a.espncdn.com/i/teamlogos/soccer/500/469.png",
  "Belgium": "https://a.espncdn.com/i/teamlogos/soccer/500/459.png",
  "Egypt": "https://a.espncdn.com/i/teamlogos/soccer/500/2620.png",
  "Uruguay": "https://a.espncdn.com/i/teamlogos/soccer/500/212.png",
  "Saudi Arabia": "https://a.espncdn.com/i/teamlogos/soccer/500/655.png",
  "Spain": "https://a.espncdn.com/i/teamlogos/soccer/500/164.png",
  "Cape Verde": "https://a.espncdn.com/i/teamlogos/soccer/500/2597.png",
  "Norway": "https://a.espncdn.com/i/teamlogos/soccer/500/464.png",
  "France": "https://a.espncdn.com/i/teamlogos/soccer/500/478.png",
  "Senegal": "https://a.espncdn.com/i/teamlogos/soccer/500/654.png",
  "Iraq": "https://a.espncdn.com/i/teamlogos/soccer/500/4375.png",
  "Argentina": "https://a.espncdn.com/i/teamlogos/soccer/500/202.png",
  "Austria": "https://a.espncdn.com/i/teamlogos/soccer/500/474.png",
  "Jordan": "https://a.espncdn.com/i/teamlogos/soccer/500/2917.png",
  "Algeria": "https://a.espncdn.com/i/teamlogos/soccer/500/624.png",
  "Colombia": "https://a.espncdn.com/i/teamlogos/soccer/500/208.png",
  "DR Congo": "https://a.espncdn.com/i/teamlogos/soccer/500/2850.png",
  "Portugal": "https://a.espncdn.com/i/teamlogos/soccer/500/482.png",
  "Uzbekistan": "https://a.espncdn.com/i/teamlogos/soccer/500/2570.png",
  "England": "https://a.espncdn.com/i/teamlogos/soccer/500/448.png",
  "Ghana": "https://a.espncdn.com/i/teamlogos/soccer/500/4469.png",
  "Panama": "https://a.espncdn.com/i/teamlogos/soccer/500/2659.png",
  "Croatia": "https://a.espncdn.com/i/teamlogos/soccer/500/477.png"
};

function TeamLogo({ name, className }: { name: string, className?: string }) {
  const cleanName = name.replace("Curaçao", "Curacao");
  const code = COUNTRY_CODES[name] || COUNTRY_CODES[cleanName];
  const espnLogo = FEDERATION_LOGOS[cleanName];

  if (espnLogo) {
    return (
      <div className={cn("w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center bg-foreground/5 rounded-lg border border-border/50 shadow-sm p-1.5 transition-transform duration-500 group-hover:scale-105", className)}>
        <img src={espnLogo} alt={name} className="w-full h-full object-contain drop-shadow-md" />
      </div>
    );
  }
  
  if (code) {
    return (
      <div className={cn("w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center bg-foreground/5 rounded-lg border border-border/50 shadow-sm overflow-hidden p-1.5 transition-transform duration-500 group-hover:scale-105", className)}>
        <img src={`https://flagcdn.com/w80/${code}.png`} alt={name} className="w-full h-full object-cover rounded-sm shadow-sm" />
      </div>
    );
  }

  return (
    <div className={cn("w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg bg-foreground/5 flex items-center justify-center border border-border/50 shadow-sm transition-transform duration-500 group-hover:scale-105", className)}>
      <Shield size={24} className="text-muted-foreground/40" />
    </div>
  );
}

interface Favorite {
  _id: string;
  matchId: string;
  teams: {
    team1: string;
    team2: string;
  };
  date: string;
  venue: string;
  sport: string;
  type: "match" | "team" | "player" | "league";
  itemId?: string;
  name?: string;
  image?: string;
}

const TABS = [
  { id: 'matches', label: 'Matches', icon: Trophy },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'players', label: 'Players', icon: User },
  { id: 'leagues', label: 'Leagues', icon: Medal }
];

function FavoriteMatchCard({ match, onRemove, navigate }: { match: Favorite, onRemove: (id: string) => void, navigate: any }) {
  // If it's a football match, fetch details to get live score and accurate status
  const { data: espnData } = useEspnMatchDetail(match.matchId, match.sport === 'football');

  let displayStatus = match.status;
  let team1Score: string | number | null = null;
  let team2Score: string | number | null = null;

  if (match.sport === 'football' && espnData?.header?.competitions?.[0]) {
    const comp = espnData.header.competitions[0];
    displayStatus = comp.status?.type?.state === 'pre' ? 'upcoming' : 
                    comp.status?.type?.state === 'post' ? 'completed' : 'live';

    const homeCompetitor = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const awayCompetitor = comp.competitors?.find((c: any) => c.homeAway === 'away');

    if (homeCompetitor && awayCompetitor) {
        // Try to match team names to assign correct scores
        const isHomeTeam1 = homeCompetitor.team?.displayName?.toLowerCase().includes(match.teams.team1.toLowerCase()) || 
                            match.teams.team1.toLowerCase().includes(homeCompetitor.team?.displayName?.toLowerCase());
        
        if (isHomeTeam1) {
            team1Score = homeCompetitor.score;
            team2Score = awayCompetitor.score;
        } else {
            team1Score = awayCompetitor.score;
            team2Score = homeCompetitor.score;
        }
    }
  } else {
      // Fallback date check for completed if no API data or not football
      if (displayStatus === 'upcoming' && new Date(match.date).getTime() < Date.now()) {
          displayStatus = 'completed';
      }
  }

  return (
    <div
      onClick={() => navigate(match.sport === 'football' ? `/football/match/${match.matchId}` : `/match/${match.matchId}`)}
      className="group flex flex-col bg-card hover:bg-accent/5 border border-border/50 hover:border-border rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* Top Row: Meta Info */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-foreground/5 text-[10px] font-bold uppercase tracking-widest text-foreground/80">
            <Trophy size={12} className="text-[#d4af37]" />
            {match.sport}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${displayStatus === 'live' ? 'text-emerald-500 bg-emerald-500/10' : displayStatus === 'upcoming' ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground bg-muted/50'}`}>
            {displayStatus === 'live' && <Activity size={10} className="inline mr-1 animate-pulse" />}
            {displayStatus}
          </span>
        </div>
        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
           <Calendar size={12} className="text-muted-foreground/60" />
           {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Middle Row: Stacked Teams & Scores */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo name={match.teams.team1} className="w-8 h-8 md:w-9 md:h-9 p-1 shadow-none" />
            <span className="text-base font-bold text-foreground truncate group-hover:text-[#d4af37] transition-colors">
              {match.teams.team1}
            </span>
          </div>
          {team1Score !== null && (
             <span className="text-xl font-black text-foreground ml-2">{team1Score}</span>
          )}
        </div>
        
        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo name={match.teams.team2} className="w-8 h-8 md:w-9 md:h-9 p-1 shadow-none" />
            <span className="text-base font-bold text-foreground truncate group-hover:text-[#d4af37] transition-colors">
              {match.teams.team2}
            </span>
          </div>
          {team2Score !== null && (
             <span className="text-xl font-black text-foreground ml-2">{team2Score}</span>
          )}
        </div>
      </div>

      {/* Bottom Row: Actions */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/10">
        <div className="flex items-center gap-1.5 text-muted-foreground/60 min-w-0">
           <MapPin size={12} className="shrink-0" />
           <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">{match.venue || "TBD"}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-2 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(match._id);
            }}
            className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors"
          >
            <Heart size={16} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FavoriteTeamCard({ team, onRemove, navigate }: { team: Favorite, onRemove: (id: string) => void, navigate: any }) {
  return (
    <div
      onClick={() => navigate('/performance-lab', { state: { targetTeamName: team.name || team.itemId, targetTab: 'team_analysis', targetSport: team.sport } })}
      className="group flex flex-col bg-card hover:bg-accent/5 border border-border/50 hover:border-border rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-foreground/5 text-[10px] font-bold uppercase tracking-widest text-foreground/80">
          <Users size={12} className="text-primary" />
          {team.sport}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(team._id);
          }}
          className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors"
        >
          <Heart size={16} fill="currentColor" />
        </button>
      </div>
      
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        {team.image ? (
          <img src={team.image} alt={team.name} className="w-20 h-20 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <TeamLogo name={team.name} className="w-20 h-20 p-2 shadow-none" />
        )}
        <h3 className="text-lg font-black text-foreground text-center line-clamp-1">{team.name}</h3>
      </div>
    </div>
  );
}

export default function Favorites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSport, setActiveSport] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await favoritesApi.get();
        if (response.success) {
          setFavorites(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchFavorites();
  }, [navigate]);

  const removeFavorite = async (id: string) => {
    try {
      await favoritesApi.remove(id);
      const updated = favorites.filter((m) => m._id !== id);
      setFavorites(updated);
      toast({
        title: "Removed",
        description: "Match removed from favorites",
      });
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const filteredMatches = favorites.filter(
    (item) => (!item.type || item.type === 'match') && 
      (activeSport === "all" || item.sport === activeSport) &&
      (item.teams?.team1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.teams?.team2?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTeams = favorites.filter(
    (item) => item.type === 'team' && 
      (activeSport === "all" || item.sport === activeSport) &&
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pb-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Favorites - SportsBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground pb-24">
        <Navbar />
        <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 lg:px-8 pt-12">
          {/* Header */}
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 px-3 py-1.5 mb-8 rounded-md hover:bg-foreground/5 transition-all text-muted-foreground hover:text-foreground w-fit"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium tracking-wide">Back</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Heart size={28} className="text-rose-500" fill="currentColor" />
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
                  Favorites.
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mt-2 font-medium tracking-wide uppercase">
                {favorites.length} {favorites.length === 1 ? "match" : "matches"} saved
              </p>
            </div>

            {favorites.length > 0 && activeTab === 'matches' && (
              <div className="relative w-full md:w-72 group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={16} className="text-muted-foreground group-focus-within:text-[#d4af37] transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-foreground/[0.02] border-b border-border hover:border-foreground/30 focus:border-[#d4af37] text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all rounded-t-md"
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide border-b border-border/30">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-sm tracking-widest uppercase transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab.id 
                  ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/5' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-[#d4af37]' : 'text-muted-foreground/70'} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'matches' && favorites.length > 0 && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2">
              {['all', 'football', 'cricket', 'basketball', 'tennis'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setActiveSport(sport)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 border ${
                    activeSport === sport
                      ? 'bg-foreground text-background border-foreground shadow-md'
                      : 'bg-transparent text-muted-foreground border-border/50 hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  {sport === 'all' ? 'All Sports' : sport}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'matches' ? (
            filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-foreground/5 border border-border/50">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {favorites.length === 0 ? "No favorite matches yet" : "No matches found"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  {favorites.length === 0
                    ? "Keep track of the matches you care about by adding them to your favorites."
                    : "Try adjusting your search terms."}
                </p>
                {favorites.length === 0 && (
                  <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2.5 bg-foreground text-background text-sm font-bold uppercase tracking-wider rounded-full hover:bg-foreground/90 transition-colors"
                  >
                    Browse Matches
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                {filteredMatches.map((match) => (
                  <FavoriteMatchCard key={match._id} match={match} onRemove={removeFavorite} navigate={navigate} />
                ))}
              </div>
            )
          ) : activeTab === 'teams' ? (
            filteredTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-foreground/5 border border-border/50">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No favorite teams yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Keep track of your favorite teams.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2.5 bg-foreground text-background text-sm font-bold uppercase tracking-wider rounded-full hover:bg-foreground/90 transition-colors"
                >
                  Browse Teams
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                {filteredTeams.map((team) => (
                  <FavoriteTeamCard key={team._id} team={team} onRemove={removeFavorite} navigate={navigate} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-foreground/5 border border-border/50">
                {activeTab === 'players' && <User className="w-6 h-6 text-muted-foreground" />}
                {activeTab === 'leagues' && <Medal className="w-6 h-6 text-muted-foreground" />}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                No favorite {activeTab} yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                You haven't added any {activeTab} to your favorites. Browse around to add some.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

