import { TrendingPlayerData } from '../../hooks/football/useTrendingPlayers';
import { User } from 'lucide-react';
import { useState } from 'react';
import { cn } from "@/lib/utils";

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      <div className="relative h-24 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
        <div className="relative">
          {/* Profile Image Container */}
          <div className="w-16 h-16 rounded-full border-2 border-border bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
            {!imgError ? (
              <img 
                src={`${BACKEND_URL}/football/trending-players/${player.playerId}/image`} 
                alt={player.playerName}
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <User size={28} className="text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <h3 className="font-semibold text-foreground text-lg truncate" title={player.playerName}>
            {player.playerName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
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
