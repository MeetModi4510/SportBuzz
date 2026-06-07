import { FootballTransferData } from "../../types/football";
import { ArrowRight, CalendarDays, ArrowRightLeft } from "lucide-react";
import { TeamLogo } from "../TeamLogo";

interface TransferCardProps {
  transferData: FootballTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const { player, transfers } = transferData;
  const latestTransfer = transfers[0];

  if (!latestTransfer) return null;

  return (
    <div className="bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-[2rem] p-6 hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors" />

      <div className="relative z-10 flex flex-col gap-6 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
            <CalendarDays size={12} />
            {new Date(latestTransfer.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-white/10 px-2.5 py-1 rounded-full">
            <ArrowRightLeft size={10} />
            {latestTransfer.type || 'Transfer'}
          </div>
        </div>

        <h3 className="text-2xl font-black tracking-tight text-white truncate text-center mt-2">
          {player.name}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
          <div className="flex flex-col items-center flex-1 w-0 gap-3">
            <div className="w-14 h-14 bg-black/50 rounded-full p-2 border border-white/10 flex items-center justify-center shadow-inner">
              <TeamLogo logo={latestTransfer.teams.out.logo} name={latestTransfer.teams.out.name} size="sm" className="w-full h-full object-contain opacity-70" />
            </div>
            <span className="text-xs font-semibold text-center truncate w-full text-white/50">
              {latestTransfer.teams.out.name}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center shrink-0 w-12 text-white/20 group-hover:text-white/80 transition-colors">
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex flex-col items-center flex-1 w-0 gap-3">
            <div className="w-14 h-14 bg-black/50 rounded-full p-2 border border-white/20 flex items-center justify-center shadow-inner">
              <TeamLogo logo={latestTransfer.teams.in.logo} name={latestTransfer.teams.in.name} size="sm" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-center truncate w-full text-white">
              {latestTransfer.teams.in.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
