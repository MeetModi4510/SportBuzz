import React, { useState } from 'react';
import { FootballTeamLogo } from './FootballTeamLogo';
import { Search, Loader2, Trophy, BarChart3, Users, Activity, Medal, Star, AlertCircle, Heart } from 'lucide-react';
import { useFotmobTeam } from '@/hooks/football/useFotmobTeam';
import { favoritesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { TeamOverviewDashboard } from './TeamOverviewDashboard';
import { TeamSquadView } from './TeamSquadView';
import { TeamFixturesView } from './TeamFixturesView';
import { TeamPlayerStatsView } from './TeamPlayerStatsView';
import { TeamStatsView } from './TeamStatsView';
import { TeamTableView } from './TeamTableView';
import { TeamTrophiesView } from './TeamTrophiesView';

const TABS = ['Overview', 'Table', 'Fixtures', 'Squad', 'Player stats', 'Team stats', 'Trophies', 'News'];

const TEAMS_BY_CONFEDERATION = [
  {
    region: 'UEFA (Europe)',
    teams: ['France', 'England', 'Belgium', 'Netherlands', 'Portugal', 'Spain', 'Italy', 'Croatia', 'Germany', 'Switzerland', 'Denmark', 'Serbia', 'Poland', 'Scotland', 'Wales', 'Sweden']
  },
  {
    region: 'CONMEBOL (South America)',
    teams: ['Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Ecuador', 'Chile', 'Peru', 'Venezuela', 'Paraguay']
  },
  {
    region: 'CONCACAF (North/Central America)',
    teams: ['USA', 'Mexico', 'Canada', 'Costa Rica', 'Panama', 'Jamaica']
  },
  {
    region: 'CAF (Africa)',
    teams: ['Morocco', 'Senegal', 'Egypt', 'Nigeria', 'Cameroon', 'Algeria', 'Ghana', 'Ivory Coast', 'South Africa']
  },
  {
    region: 'AFC (Asia) & OFC (Oceania)',
    teams: ['Japan', 'Iran', 'South Korea', 'Australia', 'Saudi Arabia', 'Qatar', 'Uzbekistan', 'UAE', 'New Zealand']
  }
];

// Helper to get total teams (should be 48)
const totalTeamsCount = TEAMS_BY_CONFEDERATION.reduce((acc, conf) => acc + conf.teams.length, 0);

export function FootballTeamAnalysisPanel({ initialTeam }: { initialTeam?: string }) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(initialTeam || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { toast } = useToast();
  
  const { data: teamData, isLoading, error } = useFotmobTeam(selectedTeam);

  React.useEffect(() => {
    if (!selectedTeam) return;
    
    const checkFav = async () => {
      try {
        const res = await favoritesApi.check(selectedTeam);
        // The API returns { isFavorite: boolean, favoriteId: string } or similar based on our update
        // We'll also pass type='team' in the check if we had query params, but since the route is just /check/:id, let's just use get() and find it.
        // Wait, favoritesApi.check doesn't take query params easily without modifying it. Let's just fetch all favorites and find it.
        const allFavs = await favoritesApi.get();
        if (allFavs.success) {
          const fav = allFavs.data.find((f: any) => f.type === 'team' && f.itemId === selectedTeam);
          if (fav) {
            setIsFavorite(true);
            setFavoriteId(fav._id);
          } else {
            setIsFavorite(false);
            setFavoriteId(null);
          }
        }
      } catch (e) {
        console.error('Failed to check favorite status', e);
      }
    };
    checkFav();
  }, [selectedTeam]);

  const toggleFavorite = async () => {
    if (!selectedTeam) return;
    setIsTogglingFavorite(true);
    
    try {
      if (isFavorite && favoriteId) {
        await favoritesApi.remove(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        toast({ title: 'Removed from Favorites' });
      } else {
        const teamLogoUrl = `https://images.fotmob.com/image_resources/logo/teamlogo/${teamData?.details?.id || ''}.png`;
        const res = await favoritesApi.add({
          type: 'team',
          itemId: selectedTeam,
          name: selectedTeam,
          sport: 'football',
          image: teamData?.details?.id ? teamLogoUrl : undefined
        });
        if (res.success) {
          setIsFavorite(true);
          setFavoriteId(res.data._id);
          toast({ title: 'Added to Favorites', description: `${selectedTeam} has been saved.` });
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update favorites', variant: 'destructive' });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (selectedTeam) {
    // Show Analysis Dashboard for Selected Team
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => setSelectedTeam(null)}
          className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground font-bold tracking-widest uppercase text-xs rounded-lg transition-colors"
        >
          ← Back to Teams
        </button>

        <div className="bg-card border border-border/40 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-3xl rounded-full" />
          
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-foreground/5 flex items-center justify-center p-4 shadow-inner shrink-0 relative z-10 border border-border/50">
            <FootballTeamLogo name={selectedTeam} logo={null} className="w-24 h-24 md:w-32 md:h-32" />
          </div>

          <div className="flex-1 text-center md:text-left relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-2">{selectedTeam}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                <Trophy size={14} /> National Team
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-widest rounded-full">
                <Activity size={14} className="animate-pulse" /> Active
              </span>
              <button 
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border transition-all ${
                  isFavorite 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                    : 'bg-foreground/5 text-muted-foreground border-border hover:bg-foreground/10 hover:text-foreground'
                }`}
              >
                <Heart size={14} fill={isFavorite ? "currentColor" : "none"} className={isTogglingFavorite ? "animate-pulse" : ""} />
                {isFavorite ? 'Saved' : 'Favorite'}
              </button>
            </div>
          </div>
        </div>

        {/* FotMob Style Tab Navigation */}
        <div className="flex items-center gap-6 md:gap-10 border-b border-border/40 overflow-x-auto scrollbar-hide px-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-card border border-border/40 rounded-3xl">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm animate-pulse">Loading Live Data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-24 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="text-xl font-black text-rose-500 mb-2">Failed to load team data</h3>
            <p className="text-rose-500/70 text-sm">{error}</p>
          </div>
        ) : teamData ? (
          <>
            {activeTab === 'Overview' && <TeamOverviewDashboard data={teamData} />}
            {activeTab === 'Table' && <TeamTableView data={teamData} />}
            {activeTab === 'Squad' && <TeamSquadView data={teamData} />}
            {activeTab === 'Fixtures' && <TeamFixturesView data={teamData} />}
            {activeTab === 'Player stats' && <TeamPlayerStatsView data={teamData} />}
            {activeTab === 'Team stats' && <TeamStatsView data={teamData} />}
            {activeTab === 'Trophies' && <TeamTrophiesView data={teamData} />}
            {!['Overview', 'Table', 'Squad', 'Fixtures', 'Player stats', 'Team stats', 'Trophies'].includes(activeTab) && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-2">
                  <Star className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Coming Soon</h3>
                <p className="text-muted-foreground text-sm font-medium">{activeTab} data will be available shortly.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  // Show 48 Teams Selector
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-4">
            <Star className="w-4 h-4 text-primary" fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">World Cup Edition</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight text-foreground">
            Select a Team
          </h2>
          <p className="text-muted-foreground text-sm font-medium tracking-wide mt-2">
            Explore deep analytics for all {totalTeamsCount} major national teams.
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-background border border-border/60 hover:border-foreground/30 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all rounded-xl shadow-sm"
          />
        </div>
      </div>

      {/* Grid of Teams Grouped by Confederation */}
      <div className="space-y-12">
        {TEAMS_BY_CONFEDERATION.map((confederation) => {
          const filteredTeams = confederation.teams.filter(team => 
            team.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredTeams.length === 0) return null;

          return (
            <div key={confederation.region} className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
                  {confederation.region}
                </h3>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-2 py-1 rounded">
                  {filteredTeams.length} Teams
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {filteredTeams.map((team) => (
                  <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className="group relative flex flex-col items-center justify-center p-4 bg-card border border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden text-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="w-14 h-14 md:w-16 md:h-16 mb-3 p-1.5 bg-foreground/5 group-hover:bg-background rounded-full flex items-center justify-center transition-colors shadow-inner relative z-10">
                       <FootballTeamLogo name={team} logo={null} size="md" className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                    
                    <span className="text-xs md:text-sm font-bold text-foreground/80 group-hover:text-foreground tracking-wide relative z-10 transition-colors">
                      {team}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
