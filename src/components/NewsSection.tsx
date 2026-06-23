import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { mockNewsData, type NewsItem } from '@/data/mockNewsData';
import { useCricketNews, type CricketNewsItem, useCricketNewsDetail } from '@/hooks/useCricketNews';
import { useFootballNews, type FootballNewsItem } from '@/hooks/useFootballNews';
import { useFootballNewsDetail } from '@/hooks/football/useFootballQueries';
import { SportIcon } from '@/components/SportIcon';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Merge type: can be mock NewsItem OR live CricketNewsItem OR live FootballNewsItem
type DisplayNewsItem = (NewsItem | CricketNewsItem | FootballNewsItem) & { isLive?: boolean; snippet?: string; title?: string };

const getCricketImageUrl = (imageId: string | null) => {
  if (!imageId) return null;
  return `https://static.cricbuzz.com/a/img/v1/1080x720/i1/c${imageId}/i.jpg`;
};

export const NewsSection = () => {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<DisplayNewsItem | null>(null);
  
  const { news: liveNews, loading: cricketLoading } = useCricketNews();
  const { news: liveFootball, loading: footballLoading } = useFootballNews();
  const { content: cricketContent, loading: cricketContentLoading } = useCricketNewsDetail(
    selectedArticle?.sport === 'cricket' ? selectedArticle.id : null
  );

  const { data: footballContent, isLoading: footballContentLoading } = useFootballNewsDetail(
    selectedArticle?.sport === 'football' ? (selectedArticle as any).pageUrl : null
  );

  // Non-cricket/football mock news (tennis, basketball etc.)
  const otherMock = mockNewsData.filter(n => n.sport !== 'cricket' && n.sport !== 'football');

  // Live cricket news from API (or fallback to mock cricket if still loading)
  const cricketMockFallback = mockNewsData.filter(n => n.sport === 'cricket');
  const cricketItems: DisplayNewsItem[] = (liveNews.length > 0
    ? liveNews.map(n => ({ ...n, isLive: true }))
    : (!cricketLoading ? cricketMockFallback : []));

  // Live football news from API (or fallback to mock football if still loading)
  const footballMockFallback = mockNewsData.filter(n => n.sport === 'football');
  const footballItems: DisplayNewsItem[] = (liveFootball.length > 0
    ? liveFootball.map(n => ({ ...n, isLive: true }))
    : (!footballLoading ? footballMockFallback : []));

  // Final combined list: mix live cricket, live football, and mock other sports
  const combined: DisplayNewsItem[] = [];
  let ci = 0, fi = 0, oi = 0;
  while (ci < cricketItems.length || fi < footballItems.length || oi < otherMock.length) {
    if (ci < cricketItems.length) combined.push(cricketItems[ci++]);
    if (fi < footballItems.length) combined.push(footballItems[fi++]);
    if (ci < cricketItems.length) combined.push(cricketItems[ci++]);
    if (oi < otherMock.length) combined.push(otherMock[oi++]);
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
                  {(cricketLoading || footballLoading) && (
                    <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border/40 animate-pulse">
                      Loading news…
                    </span>
                  )}
                  {!(cricketLoading || footballLoading) && (liveNews.length > 0 || liveFootball.length > 0) && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                      LIVE
                    </span>
                  )}
                </div>
            <button 
              onClick={() => navigate('/global-news')}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
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
                    "min-w-[280px] md:min-w-[320px] max-w-[320px] flex-shrink-0 cursor-pointer flex flex-col",
                    "group relative rounded-2xl border bg-card/40 backdrop-blur-sm overflow-hidden",
                    "hover:-translate-y-1 hover:shadow-lg transition-all duration-300",
                    news.sport === 'cricket' ? "border-blue-500/20 hover:border-blue-500/40" :
                    news.sport === 'football' ? "border-green-500/20 hover:border-green-500/40" :
                    news.sport === 'basketball' ? "border-orange-500/20 hover:border-orange-500/40" :
                    "border-yellow-500/20 hover:border-yellow-500/40"
                  )}
                >
                  {/* Subtle gradient background based on sport */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none",
                    news.sport === 'cricket' ? "bg-gradient-to-br from-blue-500 to-indigo-500" :
                    news.sport === 'football' ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                    news.sport === 'basketball' ? "bg-gradient-to-br from-orange-500 to-red-500" :
                    "bg-gradient-to-br from-yellow-500 to-amber-500"
                  )} />

                  {/* Image Header */}
                  {(news.sport === 'football' && (news as any).imageUrl) || (news.sport === 'cricket' && (news as CricketNewsItem).imageId) ? (
                    <div className="w-full h-32 overflow-hidden shrink-0 border-b border-border/10 relative">
                      <img 
                        src={news.sport === 'football' ? (news as any).imageUrl : getCricketImageUrl((news as CricketNewsItem).imageId)!} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    </div>
                  ) : null}

                  <div className="relative z-10 flex flex-col h-full justify-between gap-3 p-5 pointer-events-none">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <SportIcon sport={news.sport} size={16} />
                        <div className="flex items-center gap-2">


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
                      {!((news.sport === 'football' && (news as any).imageUrl) || (news.sport === 'cricket' && (news as CricketNewsItem).imageId)) && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {news.snippet}
                        </p>
                      )}
                      {/* Context tag for live cricket news */}
                      {(news as CricketNewsItem).context && (
                        <span className="inline-block text-[10px] text-blue-400/70 bg-blue-500/10 border border-blue-500/15 px-1.5 py-0.5 rounded-full truncate max-w-full">
                          {(news as CricketNewsItem).context}
                        </span>
                      )}
                      {news.sport === 'football' && (news as any).isLive && (
                        <span className="inline-block text-[10px] text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded-full truncate max-w-full">
                          Football
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
          <DialogTitle className="sr-only">{selectedArticle?.title || 'News Article'}</DialogTitle>
          <DialogDescription className="sr-only">Read the full sports news article.</DialogDescription>
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <SportIcon sport={selectedArticle?.sport || 'cricket'} size={24} />

                {(selectedArticle as any)?.isLive && selectedArticle?.sport === 'football' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    NEW • Football Daily
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
          <div className="pt-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {(selectedArticle as CricketNewsItem)?.context && (
              <span className="inline-block text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full mb-2">
                {(selectedArticle as CricketNewsItem).context}
              </span>
            )}

            {/* Modal Image Header for Cricket News */}
            {(selectedArticle as any)?.isLive && selectedArticle?.sport === 'cricket' && (selectedArticle as CricketNewsItem).imageId && (
              <div className="w-full h-48 md:h-56 overflow-hidden rounded-xl border border-border/10 mb-4">
                <img 
                  src={getCricketImageUrl((selectedArticle as CricketNewsItem).imageId)!} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* Modal Image Header for Football News */}
            {(selectedArticle as any)?.isLive && selectedArticle?.sport === 'football' && (selectedArticle as FootballNewsItem).imageUrl && (
              <div className="w-full h-48 md:h-56 overflow-hidden rounded-xl border border-border/10 mb-4 relative">
                <img 
                  src={(selectedArticle as FootballNewsItem).imageUrl!} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              </div>
            )}

            {(selectedArticle as any)?.isLive && selectedArticle?.sport === 'cricket' ? (
              cricketContentLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : cricketContent && cricketContent.length > 0 ? (
                <div className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed font-serif text-justify">
                  {cricketContent.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-blue-400/80 text-center">
                  📰 Full article available on the original site
                </div>
              )
            ) : (selectedArticle as any)?.isLive && selectedArticle?.sport === 'football' ? (
              footballContentLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : footballContent && footballContent.length > 0 ? (
                <div className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed font-serif text-justify">
                  {footballContent.map((paragraph: string, idx: number) => (
                    <p key={idx}>{paragraph}</p>
                  ))}

                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 text-sm text-[#8b5cf6]/80 text-center">
                  📰 Source: {(selectedArticle as any).sourceStr || 'External Site'} — 
                  <a href={(selectedArticle as any).pageUrl?.startsWith('/') ? `https://www.fotmob.com${(selectedArticle as any).pageUrl}` : (selectedArticle as any).pageUrl} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                    Read full article here
                  </a>
                </div>
              )
            ) : (
              <>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {selectedArticle?.snippet}
                </p>
                <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/50 text-sm text-muted-foreground text-center">
                  (Full article content would be fetched from a CMS and displayed here)
                </div>
              </>
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
