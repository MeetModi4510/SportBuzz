import { useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { mockNewsData, type NewsItem } from '@/data/mockNewsData';
import { useCricketNews, type CricketNewsItem } from '@/hooks/useCricketNews';
import { SportIcon } from '@/components/SportIcon';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Merge type: can be mock NewsItem OR live CricketNewsItem
type DisplayNewsItem = (NewsItem | CricketNewsItem) & { isLive?: boolean };

export const NewsSection = () => {
  const [selectedArticle, setSelectedArticle] = useState<DisplayNewsItem | null>(null);
  const { news: liveNews, loading } = useCricketNews();

  // Non-cricket mock news (football, tennis, basketball etc.)
  const nonCricketMock = mockNewsData.filter(n => n.sport !== 'cricket');

  // Live cricket news from API (or fallback to mock cricket if still loading)
  const cricketMockFallback = mockNewsData.filter(n => n.sport === 'cricket');
  const cricketItems: DisplayNewsItem[] = (liveNews.length > 0
    ? liveNews.map(n => ({ ...n, isLive: true }))
    : (!loading ? cricketMockFallback : []));

  // Final combined list: mix live cricket with mock other sports
  // Interleave: cricket first, then others, then repeat — keeps visual variety
  const combined: DisplayNewsItem[] = [];
  const nonCricket = [...nonCricketMock];
  let ci = 0, ni = 0;
  while (ci < cricketItems.length || ni < nonCricket.length) {
    if (ci < cricketItems.length) combined.push(cricketItems[ci++]);
    if (ci < cricketItems.length) combined.push(cricketItems[ci++]);
    if (ni < nonCricket.length) combined.push(nonCricket[ni++]);
  }

  // Duplicate for seamless marquee loop
  const marqueeData = combined.length > 0 ? [...combined, ...combined] : [];

  return (
    <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
      <section className="py-6 border-b border-border/40 bg-background/30 overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Breaking <span className="text-primary">News</span>
              </h2>
              {loading && (
                <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border/40 animate-pulse">
                  Loading cricket news…
                </span>
              )}
              {!loading && liveNews.length > 0 && (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  LIVE
                </span>
              )}
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>

          {/* Marquee Container */}
          <div className="relative flex overflow-hidden -mx-4 px-4 py-4 mask-edges">
            <div
              className={cn(
                "flex gap-4 w-max animate-marquee hover:[animation-play-state:paused]",
                selectedArticle && "[animation-play-state:paused]"
              )}
            >
              {marqueeData.map((news, index) => (
                <div
                  key={`${news.id}-${index}`}
                  onClick={() => setSelectedArticle(news)}
                  className={cn(
                    "min-w-[280px] md:min-w-[320px] max-w-[320px] flex-shrink-0 cursor-pointer",
                    "group relative p-5 rounded-2xl border bg-card/40 backdrop-blur-sm",
                    "hover:-translate-y-1 hover:shadow-lg transition-all duration-300",
                    news.sport === 'cricket' ? "border-blue-500/20 hover:border-blue-500/40" :
                    news.sport === 'football' ? "border-green-500/20 hover:border-green-500/40" :
                    news.sport === 'basketball' ? "border-orange-500/20 hover:border-orange-500/40" :
                    "border-yellow-500/20 hover:border-yellow-500/40"
                  )}
                >
                  {/* Subtle gradient background based on sport */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300 pointer-events-none",
                    news.sport === 'cricket' ? "bg-gradient-to-br from-blue-500 to-indigo-500" :
                    news.sport === 'football' ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                    news.sport === 'basketball' ? "bg-gradient-to-br from-orange-500 to-red-500" :
                    "bg-gradient-to-br from-yellow-500 to-amber-500"
                  )} />

                  <div className="relative z-10 flex flex-col h-full justify-between gap-3 pointer-events-none">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <SportIcon sport={news.sport} size={16} />
                        <div className="flex items-center gap-2">
                          {(news as any).isLive && (
                            <span className="text-[9px] font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-1.5 py-0.5 rounded-full">
                              LIVE
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
                            <Clock size={12} />
                            {news.timestamp}
                          </div>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {/* For live news use short headline (hline), else the title */}
                        {(news as CricketNewsItem).headline || news.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {news.snippet}
                      </p>
                      {/* Context tag for live cricket news */}
                      {(news as CricketNewsItem).context && (
                        <span className="inline-block text-[10px] text-blue-400/70 bg-blue-500/10 border border-blue-500/15 px-1.5 py-0.5 rounded-full truncate max-w-full">
                          {(news as CricketNewsItem).context}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal for full article */}
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <SportIcon sport={selectedArticle?.sport || 'cricket'} size={24} />
                {(selectedArticle as any)?.isLive && (
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded-full">
                    LIVE • Cricbuzz
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                <Clock size={14} />
                {selectedArticle?.timestamp}
              </div>
            </div>
            <DialogTitle className="text-xl md:text-2xl leading-snug">
              {(selectedArticle as CricketNewsItem)?.headline || selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-3">
            {(selectedArticle as CricketNewsItem)?.context && (
              <span className="inline-block text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                {(selectedArticle as CricketNewsItem).context}
              </span>
            )}
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {selectedArticle?.snippet}
            </p>
            {(selectedArticle as any)?.isLive ? (
              <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-blue-400/80 text-center">
                📰 Source: Cricbuzz — Full article available on Cricbuzz.com
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/50 text-sm text-muted-foreground text-center">
                (Full article content would be fetched from a CMS and displayed here)
              </div>
            )}
          </div>
        </DialogContent>

        <style>{`
          .mask-edges {
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          }
        `}</style>
      </section>
    </Dialog>
  );
};
