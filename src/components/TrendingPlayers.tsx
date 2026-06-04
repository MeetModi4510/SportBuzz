import { cn } from "@/lib/utils";
import { Player } from "@/data/types";
import { PlayerCard } from "./PlayerCard";
import { TrendingUp, Star } from "lucide-react";

interface TrendingPlayersProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  className?: string;
}

export const TrendingPlayers = ({ players, onPlayerClick, className }: TrendingPlayersProps) => {
  // Deduplicate by name and take top 6
  const uniquePlayers = Array.from(
    players.reduce((map, player) => {
      if (!map.has(player.name) || (map.get(player.name)!.rating < player.rating)) {
        map.set(player.name, player);
      }
      return map;
    }, new Map<string, Player>()).values()
  );

  const topPlayers = uniquePlayers.sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground font-display">Trending Players</h2>
          <p className="text-sm text-muted-foreground">Top performers of the moment</p>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {topPlayers.map((player, index) => (
          <div
            key={player.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative">
              {index === 0 && (
                <div className="absolute -top-2 -left-2 z-10 bg-upcoming text-background text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  #1
                </div>
              )}
              <PlayerCard
                player={player}
                onClick={() => onPlayerClick?.(player)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
