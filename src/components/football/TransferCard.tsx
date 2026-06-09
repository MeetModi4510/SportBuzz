import { NewTransferData } from "../../types/football/transfers";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { useState } from "react";

interface TransferCardProps {
  transferData: NewTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const [imgError, setImgError] = useState(false);

  if (!transferData) return null;

  const priceDisplay = transferData.fee?.feeText || transferData.transferType?.text || 'Transfer';
  const isFree = priceDisplay.toUpperCase().includes('FREE');
  const isLoan = priceDisplay.toUpperCase().includes('LOAN') || transferData.onLoan;

  // Format date elegantly
  const dateObj = new Date(transferData.transferDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Format market value
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
    return `€${value}`;
  };
  const marketValueDisplay = transferData.marketValue ? formatCurrency(transferData.marketValue) : null;

  // Determine accent color
  const accentColor = isFree ? 'bg-emerald-500' : isLoan ? 'bg-blue-500' : 'bg-[#d4af37]';
  const textColor = isFree ? 'text-emerald-500' : isLoan ? 'text-blue-500' : 'text-[#d4af37]';

  const renderTeamLogo = (teamName: string, teamId: number) => {
    if (teamName.toLowerCase().includes('free agent') || teamId === 2) {
      return (
        <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <span className="font-black text-[10px] text-white/50">FA</span>
        </div>
      );
    }
    const logoUrl = teamId > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png` : '';
    return (
      <div className="w-8 h-8 rounded bg-white flex items-center justify-center shrink-0 p-1">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={teamName}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48L3N2Zz4='; }}
          />
        ) : (
          <div className="w-full h-full rounded bg-gray-500"></div>
        )}
      </div>
    );
  };

  const displayFee = transferData.fee?.value ? formatCurrency(transferData.fee.value) : priceDisplay;

  return (
    <div className="group relative w-[420px] shrink-0 cursor-pointer rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col min-h-[190px]">
      
      {/* Dynamic Glow Background */}
      <div className={`absolute -top-20 -right-20 w-48 h-48 ${accentColor} opacity-[0.07] rounded-full blur-3xl group-hover:opacity-[0.15] transition-all duration-700`} />
      <div className={`absolute -bottom-20 -left-20 w-40 h-40 ${accentColor} opacity-[0.05] rounded-full blur-3xl group-hover:opacity-[0.1] transition-all duration-700`} />

      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColor} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gradient-to-b from-[#222] to-[#111] p-[2px] shadow-lg group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#111] flex items-center justify-center">
                {!imgError && transferData.playerId ? (
                  <img 
                    src={`https://images.fotmob.com/image_resources/playerimages/${transferData.playerId}.png`} 
                    alt={transferData.name}
                    className="w-full h-full object-cover scale-110"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User size={18} className="text-white/30" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight uppercase leading-none mb-1.5 line-clamp-1 flex items-center gap-2">
                {transferData.name}
                {transferData.position?.label && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold tracking-wider shadow-sm">{transferData.position.label}</span>
                )}
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40 tracking-widest uppercase">
                <CalendarDays size={12} className="opacity-70" />
                <span>{formattedDate}</span>
                {marketValueDisplay && (
                  <>
                    <span className="mx-1 opacity-50">•</span>
                    <span>MV: <span className="text-white/70">{marketValueDisplay}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 shadow-xl text-xs font-black tracking-widest uppercase ${textColor}`}>
            {displayFee}
          </div>
        </div>

        {/* Transfer Path Box */}
        <div className="mt-auto bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/5 flex items-center justify-between group-hover:bg-black/60 transition-colors shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="flex items-center gap-3 max-w-[40%] relative z-10">
            {renderTeamLogo(transferData.fromClub, transferData.fromClubId)}
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider truncate">{transferData.fromClub}</span>
          </div>

          <div className="text-white/20 shrink-0 mx-2 flex flex-col items-center relative z-10">
            <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
              <ArrowRight size={14} className="opacity-80 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
            {transferData.transferType?.text && (
              <span className="text-[9px] font-bold text-white/30 mt-1.5 uppercase tracking-widest">{transferData.transferType.text}</span>
            )}
          </div>

          <div className="flex items-center gap-3 max-w-[40%] flex-row-reverse text-right relative z-10">
            {renderTeamLogo(transferData.toClub, transferData.toClubId)}
            <span className="text-xs font-black text-white uppercase tracking-wider truncate drop-shadow-md">{transferData.toClub}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
