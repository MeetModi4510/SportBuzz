import { useFootballNews, useFootballNewsDetail } from "../../hooks/football/useFootballQueries";
import { Loader2, Globe, ChevronRight, ArrowUpRight, Clock } from "lucide-react";
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
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Fetch full article when an item is selected
  const { data: articleContent, isLoading: isArticleLoading } = useFootballNewsDetail(
    selectedArticle?.page?.url || null
  );

  const rawNews = apiNews && apiNews.length > 0 ? apiNews : FALLBACK_NEWS;
  const news = [...rawNews].sort((a, b) => {
    const dateA = new Date(a.gmtTime || a.publishedAt || 0).getTime();
    const dateB = new Date(b.gmtTime || b.publishedAt || 0).getTime();
    return dateB - dateA;
  });
  
  // Take first 5 for the Bento grid layout
  const displayedNews = news.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Globe size={24} className="text-[#8b5cf6] drop-shadow-md" />
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/50">
              Latest News.
            </h2>
          </div>
        </div>
        {news.length > 0 && (
          <button
            onClick={() => setIsViewAllOpen(true)}
            className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            View All 
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedNews.map((item: any, idx: number) => {
          // In a 5-item layout: 1st spans 2 cols, rest span 1 col.
          // This perfectly fills a 3x2 grid.
          const isFeatured = idx === 0;

          return (
            <div
              key={item.id || idx}
              onClick={() => {
                if (item.page?.url) {
                  setSelectedArticle(item);
                }
              }}
              className={`
                group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#0c0c0c] border border-border/[0.08] 
                transition-all duration-500 cursor-pointer hover:border-border/[0.15] hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-0.5
                ${isFeatured ? "md:col-span-2 lg:col-span-2 min-h-[340px]" : "min-h-[260px]"}
              `}
            >
              {/* Background Image & Premium Gradient Mask */}
              {item.imageUrl ? (
                <div className="absolute inset-0 z-0">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700 ease-out"
                  />
                  {/* Two-stop gradient to ensure text readability while maintaining depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/80 to-[#0c0c0c]/10" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-foreground/[0.03] to-transparent opacity-50" />
              )}

              {/* Content Container */}
              <div className="relative z-10 flex flex-col h-full p-6 md:p-8">
                {/* Header (Source) */}
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/10 backdrop-blur-md border border-border/50">
                    {item.sourceIconUrl ? (
                      <img src={item.sourceIconUrl} alt={item.source} className="w-3.5 h-3.5 object-contain" />
                    ) : (
                      <Globe size={12} className="text-muted-foreground" />
                    )}
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">
                      {item.source}
                    </span>
                  </div>
                  
                  {/* Subtle top-right icon appearing on hover */}
                  <div className="w-8 h-8 rounded-full bg-foreground/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 border border-border/50">
                    <ArrowUpRight size={14} className="text-white" />
                  </div>
                </div>

                <div className="flex-1" />

                {/* Typography Block */}
                <div className="space-y-3 mt-4">
                  <h3 className={`
                    font-semibold text-white/95 group-hover:text-white transition-colors duration-300 drop-shadow-sm
                    ${isFeatured ? "text-2xl md:text-3xl leading-[1.25]" : "text-lg leading-snug"}
                  `}>
                    {item.title}
                  </h3>
                  
                  {isFeatured && (
                    <p className="text-white/50 text-sm md:text-base leading-relaxed line-clamp-2 max-w-2xl font-light">
                      {item.summary}
                    </p>
                  )}

                  {/* Footer (Time) */}
                  <div className="flex items-center gap-1.5 pt-3">
                    <Clock size={12} className="text-white/60" />
                    <span className="text-xs text-white/80 font-medium tracking-wide">
                      {timeAgo(item.publishedAt || item.gmtTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Modal */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="sm:max-w-[1000px] border-border bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[32px] max-h-[85vh] overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent shadow-2xl">
          <DialogTitle className="sr-only">All Football News</DialogTitle>
          <DialogDescription className="sr-only">View all the latest football news and updates.</DialogDescription>
          
          <div className="mb-8 pb-6 border-b border-border/[0.08] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center border border-border">
              <Globe size={24} className="text-foreground/80" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              All News
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map((item: any, index: number) => {
              return (
                <div 
                  key={item.id || index}
                  onClick={() => { setIsViewAllOpen(false); setSelectedArticle(item); }}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#111] border border-border/[0.05] cursor-pointer hover:border-border/[0.15] transition-all duration-300 hover:-translate-y-1 min-h-[280px]"
                >
                  {/* Image & Gradient */}
                  {item.imageUrl ? (
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-[#111]/10" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-foreground/[0.02] to-transparent" />
                  )}

                  <div className="relative z-10 flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-foreground/5 backdrop-blur-md border border-border/50">
                        <span className="text-[9px] font-bold tracking-widest uppercase text-white/80">
                          {item.source}
                        </span>
                      </div>
                      <ArrowUpRight size={14} className="text-white/40 group-hover:text-white/80 transition-colors" />
                    </div>
                    
                    <div className="flex-1" />

                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-white/90 leading-snug group-hover:text-white transition-colors line-clamp-3">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 pt-2">
                        <Clock size={12} className="text-white/60" />
                        <span className="text-[11px] text-white/80 font-medium">
                          {timeAgo(item.publishedAt || item.gmtTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Article Modal (Native Render instead of iframe) */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="sm:max-w-[800px] border-border bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[32px] max-h-[85vh] overflow-y-auto p-6 md:p-10 shadow-2xl">
          {selectedArticle && (
            <>
              <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                {selectedArticle.title}
              </DialogTitle>
              <DialogDescription className="sr-only">Full article content.</DialogDescription>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/10 border border-border/50">
                  {selectedArticle.sourceIconUrl ? (
                    <img src={selectedArticle.sourceIconUrl} alt={selectedArticle.source} className="w-4 h-4 object-contain" />
                  ) : (
                    <Globe size={14} className="text-muted-foreground" />
                  )}
                  <span className="text-xs font-bold tracking-widest uppercase text-white/90">
                    {selectedArticle.source}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={14} />
                  <span className="text-sm font-medium">
                    {timeAgo(selectedArticle.publishedAt || selectedArticle.gmtTime)}
                  </span>
                </div>
              </div>

              {selectedArticle.imageUrl && (
                <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 relative">
                  <img src={selectedArticle.imageUrl} alt="Article Header" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-80" />
                </div>
              )}

              <div className="w-full min-h-[30vh]">
                {isArticleLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#8b5cf6]" />
                    <p className="text-muted-foreground animate-pulse">Extracting article content...</p>
                  </div>
                ) : articleContent && articleContent.length > 0 ? (
                  <div className="space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed font-serif text-justify px-2 md:px-6">
                    {articleContent.map((paragraph: string, idx: number) => (
                      <p key={idx} className="tracking-wide">{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <Globe className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Unable to cleanly extract this article.</p>
                    <a 
                      href={selectedArticle.page?.url?.startsWith('/') ? `https://www.fotmob.com${selectedArticle.page.url}` : selectedArticle.page?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] font-medium hover:bg-[#8b5cf6]/20 transition-colors"
                    >
                      Read Original Source <ArrowUpRight size={16} />
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

