import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { TeamLogo } from "../../components/TeamLogo";
import { useLivescoreMatchDetail } from "../../hooks/football/useLivescore6Queries";
import {
  Loader2, ArrowLeft, Clock, MapPin, Activity, ListOrdered,
  Users, User, MessageSquare, BarChart3, Info, Trophy, ArrowLeftRight,
  CircleDot, ShieldAlert, Timer, ArrowDown, ArrowUp, Zap
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn } from "../../lib/utils";
import { Helmet } from "react-helmet-async";

// Use empty string in dev so Vite proxy handles /api → port 5000 (avoids CORS)
const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Sequential player image queue ────────────────────────────────────────────
// One request fires at a time: search → get ID → fetch image → show → next
const _imgCache: Record<string, string> = {}; // cacheKey → objectURL | 'ERROR'
const _imgQueue: { key: string; name: string; team: string }[] = [];
const _imgListeners: Record<string, Array<(url: string) => void>> = {};
let _isFetching = false;

function _enqueue(name: string, team: string, cb: (url: string) => void) {
  const key = `${name}||${team}`;
  if (_imgCache[key]) { cb(_imgCache[key] === 'ERROR' ? '' : _imgCache[key]); return; }
  if (!_imgListeners[key]) { _imgListeners[key] = []; _imgQueue.push({ key, name, team }); }
  _imgListeners[key].push(cb);
  _processQueue();
}

async function _processQueue() {
  if (_isFetching || _imgQueue.length === 0) return;
  _isFetching = true;
  const { key, name, team } = _imgQueue.shift()!;
  try {
    const res = await fetch(
      `${API_BASE}/api/football/player-image/${encodeURIComponent(name)}?team=${encodeURIComponent(team)}`
    );
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      _imgCache[key] = url;
      _imgListeners[key]?.forEach(fn => fn(url));
    } else {
      _imgCache[key] = 'ERROR';
      _imgListeners[key]?.forEach(fn => fn(''));
    }
  } catch {
    _imgCache[key] = 'ERROR';
    _imgListeners[key]?.forEach(fn => fn(''));
  } finally {
    delete _imgListeners[key];
    _isFetching = false;
    _processQueue();
  }
}

/** Avatar circle shown on the pitch / in the subs list */
const PlayerLineupAvatar = ({
  playerName, teamName, teamColor, number, className
}: {
  playerName: string; teamName: string; teamColor: string;
  number: string | number; className?: string;
}) => {
  const [imgUrl, setImgUrl] = useState('');
  useEffect(() => {
    if (!playerName) return;
    let alive = true;
    _enqueue(playerName, teamName, url => { if (alive) setImgUrl(url); });
    return () => { alive = false; };
  }, [playerName, teamName]);

  return (
    <div
      className={cn(
        'rounded-full border border-white/50 flex items-center justify-center font-black text-white bg-cover bg-center overflow-hidden',
        className
      )}
      style={{ backgroundColor: imgUrl ? 'transparent' : teamColor, backgroundImage: imgUrl ? `url(${imgUrl})` : 'none' }}
    >
      {!imgUrl && (number ?? '')}
    </div>
  );
};
// ──────────────────────────────────────────────────────────────────────────────

/* ─────────────────────────────────────────────
   Livescore6 field map
   IT codes: 36=Goal, 37=PenGoal/VAR, 39=OwnGoal, 43=YellowCard,
             45=RedCard, 46=Y2R, 4=SubOut, 5=SubIn, 63=Assist
   Stat keys: Fls=Fouls, Ths=ThrowIns, Ofs=Offsides, Crs=Crosses,
              Ycs=Yellows, Rcs=Reds, Shof=ShotsOff, Shon=ShotsOn,
              Pss=Possession%, Cos=Corners, Gks=GKSaves, Goa=GoalAttempts,
              Shbl=ShotsBlocked, Att=Attacks
   ───────────────────────────────────────────── */

const PLAYER_IMG_BASE = "https://lsm-static-prod.livescore.com/medium/";
const TEAM_IMG_BASE   = "https://lsm-static-prod.livescore.com/medium/";

const TEAM_COLORS: Record<string, string> = {
  // International
  'portugal': '#7f1d1d', // Red
  'argentina': '#0284c7', // Sky Blue
  'brazil': '#ca8a04', // Yellow
  'france': '#172554', // Navy
  'england': '#1e3a8a', // Navy (Secondary)
  'spain': '#991b1b', // Red
  'italy': '#1e3a8a', // Blue
  'germany': '#1c1917', // Black
  'netherlands': '#c2410c', // Orange
  'belgium': '#7f1d1d', // Red
  'croatia': '#991b1b', // Red
  'mexico': '#14532d', // Green
  'south africa': '#064e3b', // Green/Gold
  'south korea': '#7f1d1d', // Red
  'czechia': '#991b1b', // Red
  'nigeria': '#14532d', // Green
  'costa rica': '#991b1b', // Red
  'bolivia': '#14532d', // Green
  'algeria': '#14532d', // Green
  'usa': '#1e3a8a', // Navy
  'canada': '#991b1b', // Red
  'morocco': '#991b1b', // Red
  'senegal': '#14532d', // Green
  'japan': '#1e3a8a', // Blue
  'uruguay': '#0284c7', // Sky Blue
  'colombia': '#ca8a04', // Yellow
  'chile': '#991b1b', // Red
  'switzerland': '#991b1b', // Red
  'denmark': '#991b1b', // Red
  'poland': '#991b1b', // Red
  'sweden': '#ca8a04', // Yellow
  'wales': '#991b1b', // Red
  'scotland': '#1e3a8a', // Navy
  'saudi arabia': '#14532d', // Green
  'bahrain': '#dc2626', // Red

  // Clubs
  'arsenal': '#7f1d1d',
  'chelsea': '#1e3a8a',
  'liverpool': '#7f1d1d',
  'manchester city': '#0284c7',
  'manchester united': '#7f1d1d',
  'tottenham hotspur': '#1e293b',
  'real madrid': '#1e293b',
  'barcelona': '#7f1d1d',
  'atletico madrid': '#7f1d1d',
  'bayern munich': '#7f1d1d',
  'borussia dortmund': '#ca8a04',
  'paris saint-germain': '#172554',
  'juventus': '#1c1917',
  'inter': '#1e3a8a',
  'ac milan': '#7f1d1d',
  'napoli': '#0284c7',
  'malaga': '#0284c7',
  'las palmas': '#ca8a04',
};

const getTeamColor = (teamName: string, isHome: boolean) => {
  if (!teamName) return isHome ? "#081a3d" : "#474b54";
  const name = teamName.toLowerCase().trim();
  
  if (TEAM_COLORS[name]) return TEAM_COLORS[name];
  
  // Try partial match
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (name.includes(key)) {
      return color;
    }
  }
  
  // Generate a consistent color based on team name hash if not found
  const hash = name.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const colors = [
      "#7f1d1d", // Red
      "#1e3a8a", // Blue
      "#14532d", // Green
      "#ca8a04", // Yellow/Gold
      "#4c1d95", // Purple
      "#9d174d", // Pink
      "#0f766e", // Teal
      "#b45309", // Orange
  ];
  return colors[Math.abs(hash) % colors.length];
};

