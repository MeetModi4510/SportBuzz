import { useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { mockNewsData, type NewsItem } from '@/data/mockNewsData';
import { SportIcon } from '@/components/SportIcon';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const CricketNewsSection = () => {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  const cricketNews = mockNewsData.filter(news => news.sport === 'cricket');
  const marqueeData = [...cricketNews, ...cricketNews, ...cricketNews]; // Triple it to ensure enough items for marquee

  if (cricketNews.length === 0) return null;

  return (
    <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
      <section className="py-6 border-b border-border/40 bg-background/30 overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SportIcon sport="cricket" size={20} />
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Cricket News
              </h2>
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>

          {/* Marquee Container */}
          <div className="relative flex overflow-hidden -mx-4 px-4 mask-edges">
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
                    "group relative p-5 rounded-2xl border bg-card/40 backdrop-blur-sm border-border/40 hover:border-white/20",
                    "hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  )}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-white rounded-2xl transition-opacity duration-300 pointer-events-none" />

                  <div className="relative z-10 flex flex-col h-full justify-between gap-3 pointer-events-none">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Update</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50">
                          <Clock size={12} />
                          {news.timestamp}
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {news.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {news.snippet}
                      </p>
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
              <SportIcon sport="cricket" size={24} />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
                <Clock size={14} />
                {selectedArticle?.timestamp}
              </div>
            </div>
            <DialogTitle className="text-xl md:text-2xl leading-snug">{selectedArticle?.title}</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {selectedArticle?.snippet}
            </p>
            <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/50 text-sm text-muted-foreground text-center">
              (Full article content would be fetched from a CMS and displayed here)
            </div>
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
