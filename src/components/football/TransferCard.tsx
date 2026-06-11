import { NewTransferData } from "../../types/football/transfers";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { useState } from "react";

interface TransferCardProps {
  transferData: NewTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const [imgError, setImgError] = useState(false);

  if (!transferData) return null;

  const priceDisplay = (typeof transferData.fee === 'string' ? transferData.fee : transferData.fee?.feeText) || (typeof transferData.transferType === 'string' ? transferData.transferType : transferData.transferType?.text) || 'Transfer';
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
        <div className="w-8 h-8 rounded bg-foreground/5 border border-border flex items-center justify-center shrink-0">
          <span className="font-black text-[10px] text-muted-foreground">FA</span>
        </div>
      );
    }
    const logoUrl = teamId > 0 ? `https://images.fotmob.com/image_resources/logo/teamlogo/${teamId}.png` : '';
    return (
      <div className="w-8 h-8 rounded bg-white border border-border/20 flex items-center justify-center shrink-0 p-1 shadow-sm">
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

  const displayFee = transferData.feeValue ? formatCurrency(transferData.feeValue) : ((typeof transferData.fee === 'object' && transferData.fee?.value) ? formatCurrency(transferData.fee.value) : priceDisplay);

  return (
    <div className="group relative w-[420px] shrink-0 cursor-pointer rounded-2xl bg-gradient-to-br from-card to-muted/30 dark:from-[#1a1a1a] dark:to-[#0a0a0a] border border-border/50 hover:border-border hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col min-h-[190px]">
      
      {/* Dynamic Glow Background */}
      <div className={`absolute -top-20 -right-20 w-48 h-48 ${accentColor} opacity-[0.07] rounded-full blur-3xl group-hover:opacity-[0.15] transition-all duration-700`} />
      <div className={`absolute -bottom-20 -left-20 w-40 h-40 ${accentColor} opacity-[0.05] rounded-full blur-3xl group-hover:opacity-[0.1] transition-all duration-700`} />

      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColor} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header section */}
        <div className="flex justify-between items-start mb-6 gap-3">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden bg-gradient-to-b from-border/50 to-border/20 dark:from-[#222] dark:to-[#111] p-[2px] shadow-lg group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-background dark:bg-[#111] flex items-center justify-center">
                {!imgError && transferData.playerId ? (
                  <img 
                    src={`https://images.fotmob.com/image_resources/playerimages/${transferData.playerId}.png`} 
                    alt={transferData.name}
                    className="w-full h-full object-cover scale-110"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User size={18} className="text-muted-foreground/60" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 tracking-tight uppercase leading-none truncate">
                  {transferData.name}
                </h3>
                {transferData.position?.label && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground font-bold tracking-wider shadow-sm shrink-0">
                    {transferData.position.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80 tracking-widest uppercase truncate">
                <CalendarDays size={12} className="opacity-70 shrink-0" />
                <span className="shrink-0">{formattedDate}</span>
                {marketValueDisplay && (
                  <>
                    <span className="mx-1 opacity-50 shrink-0">•</span>
                    <span className="truncate">MV: <span className="text-foreground/70">{marketValueDisplay}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className={`shrink-0 px-3 py-1.5 rounded-lg bg-foreground/5 backdrop-blur-md border border-border shadow-xl text-xs font-black tracking-widest uppercase ${textColor}`}>
            {displayFee}
          </div>
        </div>

        {/* Transfer Path Box */}
        <div className="mt-auto bg-foreground/5 backdrop-blur-md rounded-xl p-4 border border-border/50 flex items-center justify-between group-hover:bg-foreground/10 transition-colors shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="flex items-center gap-3 max-w-[40%] relative z-10">
            {renderTeamLogo(transferData.fromClub, transferData.fromClubId)}
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">{transferData.fromClub}</span>
          </div>

          <div className="text-muted-foreground/40 shrink-0 mx-2 flex flex-col items-center relative z-10">
            <div className={`w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center border border-border/50 group-hover:scale-110 transition-transform`}>
              <ArrowRight size={14} className="opacity-80 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </div>
            {transferData.transferType?.text && (
              <span className="text-[9px] font-bold text-muted-foreground/60 mt-1.5 uppercase tracking-widest">{transferData.transferType.text}</span>
            )}
          </div>

          <div className="flex items-center gap-3 max-w-[40%] flex-row-reverse text-right relative z-10">
            {renderTeamLogo(transferData.toClub, transferData.toClubId)}
            <span className="text-xs font-black text-foreground uppercase tracking-wider truncate drop-shadow-md">{transferData.toClub}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
