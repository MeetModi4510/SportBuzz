import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : (import.meta.env.PROD ? '' : 'http://localhost:5000');

// ─── Sequential Image Resolution Queue ─────────────────────────────────────────
// Processes ONE player at a time to avoid 429 rate limits.
// Results are cached in memory + localStorage for instant repeat visits.

type QueueItem = { name: string; resolve: (id: string | null) => void };
const resolveQueue: QueueItem[] = [];
let isProcessing = false;
const memoryCache = new Map<string, string | null>();

// Seed memory cache from localStorage on load
try {
  const stored = localStorage.getItem('_cbFaceCacheV2');
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.entries(parsed).forEach(([k, v]) => memoryCache.set(k, v as string | null));
  }
} catch { /* ignore */ }

function persistCache() {
  try {
    const obj: Record<string, string | null> = {};
    memoryCache.forEach((v, k) => { if (v) obj[k] = v; }); // Don't persist nulls permanently
    localStorage.setItem('_cbFaceCacheV2', JSON.stringify(obj));
  } catch { /* ignore */ }
}

async function processQueue() {
  if (isProcessing || resolveQueue.length === 0) return;
  isProcessing = true;

  const { name, resolve } = resolveQueue.shift()!;
  const cacheKey = name.toLowerCase().trim();

  // Check cache first
  if (memoryCache.has(cacheKey)) {
    resolve(memoryCache.get(cacheKey)!);
    isProcessing = false;
    // Small delay even for cache hits to avoid burst
    setTimeout(processQueue, 50);
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/cricket/cb/resolve-face?name=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    const faceId = data?.faceImageId || null;
    memoryCache.set(cacheKey, faceId);
    persistCache();
    resolve(faceId);
  } catch {
    resolve(null);
  }

  // 2000ms delay between API calls to stay under rate limit and prevent 429
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, 2000);
}

function queueResolve(playerName: string): Promise<string | null> {
  const cacheKey = playerName.toLowerCase().trim();
  if (memoryCache.has(cacheKey)) {
    return Promise.resolve(memoryCache.get(cacheKey)!);
  }
  return new Promise((resolve) => {
    resolveQueue.push({ name: playerName, resolve });
    processQueue();
  });
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface CricketPlayerImageProps {
  playerId?: string | null;   // If already known faceImageId
  playerName?: string;        // Used to resolve faceImageId via queue
  size?: number;
  className?: string;
  align?: "left" | "right";
}

/**
 * Displays a cricket player's headshot.
 * - If faceImageId is already provided, loads image directly.
 * - If only playerName is given, queues a resolve request (one-by-one).
 * - Shows a shimmer animation while resolving/loading.
 * - Falls back to a silhouette if image is unavailable.
 */
export const CricketPlayerImage = ({
  playerId,
  playerName,
  size = 40,
  className,
}: CricketPlayerImageProps) => {
  const [resolvedFaceId, setResolvedFaceId] = useState<string | null>(playerId || null);
  const [phase, setPhase] = useState<"resolving" | "loading" | "ok" | "fallback">(
    playerId ? "loading" : "resolving"
  );

  const dimensionStyle = { width: size, height: size, minWidth: size };

  // Resolve faceImageId from player name (one-by-one queue)
  useEffect(() => {
    // If we already have a faceImageId, skip resolution
    if (playerId) {
      setResolvedFaceId(playerId);
      setPhase("loading");
      return;
    }

    if (!playerName) {
      setPhase("fallback");
      return;
    }

    // Check memory cache for instant hit
    const cacheKey = playerName.toLowerCase().trim();
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        setResolvedFaceId(cached);
        setPhase("loading");
      } else {
        setPhase("fallback");
      }
      return;
    }

    // Queue the resolution
    setPhase("resolving");
    let cancelled = false;

    queueResolve(playerName).then((faceId) => {
      if (cancelled) return;
      if (faceId) {
        setResolvedFaceId(faceId);
        setPhase("loading");
      } else {
        setPhase("fallback");
      }
    });

    return () => { cancelled = true; };
  }, [playerId, playerName]);

  const imageUrl = resolvedFaceId
    ? `${API_BASE}/api/cricket/cb/player-image/${resolvedFaceId}`
    : null;

  // Fallback silhouette
  if (phase === "fallback" || (!imageUrl && phase !== "resolving")) {
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

  // Resolving (waiting in queue) — shimmer placeholder
  if (phase === "resolving") {
    return (
      <div
        className={cn(
          "rounded-full bg-slate-700/60 border border-slate-600/40 shrink-0 animate-pulse",
          className
        )}
        style={dimensionStyle}
        title={playerName ? `Loading ${playerName}...` : "Loading..."}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-600/40 to-slate-700/60" />
      </div>
    );
  }

  // Loading / OK — show image
  return (
    <div
      className={cn(
        "rounded-full overflow-hidden border border-slate-600/40 shrink-0 bg-slate-700/60",
        phase === "loading" && "animate-pulse",
        className
      )}
      style={dimensionStyle}
      title={playerName}
    >
      <img
        src={imageUrl!}
        alt={playerName || "Player"}
        className="w-full h-full object-cover object-top"
        onLoad={() => setPhase("ok")}
        onError={() => setPhase("fallback")}
      />
    </div>
  );
};

export default CricketPlayerImage;
