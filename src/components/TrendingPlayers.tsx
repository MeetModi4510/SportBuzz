import { cn } from "@/lib/utils";
import { Player } from "@/data/types";
import { PlayerCard } from "./PlayerCard";
import { TrendingUp, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TrendingCard, PlayerProfileModal } from "@/components/cricket/CricketTrendingPlayers";
import { TrendingPlayerEntry } from "@/hooks/useCricketTrending";

interface TrendingPlayersProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  className?: string;
  cricketTrending?: TrendingPlayerEntry[];
  onCricketPlayerClick?: (player: TrendingPlayerEntry) => void;
  cricketPlayerInfo?: any;
  cricketPlayerLoading?: boolean;
  clearCricketPlayerInfo?: () => void;
  fetchCricketTrending?: () => void;
}

export const TrendingPlayers = ({ 
  players, 
  onPlayerClick, 
  className,
  cricketTrending,
  onCricketPlayerClick,
  cricketPlayerInfo,
  cricketPlayerLoading,
  clearCricketPlayerInfo,
  fetchCricketTrending
}: TrendingPlayersProps) => {
  const observerRef = useRef<HTMLDivElement>(null);
  const [selectedCricketPlayer, setSelectedCricketPlayer] = useState<TrendingPlayerEntry | null>(null);

  useEffect(() => {
    if (!fetchCricketTrending) return;
    const currentRef = observerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchCricketTrending();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [fetchCricketTrending]);

  // Deduplicate mock players by name and sort by rating
  const uniqueMockPlayers = Array.from(
    players.reduce((map, player) => {
      if (player.sport !== 'cricket' && (!map.has(player.name) || (map.get(player.name)!.rating < player.rating))) {
        map.set(player.name, player);
      }
      return map;
    }, new Map<string, Player>()).values()
  ).sort((a, b) => b.rating - a.rating);

  // Combine lists: top 3 cricket API + top 3 mock (or adjust if one is missing)
  const apiPlayers = (cricketTrending || []).slice(0, 3);
  const mockLimit = 6 - apiPlayers.length;
  const mockPlayers = uniqueMockPlayers.slice(0, mockLimit);

  // We interleave them or just append
  const combined = [...apiPlayers, ...mockPlayers];

  const handleCricketClick = (p: TrendingPlayerEntry) => {
    setSelectedCricketPlayer(p);
    onCricketPlayerClick?.(p);
  };

  const handleCloseModal = () => {
    setSelectedCricketPlayer(null);
    clearCricketPlayerInfo?.();
  };

  return (
    <section ref={observerRef} className={cn("space-y-4", className)}>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {combined.map((item, index) => {
          const isApi = 'faceImageId' in item;
          return (
            <div
              key={isApi ? item.id : (item as Player).id}
              className="animate-slide-up relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {isApi ? (
                <TrendingCard 
                  player={item as TrendingPlayerEntry} 
                  index={index} 
                  onClick={() => handleCricketClick(item as TrendingPlayerEntry)} 
                />
              ) : (
                <PlayerCard
                  player={item as Player}
                  onClick={() => onPlayerClick?.(item as Player)}
                  hideStats={true}
                />
              )}
            </div>
          );
        })}
      </div>

      {selectedCricketPlayer && (
        <PlayerProfileModal
          player={selectedCricketPlayer}
          info={cricketPlayerInfo}
          loadingInfo={cricketPlayerLoading || false}
          onClose={handleCloseModal}
        />
      )}
    </section>
  );
};
