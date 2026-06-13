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
  "portugal": "#7f1d1d",
  "mexico": "#14532d",
  "south africa": "#eab308",
  "england": "#1e3a8a",
  "brazil": "#eab308",
  "argentina": "#38bdf8",
  "france": "#1d4ed8",
  "germany": "#000000",
  "spain": "#dc2626",
  "italy": "#1e3a8a",
  "netherlands": "#f97316",
  "belgium": "#dc2626",
  "croatia": "#dc2626",
  "uruguay": "#38bdf8",
  "usa": "#1e3a8a",
  "colombia": "#eab308",
  "chile": "#dc2626",
  "sweden": "#eab308",
  "poland": "#dc2626",
  "senegal": "#14532d",
  "morocco": "#dc2626",
  "japan": "#1d4ed8",
  "south korea": "#dc2626",
  "canada": "#dc2626"
};

const getTeamColor = (teamName: string, isHome: boolean) => {
  if (!teamName) return isHome ? "#081a3d" : "#474b54";
  const color = TEAM_COLORS[teamName.toLowerCase()];
  return color || (isHome ? "#081a3d" : "#474b54");
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
  const { data: lineupsRes, isLoading: luLoading } =
    useLivescoreMatchDetail("get-lineups", id || "", !!id);
  const { data: statsRes, isLoading: stLoading } =
    useLivescoreMatchDetail("get-statistics", id || "", activeTab === "statistics");

  const allIncidents = useMemo(() => {
    const incs = flattenIncidents(incidentsRes?.data?.Incs || scoreboardRes?.data?.["Incs-s"]);
    
    // Explicitly add substitutions from lineups to ensure they appear in Key Events
    const subsArray = Array.isArray(lineupsRes?.data?.Subs) ? lineupsRes.data.Subs : [];
    subsArray.forEach((sub: any) => {
      let teamNm = 1;
      const homePl = lineupsRes?.data?.T1?.[0]?.Pl || [];
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

    incs.sort((a, b) => (a.Min || 0) - (b.Min || 0));
    return incs;
  }, [incidentsRes?.data, scoreboardRes?.data, lineupsRes?.data]);

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

                    const extractLineups = (players: any[]) => {
                      const validPlayers = players.filter(p => !isCoach(p));
                      const startingXI = [];
                      const subs = [];
                      
                      // First 11 players are starters, the rest are substitutes (unless explicitly marked)
                      let startersCount = 0;
                      for (const p of validPlayers) {
                        if (p.Pon?.toLowerCase() === "substitute" || startersCount >= 11) {
                          subs.push(p);
                        } else {
                          startingXI.push(p);
                          startersCount++;
                        }
                      }
                      
                      return {
                        startingRows: [
                          startingXI.filter(p => p.Pon === "Goalkeeper"),
                          startingXI.filter(p => p.Pon === "Defender"),
                          startingXI.filter(p => p.Pon === "Midfielder"),
                          startingXI.filter(p => p.Pon === "Forward")
                        ],
                        subs
                      };
                    };

                    const homeData = extractLineups(homePlayers);
                    const awayData = extractLineups(awayPlayers);
                    
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
                      const evts = allIncidents.filter((e: any) => 
                        (e.Pn === p.Pn || e.Pn === p.Ln || e.Ln === p.Ln || (e.Fn === p.Fn && e.Ln === p.Ln) || e.Pn === `${p.Fn} ${p.Ln}`) && 
                        [36, 37, 39, 43, 45, 46, 63].includes(e.IT)
                      );
                      
                      const subsArray = Array.isArray(lineupsRes?.data?.Subs) ? lineupsRes.data.Subs : [];
                      
                      const isSubIn = subsArray.find(s => s.Pn === p.Pn || s.Pn === p.Ln || s.Ln === p.Ln || (s.Fn === p.Fn && s.Ln === p.Ln) || s.Pn === `${p.Fn} ${p.Ln}`);
                      if (isSubIn) evts.push({ IT: 5, Min: isSubIn.Min });

                      const isSubOut = subsArray.find(s => s.PnO === p.Pn || s.PnO === p.Ln || s.PnO === `${p.Fn} ${p.Ln}` || s.PnO === p.Fn);
                      if (isSubOut) evts.push({ IT: 4, Min: isSubOut.Min });

                      return evts;
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
                      return (
                        <div key={p.Pid || p.Fn} className={cn("flex flex-col items-center justify-center w-16 md:w-20 group z-10 transition-opacity", hasRedCard ? "opacity-40 grayscale-[50%]" : "")}>
                          <div className="relative">
                            <PlayerLineupAvatar
                              playerName={displayName}
                              teamName={teamName}
                              teamColor={teamColor}
                              number={p.Snu}
                              className="w-10 h-10 md:w-12 md:h-12 text-xs md:text-sm border-[3px] border-white shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110"
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


              {/* Substitutions */}
              {lineupsRes?.data?.Subs && (
                <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm mt-6">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-border/30 bg-muted/10">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Substitutions</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {(Array.isArray(lineupsRes.data.Subs) ? lineupsRes.data.Subs : []).map((sub: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/10 border border-border/20">
                        <span className="text-xs font-mono font-bold text-muted-foreground w-10 text-center">{sub.Min}'</span>
                        <span className="text-emerald-500">↑</span>
                        <span className="font-semibold text-sm text-foreground">{sub.Pn || `${sub.Fn} ${sub.Ln}`}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="text-red-400">↓</span>
                        <span className="text-sm text-muted-foreground">{sub.PnO || ""}</span>
                      </div>
                    ))}
                  </div>
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
                const acc1 = goa1 > 0 ? Math.round((shon1 / goa1) * 100) : 0;
                const acc2 = goa2 > 0 ? Math.round((shon2 / goa2) * 100) : 0;

                const renderBar = (label: string, v1: number, v2: number) => {
                  const tot = v1 + v2 || 1;
                  const p1 = Math.round((v1 / tot) * 100);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={cn('font-bold tabular-nums w-12 text-left', v1 > v2 ? 'text-emerald-400' : 'text-foreground')}>{v1}</span>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                        <span className={cn('font-bold tabular-nums w-12 text-right', v2 > v1 ? 'text-amber-400' : 'text-foreground')}>{v2}</span>
                      </div>
                      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500/80 rounded-l-full transition-all duration-700 ease-out" style={{ width: `${p1}%`, minWidth: v1 > 0 ? '4px' : '0' }} />
                        <div className="bg-amber-500/80 rounded-r-full transition-all duration-700 ease-out" style={{ width: `${100 - p1}%`, minWidth: v2 > 0 ? '4px' : '0' }} />
                      </div>
                    </div>
                  );
                };

                const minToX = (m: number) => 50 + (Math.min(m, 95) / 90) * 792;

                return (
                  <>
                    {/* ─── SECTION 1: MATCH OVERVIEW ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-base">📊</span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Overview</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* FT */}
                          <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl p-5 border border-border/20 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Full Time</p>
                            <div className="flex items-center justify-center gap-4">
                              <div className="flex items-center gap-2">
                                <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="sm" className="w-6 h-6 object-contain" />
                                <span className="text-3xl font-black text-foreground">{ftH}</span>
                              </div>
                              <span className="text-lg text-border font-light">–</span>
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-foreground">{ftA}</span>
                                <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="sm" className="w-6 h-6 object-contain" />
                              </div>
                            </div>
                          </div>
                          {/* HT */}
                          <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl p-5 border border-border/20 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Half Time</p>
                            <div className="flex items-center justify-center gap-4">
                              <span className="text-2xl font-black text-foreground/70">{htHome ?? '–'}</span>
                              <span className="text-lg text-border font-light">–</span>
                              <span className="text-2xl font-black text-foreground/70">{htAway ?? '–'}</span>
                            </div>
                          </div>
                          {/* Result */}
                          <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl p-5 border border-border/20 flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Result</p>
                            <span className={cn('text-lg font-black uppercase tracking-wider', resultClr)}>{result}</span>
                          </div>
                        </div>
                        {/* Meta */}
                        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {venue && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 rounded-xl px-3 py-2.5 border border-border/10">
                              <MapPin size={13} className="text-emerald-500/60 shrink-0" />
                              <span className="truncate">{venue}</span>
                            </div>
                          )}
                          {referee && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 rounded-xl px-3 py-2.5 border border-border/10">
                              <ShieldAlert size={13} className="text-emerald-500/60 shrink-0" />
                              <span className="truncate">{referee}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 rounded-xl px-3 py-2.5 border border-border/10">
                            <Trophy size={13} className="text-emerald-500/60 shrink-0" />
                            <span className="truncate">{stage}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/10 rounded-xl px-3 py-2.5 border border-border/10">
                            <Clock size={13} className="text-emerald-500/60 shrink-0" />
                            <span className="truncate">{matchDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── SECTION 2: MATCH MOMENTUM TIMELINE ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Timer size={16} className="text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Momentum Timeline</h3>
                      </div>
                      <div className="p-6 overflow-x-auto">
                        <div className="min-w-[600px]">
                          <svg width="100%" height="120" viewBox="0 0 900 120" preserveAspectRatio="xMidYMid meet">
                            {/* Minute markers */}
                            {[0, 15, 30, 45, 60, 75, 90].map(m => {
                              const mx = minToX(m);
                              return (
                                <g key={m}>
                                  <line x1={mx} y1={52} x2={mx} y2={68} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                  <text x={mx} y={110} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="600">{m}'</text>
                                </g>
                              );
                            })}
                            {/* Main bar */}
                            <rect x="50" y="54" width="792" height="12" rx="6" fill="rgba(255,255,255,0.06)" />
                            {/* HT marker */}
                            <line x1={minToX(45)} y1={42} x2={minToX(45)} y2={78} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x={minToX(45)} y={38} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700">HT</text>
                            {/* Events */}
                            {timelineEvts.map((evt: any, i: number) => {
                              const x = minToX(evt.Min);
                              const isGoal = [36, 37, 39].includes(evt.IT);
                              const isCard = [43, 45, 46].includes(evt.IT);
                              const isSub = [4, 5, 60, 61].includes(evt.IT);
                              const isT1 = evt.Nm === 1;
                              const y = isT1 ? 32 : 88;
                              if (isGoal) {
                                return (
                                  <g key={i}>
                                    <line x1={x} y1={54} x2={x} y2={y + (isT1 ? 10 : -10)} stroke={isT1 ? '#10b981' : '#f59e0b'} strokeWidth="1.5" opacity="0.5" />
                                    <text x={x} y={y + (isT1 ? 0 : 5)} textAnchor="middle" fontSize="14">⚽</text>
                                  </g>
                                );
                              }
                              if (isCard) {
                                const cc = evt.IT === 43 ? '#facc15' : '#ef4444';
                                return (
                                  <g key={i}>
                                    <line x1={x} y1={54} x2={x} y2={y + (isT1 ? 12 : -6)} stroke={cc} strokeWidth="1" opacity="0.4" />
                                    <rect x={x - 3.5} y={y} width="7" height="10" rx="1.5" fill={cc} />
                                  </g>
                                );
                              }
                              if (isSub) {
                                return (
                                  <g key={i}>
                                    <circle cx={x} cy={y + (isT1 ? 5 : 0)} r="4.5" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="1.5" />
                                  </g>
                                );
                              }
                              return null;
                            })}
                          </svg>
                          {/* Legend */}
                          <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5"><span>⚽</span> Goal</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-3.5 bg-yellow-400 rounded-[1px] inline-block" /> Yellow</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-3.5 bg-red-500 rounded-[1px] inline-block" /> Red</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-blue-500 inline-block" /> Sub</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> {home.Abr || 'Home'}</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> {away.Abr || 'Away'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── SECTION 3: POSSESSION & ATTACKS ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Activity size={16} className="text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Possession & Attacks</h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                          {/* Donut */}
                          <div className="flex flex-col items-center justify-center">
                            <div className="relative">
                              <svg width="180" height="180" viewBox="0 0 180 180">
                                <circle cx="90" cy="90" r="58" fill="none" stroke="#f59e0b" strokeWidth="16" opacity="0.25" />
                                <circle cx="90" cy="90" r="58" fill="none" stroke="#f59e0b" strokeWidth="16"
                                  strokeDasharray={`${CIRC}`}
                                  transform="rotate(-90 90 90)" />
                                <circle cx="90" cy="90" r="58" fill="none" stroke="#10b981" strokeWidth="16"
                                  strokeDasharray={`${homeArc} ${CIRC - homeArc}`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 90 90)"
                                  style={{ transition: 'stroke-dasharray 1.2s ease-out' }} />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-foreground">{homePoss}%</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">vs {awayPoss}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 mt-4 text-xs font-semibold">
                              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" />{home.Abr || home.Nm}</span>
                              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" />{away.Abr || away.Nm}</span>
                            </div>
                          </div>
                          {/* Metric bars */}
                          <div className="space-y-4">
                            {renderBar('Attacks', Number(t1.Att) || 0, Number(t2.Att) || 0)}
                            {renderBar('Corners', Number(t1.Cos) || 0, Number(t2.Cos) || 0)}
                            {renderBar('Crosses', Number(t1.Crs) || 0, Number(t2.Crs) || 0)}
                            {renderBar('Throw-ins', Number(t1.Ths) || 0, Number(t2.Ths) || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── SECTION 4: SHOOTING ANALYSIS ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-base">🎯</span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Shooting Analysis</h3>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-4">
                          {renderBar('Shots On Target', shon1, shon2)}
                          {renderBar('Shots Off Target', shof1, shof2)}
                          {renderBar('Shots Blocked', shbl1, shbl2)}
                          {renderBar('Goal Attempts', goa1, goa2)}
                          {renderBar('GK Saves', Number(t1.Gks) || 0, Number(t2.Gks) || 0)}
                        </div>
                        {/* Accuracy */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl p-4 border border-emerald-500/10 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{home.Abr} Accuracy</p>
                            <span className="text-3xl font-black text-emerald-400">{acc1}%</span>
                          </div>
                          <div className="bg-gradient-to-bl from-amber-500/10 to-transparent rounded-2xl p-4 border border-amber-500/10 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{away.Abr} Accuracy</p>
                            <span className="text-3xl font-black text-amber-400">{acc2}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── SECTION 5: DISCIPLINE & DUELS ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <ShieldAlert size={16} className="text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Discipline & Duels</h3>
                      </div>
                      <div className="p-6">
                        {/* Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {[
                            { team: home.Abr, color: 'bg-yellow-400', val: Number(t1.Ycs) || 0 },
                            { team: away.Abr, color: 'bg-yellow-400', val: Number(t2.Ycs) || 0 },
                            { team: home.Abr, color: 'bg-red-500', val: Number(t1.Rcs) || 0 },
                            { team: away.Abr, color: 'bg-red-500', val: Number(t2.Rcs) || 0 },
                          ].map((c, ci) => (
                            <div key={ci} className="bg-muted/10 rounded-2xl p-4 border border-border/20 text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <div className={cn('w-4 h-5 rounded-[2px]', c.color)} />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{c.team}</span>
                              </div>
                              <span className="text-2xl font-black text-foreground">{c.val}</span>
                            </div>
                          ))}
                        </div>
                        {/* Fouls & Offsides */}
                        <div className="space-y-4">
                          {renderBar('Fouls', Number(t1.Fls) || 0, Number(t2.Fls) || 0)}
                          {renderBar('Offsides', Number(t1.Ofs) || 0, Number(t2.Ofs) || 0)}
                        </div>
                      </div>
                    </div>

                    {/* ─── SECTION 6: TACTICAL BREAKDOWN ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Users size={16} className="text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Tactical Breakdown</h3>
                      </div>
                      <div className="p-6">
                        {/* Formations */}
                        <div className="flex items-center justify-center gap-6 mb-8">
                          <div className="text-center">
                            <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="sm" className="w-8 h-8 object-contain mx-auto mb-2" />
                            <p className="text-3xl font-black text-emerald-400 tracking-wider">{formatFo(homeLu.Fo)}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{home.Abr}</p>
                          </div>
                          <span className="text-2xl font-light text-border">vs</span>
                          <div className="text-center">
                            <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="sm" className="w-8 h-8 object-contain mx-auto mb-2" />
                            <p className="text-3xl font-black text-amber-400 tracking-wider">{formatFo(awayLu.Fo)}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{away.Abr}</p>
                          </div>
                        </div>
                        {/* Position breakdown */}
                        <div className="grid grid-cols-2 gap-6">
                          {[
                            { label: home.Abr || home.Nm, pos: homePos, ti: 0 },
                            { label: away.Abr || away.Nm, pos: awayPos, ti: 1 }
                          ].map(team => (
                            <div key={team.ti} className="space-y-3">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">{team.label} Starting XI</p>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { k: 'gk', l: 'GK', v: team.pos.gk },
                                  { k: 'def', l: 'DEF', v: team.pos.def },
                                  { k: 'mid', l: 'MID', v: team.pos.mid },
                                  { k: 'fwd', l: 'FWD', v: team.pos.fwd },
                                ].map(p => (
                                  <div key={p.k} className={cn('rounded-xl p-3 text-center border', team.ti === 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10')}>
                                    <span className={cn('text-xl font-black', team.ti === 0 ? 'text-emerald-400' : 'text-amber-400')}>{p.v}</span>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{p.l}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ─── SECTION 7: GOAL & ASSIST LOG ─── */}
                    <div className="bg-card border border-border/30 rounded-3xl overflow-hidden shadow-lg">
                      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/30 bg-gradient-to-r from-emerald-500/5 via-transparent to-amber-500/5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <span className="text-base">⚽</span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Goal & Assist Log</h3>
                      </div>
                      {goalLog.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border/30 bg-muted/5">
                                <th className="text-left px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Min</th>
                                <th className="text-left px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Player</th>
                                <th className="text-left px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                                <th className="text-left px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assist</th>
                                <th className="text-left px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                              {goalLog.map((g: any, gi: number) => {
                                const isT1 = g.Nm === 1;
                                const gType = g.IT === 37 ? 'Penalty' : g.IT === 39 ? 'Own Goal' : 'Goal';
                                const pName = g.Pn || (g.Fn ? `${g.Fn} ${g.Ln}` : 'Unknown');
                                return (
                                  <tr key={gi} className={cn('transition-colors hover:bg-muted/10', isT1 ? 'border-l-2 border-l-emerald-500/50' : 'border-l-2 border-l-amber-500/50')}>
                                    <td className="px-6 py-3">
                                      <span className="font-mono font-black text-emerald-500 text-xs">{g.Min}'</span>
                                    </td>
                                    <td className="px-6 py-3">
                                      <div className="flex items-center gap-2">
                                        <span className={cn('w-2 h-2 rounded-full shrink-0', isT1 ? 'bg-emerald-500' : 'bg-amber-500')} />
                                        <span className="font-semibold text-foreground">{pName}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className={cn('text-xs font-bold uppercase px-2 py-0.5 rounded-full',
                                        gType === 'Penalty' ? 'bg-blue-500/10 text-blue-400' :
                                        gType === 'Own Goal' ? 'bg-red-500/10 text-red-400' :
                                        'bg-emerald-500/10 text-emerald-400'
                                      )}>{gType}</span>
                                    </td>
                                    <td className="px-6 py-3 text-muted-foreground text-xs">{g._assist || '—'}</td>
                                    <td className="px-6 py-3">
                                      {(g.Sc || g._parentSc) ? (
                                        <span className="font-mono font-bold text-xs bg-muted/20 px-2 py-1 rounded-md">
                                          {(g.Sc || g._parentSc)?.[0]} – {(g.Sc || g._parentSc)?.[1]}
                                        </span>
                                      ) : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground italic">No goals recorded in this match.</div>
                      )}
                    </div>
                  </>
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
