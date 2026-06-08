import { useState } from 'react';
import { ChevronRight, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useCricketNews, useCricketNewsDetail, type CricketNewsItem } from '@/hooks/useCricketNews';
import { SportIcon } from '@/components/SportIcon';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

const getImageUrl = (imageId: string | null) => {
  if (!imageId) return null;
  // Use public CDN directly to avoid RapidAPI rate limit (429) when loading multiple news images
  // Using 1080x720 for high quality instead of default low-res thumbnail
  return `https://static.cricbuzz.com/a/img/v1/1080x720/i1/c${imageId}/i.jpg`;
};

export const CricketNewsSection = () => {
  const { news, loading, error } = useCricketNews();
  const [selectedArticle, setSelectedArticle] = useState<CricketNewsItem | null>(null);
  const { content: detailContent, loading: detailLoading } = useCricketNewsDetail(selectedArticle?.id || null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card/20 rounded-[2rem] border border-border/40">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading latest cricket news...</p>
      </div>
    );
  }

  if (error || !news || news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card/20 rounded-[2rem] border border-red-500/20">
        <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
        <p className="text-muted-foreground">Failed to load news or no news available.</p>
      </div>
    );
  }

  const featuredArticle = news[0];
  const sideArticles = news.slice(1, 4); // Take next 3

  return (
    <>
    <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
      <section className="bg-card/20 rounded-[2rem] border border-border/40 p-6 md:p-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <SportIcon sport="cricket" size={20} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Top Stories</h2>
              <p className="text-sm text-muted-foreground">Latest in the world of Cricket</p>
            </div>
          </div>
          <button 
            onClick={() => setIsViewAllOpen(true)}
            className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
          
          {/* Featured Article (Large) */}
          {featuredArticle && (
            <div 
              onClick={() => setSelectedArticle(featuredArticle)}
              className="md:col-span-7 group relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 cursor-pointer min-h-[300px] flex flex-col justify-end p-6 hover:border-white/20 transition-all duration-500"
            >
              {/* Background Image */}
              {featuredArticle.imageId && (
                <img 
                  src={getImageUrl(featuredArticle.imageId)!} 
                  alt={featuredArticle.headline}
                  className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent z-10" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent transition-opacity duration-500 z-10" />
              
              <div className="relative z-20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">Featured</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <Clock size={12} />
                    {featuredArticle.timestamp}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {featuredArticle.headline || featuredArticle.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {featuredArticle.snippet}
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-2 uppercase tracking-wide">
                  Via {featuredArticle.source}
                </p>
              </div>
            </div>
          )}

          {/* Side Articles (Vertical Stack) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {sideArticles.map((article, index) => (
              <div 
                key={article.id || index}
                onClick={() => setSelectedArticle(article)}
                className="group relative flex flex-col justify-center p-5 rounded-3xl border border-border/40 bg-card/40 cursor-pointer flex-1 hover:border-white/20 hover:bg-secondary/20 transition-all duration-300"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{article.source}</span>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                      <Clock size={12} />
                      {article.timestamp}
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <h4 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
                      {article.headline || article.title}
                    </h4>
                    {article.imageId && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-secondary/30 relative border border-border/30">
                        <img 
                          src={getImageUrl(article.imageId)!} 
                          alt={article.headline}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Modal for full article */}
      <DialogContent className="sm:max-w-[700px] border-border/50 bg-background/95 backdrop-blur-xl rounded-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{selectedArticle?.source}</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
              <Clock size={14} />
              {selectedArticle?.timestamp}
            </div>
          </div>
          <DialogTitle className="text-2xl md:text-3xl leading-snug">{selectedArticle?.headline || selectedArticle?.title}</DialogTitle>
          <DialogDescription className="sr-only">Full article content.</DialogDescription>
        </DialogHeader>
        <div className="pt-4 space-y-4">
          {selectedArticle?.imageId && (
            <div className="w-full rounded-2xl overflow-hidden relative border border-border/40 bg-black/20 flex justify-center items-center">
              <img 
                src={getImageUrl(selectedArticle.imageId)!} 
                alt="Article"
                className="w-full h-auto max-h-[400px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          {detailLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : detailContent && detailContent.length > 0 ? (
            <div className="space-y-4">
              {detailContent.map((paragraph, idx) => (
                <p key={idx} className="text-foreground/90 leading-relaxed text-base md:text-lg text-justify font-serif">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-foreground/90 leading-relaxed text-base md:text-lg">
              {selectedArticle?.snippet}
            </p>
          )}
          {selectedArticle?.context && (
            <div className="mt-6 p-5 rounded-2xl bg-secondary/30 border border-border/50">
              <h4 className="text-sm font-bold text-foreground mb-2">Context</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedArticle.context}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal for View All News */}
    <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
      <DialogContent className="sm:max-w-[900px] border-border/50 bg-background/95 backdrop-blur-xl rounded-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden p-6 md:p-8 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <DialogTitle className="sr-only">All Cricket News</DialogTitle>
        <DialogDescription className="sr-only">View all the latest cricket news and updates.</DialogDescription>
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <SportIcon sport="cricket" size={24} />
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight">All Cricket News</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map((article, index) => (
            <div 
              key={article.id || index}
              onClick={() => { setIsViewAllOpen(false); setSelectedArticle(article); }}
              className="group flex flex-col justify-between p-5 rounded-3xl border border-border/40 bg-card/40 cursor-pointer hover:border-white/20 hover:bg-secondary/20 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full truncate max-w-[100px]">{article.source}</span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                    <Clock size={12} />
                    {article.timestamp}
                  </div>
                </div>
                <h4 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {article.headline || article.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {article.snippet}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
