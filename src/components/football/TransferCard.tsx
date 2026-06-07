import { FootballTransferData } from "../../types/football";
import { ArrowRight, CalendarDays, User } from "lucide-react";
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

  // Determine accent color
  const accentColor = isFree ? 'bg-emerald-500' : isLoan ? 'bg-blue-500' : 'bg-white';
  const textColor = isFree ? 'text-emerald-500' : isLoan ? 'text-blue-500' : 'text-white';

  const renderTeamLogo = (team: { logo: string, name: string }) => {
    if (team.name.toLowerCase().includes('free agent') || team.name === 'Unknown') {
      return (
        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <span className="font-black text-[10px] text-white/50">FA</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded bg-white flex items-center justify-center shrink-0 p-1">
        <img 
          src={team.logo} 
          alt={team.name}
          className="w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4='; }}
        />
      </div>
    );
  };

  return (
    <div className="group relative w-[420px] shrink-0 cursor-pointer rounded-xl bg-[#111111] border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-lg overflow-hidden flex flex-col min-h-[180px]">
      
      {/* Top Accent Line */}
      <div className={`w-full h-1 ${accentColor} opacity-80`} />

      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header section */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1a1a1a] border border-white/10 flex items-center justify-center shrink-0">
              {!imgError && player.photo ? (
                <img 
                  src={player.photo} 
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <User size={16} className="text-white/30" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase leading-none mb-1.5 line-clamp-1">{player.name}</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40 tracking-wider">
                <CalendarDays size={12} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded bg-[#1a1a1a] border border-white/5 text-xs font-black tracking-widest uppercase ${textColor}`}>
            {priceDisplay}
          </div>
        </div>

        {/* Transfer Path Box */}
        <div className="mt-auto bg-[#0a0a0a] rounded-lg p-3.5 border border-white/5 flex items-center justify-between group-hover:bg-[#161616] transition-colors">
          <div className="flex items-center gap-3 max-w-[40%]">
            {renderTeamLogo(latestTransfer.teams.out)}
            <span className="text-xs font-bold text-white/70 uppercase tracking-wide truncate">{latestTransfer.teams.out.name}</span>
          </div>

          <div className="text-white/20 shrink-0 mx-2">
            <ArrowRight size={16} className="opacity-70 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="flex items-center gap-3 max-w-[40%] flex-row-reverse text-right">
            {renderTeamLogo(latestTransfer.teams.in)}
            <span className="text-xs font-black text-white uppercase tracking-wide truncate">{latestTransfer.teams.in.name}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
