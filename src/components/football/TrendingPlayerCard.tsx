import { TrendingPlayerData } from '../../hooks/football/useTrendingPlayers';
import { User } from 'lucide-react';
import { useState } from 'react';
import { cn } from "@/lib/utils";
let BACKEND_URL = import.meta.env.VITE_API_URL || '';
if (import.meta.env.PROD) {
    if (!BACKEND_URL || BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
        BACKEND_URL = '/api';
    }
} else {
    if (!BACKEND_URL) {
        BACKEND_URL = (import.meta.env.PROD ? '' : '') + '/api';
    }
}

interface TrendingPlayerCardProps {
  player: TrendingPlayerData;
  onClick: (player: TrendingPlayerData) => void;
}

export function TrendingPlayerCard({ player, onClick }: TrendingPlayerCardProps) {
  const [imgError, setImgError] = useState(false);

  // Derive the position short name if possible
  const getShortPosition = (pos: string | null) => {
    if (!pos) return 'Player';
    if (pos.toLowerCase().includes('forward')) return 'Forward';
    if (pos.toLowerCase().includes('midfield')) return 'Midfielder';
    if (pos.toLowerCase().includes('defend')) return 'Defender';
    if (pos.toLowerCase().includes('goal')) return 'Goalkeeper';
    return pos;
  };

  return (
    <div 
      onClick={() => onClick(player)}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border h-full flex flex-col",
        "cursor-pointer transition-all duration-300 card-hover"
      )}
    >
      {/* Header */}
      <div className="relative h-28 bg-slate-900 overflow-hidden">
        {/* Flag Background */}
        {(player.teamId || player.teamFlag) && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 scale-150 transition-transform duration-700 group-hover:scale-[1.7]"
            style={{ 
              backgroundImage: `url(${player.teamId ? `${BACKEND_URL}/football/trending-players/team/${player.teamId}/image` : player.teamFlag!})` 
            }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent/10" />
      </div>

      {/* Profile Image Container (Overlapping) */}
      <div className="relative -mt-10 flex justify-center z-10">
        <div className="w-20 h-20 rounded-full border-4 border-card bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md group-hover:-translate-y-1 transition-transform duration-300">
          {!imgError ? (
            <img 
              src={`${BACKEND_URL}/football/trending-players/${player.playerId}/image`} 
              alt={player.playerName}
              className="w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <User size={32} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-3 space-y-3 flex-1 flex flex-col text-center">
        <div>
          <h3 className="font-semibold text-foreground text-lg truncate" title={player.playerName}>
            {player.playerName}
          </h3>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            {(player.teamId || player.teamFlag) && (
              <img 
                src={player.teamId ? `${BACKEND_URL}/football/trending-players/team/${player.teamId}/image` : player.teamFlag!} 
                alt={player.teamName || ""} 
                className="w-4 h-4 object-contain rounded-full flex-shrink-0" 
                loading="lazy"
              />
            )}
            <p className="text-sm text-muted-foreground truncate">{player.teamName || getShortPosition(player.position)}</p>
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}
