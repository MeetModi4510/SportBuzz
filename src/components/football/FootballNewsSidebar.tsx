import { useFootballNews } from "../../hooks/football/useFootballQueries";
import { Loader2, TrendingUp, Clock, ExternalLink, Newspaper } from "lucide-react";
import { useState } from "react";

// Hardcoded premium football news for when the API returns nothing
const FALLBACK_NEWS = [
  {
    id: "fb-1",
    title: "FIFA World Cup 2026 — Host cities reveal final preparations as kickoff nears",
    summary: "The 48-team tournament across USA, Mexico, and Canada is set to be the biggest World Cup ever. Stadiums in all 16 host cities are now match-ready.",
    source: "FIFA",
    publishedAt: new Date().toISOString(),
    image: null,
    url: "#",
  },
  {
    id: "fb-2",
    title: "Champions League final delivers an instant classic with dramatic late winner",
    summary: "A stoppage-time goal sends fans into delirium as the European crown changes hands in one of the most thrilling finals in recent memory.",
    source: "UEFA",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    image: null,
    url: "#",
  },
  {
    id: "fb-3",
    title: "Transfer window heats up: Record-breaking deal expected before deadline day",
    summary: "Multiple top clubs are locked in negotiations for one of the most coveted attackers in world football, with a fee expected to surpass €150M.",
    source: "Transfer Intel",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    image: null,
    url: "#",
  },
  {
    id: "fb-4",
    title: "Premier League clubs begin pre-season preparations ahead of new campaign",
    summary: "Squads are being assembled, new signings are settling in, and managers are finalising their tactical blueprints for the season ahead.",
    source: "PL",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    image: null,
    url: "#",
  },
  {
    id: "fb-5",
    title: "Emerging talent spotlight: Five young stars ready to break through this season",
    summary: "From La Masia graduates to Bundesliga wonderkids, these five players are tipped for stardom by scouts across Europe.",
    source: "Scouting",
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    image: null,
    url: "#",
  },
];

// Source badge color map for a premium feel
const SOURCE_COLORS: Record<string, string> = {
  FIFA: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30",
  UEFA: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30",
  "Transfer Intel": "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30",
  PL: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30",
  Scouting: "from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30",
};

function getSourceColor(source: string) {
  return SOURCE_COLORS[source] || "from-white/10 to-white/5 text-white/70 border-white/20";
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function FootballNewsSidebar() {
  const { data: apiNews, isLoading } = useFootballNews();
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const news = apiNews && apiNews.length > 0 ? apiNews : FALLBACK_NEWS;

  const handleImgError = (id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : (
        <>
          {/* Featured / Hero card */}
          {news.length > 0 && (
            <a
              href={news[0].url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500"
            >
              {/* Image or gradient placeholder */}
              {news[0].image && !imgErrors.has(news[0].id) ? (
                <div className="relative aspect-[2.2/1] overflow-hidden">
                  <img
                    src={news[0].image}
                    alt={news[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    onError={() => handleImgError(news[0].id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
              ) : (
                <div className="relative aspect-[2.5/1] overflow-hidden bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
                    <Newspaper size={120} strokeWidth={0.5} />
                  </div>
                </div>
              )}

              <div className="p-5 -mt-12 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border bg-gradient-to-r ${getSourceColor(news[0].source)}`}>
                    {news[0].source}
                  </span>
                  <span className="text-[10px] text-white/30 font-medium flex items-center gap-1">
                    <Clock size={9} />
                    {timeAgo(news[0].publishedAt)}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-tight text-white group-hover:text-white/90 transition-colors line-clamp-2">
                  {news[0].title}
                </h3>
                <p className="text-xs text-white/40 mt-2 line-clamp-2 leading-relaxed">
                  {news[0].summary}
                </p>
              </div>
            </a>
          )}

          {/* Remaining news items — compact list */}
          <div className="grid gap-1">
            {news.slice(1).map((item, idx) => (
              <a
                key={item.id || idx}
                href={item.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] transition-all duration-300"
              >
                {/* Number indicator */}
                <div className="shrink-0 w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/25 group-hover:text-white/50 group-hover:border-white/10 transition-all">
                  {String(idx + 2).padStart(2, "0")}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border bg-gradient-to-r ${getSourceColor(item.source)}`}>
                      {item.source}
                    </span>
                    <span className="text-[10px] text-white/25 font-medium">
                      {timeAgo(item.publishedAt)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white/80 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                </div>

                <ExternalLink
                  size={12}
                  className="shrink-0 mt-1 text-white/10 group-hover:text-white/30 transition-colors"
                />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
