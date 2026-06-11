import { cn } from "@/lib/utils";
import { Player } from "@/data/types";
import { PlayerCard } from "./PlayerCard";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TrendingCard, PlayerProfileModal } from "@/components/cricket/CricketTrendingPlayers";
import { TrendingPlayerEntry } from "@/hooks/useCricketTrending";
import { TrendingPlayerData } from "@/hooks/football/useTrendingPlayers";
import { TrendingPlayerCard } from "@/components/football/TrendingPlayerCard";
import { TrendingPlayerModal as FootballTrendingPlayerModal } from "@/components/football/TrendingPlayerModal";

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
  footballTrending?: TrendingPlayerData[];
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
  fetchCricketTrending,
  footballTrending
}: TrendingPlayersProps) => {
  const observerRef = useRef<HTMLDivElement>(null);
  const [selectedCricketPlayer, setSelectedCricketPlayer] = useState<TrendingPlayerEntry | null>(null);
  const [selectedFootballPlayer, setSelectedFootballPlayer] = useState<TrendingPlayerData | null>(null);

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
      if (player.sport !== 'cricket' && player.sport !== 'football' && (!map.has(player.name) || (map.get(player.name)!.rating < player.rating))) {
        map.set(player.name, player);
      }
      return map;
    }, new Map<string, Player>()).values()
  ).sort((a, b) => b.rating - a.rating);

  // Combine lists: top cricket API + top football API + mock (if needed to fill)
  const apiCricketPlayers = (cricketTrending || []).slice(0, 3);
  const apiFootballPlayers = (footballTrending || []).slice(0, 3);
  
  // Mix them up: Cricket, then Football, then Mock
  const combined: (TrendingPlayerEntry | TrendingPlayerData | Player)[] = [
    ...apiCricketPlayers, 
    ...apiFootballPlayers,
    ...uniqueMockPlayers.slice(0, 4) // Always show top 4 mock players (Tennis, Basketball, etc)
  ];

  const handleCricketClick = (p: TrendingPlayerEntry) => {
    setSelectedCricketPlayer(p);
    onCricketPlayerClick?.(p);
  };

  const handleCloseCricketModal = () => {
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
      <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar">
        {combined.map((item, index) => {
          const isCricketApi = 'faceImageId' in item;
          const isFootballApi = 'playerId' in item && 'teamName' in item;
          
          return (
            <div
              key={isCricketApi ? (item as TrendingPlayerEntry).id : isFootballApi ? (item as TrendingPlayerData).playerId : (item as Player).id}
              className="snap-start shrink-0 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {isCricketApi ? (
                <div className="w-48 h-full">
                  <TrendingCard 
                    player={item as TrendingPlayerEntry} 
                    index={index} 
                    onClick={() => handleCricketClick(item as TrendingPlayerEntry)} 
                  />
                </div>
              ) : isFootballApi ? (
                <div className="w-48 h-full">
                  <TrendingPlayerCard
                    player={item as TrendingPlayerData}
                    onClick={setSelectedFootballPlayer}
                  />
                </div>
              ) : (
                <div className="w-48 h-full">
                  <PlayerCard
                    player={item as Player}
                    onClick={() => onPlayerClick?.(item as Player)}
                    hideStats={true}
                  />
                </div>
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
          onClose={handleCloseCricketModal}
        />
      )}

      {selectedFootballPlayer && (
        <FootballTrendingPlayerModal
          player={selectedFootballPlayer}
          onClose={() => setSelectedFootballPlayer(null)}
        />
      )}
    </section>
  );
};
