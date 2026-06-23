import { useState } from "react";
import { useFifaRankings } from "@/hooks/football/useFootballQueries";
import { Loader2, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function TeamLogo({ src, name, size = "w-6 h-6" }: { src?: string; name: string; size?: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={cn(size, "rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0")}>
        <span className="text-[10px] font-black text-muted-foreground leading-none">
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      className={cn(size, "rounded-full object-contain flex-shrink-0 bg-white")}
    />
  );
}

export function FifaRankingsTable() {
  const { data: rankings, isLoading, isError } = useFifaRankings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-[#00c6ff]" />
      </div>
    );
  }

  if (isError || !rankings || rankings.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground/80 bg-foreground/5 rounded-2xl border border-border">
        <AlertTriangle size={18} />
        <span className="text-sm font-medium">Could not load FIFA rankings.</span>
      </div>
    );
  }

  // Display top 50 to avoid huge DOM, but user can scroll
  const displayRankings = rankings.slice(0, 50);

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 px-2">
        <div className="w-1.5 h-6 rounded-full bg-[#00c6ff] drop-shadow-[0_0_8px_rgba(0,198,255,0.6)]" />
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
          FIFA Rankings Men
        </h2>
      </div>

      <div className="rounded-2xl border border-border/60 bg-[#121212]/80 backdrop-blur-xl overflow-hidden shadow-2xl relative">
        {/* Subtle Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00c6ff]/30 to-transparent" />
        
        {/* Scrollable Container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-sm">
            {/* Column Headers */}
            <thead className="sticky top-0 z-10 bg-[#1a1a1a] shadow-sm backdrop-blur-md">
              <tr className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest border-b border-border/40">
                <th className="pl-6 pr-3 py-4 text-center w-14">Rank</th>
                <th className="px-3 py-4 text-left min-w-[180px]">Country</th>
                <th className="px-3 py-4 text-center">Total</th>
                <th className="px-3 py-4 text-center hidden sm:table-cell">Previous</th>
                <th className="pr-6 pl-3 py-4 text-center">+/-</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/20">
              {displayRankings.map((row) => {
                const diffNum = Number(row.pointsDiff);
                const isPositive = row.gainedRank || diffNum > 0;
                const isNegative = row.lostRank || diffNum < 0;

                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-white/[0.03] group"
                  >
                    {/* Rank */}
                    <td className="pl-6 pr-3 py-3 text-center">
                      <span className="font-bold text-muted-foreground/80 text-sm">{row.rank}</span>
                    </td>

                    {/* Country */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <TeamLogo 
                          src={`https://images.fotmob.com/image_resources/logo/teamlogo/${row.id}.png`} 
                          name={row.name} 
                          size="w-6 h-6" 
                        />
                        <span className="font-bold leading-tight whitespace-nowrap text-foreground/90 text-[14px]">
                          {row.name}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-black text-foreground text-sm tabular-nums">
                        {row.totalPoints.toFixed(2).replace(/\.00$/, '')}
                      </span>
                    </td>

                    {/* Previous */}
                    <td className="px-3 py-3 text-center text-muted-foreground/70 font-semibold tabular-nums text-sm hidden sm:table-cell">
                      {row.previousPoints.toFixed(2).replace(/\.00$/, '')}
                    </td>

                    {/* +/- */}
                    <td className="pr-6 pl-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-muted-foreground/80 tabular-nums text-[13px]">
                          {diffNum > 0 ? `+${diffNum.toFixed(2)}` : diffNum < 0 ? diffNum.toFixed(2) : '0.00'}
                        </span>
                        {isPositive ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                            <ArrowUp size={12} strokeWidth={3} />
                          </div>
                        ) : isNegative ? (
                          <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                            <ArrowDown size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50">
                            <Minus size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/40 bg-black/20 flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-wider">Top 50 Displayed</span>
        </div>
      </div>
    </section>
  );
}
