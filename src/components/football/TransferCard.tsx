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
    <div className="group relative w-[450px] shrink-0 cursor-pointer rounded-[24px] bg-card dark:bg-[#0c0c0c] border border-border/70 hover:border-border shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-1 overflow-hidden flex flex-col min-h-[190px]">
      
      {/* Subtle Glow Background */}
      <div className={`absolute -top-24 -right-24 w-56 h-56 ${accentColor} opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none`} />
      
      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header section */}
        <div className="flex justify-between items-start mb-6 gap-3">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden border border-border/40 shadow-sm bg-secondary/20 group-hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full flex items-center justify-center">
                {!imgError && transferData.playerId ? (
                  <img 
                    src={`https://images.fotmob.com/image_resources/playerimages/${transferData.playerId}.png`} 
                    alt={transferData.name}
                    className="w-full h-full object-cover scale-110"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <User size={16} className="text-muted-foreground/60" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[17px] font-extrabold text-foreground tracking-tight leading-none truncate">
                  {transferData.name}
                </h3>
                {transferData.position?.label && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold tracking-wider shrink-0">
                    {transferData.position.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase truncate">
                <span className="shrink-0">{formattedDate}</span>
                {marketValueDisplay && (
                  <>
                    <span className="mx-1 opacity-30 shrink-0">•</span>
                    <span className="truncate">MV <span className="text-foreground/70 font-semibold">{marketValueDisplay}</span></span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className={`shrink-0 px-2.5 py-1 rounded-full bg-secondary/30 border border-border/30 text-[10px] font-bold tracking-widest uppercase ${textColor}`}>
            {displayFee}
          </div>
        </div>

        {/* Transfer Path Box */}
        <div className="mt-auto bg-secondary/20 rounded-2xl p-4 border border-border/40 flex items-center justify-between group-hover:bg-secondary/30 transition-colors relative overflow-hidden">
          
          <div className="flex items-center gap-3 max-w-[40%] relative z-10">
            {renderTeamLogo(transferData.fromClub, transferData.fromClubId)}
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">{transferData.fromClub}</span>
          </div>

          <div className="text-muted-foreground/40 shrink-0 mx-2 flex flex-col items-center relative z-10">
            <div className={`w-7 h-7 rounded-full bg-background flex items-center justify-center border border-border/50 group-hover:scale-110 shadow-sm transition-transform`}>
              <ArrowRight size={12} className="opacity-60 group-hover:text-foreground group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-[40%] flex-row-reverse text-right relative z-10">
            {renderTeamLogo(transferData.toClub, transferData.toClubId)}
            <span className="text-[11px] font-black text-foreground uppercase tracking-widest truncate">{transferData.toClub}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
