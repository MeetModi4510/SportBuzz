import { FootballTransferData } from "../../types/football";
import { ArrowRight } from "lucide-react";

interface TransferCardProps {
  transferData: FootballTransferData;
}

export function TransferCard({ transferData }: TransferCardProps) {
  const { player, transfers } = transferData;
  const latestTransfer = transfers[0];

  if (!latestTransfer) return null;

  const priceDisplay = latestTransfer.price || latestTransfer.type || 'Transfer';

  // Extract just the number if it's €X.XM for cleaner display, else keep text
  const isEuroValue = priceDisplay.startsWith('€');
  const mainPrice = isEuroValue ? priceDisplay.replace('€', '') : (priceDisplay === 'FREE' ? 'FREE' : priceDisplay === 'LOAN' ? 'LOAN' : priceDisplay);
  const currencySymbol = isEuroValue ? '€' : '';

  return (
    <div className="relative group w-[260px] h-[380px] shrink-0 cursor-pointer">
      {/* FUT Card Base Shape */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#18181b] via-[#0f0f11] to-[#050505] rounded-t-full rounded-b-[2.5rem] border-[1px] border-white/10 shadow-2xl overflow-hidden transition-all duration-500 group-hover:border-[#d4af37]/40 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] group-hover:-translate-y-3">
        
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Player Photo (Cutout) */}
        {player.photo && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[200px] h-[200px] z-10 transition-transform duration-700 group-hover:scale-[1.15] origin-bottom">
            <img 
              src={player.photo} 
              alt={player.name}
              className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Fade out bottom of player image for seamless blend into background */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/80 to-transparent" />
          </div>
        )}

        {/* Top Left Stats (Rating / Price Style) */}
        <div className="absolute top-10 left-5 z-20 flex flex-col items-center">
          <div className="flex items-start">
            {currencySymbol && <span className="text-sm font-bold text-[#d4af37] mt-1">{currencySymbol}</span>}
            <span className="text-3xl font-black text-[#d4af37] tracking-tighter drop-shadow-md">
              {mainPrice}
            </span>
          </div>
          <div className="w-8 h-[1px] bg-[#d4af37]/30 my-1" />
          <span className="text-[9px] font-black text-white/40 tracking-widest uppercase">FEE</span>
        </div>

        {/* Top Right Date */}
        <div className="absolute top-10 right-5 z-20 flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black text-white tracking-widest">
            {new Date(latestTransfer.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </span>
          <span className="text-lg font-black text-white leading-none tracking-tighter">
            {new Date(latestTransfer.date).getDate()}
          </span>
        </div>

        {/* Content Area */}
        <div className="absolute bottom-0 left-0 right-0 h-[160px] flex flex-col items-center justify-end pb-8 px-4 z-20">
          
          {/* Player Name */}
          <h3 className="text-2xl font-black tracking-tight text-white text-center leading-none mb-3 w-full truncate uppercase drop-shadow-lg">
            {player.name}
          </h3>

          {/* Divider Line */}
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent mb-4" />

          {/* Teams Transfer Path */}
          <div className="flex items-center justify-center gap-6 w-full">
            {/* Out Team */}
            <div className="flex flex-col items-center gap-2 w-16 group-hover:-translate-x-1 transition-transform">
              <img src={latestTransfer.teams.out.logo} alt={latestTransfer.teams.out.name} className="w-8 h-8 object-contain drop-shadow-lg opacity-60 grayscale group-hover:grayscale-0 transition-all" />
              <span className="text-[8px] font-bold text-white/40 text-center truncate w-full uppercase tracking-wider">{latestTransfer.teams.out.name}</span>
            </div>

            {/* Arrow */}
            <div className="relative">
              <ArrowRight size={16} className="text-[#d4af37] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>

            {/* In Team */}
            <div className="flex flex-col items-center gap-2 w-16 group-hover:translate-x-1 transition-transform">
              <img src={latestTransfer.teams.in.logo} alt={latestTransfer.teams.in.name} className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all" />
              <span className="text-[9px] font-black text-white text-center truncate w-full uppercase tracking-wider">{latestTransfer.teams.in.name}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