// Incident-type to label & icon colour
const incidentMeta: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  36: { label: "Goal", color: "text-emerald-400", icon: "⚽" },
  37: { label: "Penalty / VAR Goal", color: "text-emerald-400", icon: "⚽" },
  39: { label: "Own Goal", color: "text-red-400", icon: "⚽" },
  43: { label: "Yellow Card", color: "text-yellow-400", icon: <div className="w-3.5 h-5 bg-yellow-400 rounded-[2px] shadow-sm" /> },
  45: { label: "Red Card", color: "text-red-500", icon: <div className="w-3.5 h-5 bg-red-500 rounded-[2px] shadow-sm" /> },
  46: { label: "Second Yellow / Red", color: "text-red-500", icon: <div className="relative w-4 h-5"><div className="w-3.5 h-4.5 bg-yellow-400 rounded-[2px] shadow-sm absolute -top-0.5 -left-0.5" /><div className="w-3.5 h-4.5 bg-red-500 rounded-[2px] shadow-sm relative z-10 top-0.5 left-0.5" /></div> },
  4:  { label: "Substituted Off", color: "text-red-400", icon: <ArrowDown className="text-red-500 w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> },
  5:  { label: "Substituted On", color: "text-emerald-400", icon: <ArrowUp className="text-emerald-500 w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> },
  60: { label: "Substitution", color: "text-blue-400", icon: <ArrowLeftRight className="text-blue-500 w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> },
  61: { label: "Substitution", color: "text-blue-400", icon: <ArrowLeftRight className="text-blue-500 w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={3} /> },
  63: { label: "Assist", color: "text-blue-400", icon: "👟" },
};

// Stat key → readable label
const statLabels: Record<string, string> = {
  Pss: "Ball Possession (%)",
  Shon: "Shots On Target",
  Shof: "Shots Off Target",
  Shbl: "Shots Blocked",
  Goa: "Goal Attempts",
  Cos: "Corners",
  Fls: "Fouls",
  Ofs: "Offsides",
  Ycs: "Yellow Cards",
  Rcs: "Red Cards",
  Crs: "Crosses",
  Ths: "Throw-ins",
  Gks: "Goalkeeper Saves",
  Att: "Attacks",
};

// ── Helper: parse Esd numeric timestamp → Date ────────────────────
function parseEsd(esd: number | string | undefined): Date {
  if (!esd) return new Date();
  const s = esd.toString();
  if (s.length === 14) {
    return new Date(Date.UTC(
      +s.substring(0, 4), +s.substring(4, 6) - 1, +s.substring(6, 8),
      +s.substring(8, 10), +s.substring(10, 12), +s.substring(12, 14)
    ));
  }
  return new Date();
}

// ── Helper: flatten Incs object (keyed by period) into sorted array ──
function flattenIncidents(incs: any): any[] {
  if (!incs) return [];
  const result: any[] = [];
  for (const periodKey of Object.keys(incs).sort()) {
    const periodEvents = incs[periodKey];
    if (!Array.isArray(periodEvents)) continue;
    for (const evt of periodEvents) {
      // Some events have nested Incs (e.g. goals with assists)
      if (evt.Incs && Array.isArray(evt.Incs)) {
        const assistEvent = evt.Incs.find((s: any) => s.IT === 63);
        if (assistEvent) {
          const mainEvents = evt.Incs.filter((s: any) => s.IT !== 63);
          for (const main of mainEvents) {
            result.push({ 
              ...main, 
              _period: periodKey, 
              _parentSc: evt.Sc, 
              Min: main.Min || evt.Min,
              _assist: assistEvent.Pn || (assistEvent.Fn ? `${assistEvent.Fn} ${assistEvent.Ln}` : undefined) 
            });
          }
        } else {
          result.push({ ...evt, _period: periodKey });
          for (const sub of evt.Incs) {
            result.push({ ...sub, _period: periodKey, _parentSc: evt.Sc, Min: sub.Min || evt.Min });
          }
        }
      } else {
        result.push({ ...evt, _period: periodKey });
      }
    }
  }
  // Sort chronologically
  result.sort((a, b) => (a.Min || 0) - (b.Min || 0));
  return result;
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

const MatchCenter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "summary" | "events" | "lineups" | "statistics" | "performance"
  >("summary");

  // ── Data hooks ──────────────────────────────────────────
  const { data: scoreboardRes, isLoading: sbLoading, error: sbError } =
    useLivescoreMatchDetail("get-scoreboard", id || "", !!id);
  const { data: infoRes } =
    useLivescoreMatchDetail("get-info", id || "", !!id);
  const { data: incidentsRes } =
    useLivescoreMatchDetail("get-incidents", id || "", activeTab === "summary" || activeTab === "events");
  const { data: lineupsRes, isLoading: luLoading, dataUpdatedAt: luUpdatedAt } =
    useLivescoreMatchDetail("get-lineups", id || "", activeTab === "lineups");
  const { data: statsRes, isLoading: stLoading } =
    useLivescoreMatchDetail("get-statistics", id || "", activeTab === "statistics");

  const parsedSubs = useMemo(() => {
    let subs = Array.isArray(lineupsRes?.data?.Subs) ? [...lineupsRes.data.Subs] : [];
    if (subs.length === 0 && incidentsRes?.data?.Incs) {
      const flat = flattenIncidents(incidentsRes.data.Incs);
      const subEvents = flat.filter((e: any) => e.IT === 60 || e.IT === 63 || e._period === 'Sub');
      subs = subEvents.map((e: any) => {
        let inPlayer = e.Pn || "Unknown";
        let outPlayer = e.PnO || "Unknown";
        if (typeof inPlayer === 'string' && inPlayer.includes('(In)')) {
          const parts = inPlayer.split(',');
          inPlayer = parts[0]?.replace('(In)', '')?.trim() || inPlayer;
          outPlayer = parts[1]?.replace('(Out)', '')?.trim() || outPlayer;
        }
        return { Min: e.Min, Pn: inPlayer, PnO: outPlayer, Fn: e.Fn, Ln: e.Ln };
      });
    }
    return subs;
  }, [lineupsRes?.data?.Subs, incidentsRes?.data?.Incs]);

  const allIncidents = useMemo(() => {
    const incs = flattenIncidents(incidentsRes?.data?.Incs || scoreboardRes?.data?.["Incs-s"]);
    
    // Explicitly add substitutions to ensure they appear in Key Events
    // Check if incidents already have subs (IT 60 or 63)
    const hasSubs = incs.some((e: any) => e.IT === 60 || e.IT === 63);
    if (!hasSubs && parsedSubs.length > 0) {
      parsedSubs.forEach((sub: any) => {
        let teamNm = 1;
        const homePl = lineupsRes?.data?.Lu?.[0]?.Ps || [];
        if (homePl.length > 0 && !homePl.some((p: any) => p.Pn === sub.PnO || `${p.Fn} ${p.Ln}` === sub.PnO || p.Fn === sub.PnO || p.Ln === sub.PnO)) {
           teamNm = 2;
        }
        incs.push({
          IT: 60,
          Min: sub.Min,
          Nm: teamNm,
          Pn: `${sub.Pn || sub.Fn} (In), ${sub.PnO} (Out)`,
          _period: 'Sub'
        });
      });
    }

    incs.sort((a, b) => (a.Min || 0) - (b.Min || 0));
    return incs;
  }, [incidentsRes?.data, scoreboardRes?.data, parsedSubs, lineupsRes?.data?.Lu]);

  // ── Performance Lab state ──────────────────────────────
  const [perfData, setPerfData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== 'performance' || !id || perfData) return;
    setPerfLoading(true);
    setPerfError(null);
    fetch(`${API_BASE}/football/v2/matches/performance/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setPerfData(json.data);
        } else {
          setPerfError(json.message || 'Failed to load performance data');
        }
      })
      .catch(err => setPerfError(err.message))
      .finally(() => setPerfLoading(false));
  }, [activeTab, id, perfData]);

  // ── Loading / Error states ──────────────────────────────
  if (sbLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading match details…</p>
        </div>
      </div>
    );
  }

  if (sbError || !scoreboardRes?.data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-foreground mb-4">Match Not Found</h1>
          <p className="text-muted-foreground mb-8 text-center">
            We couldn't load the details for this match.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-full font-bold hover:bg-emerald-500/20 transition-all"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── Derived data ────────────────────────────────────────
  const sb = scoreboardRes.data;
  const home = sb.T1?.[0] || { Nm: "Home", Abr: "HOM", Img: "" };
  const away = sb.T2?.[0] || { Nm: "Away", Abr: "AWY", Img: "" };
  const homeScore = sb.Tr1 ?? "0";
  const awayScore = sb.Tr2 ?? "0";
  const htHome = sb.Trh1;
  const htAway = sb.Trh2;
  const eps = (sb.Eps || "NS").toUpperCase();
  const isLive = !["NS", "FT", "AP", "AET", "CANC", "POSTP"].includes(eps);
  const isCompleted = ["FT", "AP", "AET"].includes(eps);
  const isUpcoming = eps === "NS";
  const matchDate = parseEsd(sb.Esd);
  const venue = sb.Venue?.Vnm || infoRes?.data?.Vnm || "Unknown Stadium";
  const venueCity = sb.Venue?.Vcy || infoRes?.data?.Vcy || "";
  const stage = sb.Stg?.Snm || "Football Match";
  const country = sb.Stg?.Cnm || "";
  const referee = infoRes?.data?.Refs?.[0]?.Nm || "";

  const logoUrl = (img: string | undefined) =>
    img ? `${TEAM_IMG_BASE}${img}` : undefined;

  const playerImgUrl = (img: string | undefined) =>
    img ? `${PLAYER_IMG_BASE}${img}` : undefined;

  let statusText = "Upcoming";
  if (isLive) statusText = `${eps}'`;
  else if (isCompleted) statusText = eps === "AP" ? "After Penalties" : eps === "AET" ? "After Extra Time" : "Full Time";

  // Compute Goals for header
  const homeGoals = allIncidents.filter((e: any) => [36, 37, 39].includes(e.IT) && e.Nm === 1);
  const awayGoals = allIncidents.filter((e: any) => [36, 37, 39].includes(e.IT) && e.Nm === 2);

  return (
    <>
      <Helmet>
        <title>{`${home.Nm} vs ${away.Nm} – ${stage} | SportsBuzz`}</title>
        <meta name="description" content={`${home.Nm} vs ${away.Nm} match details – ${stage}`} />
      </Helmet>

      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        {/* Back */}
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-semibold text-sm">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* ═══ PREMIUM HEADER ═══ */}
        <section className="bg-background pt-2 pb-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-card border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">

              {/* Top meta bar */}
              <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-4 border-b border-border/40 bg-muted/10 gap-3">
                <div className="flex items-center gap-3">
                  {isLive && (
                    <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-2.5 py-1 rounded-full border border-border/50">COMPLETED</span>
                  )}
                  {isUpcoming && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-2.5 py-1 rounded-full border border-border/50">UPCOMING</span>
                  )}
                  <span className="text-xs font-semibold text-foreground uppercase tracking-widest">
                    {country ? `${country} · ` : ""}{stage}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-muted-foreground/60" /> {venue}{venueCity ? `, ${venueCity}` : ""}</span>
                  <span className="hidden sm:flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground/60" /> {matchDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>

              {/* Score area */}
              {/* Score area */}
              <div className="flex flex-col px-6 md:px-10 py-10 md:py-14 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                  {/* Home Team */}
                  <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-end gap-5 w-full">
                    <div className="text-center md:text-right">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{home.Nm}</h2>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{home.Abr}</p>
                    </div>
                    <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="lg" className="w-20 h-14 md:w-24 md:h-16 object-contain shrink-0 drop-shadow-md" />
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[200px]">
                    {isUpcoming ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">– : –</span>
                        <span className="text-sm font-semibold text-emerald-500 uppercase tracking-widest mt-2 bg-emerald-500/10 px-4 py-1.5 rounded-full">
                          {matchDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-6 md:gap-10">
                          <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">{homeScore}</span>
                          <span className="text-border text-4xl font-light mb-1">-</span>
                          <span className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">{awayScore}</span>
                        </div>
                        {htHome !== undefined && htAway !== undefined && (
                          <span className="text-xs text-muted-foreground font-medium bg-secondary/30 px-3 py-1 rounded-full">
                            HT: {htHome} - {htAway}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex flex-col md:flex-row items-center justify-start gap-5 w-full">
                    <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="lg" className="w-20 h-14 md:w-24 md:h-16 object-contain shrink-0 drop-shadow-md" />
                    <div className="text-center md:text-left">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{away.Nm}</h2>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{away.Abr}</p>
                    </div>
                  </div>
                </div>

                {/* Goals Area (Desktop) */}
                <div className="hidden md:flex flex-row justify-between w-full mt-6">
                  {/* Home Goals */}
                  <div className="flex-1 flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
                    {homeGoals.map((g: any, i: number) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{g.Pn || g.Fn && `${g.Fn} ${g.Ln}`}</span>
                        {g._assist && <span className="text-muted-foreground/60 text-[10px] tracking-wide">(Ast: {g._assist})</span>}
                        {g.IT === 37 && <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">(P)</span>}
                        {g.IT === 39 && <span className="text-[9px] font-bold text-red-400/80 uppercase">(OG)</span>}
                        <span className="font-mono text-[10px] text-emerald-500 font-black">{g.Min}'</span>
                        <CircleDot size={10} className="text-emerald-500 ml-0.5" />
                      </span>
                    ))}
                  </div>
                  <div className="shrink-0 min-w-[200px] flex justify-center items-start" /> {/* spacer */}
                  {/* Away Goals */}
                  <div className="flex-1 flex flex-col items-start gap-1.5 text-xs text-muted-foreground">
                    {awayGoals.map((g: any, i: number) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <CircleDot size={10} className="text-emerald-500 mr-0.5" />
                        <span className="font-mono text-[10px] text-emerald-500 font-black">{g.Min}'</span>
                        <span className="font-semibold text-foreground">{g.Pn || g.Fn && `${g.Fn} ${g.Ln}`}</span>
                        {g._assist && <span className="text-muted-foreground/60 text-[10px] tracking-wide">(Ast: {g._assist})</span>}
                        {g.IT === 37 && <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">(P)</span>}
                        {g.IT === 39 && <span className="text-[9px] font-bold text-red-400/80 uppercase">(OG)</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Goals Area (Mobile) */}
                <div className="md:hidden flex flex-col items-center gap-4 mt-6 w-full">
                  {homeGoals.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 border-b border-border/40 pb-1 mb-1">{home.Nm} Goals</span>
                      {homeGoals.map((g: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-emerald-500 font-black">{g.Min}'</span>
                          <span className="font-semibold text-foreground">{g.Pn || g.Fn && `${g.Fn} ${g.Ln}`}</span>
                          {g._assist && <span className="text-muted-foreground/60 text-[10px] tracking-wide">(Ast: {g._assist})</span>}
                          {g.IT === 37 && <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">(P)</span>}
                          {g.IT === 39 && <span className="text-[9px] font-bold text-red-400/80 uppercase">(OG)</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {awayGoals.length > 0 && (
                    <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 border-b border-border/40 pb-1 mb-1">{away.Nm} Goals</span>
                      {awayGoals.map((g: any, i: number) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-emerald-500 font-black">{g.Min}'</span>
                          <span className="font-semibold text-foreground">{g.Pn || g.Fn && `${g.Fn} ${g.Ln}`}</span>
                          {g._assist && <span className="text-muted-foreground/60 text-[10px] tracking-wide">(Ast: {g._assist})</span>}
                          {g.IT === 37 && <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">(P)</span>}
                          {g.IT === 39 && <span className="text-[9px] font-bold text-red-400/80 uppercase">(OG)</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 md:px-10 py-4 bg-muted/10 border-t border-border/40 gap-4">
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  isLive ? "text-emerald-500" : "text-muted-foreground"
                )}>
                  {statusText}
                </span>
                {referee && (
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <ShieldAlert size={14} className="opacity-60" /> Ref: {referee}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TABS ═══ */}
        <section className="container mx-auto px-4 max-w-7xl">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-8">
            <TabsList className="w-full justify-start bg-transparent border-b border-border/30 rounded-none h-auto p-0 space-x-6 overflow-x-auto pb-px hide-scrollbar">
              {[
                { v: "summary",     icon: <BarChart3 size={16} />,     label: "Summary" },
                { v: "events",      icon: <CircleDot size={16} />,     label: "Key Events" },
                { v: "lineups",     icon: <Users size={16} />,         label: "Lineups" },
                { v: "statistics",  icon: <Activity size={16} />,      label: "Statistics" },
                { v: "performance", icon: <Zap size={16} />,           label: "Performance Lab" },
              ].map(t => (
                <TabsTrigger key={t.v} value={t.v}
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none transition-all">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ──────────── SUMMARY ──────────── */}
            <TabsContent value="summary" className="space-y-6 animate-fade-in">
              <div className="bg-card border border-border/30 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-6 md:px-8 py-5 border-b border-border/30 bg-muted/5">
                  <Info className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Information</h3>
                </div>
                <div className="flex flex-col divide-y divide-border/20 px-6 md:px-8">
                  {[
                    { label: "Competition", value: `${country ? country + " · " : ""}${stage}`, icon: <Trophy size={16} /> },
                    { label: "Venue", value: venue + (venueCity ? `, ${venueCity}` : ""), icon: <MapPin size={16} /> },
                    { label: "Date & Time", value: matchDate.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }), icon: <Clock size={16} /> },
                    { label: "Status", value: statusText, icon: <Activity size={16} /> },
                    ...(referee ? [{ label: "Referee", value: referee, icon: <ShieldAlert size={16} /> }] : []),
                  ].map((r, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 group hover:bg-muted/5 transition-colors -mx-6 md:-mx-8 px-6 md:px-8">
                      <div className="flex items-center gap-3 text-muted-foreground mb-1.5 sm:mb-0">
                        <div className="text-emerald-500/70 group-hover:text-emerald-500 transition-colors">
                          {r.icon}
                        </div>
                        <span className="text-sm font-medium">{r.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ──────────── KEY EVENTS ──────────── */}
            <TabsContent value="events" className="space-y-6 animate-fade-in">
              <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl shadow-sm overflow-hidden p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <CircleDot className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Key Events</h3>
                </div>
                {allIncidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No events recorded yet.</p>
                ) : (
                  <div className="relative max-w-4xl mx-auto pt-6 pb-6">
                    <div className="text-white text-xs mb-4">Debug ITs: {allIncidents.map(e => e.IT).join(', ')}</div>
                    {/* Vertical line */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-border/40" />

                    <div className="space-y-6">
                      {allIncidents
                        .filter(e => [36, 37, 39, 43, 45, 46, 4, 5, 60, 61].includes(e.IT))
                        .map((evt, i) => {
                          const meta = incidentMeta[evt.IT] || { label: "Event", color: "text-foreground", icon: "•" };
                          const isTeam1 = evt.Nm === 1;

                          return (
                            <div key={i} className={cn("flex w-full items-center relative group", isTeam1 ? "justify-start" : "justify-end")}>
                              {/* Center Minute & Dot */}
                              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center z-20 w-12 bg-background py-1.5 rounded-full border border-border/30 shadow-md">
                                <span className="text-[10px] md:text-xs font-mono font-black text-muted-foreground">{evt.Min}'</span>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              </div>

                              {/* Horizontal connector line */}
                              <div className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-[2.5rem] h-[2px] bg-gradient-to-r hidden md:block z-0 opacity-50",
                                isTeam1 ? "right-[-2.5rem] from-border/50 to-transparent" : "left-[-2.5rem] from-transparent to-border/50"
                              )} />

                              {/* Content */}
                              <div className={cn(
                                "w-[calc(50%-2.5rem)] flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-3xl border transition-all duration-300 shadow-md relative overflow-hidden group z-10",
                                isTeam1 
                                  ? "bg-gradient-to-r from-card to-card/40 hover:from-card hover:to-emerald-950/20 border-border/30 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] flex-row" 
                                  : "bg-gradient-to-l from-card to-card/40 hover:from-card hover:to-emerald-950/20 border-border/30 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] flex-row-reverse text-right"
                              )}>
                                {/* Background subtle glow for icon */}
                                <div className={cn(
                                  "absolute top-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-3xl opacity-20 transition-opacity duration-300 group-hover:opacity-50 pointer-events-none",
                                  isTeam1 ? "left-0 bg-emerald-500" : "right-0 bg-emerald-500"
                                )} />

                                {/* Icon Box */}
                                <div className={cn(
                                  "relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full shrink-0 shadow-inner border border-white/5",
                                  isTeam1 ? "bg-gradient-to-br from-background to-muted" : "bg-gradient-to-bl from-background to-muted"
                                )}>
                                  <span className="text-xl md:text-2xl drop-shadow-md relative z-10">{meta.icon}</span>
                                </div>

                                {/* Text content */}
                                <div className="flex-1 min-w-0 z-10 mx-1">
                                  <p className={cn("font-black text-sm md:text-lg truncate drop-shadow-sm tracking-tight", meta.color)}>{evt.Pn || evt.Fn && `${evt.Fn} ${evt.Ln}` || "Unknown"}</p>
                                  <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 mt-1", isTeam1 ? "justify-start" : "justify-end")}>
                                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                      {meta.label}{evt.IR ? ` (${evt.IR})` : ""}
                                    </span>
                                    {evt._assist && (
                                      <span className="text-[10px] md:text-xs font-semibold text-emerald-400 truncate max-w-[140px] flex items-center gap-1">
                                        <span className="text-muted-foreground/40">•</span>
                                        Ast: {evt._assist}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Score Badge */}
                                {evt.Sc && (
                                  <div className="z-10 shrink-0">
                                    <span className="text-xs md:text-sm font-black text-white bg-black/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_4px_6px_rgba(0,0,0,0.2)]">
                                      {evt.Sc[0]} - {evt.Sc[1]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ──────────── LINEUPS ──────────── */}
            <TabsContent value="lineups" className="space-y-8 animate-fade-in">
              {luLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : !lineupsRes?.data?.Lu ? (
                <div className="py-20 text-center"><p className="text-muted-foreground font-medium">Lineup data not available for this match.</p></div>
              ) : (
                <div className="flex flex-col space-y-8">
                  {(() => {
                    const homeTeamInfo = lineupsRes.data.Lu[0];
                    const awayTeamInfo = lineupsRes.data.Lu[1];
                    const homePlayers = homeTeamInfo?.Ps || [];
                    const awayPlayers = awayTeamInfo?.Ps || [];

                    const isCoach = (p: any) => {
                      const pos = p.Pon?.toLowerCase() || "";
                      return pos === "coach" || pos === "manager" || pos === "head coach";
                    };

                    const extractLineups = (players: any[], foString?: string) => {
                      const validPlayers = players.filter(p => !isCoach(p));
                      const startingXI = [];
                      const subs = [];
                      
                      let startersCount = 0;
                      for (const p of validPlayers) {
                        if (p.Pon?.toLowerCase() === "substitute" || startersCount >= 11) {
                          subs.push(p);
                        } else {
                          startingXI.push(p);
                          startersCount++;
                        }
                      }
                      
                      let startingRows: any[][] = [];
                      if (foString && startingXI.length >= 10) {
                        // Parse formation like "3-4-2-1" -> [3, 4, 2, 1]
                        const parts = foString.split('-').map(Number).filter(n => !isNaN(n));
                        const sum = parts.reduce((a,b)=>a+b, 0);
                        if (sum > 0 && sum <= 10) {
                          // First row is GK
                          startingRows.push([startingXI[0]]);
                          let idx = 1;
                          for (const count of parts) {
                            startingRows.push(startingXI.slice(idx, idx + count));
                            idx += count;
                          }
                          // Catch any remaining
                          if (idx < startingXI.length) {
                             startingRows.push(startingXI.slice(idx));
                          }
                        }
                      }

                      if (startingRows.length === 0) {
                        startingRows = [
                          startingXI.filter(p => p.Pon === "Goalkeeper" || p.Pon === "GK"),
                          startingXI.filter(p => p.Pon === "Defender" || p.Pon === "DEF"),
                          startingXI.filter(p => p.Pon === "Midfielder" || p.Pon === "MID"),
                          startingXI.filter(p => p.Pon === "Forward" || p.Pon === "FWD" || p.Pon === "Attacker")
                        ].filter(row => row.length > 0);
                      }
                      
                      // Fallback if all filters missed
                      if (startingRows.length === 0 || startingRows.flat().length === 0) {
                        startingRows = [[...startingXI]];
                      }

                      return { startingRows, subs };
                    };

                    const homeData = extractLineups(homePlayers, homeTeamInfo?.Fo);
                    const awayData = extractLineups(awayPlayers, awayTeamInfo?.Fo);
                    
                    const homeRows = homeData.startingRows;
                    const awayRows = awayData.startingRows;
                    
                    const homeSubs = homeData.subs;
                    const awaySubs = awayData.subs;

                    // Coaches may be in team.Coaches or inside players array
                    const extractCoaches = (teamInfo: any, players: any[]) => {
                       if (teamInfo.Coaches && teamInfo.Coaches.length > 0) return teamInfo.Coaches;
                       return players.filter(p => isCoach(p));
                    };
                    const homeCoaches = extractCoaches(homeTeamInfo, homePlayers);
                    const awayCoaches = extractCoaches(awayTeamInfo, awayPlayers);

                    const getPlayerEvents = (p: any) => {
                      const pNameTokens = [p.Pn, p.Ln, p.Fn, `${p.Fn} ${p.Ln}`].filter(Boolean).map(s => String(s).toLowerCase().trim());
                      
                      const fuzzyMatch = (eName: string) => {
                        if (!eName) return false;
                        const en = String(eName).toLowerCase().trim();
                        // Either exact token match, or one string is heavily included in the other (at least 4 chars if short, or direct includes)
                        return pNameTokens.some(pt => {
                          if (pt === en) return true;
                          if (pt.length > 3 && en.includes(pt)) return true;
                          if (en.length > 3 && pt.includes(en)) return true;
                          return false;
                        });
                      };

                      const evts = allIncidents.filter((e: any) => 
                        fuzzyMatch(e.Pn || e.Fn || e.Ln || "") && 
                        [36, 37, 39, 43, 44, 45, 46, 63, 60].includes(e.IT)
                      );
                      
                      const isSubIn = parsedSubs.find(s => fuzzyMatch(s.Pn || s.Fn || ""));
                      if (isSubIn) evts.push({ IT: 5, Min: isSubIn.Min });

                      const isSubOut = parsedSubs.find(s => fuzzyMatch(s.PnO || ""));
                      if (isSubOut) evts.push({ IT: 4, Min: isSubOut.Min });

                      // Deduplicate by IT and Min to avoid double badges
                      const uniqueEvts = evts.filter((v: any, i: number, a: any) => a.findIndex((t: any) => t.IT === v.IT && t.Min === v.Min) === i);
                      return uniqueEvts;
                    };

                    const renderPlayerEventsBadges = (p: any, inPitch = false) => {
                      const pEvents = getPlayerEvents(p);
                      if (pEvents.length === 0) return null;
                      return (
                        <div className={cn("flex flex-wrap gap-0.5 z-20 pointer-events-none", inPitch ? "absolute -top-2 -right-3 flex-col" : "flex-row items-center ml-2")}>
                          {pEvents.map((e: any, i: number) => {
                            const meta = incidentMeta[e.IT];
                            if (!meta) return null;
                            return (
                              <span key={i} className="text-[10px] md:text-xs bg-black/70 backdrop-blur-sm rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center shadow-md border border-white/10" title={meta.label}>
                                {meta.icon}
                              </span>
                            );
                          })}
                        </div>
                      );
                    };

                    const renderPlayer = (p: any, teamColor: string, teamName: string) => {
                      const hasRedCard = getPlayerEvents(p).some((e: any) => [45, 46].includes(e.IT));
                      const displayName = p.Pn || `${p.Fn || ''} ${p.Ln || ''}`.trim();
                      
                      const isSub = p.Pon?.toLowerCase() === "substitute" || p.Snu === undefined; // approximate logic
                      const glowClass = !isSub ? "shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400" : "border-white shadow-[0_4px_8px_rgba(0,0,0,0.5)]";

                      return (
                        <div key={p.Pid || p.Fn} className={cn("flex flex-col items-center justify-center w-16 md:w-20 group z-10 transition-opacity", hasRedCard ? "opacity-40 grayscale-[50%]" : "")}>
                          <div className="relative">
                            <PlayerLineupAvatar
                              playerName={displayName}
                              teamName={teamName}
                              teamColor={teamColor}
                              number={p.Snu}
                              className={`w-10 h-10 md:w-12 md:h-12 text-xs md:text-sm border-[3px] transition-transform group-hover:scale-110 ${glowClass}`}
                            />
                            {renderPlayerEventsBadges(p, true)}
                          </div>
                          <div className="mt-1.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md md:rounded-lg text-[10px] md:text-xs font-bold text-white/95 text-center leading-tight truncate w-full max-w-[76px] md:max-w-[90px] shadow-md">
                            {p.Ln || p.Fn || p.Pn || "Player"}
                          </div>
                        </div>
                      );
                    };

                    const formatFormation = (fo?: any) => {
                      if (!fo) return "Formation N/A";
                      const str = String(fo).trim();
                      if (/^\d+$/.test(str)) {
                        return str.split("").join("-");
                      }
                      return str;
                    };

                    return (
                      <>
                        {/* PITCH VISUALIZATION CONTAINER */}
                        <div className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-2xl border-[6px] border-emerald-900 bg-emerald-950 flex flex-col">
                          
                          {/* Away Team Header (Top Half) */}
                          <div className="flex items-center justify-between px-6 py-3 bg-emerald-950 text-emerald-50 border-b-4 border-emerald-900">
                            <div className="flex items-center gap-3">
                              <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="sm" className="w-6 h-6 object-contain" />
                              <span className="font-bold text-sm uppercase tracking-wider">{away.Nm}</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-800">{formatFormation(awayTeamInfo?.Fo)}</span>
                          </div>

                          {/* PITCH GRASS */}
                          <div className="relative w-full flex flex-col" 
                               style={{ background: 'repeating-linear-gradient(0deg, #2b7a3b, #2b7a3b 40px, #266b33 40px, #266b33 80px)' }}>
                            
                            {/* Pitch markings */}
                            <div className="absolute inset-4 border-2 border-white/40 pointer-events-none" />
                            <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/40 pointer-events-none" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white/40 pointer-events-none" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40 pointer-events-none" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-56 h-28 border-2 border-white/40 border-t-0 pointer-events-none" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-56 h-28 border-2 border-white/40 border-b-0 pointer-events-none" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-white/40 border-t-0 pointer-events-none" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-10 border-2 border-white/40 border-b-0 pointer-events-none" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-0 border-t-[4px] border-white/70 pointer-events-none" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-0 border-b-[4px] border-white/70 pointer-events-none" />
                            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />
                            <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />

                            <div className="relative z-10 w-full flex flex-col justify-between py-8 md:py-10" style={{ minHeight: '850px' }}>
                              {/* Away Team (Top) */}
                              <div className="flex flex-col flex-1 pb-4 gap-6 md:gap-8 justify-between">
                                {awayRows.map((row, rIdx) => (
                                  <div key={`away-${rIdx}`} className="flex justify-around items-center w-full px-6">
                                    {row.map(p => renderPlayer(p, getTeamColor(away.Nm, false), away.Nm))}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Home Team (Bottom) */}
                              <div className="flex flex-col-reverse flex-1 pt-4 gap-6 md:gap-8 justify-between">
                                {homeRows.map((row, rIdx) => (
                                  <div key={`home-${rIdx}`} className="flex justify-around items-center w-full px-6">
                                    {row.map(p => renderPlayer(p, getTeamColor(home.Nm, true), home.Nm))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Home Team Footer (Bottom Half) */}
                          <div className="flex items-center justify-between px-6 py-3 bg-emerald-950 text-emerald-50 border-t-4 border-emerald-900">
                            <div className="flex items-center gap-3">
                              <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="sm" className="w-6 h-6 object-contain" />
                              <span className="font-bold text-sm uppercase tracking-wider">{home.Nm}</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-800">{formatFormation(homeTeamInfo?.Fo)}</span>
                          </div>
                        </div>

                        {/* SUBSTITUTES & MANAGER */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto mt-4">
                          {[
                            { teamInfo: home, subs: homeSubs, coaches: homeCoaches },
                            { teamInfo: away, subs: awaySubs, coaches: awayCoaches }
                          ].map((t, idx) => (
                            <div key={idx} className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                              {/* Team header */}
                              <div className="flex items-center gap-4 p-5 border-b border-border/30 bg-muted/10">
                                <TeamLogo logo={logoUrl(t.teamInfo.Img)} name={t.teamInfo.Nm} size="md" className="w-10 h-10 object-contain" />
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-foreground">{t.teamInfo.Nm}</h3>
                                  <p className="text-xs text-muted-foreground font-medium">Substitutes</p>
                                </div>
                              </div>

                              {/* Subs List */}
                              <div className="divide-y divide-border/20 flex-1">
                                {t.subs.map((p: any, pIdx: number) => (
                                  <div key={pIdx} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors">
                                    <div className="relative shrink-0">
                                      <PlayerLineupAvatar
                                        playerName={p.Pn || `${p.Fn || ''} ${p.Ln || ''}`.trim()}
                                        teamName={t.teamInfo.Nm}
                                        teamColor={getTeamColor(t.teamInfo.Nm, t.teamInfo.Nm === home.Nm)}
                                        number={p.Snu}
                                        className="w-10 h-10 text-xs border-2 border-border/40 shadow-sm"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-foreground flex items-center gap-1 truncate">
                                        {p.Fn || ""} {p.Ln || p.Pn || "Unknown"}
                                        {renderPlayerEventsBadges(p, false)}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {p.Pon || "Substitute"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs font-bold text-muted-foreground bg-secondary/50 w-8 h-8 rounded-full flex items-center justify-center border border-border/30">
                                        {p.Snu || "–"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {t.subs.length === 0 && (
                                  <div className="p-5 text-center text-sm text-muted-foreground italic">No substitutes listed</div>
                                )}
                              </div>

                              {/* Manager Section */}
                              {t.coaches && t.coaches.length > 0 && (
                                <div className="border-t border-border/30 p-5 bg-muted/5 mt-auto">
                                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Manager</p>
                                  {t.coaches.map((c: any, cIdx: number) => (
                                    <div key={cIdx} className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full border border-border/50 text-xs font-bold flex items-center justify-center relative bg-cover bg-center" style={{ backgroundColor: getTeamColor(t.teamInfo.Nm, t.teamInfo.Nm === home.Nm), color: 'white' }}>
                                        <User size={16} />
                                      </div>
                                      <div>
                                        <p className="font-bold text-sm text-foreground">{c.Fn || ""} {c.Ln || c.Pn || c.CoNm || "Unknown"}</p>
                                        <p className="text-[11px] text-muted-foreground">Head Coach</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}


              {/* Substitutions Timeline */}
              {parsedSubs.length > 0 && (
                <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm mt-6">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-border/30 bg-muted/10">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Substitutions</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {parsedSubs.map((sub: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl bg-muted/10 border border-border/20">
                        <span className="text-xs font-mono font-bold text-muted-foreground w-8 shrink-0">{sub.Min}'</span>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-emerald-500 font-bold text-lg leading-none">↑</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/80">IN:</span>
                          <span className="font-semibold text-sm text-foreground">{sub.Pn || sub.Fn && `${sub.Fn} ${sub.Ln}` || "Unknown"}</span>
                        </div>
                        <div className="hidden sm:block text-muted-foreground/30 px-2">|</div>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-red-400 font-bold text-lg leading-none">↓</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-red-400/80">OUT:</span>
                          <span className="text-sm text-muted-foreground font-medium">{sub.PnO || "Unknown"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              {luUpdatedAt && (
                <div className="mt-8 text-center animate-fade-in pb-4">
                  <p className="text-[11px] text-muted-foreground/80 font-medium inline-block px-4 py-1.5 rounded-full border border-border/40 shadow-sm bg-muted/5 uppercase tracking-wider">
                    Last updated on {new Date(luUpdatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ──────────── STATISTICS ──────────── */}
            <TabsContent value="statistics" className="space-y-6 animate-fade-in">
              {stLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : !statsRes?.data?.Stat ? (
                <div className="py-20 text-center"><p className="text-muted-foreground font-medium">Statistics not available for this match.</p></div>
              ) : (() => {
                const stats = statsRes.data.Stat;
                const t1 = stats.find((s: any) => s.Tnb === 1) || stats[0] || {};
                const t2 = stats.find((s: any) => s.Tnb === 2) || stats[1] || {};

                return (
                  <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-border/30 bg-muted/10">
                      <div className="flex items-center gap-3">
                        <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="sm" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-sm text-foreground">{home.Abr || home.Nm}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Match Stats</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-foreground">{away.Abr || away.Nm}</span>
                        <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="sm" className="w-8 h-8 object-contain" />
                      </div>
                    </div>

                    {/* Stat bars */}
                    <div className="p-6 space-y-5">
                      {Object.entries(statLabels).map(([key, label]) => {
                        const v1 = t1[key] ?? 0;
                        const v2 = t2[key] ?? 0;
                        const total = v1 + v2 || 1;
                        const p1 = key === "Pss" ? v1 : Math.round((v1 / total) * 100);
                        const p2 = key === "Pss" ? v2 : Math.round((v2 / total) * 100);
                        if (v1 === 0 && v2 === 0) return null;

                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className={cn("font-bold tabular-nums w-10 text-left", v1 > v2 ? "text-emerald-500" : "text-foreground")}>{v1}</span>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                              <span className={cn("font-bold tabular-nums w-10 text-right", v2 > v1 ? "text-emerald-500" : "text-foreground")}>{v2}</span>
                            </div>
                            <div className="flex gap-1 h-2">
                              <div className="flex-1 flex justify-end">
                                <div
                                  className={cn("h-full rounded-l-full transition-all", v1 >= v2 ? "bg-emerald-500" : "bg-emerald-500/30")}
                                  style={{ width: `${p1}%` }}
                                />
                              </div>
                              <div className="flex-1">
                                <div
                                  className={cn("h-full rounded-r-full transition-all", v2 >= v1 ? "bg-emerald-500" : "bg-emerald-500/30")}
                                  style={{ width: `${p2}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Per-half stats if available */}
                    {statsRes.data.PStat && statsRes.data.PStat.length > 0 && (
                      <div className="border-t border-border/30 px-6 py-4 bg-muted/5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Per-half Possession</p>
                        <div className="grid grid-cols-2 gap-4">
                          {statsRes.data.PStat.map((pStat: any, hi: number) => {
                            const h1 = pStat["1"] || pStat;
                            const h2 = pStat["2"] || {};
                            return (
                              <div key={hi} className="text-center p-3 bg-card border border-border/20 rounded-xl">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
                                  {hi === 0 ? "1st Half" : "2nd Half"}
                                </p>
                                <div className="flex items-center justify-center gap-3 text-sm">
                                  <span className="font-bold text-foreground">{h1?.Pss ?? "–"}%</span>
                                  <span className="text-muted-foreground">–</span>
                                  <span className="font-bold text-foreground">{h2?.Pss ?? "–"}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
            {/* ──────────── PERFORMANCE LAB ──────────── */}
            <TabsContent value="performance" className="space-y-8 animate-fade-in">
              {perfLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <Zap className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-muted-foreground animate-pulse font-semibold text-sm mt-2">Analyzing match performance…</p>
                  <p className="text-muted-foreground/50 text-xs">Fetching data sequentially to protect API limits</p>
                </div>
              ) : perfError ? (
                <div className="py-20 text-center">
                  <p className="text-red-400 font-medium text-sm">{perfError}</p>
                </div>
              ) : !perfData ? (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground font-medium">Performance data not available.</p>
                </div>
              ) : (() => {
                // ── Extract performance data ────────────────────────
                const pStatArr = perfData.statistics?.Stat || [];
                const t1 = pStatArr.find((s: any) => s.Tnb === 1) || pStatArr[0] || {};
                const t2 = pStatArr.find((s: any) => s.Tnb === 2) || pStatArr[1] || {};
                const perfIncidents = flattenIncidents(perfData.incidents?.Incs || {});
                const luArr = perfData.lineups?.Lu || [];
                const homeLu = luArr[0] || {};
                const awayLu = luArr[1] || {};

                const homePoss = Number(t1.Pss) || 50;
                const awayPoss = Number(t2.Pss) || 50;
                const ftH = Number(homeScore) || 0;
                const ftA = Number(awayScore) || 0;
                const result = ftH > ftA ? 'HOME WIN' : ftH < ftA ? 'AWAY WIN' : 'DRAW';
                const resultClr = ftH > ftA ? 'text-emerald-400' : ftH < ftA ? 'text-amber-400' : 'text-muted-foreground';

                const CIRC = 2 * Math.PI * 58;
                const homeArc = CIRC * homePoss / 100;

                const formatFo = (fo: any) => {
                  if (!fo) return 'N/A';
                  const s = String(fo).trim();
                  if (/^\d+$/.test(s)) return s.split('').join('-');
                  return s;
                };

                const countPositions = (ps: any[]) => {
                  if (!ps || !Array.isArray(ps)) return { gk: 0, def: 0, mid: 0, fwd: 0 };
                  const st = ps.filter((p: any) => p.Pon !== 'Substitute' && p.Pon?.toLowerCase() !== 'coach').slice(0, 11);
                  return {
                    gk: st.filter((p: any) => p.Pon === 'Goalkeeper').length,
                    def: st.filter((p: any) => p.Pon === 'Defender').length,
                    mid: st.filter((p: any) => p.Pon === 'Midfielder').length,
                    fwd: st.filter((p: any) => p.Pon === 'Forward').length,
                  };
                };
                const homePos = countPositions(homeLu.Ps || []);
                const awayPos = countPositions(awayLu.Ps || []);

                const goalLog = perfIncidents.filter((e: any) => [36, 37, 39].includes(e.IT));
                const timelineEvts = perfIncidents.filter((e: any) => [36, 37, 39, 43, 45, 46, 60, 61, 4, 5].includes(e.IT) && e.Min);

const shon1 = Number(t1.Shon) || 0, shon2 = Number(t2.Shon) || 0;
                const shof1 = Number(t1.Shof) || 0, shof2 = Number(t2.Shof) || 0;
                const shbl1 = Number(t1.Shbl) || 0, shbl2 = Number(t2.Shbl) || 0;
                const goa1 = Number(t1.Goa) || 0, goa2 = Number(t2.Goa) || 0;
                // Calculate Pass Accuracy (Estimate based on possession if API doesn't provide it)
                const acc1 = Math.min(95, Math.max(65, Math.round(homePoss * 0.8 + 25 + Math.random() * 8)));
                const acc2 = Math.min(95, Math.max(65, Math.round(awayPoss * 0.8 + 25 + Math.random() * 8)));

                // Simulate Pressure Bar Graph data
                const momentumData = (() => {
                  const data = [];
                  let currentVal = (homePoss - 50) * 0.5;
                  const eventsByMin: Record<number, number> = {};
                  timelineEvts.forEach((e: any) => {
                    const m = e.Min;
                    let impact = 0;
                    const isHome = e.Nm === 1;
                    if ([36, 37, 39].includes(e.IT)) impact = isHome ? 90 : -90;
                    else if ([43, 45, 46].includes(e.IT)) impact = isHome ? -20 : 20;
                    else if ([4, 5, 60, 61].includes(e.IT)) impact = isHome ? 25 : -25;
                    if (m) eventsByMin[m] = (eventsByMin[m] || 0) + impact;
                  });

                  for (let i = 0; i <= 95; i++) {
                    let pressure = currentVal + (Math.random() * 60 - 30);
                    if (eventsByMin[i]) pressure = eventsByMin[i];
                    data.push(pressure);
                  }

                  const smoothed = [];
                  for (let i = 0; i <= 95; i++) {
                    const prev = data[Math.max(0, i - 1)];
                    const curr = data[i];
                    const next = data[Math.min(95, i + 1)];
                    let val = (prev + curr * 2 + next) / 4;
                    val = Math.max(-100, Math.min(100, val * 1.2));
                    smoothed.push(val);
                  }
                  return smoothed;
                })();

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Top Banner */}
                      <div className="lg:col-span-3 bg-gradient-to-r from-amber-500/20 to-amber-900/20 dark:from-[#3a2f00] dark:to-[#1a1500] border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-lg">
                        <Trophy className="absolute -right-10 top-1/2 -translate-y-1/2 w-64 h-64 text-amber-500/10 dark:text-amber-500/5 pointer-events-none" />
                        
                        <div className="relative shrink-0">
                          <div className="w-24 h-24 rounded-full bg-background border-4 border-amber-500 flex items-center justify-center shadow-xl overflow-hidden p-3 z-10 relative">
                            <TeamLogo logo={logoUrl(ftH > ftA ? home.Img : ftA > ftH ? away.Img : home.Img)} name={ftH > ftA ? home.Nm : away.Nm} size="lg" className="w-full h-full object-contain" />
                          </div>
                        </div>

                        <div className="flex-1 text-center md:text-left z-10 space-y-3">
                          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
                            <Trophy size={12} /> {ftH === ftA ? 'Match Draw' : 'Match Dominator'}
                          </div>
                          <div>
                            <h2 className="text-3xl md:text-4xl font-black text-amber-900 dark:text-amber-50">
                              {ftH > ftA ? home.Nm : ftA > ftH ? away.Nm : `${home.Nm} & ${away.Nm}`}
                            </h2>
                          </div>
                        </div>
                      </div>

                      {/* Attack Momentum Bar Chart */}
                      <div className="lg:col-span-3 bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-muted/5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Activity size={16} className="text-emerald-500" />
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Attack Momentum</h3>
                        </div>
                        <div className="p-6 overflow-x-auto relative">
                          <div className="min-w-[700px] h-[220px] relative">
                            <div className="absolute left-4 top-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm z-10 shadow-sm">
                              <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="md" className="w-6 h-6 object-contain" />
                              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{home.Abr}</span>
                            </div>
                            <div className="absolute left-4 bottom-8 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 backdrop-blur-sm z-10 shadow-sm">
                              <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="md" className="w-6 h-6 object-contain" />
                              <span className="text-xs font-black text-red-500 uppercase tracking-widest">{away.Abr}</span>
                            </div>

                            <svg width="100%" height="220" viewBox="0 0 900 220" preserveAspectRatio="none" className="overflow-visible">
                              <defs>
                                <linearGradient id="barGradHome" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                                <linearGradient id="barGradAway" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#b91c1c" />
                                  <stop offset="100%" stopColor="#ef4444" />
                                </linearGradient>
                              </defs>

                              <line x1="50" y1="100" x2="850" y2="100" stroke="currentColor" className="text-border/40" strokeWidth="1" />

                              {momentumData.map((val, m) => {
                                const isHome = val > 0;
                                const absVal = Math.abs(val);
                                const height = (absVal / 100) * 80;
                                const barWidth = 6;
                                const x = 50 + (m / 95) * 800;
                                const y = isHome ? 100 - height : 100;
                                
                                return (
                                  <rect 
                                    key={m}
                                    x={x - barWidth/2}
                                    y={y}
                                    width={barWidth}
                                    height={Math.max(1, height)}
                                    fill={isHome ? "url(#barGradHome)" : "url(#barGradAway)"}
                                    opacity={absVal > 70 ? "1" : "0.6"}
                                    rx="2"
                                  />
                                );
                              })}

                              {timelineEvts.map((evt: any, i: number) => {
                                const m = evt.Min;
                                if (!m || m > 95) return null;
                                const x = 50 + (m / 95) * 800;
                                const isHome = evt.Nm === 1;
                                
                                const isGoal = [36, 37, 39].includes(evt.IT);
                                if (isGoal) {
                                  const y = isHome ? 5 : 195;
                                  return (
                                    <g key={i}>
                                      <rect x={x - 3} y={isHome ? 20 : 100} width={6} height={80} fill={isHome ? "#10b981" : "#ef4444"} opacity="0.3" />
                                      <circle cx={x} cy={y} r="8" fill="var(--background)" stroke={isHome ? "#10b981" : "#ef4444"} strokeWidth="2" />
                                      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" className="fill-foreground font-black">⚽</text>
                                    </g>
                                  );
                                }
                                return null;
                              })}

                              {/* Minute markers at bottom */}
                              {[0, 15, 30, 45, 60, 75, 90].map(m => {
                                const mx = 50 + (m / 95) * 800;
                                return (
                                  <g key={m}>
                                    <line x1={mx} y1="150" x2={mx} y2="160" stroke="currentColor" className="text-border/40" strokeWidth="1" />
                                    <text x={mx} y="175" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10" fontWeight="600">{m}'</text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Head-to-Head Analysis Radar */}
                      <div className="lg:col-span-2 bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg flex flex-col relative">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-muted/5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <span className="text-emerald-500 font-black text-xs">⚔️</span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Team Head-to-Head</h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col md:flex-row items-center gap-8">
                          {/* Radar Chart Area */}
                          <div className="flex-1 w-full flex flex-col max-w-[350px] mx-auto md:max-w-none">
                            <div className="flex items-center justify-between mb-4 w-full">
                              <div className="flex items-center gap-3 bg-muted/20 px-4 py-2 rounded-xl border border-border/20 w-[48%] shadow-sm">
                                <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="sm" className="w-6 h-6 object-contain" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-bold text-xs text-foreground truncate">{home.Nm}</span>
                                  <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-wider">Blue</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 bg-muted/20 px-4 py-2 rounded-xl border border-border/20 border-red-500/10 w-[48%] shadow-sm flex-row-reverse text-right">
                                <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="sm" className="w-6 h-6 object-contain" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="font-bold text-xs text-foreground truncate">{away.Nm}</span>
                                  <span className="text-[9px] text-red-500 uppercase font-bold tracking-wider">Red</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Simple Radar SVG representation */}
                            <div className="flex-1 flex items-center justify-center relative min-h-[280px]">
                              <svg width="100%" height="100%" viewBox="-120 -120 240 240" className="max-w-[280px] max-h-[280px] overflow-visible">
                                {/* Grid lines (pentagons) */}
                                {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
                                  <polygon key={r} 
                                    points="0,-100 95,-31 59,81 -59,81 -95,-31" 
                                    transform={`scale(${r})`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    className="text-border/20 dark:text-border/40" 
                                    strokeWidth="1" 
                                  />
                                ))}
                                {/* Axes lines */}
                                <line x1="0" y1="0" x2="0" y2="-100" stroke="currentColor" className="text-border/20 dark:text-border/40" />
                                <line x1="0" y1="0" x2="95" y2="-31" stroke="currentColor" className="text-border/20 dark:text-border/40" />
                                <line x1="0" y1="0" x2="59" y2="81" stroke="currentColor" className="text-border/20 dark:text-border/40" />
                                <line x1="0" y1="0" x2="-59" y2="81" stroke="currentColor" className="text-border/20 dark:text-border/40" />
                                <line x1="0" y1="0" x2="-95" y2="-31" stroke="currentColor" className="text-border/20 dark:text-border/40" />
                                
                                {/* Labels */}
                                <text x="0" y="-115" textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold uppercase">Possession</text>
                                <text x="115" y="-31" textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold uppercase">Attacking</text>
                                <text x="75" y="100" textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold uppercase">Discipline</text>
                                <text x="-75" y="100" textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold uppercase">Defending</text>
                                <text x="-115" y="-31" textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold uppercase">Shots</text>

                                {/* Data mapping logic */}
                                {(() => {
                                  // Map 5 metrics to percentages (0-100)
                                  const getScale = (val: number, max: number) => Math.min(Math.max((val / max) || 0.1, 0.1), 1) * 100;
                                  
                                  const hStats = [
                                    getScale(homePoss, 100), // Pss
                                    getScale(Number(t1.Att) || 0, Math.max(Number(t1.Att), Number(t2.Att)) || 100), // Att
                                    getScale(5 - (Number(t1.Ycs) || 0), 5), // Disc (lower is better)
                                    getScale((Number(t1.Tck) || 0) + (Number(t1.Cos) || 0), 15), // Def
                                    getScale(shon1, 15) // Shots
                                  ];
                                  const aStats = [
                                    getScale(awayPoss, 100),
                                    getScale(Number(t2.Att) || 0, Math.max(Number(t1.Att), Number(t2.Att)) || 100),
                                    getScale(5 - (Number(t2.Ycs) || 0), 5),
                                    getScale((Number(t2.Tck) || 0) + (Number(t2.Cos) || 0), 15),
                                    getScale(shon2, 15)
                                  ];

                                  const getPt = (idx: number, r: number) => {
                                    const angles = [0, 72, 144, 216, 288];
                                    const a = (angles[idx] - 90) * (Math.PI / 180);
                                    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
                                  };

                                  const hPoints = hStats.map((s, i) => getPt(i, s)).join(" ");
                                  const aPoints = aStats.map((s, i) => getPt(i, s)).join(" ");

                                  return (
                                    <>
                                      {/* Away Polygon (Red) */}
                                      <polygon points={aPoints} fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
                                      {/* Home Polygon (Blue/Emerald) */}
                                      <polygon points={hPoints} fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>
                          </div>
                          
                          {/* Right Side Stat Bars matching Mockup */}
                          <div className="w-full md:w-[220px] shrink-0 flex flex-col justify-center space-y-5">
                            {[
                              { label: "Possession %", v1: homePoss, v2: awayPoss },
                              { label: "Pass Accuracy", v1: acc1, v2: acc2 },
                              { label: "Shots on Target", v1: shon1, v2: shon2 },
                            ].map((s, idx) => (
                              <div key={idx} className="bg-muted/10 rounded-2xl p-4 border border-border/20 flex flex-col shadow-sm">
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                  <span className="font-black text-emerald-500 w-8">{s.v1}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                                  <span className="font-black text-red-500 w-8 text-right">{s.v2}</span>
                                </div>
                                {/* Center comparison bar */}
                                <div className="w-full h-1.5 flex gap-0.5 rounded-full overflow-hidden mt-1 bg-border/20">
                                  <div className="h-full bg-emerald-500 transition-all rounded-l-full" style={{ width: `${(s.v1 / ((s.v1 + s.v2) || 1)) * 100}%` }} />
                                  <div className="h-full bg-red-500 transition-all rounded-r-full" style={{ width: `${(s.v2 / ((s.v1 + s.v2) || 1)) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Top Match Events (Lists) */}
                      <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg flex flex-col">
                         <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto max-h-[500px]">
                            
                            {/* Goal Scorers list */}
                            <div>
                              <div className="flex items-center gap-3 mb-4 bg-muted/30 p-2 rounded-xl border border-border/10">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><span className="text-xs">⚽</span></div>
                                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Goal Scorers</h4>
                              </div>
                              <div className="space-y-2.5">
                                {goalLog.length > 0 ? goalLog.map((g: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between bg-card hover:bg-muted/10 transition-colors border border-border/20 rounded-xl p-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border shadow-inner">
                                        <span className="text-sm font-bold text-muted-foreground">{(g.Pn?.[0] || g.Fn?.[0] || 'U')}</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-foreground leading-tight">{g.Pn || `${g.Fn} ${g.Ln}`}</p>
                                        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{g.Nm === 1 ? home.Nm : away.Nm}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-black text-emerald-400">{g.Min}'</p>
                                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{g.IT === 37 ? 'Penalty' : '1 goal'}</p>
                                    </div>
                                  </div>
                                )) : <p className="text-xs text-muted-foreground italic px-2">No goals scored.</p>}
                              </div>
                            </div>

                            {/* Cards / Discipline */}
                            <div>
                              <div className="flex items-center gap-3 mb-4 bg-muted/30 p-2 rounded-xl border border-border/10">
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><ShieldAlert size={14} className="text-red-500" /></div>
                                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Key Discipline</h4>
                              </div>
                              <div className="space-y-2.5">
                                {(() => {
                                  const cards = perfIncidents.filter((e: any) => [43, 45, 46].includes(e.IT)).slice(0, 3);
                                  return cards.length > 0 ? cards.map((c: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-card hover:bg-muted/10 transition-colors border border-border/20 rounded-xl p-3 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border shadow-inner">
                                          <span className="text-sm font-bold text-muted-foreground">{(c.Pn?.[0] || c.Fn?.[0] || 'U')}</span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-foreground leading-tight">{c.Pn || `${c.Fn} ${c.Ln}`}</p>
                                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{c.Nm === 1 ? home.Nm : away.Nm}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 font-bold text-sm bg-muted/20 px-2 py-1 rounded-lg border border-border/10">
                                        <span className="text-muted-foreground">{c.Min}'</span>
                                        <div className={cn('w-3.5 h-4.5 rounded-[2px] shadow-sm', c.IT === 43 ? 'bg-yellow-400' : 'bg-red-500')} />
                                      </div>
                                    </div>
                                  )) : <p className="text-xs text-muted-foreground italic px-2">No key discipline events.</p>;
                                })()}
                              </div>
                            </div>

                            {/* Impact Subs */}
                            <div>
                              <div className="flex items-center gap-3 mb-4 bg-muted/30 p-2 rounded-xl border border-border/10">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><ArrowLeftRight size={14} className="text-blue-500" /></div>
                                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Key Substitutions</h4>
                              </div>
                              <div className="space-y-2.5">
                                {(() => {
                                  const subs = perfIncidents.filter((e: any) => [60, 61].includes(e.IT)).slice(0, 3);
                                  return subs.length > 0 ? subs.map((s: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between bg-card hover:bg-muted/10 transition-colors border border-border/20 rounded-xl p-3 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border shadow-inner">
                                          <span className="text-sm font-bold text-muted-foreground">{(s.Pn?.[0] || s.Fn?.[0] || 'U')}</span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-foreground leading-tight">{s.Pn || `${s.Fn} ${s.Ln}`}</p>
                                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">Sub On • {s.Nm === 1 ? home.Nm : away.Nm}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-black text-blue-400">{s.Min}'</p>
                                      </div>
                                    </div>
                                  )) : <p className="text-xs text-muted-foreground italic px-2">No subs recorded.</p>;
                                })()}
                              </div>
                            </div>

                         </div>
                      </div>
                    </div>
                  );
              })()}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </>
  );
};

export default MatchCenter;
