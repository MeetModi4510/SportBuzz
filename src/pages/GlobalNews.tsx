import { useState } from 'react';
import { Helmet } from "react-helmet-async";
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
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

const GlobalNews = () => {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<DisplayNewsItem | null>(null);
  
  const [selectedSport, setSelectedSport] = useState<string>('all');

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

  const filteredCombined = combined.filter(news => selectedSport === 'all' || news.sport === selectedSport);

  return (
    <>
      <Helmet>
        <title>Global News - SportsBuzz</title>
      </Helmet>

      <div className="min-h-screen bg-[#050505]">
        <Navbar />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Global News
              </h1>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
              {['all', 'football', 'cricket', 'basketball', 'tennis'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 shrink-0",
                    selectedSport === sport
                      ? sport === 'football' ? "bg-green-500/10 border-green-500/50 text-green-400" :
                        sport === 'cricket' ? "bg-blue-500/10 border-blue-500/50 text-blue-400" :
                        sport === 'basketball' ? "bg-orange-500/10 border-orange-500/50 text-orange-400" :
                        sport === 'tennis' ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400" :
                        "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border"
                  )}
                >
                  {sport !== 'all' && <SportIcon sport={sport} size={14} />}
                  {sport === 'all' ? 'All News' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCombined.length > 0 ? filteredCombined.map((news, index) => (
              <div
                key={`${news.id}-${index}`}
                onClick={() => setSelectedArticle(news)}
                className={cn(
                  "flex flex-col cursor-pointer group relative rounded-2xl border bg-card/40 backdrop-blur-sm overflow-hidden",
                  "hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full",
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
                  <div className="w-full h-40 overflow-hidden shrink-0 border-b border-border/10 relative">
                    <img 
                      src={news.sport === 'football' ? (news as any).imageUrl : getCricketImageUrl((news as CricketNewsItem).imageId)!} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  </div>
                ) : null}

                <div className="relative z-10 flex flex-col h-full gap-3 p-5 pointer-events-none flex-grow">
                  <div className="flex items-center justify-between mb-2">
                    <SportIcon sport={news.sport} size={16} />
                    <div className="flex items-center gap-2">


                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
                        <Clock size={12} />
                        {news.timestamp}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
                    {(news as CricketNewsItem).headline || news.title}
                  </h3>
                  
                  {!((news.sport === 'football' && (news as any).imageUrl) || (news.sport === 'cricket' && (news as CricketNewsItem).imageId)) && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-auto">
                      {news.snippet}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 flex gap-2">
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
              ))
             : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-secondary/10">
                <SportIcon sport={selectedSport} size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No {selectedSport} news found</p>
                <p className="text-sm opacity-70">Please check back later for updates.</p>
              </div>
            )}
          </div>
        </main>

        {/* Modal for full article (copied from NewsSection) */}
        <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
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
              {(selectedArticle as any)?.isLive && selectedArticle?.sport === 'football' && (selectedArticle as any).imageUrl && (
                <div className="w-full h-48 md:h-56 overflow-hidden rounded-xl border border-border/10 mb-4 relative">
                  <img 
                    src={(selectedArticle as any).imageUrl!} 
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
        </Dialog>
      </div>
    </>
  );
};

export default GlobalNews;
