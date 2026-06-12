import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/Navbar";
import { TeamLogo } from "../../components/TeamLogo";
import { useLivescoreMatchDetail } from "../../hooks/football/useLivescore6Queries";
import {
  Loader2, ArrowLeft, Clock, MapPin, Activity, ListOrdered,
  Users, MessageSquare, BarChart3, Info, Trophy, ArrowLeftRight,
  CircleDot, ShieldAlert, Timer
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { cn } from "../../lib/utils";
import { Helmet } from "react-helmet-async";

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

// Incident-type to label & icon colour
const incidentMeta: Record<number, { label: string; color: string; icon: string }> = {
  36: { label: "Goal", color: "text-emerald-400", icon: "⚽" },
  37: { label: "Penalty / VAR Goal", color: "text-emerald-400", icon: "⚽" },
  39: { label: "Own Goal", color: "text-red-400", icon: "⚽" },
  43: { label: "Yellow Card", color: "text-yellow-400", icon: "🟡" },
  45: { label: "Red Card", color: "text-red-500", icon: "🔴" },
  46: { label: "Second Yellow / Red", color: "text-red-500", icon: "🔴" },
  4:  { label: "Substituted Off", color: "text-orange-400", icon: "🔄" },
  5:  { label: "Substituted On", color: "text-sky-400", icon: "🔄" },
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
        for (const sub of evt.Incs) {
          result.push({ ...sub, _period: periodKey, _parentSc: evt.Sc });
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
    "summary" | "lineups" | "statistics" | "commentary" | "scoreboard"
  >("summary");

  // ── Data hooks ──────────────────────────────────────────
  const { data: scoreboardRes, isLoading: sbLoading, error: sbError } =
    useLivescoreMatchDetail("get-scoreboard", id || "", !!id);
  const { data: infoRes } =
    useLivescoreMatchDetail("get-info", id || "", !!id);
  const { data: incidentsRes } =
    useLivescoreMatchDetail("get-incidents", id || "", activeTab === "summary" || activeTab === "scoreboard");
  const { data: lineupsRes, isLoading: luLoading } =
    useLivescoreMatchDetail("get-lineups", id || "", activeTab === "lineups");
  const { data: statsRes, isLoading: stLoading } =
    useLivescoreMatchDetail("get-statistics", id || "", activeTab === "statistics");
  const { data: commRes, isLoading: cmLoading } =
    useLivescoreMatchDetail("get-commentary", id || "", activeTab === "commentary");

  // ── Incidents memo (MUST be before any early returns — React hooks rule) ──
  const allIncidents = useMemo(
    () => flattenIncidents(incidentsRes?.data?.Incs || scoreboardRes?.data?.["Incs-s"]),
    [incidentsRes?.data, scoreboardRes?.data]
  );

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
              <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-10 md:py-14 gap-8 relative">
                {/* Home */}
                <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-end gap-5 w-full z-10">
                  <div className="text-center md:text-right">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{home.Nm}</h2>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{home.Abr}</p>
                  </div>
                  <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="lg" className="w-20 h-14 md:w-24 md:h-16 object-contain shrink-0 drop-shadow-md" />
                </div>

                {/* Score */}
                <div className="flex flex-col items-center justify-center shrink-0 z-10 min-w-[200px]">
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

                {/* Away */}
                <div className="flex-1 flex flex-col md:flex-row items-center justify-start gap-5 w-full z-10">
                  <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="lg" className="w-20 h-14 md:w-24 md:h-16 object-contain shrink-0 drop-shadow-md" />
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{away.Nm}</h2>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.25em] mt-1">{away.Abr}</p>
                  </div>
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
                { v: "lineups",     icon: <Users size={16} />,         label: "Lineups" },
                { v: "statistics",  icon: <Activity size={16} />,      label: "Statistics" },
                { v: "scoreboard",  icon: <ListOrdered size={16} />,   label: "Scoreboard" },
                { v: "commentary",  icon: <MessageSquare size={16} />, label: "Commentary" },
              ].map(t => (
                <TabsTrigger key={t.v} value={t.v}
                  className="flex items-center gap-2 px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500 rounded-none transition-all">
                  {t.icon} {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ──────────── SUMMARY ──────────── */}
            <TabsContent value="summary" className="space-y-6 animate-fade-in">
              {/* Match Info Card */}
              <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40">
                  {/* Col 1: Core info */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Information</h3>
                    </div>
                    {[
                      { label: "Competition", value: `${country ? country + " · " : ""}${stage}` },
                      { label: "Venue", value: venue + (venueCity ? `, ${venueCity}` : "") },
                      { label: "Date & Time", value: matchDate.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) },
                      { label: "Status", value: statusText },
                      ...(referee ? [{ label: "Referee", value: referee }] : []),
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="p-3 bg-secondary/60 rounded-2xl text-foreground shrink-0">
                          {i === 0 ? <Trophy size={16} /> : i === 1 ? <MapPin size={16} /> : i === 2 ? <Clock size={16} /> : i === 3 ? <Activity size={16} /> : <ShieldAlert size={16} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{r.label}</p>
                          <p className="font-semibold text-sm text-foreground">{r.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Col 2: Key events timeline */}
                  <div className="p-6 md:p-8 bg-muted/5">
                    <div className="flex items-center gap-2 mb-4">
                      <CircleDot className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Key Events</h3>
                    </div>
                    {allIncidents.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No events recorded yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {allIncidents
                          .filter(e => [36, 37, 39, 43, 45, 46].includes(e.IT))
                          .map((evt, i) => {
                            const meta = incidentMeta[evt.IT] || { label: "Event", color: "text-foreground", icon: "•" };
                            return (
                              <div key={i} className="flex items-start gap-3 group">
                                <div className="flex flex-col items-center shrink-0 w-10">
                                  <span className="text-xs font-mono font-bold text-muted-foreground">{evt.Min}'</span>
                                </div>
                                <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30 group-hover:border-border/60 transition-colors">
                                  <span className="text-lg">{meta.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("font-bold text-sm", meta.color)}>{evt.Pn || evt.Fn && `${evt.Fn} ${evt.Ln}` || "Unknown"}</p>
                                    <p className="text-[11px] text-muted-foreground font-medium">{meta.label}{evt.IR ? ` (${evt.IR})` : ""}</p>
                                  </div>
                                  {evt.Sc && (
                                    <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md shrink-0">
                                      {evt.Sc[0]} - {evt.Sc[1]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ──────────── LINEUPS ──────────── */}
            <TabsContent value="lineups" className="space-y-6 animate-fade-in">
              {luLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : !lineupsRes?.data?.Lu ? (
                <div className="py-20 text-center"><p className="text-muted-foreground font-medium">Lineup data not available for this match.</p></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {lineupsRes.data.Lu.map((team: any, tIdx: number) => {
                    const teamInfo = tIdx === 0 ? home : away;
                    const players: any[] = team.Ps || [];
                    const formation = team.Fo || "N/A";

                    // Group by position
                    const groups: Record<string, any[]> = {};
                    for (const p of players) {
                      const pos = p.Pon || "Unknown";
                      if (!groups[pos]) groups[pos] = [];
                      groups[pos].push(p);
                    }
                    const posOrder = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Substitute"];
                    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
                      const ai = posOrder.findIndex(x => a.toLowerCase().includes(x.toLowerCase()));
                      const bi = posOrder.findIndex(x => b.toLowerCase().includes(x.toLowerCase()));
                      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                    });

                    return (
                      <div key={tIdx} className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
                        {/* Team header */}
                        <div className="flex items-center gap-4 p-5 border-b border-border/30 bg-muted/10">
                          <TeamLogo logo={logoUrl(teamInfo.Img)} name={teamInfo.Nm} size="md" className="w-10 h-10 object-contain" />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-foreground">{teamInfo.Nm}</h3>
                            <p className="text-xs text-muted-foreground font-medium">Formation: <span className="text-foreground font-bold">{formation}</span></p>
                          </div>
                        </div>

                        {/* Players by position */}
                        <div className="divide-y divide-border/20">
                          {sortedGroups.map(([posName, posPlayers]) => (
                            <div key={posName}>
                              <div className="px-5 py-2 bg-muted/5">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{posName}s</span>
                              </div>
                              {posPlayers.map((p: any, pIdx: number) => (
                                <div key={pIdx} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors">
                                  {/* Player image */}
                                  <div className="relative shrink-0">
                                    {p.imageUrl ? (
                                      <img
                                        src={playerImgUrl(p.imageUrl)}
                                        alt={`${p.Fn || ''} ${p.Ln || ''}`}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-border/40 bg-secondary"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center text-xs font-bold text-muted-foreground border-2 border-border/40">
                                        {(p.Fn || "?")[0]}{(p.Ln || "?")[0]}
                                      </div>
                                    )}
                                  </div>
                                  {/* Name & number */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-foreground truncate">
                                      {p.Fn || ""} {p.Ln || p.Pn || "Unknown"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {p.Pon || "Player"}
                                      {p.Mo ? ` · ${p.Mo} min` : ""}
                                    </p>
                                  </div>
                                  {/* Shirt number */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-bold text-muted-foreground bg-secondary/50 w-8 h-8 rounded-full flex items-center justify-center border border-border/30">
                                      {p.Snu || "–"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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

            {/* ──────────── SCOREBOARD / INCIDENTS ──────────── */}
            <TabsContent value="scoreboard" className="space-y-6 animate-fade-in">
              <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
                {/* Score summary */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/30 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <TeamLogo logo={logoUrl(home.Img)} name={home.Nm} size="sm" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg text-foreground">{homeScore}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{statusText}</p>
                    {htHome !== undefined && <p className="text-[10px] text-muted-foreground mt-0.5">HT: {htHome} - {htAway}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-foreground">{awayScore}</span>
                    <TeamLogo logo={logoUrl(away.Img)} name={away.Nm} size="sm" className="w-8 h-8 object-contain" />
                  </div>
                </div>

                {/* All incidents timeline */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Timer className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Match Timeline</h3>
                  </div>

                  {allIncidents.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No incidents recorded.</p>
                  ) : (
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[39px] top-0 bottom-0 w-px bg-border/40" />

                      <div className="space-y-2">
                        {allIncidents.map((evt, i) => {
                          const meta = incidentMeta[evt.IT] || { label: `Event (${evt.IT || '?'})`, color: "text-foreground", icon: "•" };
                          const isTeam1 = evt.Nm === 1;

                          return (
                            <div key={i} className="flex items-center gap-3 relative group">
                              {/* Minute */}
                              <span className="text-xs font-mono font-bold text-muted-foreground w-8 text-right shrink-0">{evt.Min}'</span>
                              {/* Dot on timeline */}
                              <div className="w-2 h-2 rounded-full bg-emerald-500 border-2 border-background z-10 shrink-0" />
                              {/* Card */}
                              <div className={cn(
                                "flex-1 flex items-center gap-3 p-3 rounded-xl border transition-colors",
                                isTeam1
                                  ? "bg-card border-border/30 group-hover:border-emerald-500/30"
                                  : "bg-muted/10 border-border/20 group-hover:border-emerald-500/30"
                              )}>
                                <span className="text-base shrink-0">{meta.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-bold text-sm truncate", meta.color)}>
                                    {evt.Pn || (evt.Fn ? `${evt.Fn} ${evt.Ln}` : "Unknown")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-medium">
                                    {meta.label}
                                    {evt.IR ? ` (${evt.IR})` : ""}
                                    {" · "}
                                    {isTeam1 ? home.Nm : away.Nm}
                                  </p>
                                </div>
                                {evt.Sc && (
                                  <span className="text-xs font-bold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-lg shrink-0">
                                    {evt.Sc[0]} - {evt.Sc[1]}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ──────────── COMMENTARY ──────────── */}
            <TabsContent value="commentary" className="space-y-6 animate-fade-in">
              {cmLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : !commRes?.data?.Com ? (
                <div className="py-20 text-center"><p className="text-muted-foreground font-medium">Commentary not available for this match.</p></div>
              ) : (
                <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-border/30 bg-muted/10">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Live Commentary</h3>
                    <span className="ml-auto text-[10px] text-muted-foreground font-medium">
                      {commRes.data.Com.length} entries
                    </span>
                  </div>

                  <div className="divide-y divide-border/20 max-h-[700px] overflow-y-auto">
                    {commRes.data.Com.map((c: any, i: number) => {
                      const hasIncident = c.IT !== undefined;
                      const meta = hasIncident ? incidentMeta[c.IT] : null;

                      return (
                        <div key={i} className={cn(
                          "flex gap-4 px-6 py-4 transition-colors hover:bg-muted/5",
                          hasIncident && "bg-emerald-500/5"
                        )}>
                          {/* Minute */}
                          <div className="shrink-0 w-14 text-right">
                            <span className={cn(
                              "text-xs font-mono font-bold",
                              hasIncident ? "text-emerald-500" : "text-muted-foreground"
                            )}>
                              {c.Min}'
                              {c.MinEx ? `+${c.MinEx}` : ""}
                            </span>
                          </div>
                          {/* Icon */}
                          <div className="shrink-0 w-6 flex items-start justify-center pt-0.5">
                            {meta ? (
                              <span className="text-sm">{meta.icon}</span>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-border/60 mt-1.5" />
                            )}
                          </div>
                          {/* Text */}
                          <p className={cn(
                            "text-sm leading-relaxed flex-1",
                            hasIncident ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}>
                            {c.Txt}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </>
  );
};

export default MatchCenter;
