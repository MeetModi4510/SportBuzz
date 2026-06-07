import { FootballTransferData } from "../../types/football";
import { ArrowRight, ArrowRightLeft, CalendarDays, User } from "lucide-react";
import { useState } from "react";

interface TransferCardProps {
  transferData: FootballTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const { player, transfers } = transferData;
  const latestTransfer = transfers[0];
  const [imgError, setImgError] = useState(false);

  if (!latestTransfer) return null;

  const priceDisplay = latestTransfer.price || latestTransfer.type || 'Transfer';
  const isFree = priceDisplay === 'FREE';
  const isLoan = priceDisplay === 'LOAN';

  // Format date elegantly
  const dateObj = new Date(latestTransfer.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="group relative w-[320px] shrink-0 cursor-pointer p-5 rounded-3xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[160px] overflow-hidden">
      
      {/* Subtle Glow Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl group-hover:bg-white/[0.04] transition-colors" />

      {/* Header: Fee & Date */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-sm
          ${isFree ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
            isLoan ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
            'bg-white/10 text-white border border-white/20'}`}>
          {priceDisplay}
        </div>
        <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium">
          <CalendarDays size={12} />
          {formattedDate}
        </div>
      </div>

      {/* Player Info */}
      <div className="flex items-center gap-4 mb-5 relative z-10">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden relative">
          {!imgError && player.photo ? (
            <img 
              src={player.photo} 
              alt={player.name}
              className="w-full h-full object-cover scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <User size={20} className="text-white/30" />
          )}
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-tight leading-tight line-clamp-1">{player.name}</h3>
          <span className="text-xs text-white/40 font-medium mt-0.5">Football Player</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

      {/* Teams Transfer Path */}
      <div className="flex items-center justify-between relative z-10 px-2">
        {/* Out Team */}
        <div className="flex items-center gap-2 max-w-[40%]">
          <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 p-1 overflow-hidden">
            {latestTransfer.teams.out.name.toLowerCase().includes('free agent') || latestTransfer.teams.out.name === 'Unknown' ? (
              <div className="w-full h-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-[8px] rounded-full">FA</div>
            ) : (
              <img 
                src={latestTransfer.teams.out.logo} 
                alt={latestTransfer.teams.out.name}
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4='; }}
              />
            )}
          </div>
          <span className="text-[11px] font-semibold text-white/60 truncate">{latestTransfer.teams.out.name}</span>
        </div>

        {/* Arrow */}
        <div className="text-white/20 mx-2 shrink-0">
          <ArrowRightLeft size={14} className="opacity-50" />
        </div>

        {/* In Team */}
        <div className="flex items-center gap-2 max-w-[40%] flex-row-reverse text-right">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 p-1 overflow-hidden border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:border-white/30 transition-colors">
            {latestTransfer.teams.in.name.toLowerCase().includes('free agent') || latestTransfer.teams.in.name === 'Unknown' ? (
              <div className="w-full h-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-[8px] rounded-full">FA</div>
            ) : (
              <img 
                src={latestTransfer.teams.in.logo} 
                alt={latestTransfer.teams.in.name}
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4='; }}
              />
            )}
          </div>
          <span className="text-[11px] font-bold text-white truncate">{latestTransfer.teams.in.name}</span>
        </div>
      </div>
    </div>
  );
}
