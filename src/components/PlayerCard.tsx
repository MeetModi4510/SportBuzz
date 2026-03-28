import { cn } from "@/lib/utils";
import { useState } from "react";
import { Player } from "@/data/types";
import { SportIcon } from "./SportIcon";
import {
  Star,
  TrendingUp,
  Disc,
  Footprints,
  RectangleVertical,
  Hand,
  ArrowUpCircle,
  ArrowDownCircle,
  Trophy // Optional if we want a different goal icon
} from "lucide-react";

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export const PlayerCard = ({ player, onClick, className, compact = false }: PlayerCardProps) => {
  const [imgError, setImgError] = useState(false);

  if (!player) return null;

  const getRatingColor = (rating: number) => {
    if (rating >= 90) return "text-completed bg-completed/20";
    if (rating >= 80) return "text-upcoming bg-upcoming/20";
    return "text-muted-foreground bg-muted";
  };

  const getMainStat = () => {
    const stats = player.stats;
    switch (player.sport) {
      case "cricket":
        return stats.runs ? `${stats.runs} runs` : `${stats.wickets} wickets`;
      case "football":
        return `${stats.goals || 0} goals`;
      case "basketball":
        return `${stats.points || 0} pts`;
      case "tennis":
        return `${stats.grandSlams || 0} Grand Slams`;
      default:
        return "";
    }
  };

  const renderPlayerAvatar = (size: "sm" | "lg" = "sm") => {
    const sizeClasses = {
      sm: "w-10 h-10",
      lg: "w-16 h-16"
    };

    // Check if player has a direct image URL
    if (player.image && !imgError) {
      return (
        <img
          src={player.image}
          alt={player.name}
          className={cn(
            sizeClasses[size],
            "rounded-full object-cover border-2 border-border bg-secondary"
          )}
          onError={() => setImgError(true)}
        />
      );
    }

    // Check if player has a photo ID (football players with fp- prefix)
    if (player.photo && player.photo.startsWith('fp-') && !imgError) {
      const playerId = player.photo.replace('fp-', '');
      return (
        <img
          src={`https://media.api-sports.io/football/players/${playerId}.png`}
          alt={player.name}
          className={cn(
            sizeClasses[size],
            "rounded-full object-cover border-2 border-border bg-secondary"
          )}
          onError={() => setImgError(true)}
        />
      );
    }

    // Default sport icon fallback
    return (
      <div className={cn(sizeClasses[size], "rounded-full bg-secondary flex items-center justify-center")}>
        <SportIcon sport={player.sport} size={size === "sm" ? 20 : 28} />
      </div>
    );
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg bg-card border border-border",
          "cursor-pointer transition-all duration-200 hover:bg-accent",
          className
        )}
      >
        <div className="relative">
          {renderPlayerAvatar("sm")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{player.name}</p>
          <p className="text-xs text-muted-foreground">{player.position}</p>
        </div>

        {/* Match Stats (Compact) */}
        {player.matchStats && (
          <div className="flex items-center gap-3 mr-2">
            {player.matchStats.goals && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title="Goals">
                <Disc size={14} className="fill-white" /> {player.matchStats.goals}
              </span>
            )}
            {player.matchStats.assists && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title="Assists">
                <Footprints size={14} className="fill-white" /> {player.matchStats.assists}
              </span>
            )}
            {player.matchStats.yellowCards && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title="Yellow Cards">
                <RectangleVertical size={14} className="fill-yellow-400 text-yellow-400" /> {player.matchStats.yellowCards}
              </span>
            )}
            {player.matchStats.redCards && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title="Red Cards">
                <RectangleVertical size={14} className="fill-red-500 text-red-500" /> {player.matchStats.redCards}
              </span>
            )}
            {player.matchStats.saves && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title="Saves">
                <Hand size={14} className="fill-white" /> {player.matchStats.saves}
              </span>
            )}
            {/* Substitution Icons (Compact) */}
            {player.matchStats.substitutedIn && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title={`Substituted In at ${player.matchStats.substitutedIn}`}>
                <ArrowUpCircle size={14} className="text-green-400" /> {player.matchStats.substitutedIn}
              </span>
            )}
            {player.matchStats.substitutedOut && (
              <span className="flex items-center gap-1 text-xs font-bold text-white" title={`Substituted Out at ${player.matchStats.substitutedOut}`}>
                <ArrowDownCircle size={14} className="text-red-400" /> {player.matchStats.substitutedOut}
              </span>
            )}
          </div>
        )}

        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", getRatingColor(player.rating))}>
          {player.rating}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border",
        "cursor-pointer transition-all duration-300 card-hover",
        className
      )}
    >
      {/* Header with rating */}
      <div className="relative h-24 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
        <div className="relative">
          {renderPlayerAvatar("lg")}
        </div>
        <div className={cn(
          "absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
          getRatingColor(player.rating)
        )}>
          <Star size={12} fill="currentColor" />
          {player.rating}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{player.name}</h3>
          <p className="text-sm text-muted-foreground">{player.position}</p>
        </div>

        {/* Match Stats (Goals, Cards) */}
        {player.matchStats && (
          <div className="flex flex-wrap gap-4 mt-2">
            {player.matchStats.goals && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Disc size={16} className="fill-white" /> {player.matchStats.goals}
              </span>
            )}
            {player.matchStats.assists && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Footprints size={16} className="fill-white" /> {player.matchStats.assists}
              </span>
            )}
            {player.matchStats.yellowCards && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <RectangleVertical size={16} className="fill-yellow-400 text-yellow-400" /> {player.matchStats.yellowCards}
              </span>
            )}
            {player.matchStats.redCards && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <RectangleVertical size={16} className="fill-red-500 text-red-500" /> {player.matchStats.redCards}
              </span>
            )}
            {player.matchStats.saves && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Hand size={16} className="fill-white" /> {player.matchStats.saves}
              </span>
            )}
            {/* Substitution Icons (Normal) */}
            {player.matchStats.substitutedIn && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <ArrowUpCircle size={16} className="text-green-400" />
                <span className="text-xs opacity-90">In {player.matchStats.substitutedIn}</span>
              </span>
            )}
            {player.matchStats.substitutedOut && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <ArrowDownCircle size={16} className="text-red-400" />
                <span className="text-xs opacity-90">Out {player.matchStats.substitutedOut}</span>
              </span>
            )}
          </div>
        )}

        {/* Main stat highlight */}
        {!player.matchStats && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">{getMainStat()}</span>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {player.stats.matches && (
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">{player.stats.matches}</span> matches
            </div>
          )}
          {player.stats.average && (
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">{player.stats.average}</span> avg
            </div>
          )}
          {player.stats.assists !== undefined && (
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">{player.stats.assists}</span> assists
            </div>
          )}
          {player.stats.wins && (
            <div className="text-muted-foreground">
              <span className="text-foreground font-medium">{player.stats.wins}</span> wins
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};
