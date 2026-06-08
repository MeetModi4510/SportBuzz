import { useFootballNews } from "../../hooks/football/useFootballQueries";
import { Loader2, Clock, Zap, Trophy, ArrowRightLeft, Shield, Globe, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Curated fallback news when the API returns nothing
const FALLBACK_NEWS = [
  {
    id: "fb-1",
    title: "FIFA World Cup 2026 — Host cities reveal final preparations as kickoff nears",
    summary: "The 48-team tournament across USA, Mexico, and Canada is set to be the biggest World Cup ever. Stadiums in all 16 host cities are now match-ready.",
    source: "FIFA",
    publishedAt: new Date().toISOString(),
    category: "world-cup",
  },
  {
    id: "fb-2",
    title: "Champions League final delivers an instant classic with dramatic late winner",
    summary: "A stoppage-time goal sends fans into delirium as the European crown changes hands in one of the most thrilling finals in recent memory.",
    source: "UEFA",
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    category: "champions-league",
  },
  {
    id: "fb-3",
    title: "Record-breaking transfer deal expected before deadline day closes",
    summary: "Multiple top clubs are locked in negotiations for one of the most coveted attackers in world football, with a fee expected to surpass €150M.",
    source: "Transfer Intel",
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    category: "transfers",
  },
  {
    id: "fb-4",
    title: "Premier League clubs begin pre-season preparations ahead of new campaign",
    summary: "Squads are being assembled, new signings are settling in, and managers are finalising their tactical blueprints for the season ahead.",
    source: "Premier League",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    category: "league",
  },
  {
    id: "fb-5",
    title: "Five young stars ready to break through this season across Europe's top leagues",
    summary: "From La Masia graduates to Bundesliga wonderkids, these five players are tipped for stardom by scouts across Europe.",
    source: "Scouting Report",
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    category: "talent",
  },
  {
    id: "fb-6",
    title: "International friendlies wrap-up — Key tactical takeaways from latest matches",
    summary: "National team coaches are trialling new formations and giving debuts to emerging talent ahead of the major tournament.",
    source: "International",
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    category: "international",
  },
];

// Visual themes for each card position — creates variety without images
const CARD_THEMES = [
  { gradient: "from-amber-500/15 via-orange-500/8 to-transparent", accent: "text-amber-400", border: "border-amber-500/20", icon: Trophy },
  { gradient: "from-blue-500/15 via-indigo-500/8 to-transparent", accent: "text-blue-400", border: "border-blue-500/20", icon: Shield },
  { gradient: "from-emerald-500/15 via-teal-500/8 to-transparent", accent: "text-emerald-400", border: "border-emerald-500/20", icon: ArrowRightLeft },
  { gradient: "from-purple-500/15 via-violet-500/8 to-transparent", accent: "text-purple-400", border: "border-purple-500/20", icon: Zap },
  { gradient: "from-cyan-500/15 via-sky-500/8 to-transparent", accent: "text-cyan-400", border: "border-cyan-500/20", icon: Globe },
  { gradient: "from-rose-500/15 via-pink-500/8 to-transparent", accent: "text-rose-400", border: "border-rose-500/20", icon: Trophy },
];

function timeAgo(dateStr: string) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FootballNewsSidebar() {
  const { data: apiNews, isLoading } = useFootballNews();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  const rawNews = apiNews && apiNews.length > 0 ? apiNews : FALLBACK_NEWS;
  const news = [...rawNews].sort((a, b) => {
    const dateA = new Date(a.gmtTime || a.publishedAt || 0).getTime();
    const dateB = new Date(b.gmtTime || b.publishedAt || 0).getTime();
    return dateB - dateA;
  });
  const displayedNews = news.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          <h2 className="text-xl font-bold tracking-tight text-white/90">Latest News</h2>
        </div>
        {news.length > 0 && (
          <button
            onClick={() => setIsViewAllOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedNews.map((item: any, idx: number) => {
          const theme = CARD_THEMES[idx % CARD_THEMES.length];
          const IconComponent = theme.icon;
          const isHovered = hoveredIdx === idx;
          const isFirst = idx === 0;

          return (
            <div
              key={item.id || idx}
              onClick={() => {
                if (item.page?.url) {
                  setSelectedArticle(item);
                }
              }}
              className={`
                group relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer
                ${isFirst ? "md:col-span-2 lg:col-span-2" : ""}
                ${isHovered ? `${theme.border} bg-white/[0.03] scale-[1.01]` : "border-white/[0.05] bg-white/[0.015]"}
              `}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Background Image or Gradient */}
              {item.imageUrl ? (
                <>
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-50 transition-all duration-700 group-hover:scale-105" 
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              )}
              
              {/* Decorative icon (only if no image) */}
              {!item.imageUrl && (
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
                  <IconComponent size={isFirst ? 140 : 100} strokeWidth={0.5} />
                </div>
              )}

              {/* Content */}
              <div className={`relative z-10 flex flex-col h-full ${isFirst ? "p-7 min-h-[220px]" : "p-5 min-h-[160px]"}`}>
                {/* Top row: source + time */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    {item.sourceIconUrl ? (
                      <img src={item.sourceIconUrl} alt={item.source} className="w-4 h-4 object-contain rounded-sm" />
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full ${theme.accent.replace("text-", "bg-")} group-hover:animate-pulse`} />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${theme.accent} opacity-80`}>
                      {item.source}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 font-medium flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full backdrop-blur-md">
                    <Clock size={9} />
                    {timeAgo(item.publishedAt)}
                  </span>
                </div>

                {/* Spacer to push title to bottom when there's an image */}
                <div className="flex-1" />

                {/* Title */}
                <h3 className={`
                  font-bold leading-tight text-white group-hover:text-white transition-colors duration-300 drop-shadow-md
                  ${isFirst ? "text-xl md:text-2xl" : "text-sm"}
                `}>
                  {item.title}
                </h3>

                {/* Summary — only for larger cards */}
                {(isFirst || idx < 3) && (
                  <p className={`
                    text-white/35 leading-relaxed mt-3 group-hover:text-white/45 transition-colors duration-300
                    ${isFirst ? "text-sm line-clamp-3" : "text-xs line-clamp-2"}
                  `}>
                    {item.summary}
                  </p>
                )}

                {/* Bottom accent line */}
                <div className={`mt-4 h-px bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for View All News */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="sm:max-w-[900px] border-border/50 bg-background/95 backdrop-blur-xl rounded-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-6 md:p-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <DialogTitle className="sr-only">All Football News</DialogTitle>
          <DialogDescription className="sr-only">View all the latest football news and updates.</DialogDescription>
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Globe size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">All Football News</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map((item: any, index: number) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              return (
                <div 
                  key={item.id || index}
                  onClick={() => { setIsViewAllOpen(false); setSelectedArticle(item); }}
                  className={`group flex flex-col justify-between p-5 rounded-3xl border border-white/[0.05] bg-white/[0.015] cursor-pointer hover:${theme.border} hover:bg-white/[0.03] transition-all duration-300 relative overflow-hidden`}
                >
                  {/* Background Image / Gradient */}
                  {item.imageUrl ? (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105" 
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  )}

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.accent} bg-white/5 px-2.5 py-1 rounded-full truncate max-w-[100px]`}>
                        {item.source}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-white/40 font-medium whitespace-nowrap">
                        <Clock size={12} />
                        {timeAgo(item.publishedAt || item.gmtTime)}
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white leading-snug group-hover:text-white/90 transition-colors line-clamp-3">
                      {item.title}
                    </h4>
                    <p className="text-sm text-white/35 leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal for Football News */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="sm:max-w-[800px] border-border/50 bg-background/95 backdrop-blur-xl rounded-xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedArticle?.title || 'Football Article'}</DialogTitle>
          <DialogDescription className="sr-only">Full article content.</DialogDescription>
          <div className="w-full h-[70vh] md:h-[80vh] bg-background">
            {selectedArticle && (
              <iframe 
                src={selectedArticle.page?.url?.startsWith('/') ? `https://www.fotmob.com${selectedArticle.page.url}` : selectedArticle.page?.url} 
                className="w-full h-full border-0 bg-background" 
                title="Football News Article"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
