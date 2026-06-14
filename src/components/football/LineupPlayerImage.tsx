import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LineupPlayerImageProps {
    playerId: number | string;
    playerName: string;
    className?: string;
    fallbackInitials?: string;
}

// ─── In-memory cache so each player is only fetched once per session ────────
const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

const TSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

async function fetchPlayerImage(playerName: string): Promise<string | null> {
    const key = playerName.toLowerCase().trim();

    // Return from cache immediately
    if (imageCache.has(key)) return imageCache.get(key)!;

    // If there's already a pending request for this player, reuse it
    if (pendingRequests.has(key)) return pendingRequests.get(key)!;

    const promise = (async () => {
        try {
            const res = await axios.get(
                `${TSDB_BASE}/searchplayers.php?p=${encodeURIComponent(playerName)}`,
                { timeout: 8000 }
            );

            if (res.data?.player?.length > 0) {
                // Find the first soccer player
                const player = res.data.player.find((p: any) => p.strSport === 'Soccer');
                if (player) {
                    const imgUrl = player.strCutout || player.strThumb || player.strRender;
                    if (imgUrl) {
                        imageCache.set(key, imgUrl);
                        return imgUrl;
                    }
                }
            }

            imageCache.set(key, null);
            return null;
        } catch {
            imageCache.set(key, null);
            return null;
        } finally {
            pendingRequests.delete(key);
        }
    })();

    pendingRequests.set(key, promise);
    return promise;
}

// ─── Throttled queue to avoid hammering the API ─────────────────────────────
// Processes one request every 150ms so a lineup of 22 players takes ~3.3s
const queue: Array<{ name: string; resolve: (v: string | null) => void }> = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (queue.length > 0) {
        const item = queue.shift()!;
        const result = await fetchPlayerImage(item.name);
        item.resolve(result);
        // Small delay between requests to be nice to the free API
        if (queue.length > 0) {
            await new Promise(r => setTimeout(r, 150));
        }
    }

    isProcessing = false;
}

function queueFetch(playerName: string): Promise<string | null> {
    const key = playerName.toLowerCase().trim();

    // If already cached, return immediately
    if (imageCache.has(key)) return Promise.resolve(imageCache.get(key)!);

    return new Promise(resolve => {
        queue.push({ name: playerName, resolve });
        processQueue();
    });
}

// ─── Component ──────────────────────────────────────────────────────────────
export const LineupPlayerImage = ({ playerId, playerName, className, fallbackInitials }: LineupPlayerImageProps) => {
    const [imgUrl, setImgUrl] = useState<string | null>(() => {
        // Check cache synchronously on first render
        const cached = imageCache.get(playerName.toLowerCase().trim());
        return cached || null;
    });
    const [hasError, setHasError] = useState(false);
    const [loading, setLoading] = useState(() => {
        return !imageCache.has(playerName.toLowerCase().trim());
    });

    useEffect(() => {
        let isMounted = true;
        const key = playerName.toLowerCase().trim();

        // Already cached
        if (imageCache.has(key)) {
            const cached = imageCache.get(key);
            if (cached) {
                setImgUrl(cached);
                setLoading(false);
            } else {
                setHasError(true);
                setLoading(false);
            }
            return;
        }

        // Queue the fetch
        queueFetch(playerName).then(url => {
            if (!isMounted) return;
            if (url) {
                setImgUrl(url);
            } else {
                setHasError(true);
            }
            setLoading(false);
        });

        return () => { isMounted = false; };
    }, [playerName]);

    // Generate Initials
    const initials = fallbackInitials || playerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!imgUrl || hasError) {
        return (
            <div className={`w-full h-full bg-[#1a1a2e] flex items-center justify-center font-black text-white ${className || ''}`}>
                <span className="opacity-90 text-sm">{initials}</span>
            </div>
        );
    }

    return (
        <img 
            src={imgUrl} 
            alt={playerName}
            className={`w-full h-full object-cover ${className || ''}`}
            onError={() => setHasError(true)}
        />
    );
};
