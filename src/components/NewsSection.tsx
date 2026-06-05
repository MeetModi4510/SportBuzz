import { useRef } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { mockNewsData } from '@/data/mockNewsData';
import { SportIcon } from '@/components/SportIcon';
import { cn } from '@/lib/utils';

export const NewsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-6 border-b border-border/40 bg-background/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Breaking <span className="text-primary">News</span>
            </h2>
          </div>
          <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            View All <ChevronRight size={16} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mockNewsData.map((news) => (
            <div 
              key={news.id}
              className={cn(
                "min-w-[280px] md:min-w-[320px] max-w-[320px] flex-shrink-0 snap-center",
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

              <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SportIcon sport={news.sport} size={16} />
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
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};
