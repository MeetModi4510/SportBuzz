import { Trophy, Globe2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface WorldCupHeroProps {
  className?: string;
}

export const WorldCupHero = ({ className }: WorldCupHeroProps) => {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-[3rem] bg-gradient-to-br from-emerald-900 via-[#0a2342] to-emerald-950 p-8 md:p-16 mb-12 shadow-2xl border border-emerald-500/20 group", className)}>
      {/* Abstract Pitch / Stadium Light Elements */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 right-10 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-amber-400/30 transition-colors duration-700" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-400/30 transition-colors duration-700" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex flex-col gap-4 text-white max-w-xl">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit">
            <Globe2 className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400">The Greatest Show on Earth</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-white">
            World Cup <br /> Tournament Hub
          </h2>
          <p className="text-emerald-100/80 font-medium text-lg max-w-md leading-relaxed">
            Experience the ultimate football tournament. Live updates, exclusive transfers, and premium match coverage.
          </p>
        </div>

        {/* Decorative Trophy Graphic */}
        <div className="relative hidden md:flex items-center justify-center w-64 h-64 shrink-0">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative p-8 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500">
            <Trophy className="w-32 h-32 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
};
