import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SportIcon } from "./SportIcon";
import { Sport } from "@/data/types";
import {
  Home,
  BarChart3,
  PlusCircle,
  Search,
  User,
  Menu,
  X,
  Zap,
  LogOut,
  Heart,
  Trophy,
  Users,
  Loader2,
  Shield,
  Settings,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationPopover from "./NotificationPopover";
import { tournamentApi, teamApi } from "@/services/api";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavItem = ({ to, icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    )}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
  </Link>
);

const sports: Sport[] = ["cricket", "football", "basketball", "tennis"];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ tournaments: any[]; players: any[] }>({ tournaments: [], players: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [allTournaments, setAllTournaments] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [user, setUser] = useState<{ email: string; fullName?: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load all data when search opens
  useEffect(() => {
    if (searchOpen && !dataLoaded) {
      const loadData = async () => {
        try {
          const [tRes, teamRes] = await Promise.all([
            tournamentApi.getAll(),
            teamApi.getAll()
          ]);
          const tournaments = tRes?.data || tRes || [];
          setAllTournaments(Array.isArray(tournaments) ? tournaments : []);

          const teams = teamRes?.data || teamRes || [];
          const playerMap = new Map<string, any>();
          (Array.isArray(teams) ? teams : []).forEach((team: any) => {
            (team.players || []).forEach((p: any) => {
              const name = typeof p === 'string' ? p : p.name;
              if (name && !playerMap.has(name.toLowerCase())) {
                playerMap.set(name.toLowerCase(), {
                  name,
                  role: typeof p === 'object' ? p.role : 'Player',
                  team: team.name,
                  teamId: team._id,
                  photo: typeof p === 'object' ? p.photo : null
                });
              }
            });
          });
          setAllPlayers(Array.from(playerMap.values()));
          setDataLoaded(true);
        } catch (e) {
          console.error("Search data load error:", e);
        }
      };
      loadData();
    }
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen, dataLoaded]);

  // Filter results when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ tournaments: [], players: [] });
      return;
    }
    setIsSearching(true);
    const q = searchQuery.toLowerCase().trim();
    const filteredT = allTournaments.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.matchType?.toLowerCase().includes(q)
    ).slice(0, 5);
    const filteredP = allPlayers.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.team?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    ).slice(0, 8);
    setSearchResults({ tournaments: filteredT, players: filteredP });
    setIsSearching(false);
  }, [searchQuery, allTournaments, allPlayers]);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(""); }
    };
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    if (searchOpen) {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [searchOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const handleTournamentClick = (t: any) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/tournament/${t._id}`);
  };

  const handlePlayerClick = (p: any) => {
    setSearchOpen(false);
    setSearchQuery("");
    // Navigate directly to the standalone player profile page
    navigate(`/player/${encodeURIComponent(p.name)}`);
  };

  const hasResults = searchResults.tournaments.length > 0 || searchResults.players.length > 0;
  const showDropdown = searchOpen && searchQuery.trim().length > 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary transition-transform group-hover:scale-110" fill="currentColor" />
              <div className="absolute inset-0 bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text font-display">SportBuzz</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/" icon={<Home size={18} />} label="Dashboard" isActive={location.pathname === "/"} />
            <NavItem to="/performance-lab" icon={<BarChart3 size={18} />} label="Performance Lab" isActive={location.pathname === "/performance-lab"} />
            <NavItem to="/create" icon={<PlusCircle size={18} />} label="Create" isActive={location.pathname === "/create"} />
          </nav>

          {/* Sport Quick Access */}
          <div className="hidden lg:flex items-center gap-2 px-4">
            {sports.map((sport) => (
              <Link
                key={sport}
                to={`/?sport=${sport}`}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  "hover:bg-secondary",
                  sport === "cricket" && "hover:bg-cricket/10",
                  sport === "football" && "hover:bg-football/10",
                  sport === "basketball" && "hover:bg-basketball/10",
                  sport === "tennis" && "hover:bg-tennis/10"
                )}
              >
                <SportIcon sport={sport} size={20} />
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                searchOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            <NotificationPopover />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                        <User size={18} />
                        <span className="text-sm font-medium">{user.fullName || user.email}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
                      {(user as any).role === 'admin' || (user as any).role === 'scorer' ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="cursor-pointer text-blue-400 font-bold hover:text-blue-300">
                              <Shield size={16} className="mr-2" />Admin Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                        </>
                      ) : null}
                      <DropdownMenuItem asChild><Link to="/profile" className="cursor-pointer"><User size={16} className="mr-2" />My Profile</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/favorites" className="cursor-pointer"><Heart size={16} className="mr-2" />Favorites</Link></DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem asChild><Link to="/achievements" className="cursor-pointer"><Trophy size={16} className="mr-2" />Achievements</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/activity-history" className="cursor-pointer"><Clock size={16} className="mr-2" />Activity</Link></DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer"><LogOut size={16} className="mr-2" />Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-secondary transition-colors text-sm">Login</Link>
                <Link to="/signup" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
                  <User size={18} /><span className="hidden sm:inline">Sign Up</span>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ── Search Panel ───────────────────────────────────── */}
        {searchOpen && (
          <div ref={searchRef} className="py-3 border-t border-border animate-slide-up relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments, players..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" size={18} />}
            </div>

            {/* Results Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-[70vh] overflow-y-auto">
                {!dataLoaded ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <span className="text-sm text-slate-400">Loading data...</span>
                  </div>
                ) : !hasResults ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <Search size={32} className="text-slate-700" />
                    <p className="text-sm text-slate-500">No results for "<span className="text-white font-medium">{searchQuery}</span>"</p>
                  </div>
                ) : (
                  <>
                    {searchResults.tournaments.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Trophy size={12} className="text-yellow-500" /> Tournaments
                          </p>
                        </div>
                        {searchResults.tournaments.map((t) => (
                          <button
                            key={t._id}
                            onClick={() => handleTournamentClick(t)}
                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-800/70 transition-colors text-left group"
                          >
                            {t.logo ? (
                              <img src={t.logo} alt={t.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-slate-700">
                                <Trophy size={18} className="text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate group-hover:text-blue-400 transition-colors">{t.name}</p>
                              <p className="text-xs text-slate-500 truncate">{t.matchType || 'Tournament'} · {t.teams?.length || 0} teams</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded-md">{t.status || 'Active'}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.players.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50 border-t">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users size={12} className="text-emerald-500" /> Players
                          </p>
                        </div>
                        {searchResults.players.map((p, i) => (
                          <button
                            key={`${p.name}-${i}`}
                            onClick={() => handlePlayerClick(p)}
                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-800/70 transition-colors text-left group"
                          >
                            {p.photo ? (
                              <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600/20 to-blue-600/20 flex items-center justify-center border border-slate-700">
                                <User size={18} className="text-emerald-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">{p.name}</p>
                              <p className="text-xs text-slate-500 truncate">{p.role} · {p.team}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              <NavItem to="/" icon={<Home size={18} />} label="Dashboard" isActive={location.pathname === "/"} />
              <NavItem to="/performance-lab" icon={<BarChart3 size={18} />} label="Performance Lab" isActive={location.pathname === "/performance-lab"} />
              <NavItem to="/create" icon={<PlusCircle size={18} />} label="Create" isActive={location.pathname === "/create"} />
              <div className="flex items-center gap-2 pt-4 border-t border-border mt-2">
                {sports.map((sport) => (
                  <Link key={sport} to={`/?sport=${sport}`} className="flex-1 flex items-center justify-center p-3 rounded-lg bg-secondary">
                    <SportIcon sport={sport} size={24} />
                  </Link>
                ))}
              </div>
              {user ? (
                <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                  {((user as any).role === 'admin' || (user as any).role === 'scorer') && (
                    <Link to="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-400 font-bold hover:bg-blue-500/10 transition-colors">
                      <Shield size={18} /><span>Admin Dashboard</span>
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"><User size={18} /><span>My Profile</span></Link>
                  <Link to="/favorites" className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Heart size={18} /><span>Favorites</span></Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors mt-2"><LogOut size={18} /><span>Logout</span></button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                  <Link to="/login" className="px-3 py-2 rounded-lg text-center bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm font-medium">Login</Link>
                  <Link to="/signup" className="px-3 py-2 rounded-lg text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">Sign Up</Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
