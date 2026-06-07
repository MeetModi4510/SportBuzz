import { FootballTransferData } from "../../types/football";
import { ArrowRight, CalendarDays, Tag } from "lucide-react";
import { TeamLogo } from "../TeamLogo";

interface TransferCardProps {
  transferData: FootballTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const { player, transfers } = transferData;
  const latestTransfer = transfers[0];

  if (!latestTransfer) return null;

  const isFree = latestTransfer.type?.toLowerCase().includes('free');
  const typeDisplay = isFree ? 'FREE' : latestTransfer.type || 'Transfer';

  return (
    <div className="relative group w-full h-[220px] rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-2xl transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full flex flex-col p-5">
        {/* Header: Date & Type */}
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-white/50 text-xs font-medium backdrop-blur-md">
            <CalendarDays size={12} className="opacity-70" />
            <span>{new Date(latestTransfer.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider backdrop-blur-md border ${isFree ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/10 text-white border-white/20'}`}>
            <Tag size={10} />
            <span>{typeDisplay}</span>
          </div>
        </div>

        {/* Player Name */}
        <div className="flex-1 flex items-center justify-center mt-2 mb-2">
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center leading-none px-2 line-clamp-2">
            {player.name}
          </h3>
        </div>

        {/* Teams Flow */}
        <div className="flex items-center justify-between mt-auto pt-4 relative">
          {/* subtle connecting line */}
          <div className="absolute top-1/2 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
          
          <div className="flex flex-col items-center gap-2 z-10 w-[40%]">
            <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center p-2.5 shadow-lg group-hover:scale-105 transition-transform">
              <TeamLogo logo={latestTransfer.teams.out.logo} name={latestTransfer.teams.out.name} size="sm" className="w-full h-full object-contain opacity-80" />
            </div>
            <span className="text-[11px] font-medium text-white/50 text-center truncate w-full">
              {latestTransfer.teams.out.name}
            </span>
          </div>

          <div className="z-10 text-white/20 group-hover:text-white/60 transition-colors group-hover:translate-x-1 duration-300">
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>

          <div className="flex flex-col items-center gap-2 z-10 w-[40%]">
            <div className="w-12 h-12 rounded-full bg-white border border-white/20 flex items-center justify-center p-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform group-hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
              <TeamLogo logo={latestTransfer.teams.in.logo} name={latestTransfer.teams.in.name} size="sm" className="w-full h-full object-contain" />
            </div>
            <span className="text-[11px] font-bold text-white text-center truncate w-full">
              {latestTransfer.teams.in.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
