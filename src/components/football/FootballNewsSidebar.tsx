import { useFootballNews } from "../../hooks/football/useFootballQueries";
import { Loader2, TrendingUp, Clock } from "lucide-react";

export function FootballNewsSidebar() {
  const { data: news, isLoading } = useFootballNews();

  return (
    <div className="bg-secondary/10 border border-border/20 rounded-2xl p-5 overflow-hidden sticky top-24">
      <div className="flex items-center gap-2 mb-6 border-b border-border/20 pb-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <TrendingUp size={18} />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Trending News</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
        </div>
      ) : !news || news.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No latest news available.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {news.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl mb-3 aspect-video">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60" />
                <div className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider text-primary bg-background/80 backdrop-blur-md px-2 py-0.5 rounded shadow-sm border border-border/20">
                  {item.source}
                </div>
              </div>
              <h3 className="font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
              <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-muted-foreground/70 font-medium">
                <Clock size={10} />
                {new Date(item.publishedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} 
                {' · '} 
                {new Date(item.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
