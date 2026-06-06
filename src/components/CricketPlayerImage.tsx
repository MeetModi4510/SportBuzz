import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

interface CricketPlayerImageProps {
  playerId?: string | null;
  playerName?: string;
  size?: number; // px, default 40
  className?: string;
  align?: "left" | "right"; // affects border/shadow styling optionally
}

/**
 * Displays a cricket player's headshot via the backend image proxy.
 * Falls back to a silhouette icon if the image is unavailable (204 / error).
 * Images are cached by the backend for 1 hour — no duplicate API calls.
 */
export const CricketPlayerImage = ({
  playerId,
  playerName,
  size = 40,
  className,
  align,
}: CricketPlayerImageProps) => {
  const [status, setStatus] = useState<"loading" | "ok" | "fallback">("loading");

  const imageUrl = playerId
    ? `${API_BASE}/api/cricket/cb/player-image/${playerId}`
    : null;

  const dimensionStyle = { width: size, height: size, minWidth: size };

  if (!imageUrl || !playerId) {
    return (
      <div
        className={cn(
          "rounded-full bg-slate-700/60 border border-slate-600/40 flex items-center justify-center shrink-0",
          className
        )}
        style={dimensionStyle}
        title={playerName}
      >
        <User size={Math.floor(size * 0.5)} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden border border-slate-600/40 shrink-0 bg-slate-700/60",
        status === "loading" && "animate-pulse",
        className
      )}
      style={dimensionStyle}
      title={playerName}
    >
      {status !== "fallback" ? (
        <img
          src={imageUrl}
          alt={playerName || "Player"}
          className="w-full h-full object-cover object-top"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("fallback")}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <User size={Math.floor(size * 0.5)} className="text-slate-400" />
        </div>
      )}
    </div>
  );
};

export default CricketPlayerImage;
