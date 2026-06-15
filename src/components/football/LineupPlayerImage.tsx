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

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : 'http://localhost:5000';

async function fetchPlayerImage(playerName: string): Promise<string | null> {
    const key = playerName.toLowerCase().trim();

    // Return from cache immediately, BUT ONLY if it's a valid URL.
    if (imageCache.has(key) && imageCache.get(key) !== null) {
        return imageCache.get(key)!;
    }

    // If there's already a pending request for this player, reuse it
    if (pendingRequests.has(key)) return pendingRequests.get(key)!;

    const promise = (async () => {
        try {
            // Hit our backend proxy instead of TheSportsDB directly!
            const res = await axios.get(
                `${API_BASE}/api/football/v3/image/player?name=${encodeURIComponent(playerName)}`,
                { timeout: 8000 }
            );

            // Our proxy returns { url: "..." } or { url: null }
            if (res.data && res.data.url) {
                imageCache.set(key, res.data.url);
                return res.data.url;
            }

            // Don't permanently cache null to allow future retries
            return null;
        } catch {
            return null;
        } finally {
            pendingRequests.delete(key);
        }
    })();

    pendingRequests.set(key, promise);
    return promise;
}

// ─── Component ──────────────────────────────────────────────────────────────
export const LineupPlayerImage = ({ playerId, playerName, className, fallbackInitials }: LineupPlayerImageProps) => {
    const [imgUrl, setImgUrl] = useState<string | null>(() => {
        // Check cache synchronously on first render
        const cached = imageCache.get(playerName.toLowerCase().trim());
        return cached || null;
    });
    const [hasError, setHasError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const key = playerName.toLowerCase().trim();

        // Already cached successfully
        if (imageCache.has(key) && imageCache.get(key) !== null) {
            const cached = imageCache.get(key);
            setImgUrl(cached!);
            setLoading(false);
            return;
        }

        // Reset error state on new fetch
        setHasError(false);
        setLoading(true);

        // Fetch immediately without artificial queue delay
        fetchPlayerImage(playerName).then(url => {
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

    // If it's loading, or no image found, render absolutely nothing!
    // This perfectly allows the parent component's background (like the blue/red circle AND the jersey number) to show through naturally without any overlapping divs!
    if (!imgUrl || hasError) {
        return null;
    }

    return (
        <img 
            src={imgUrl} 
            alt={playerName}
            className={`w-full h-full object-cover object-top scale-[1.15] translate-y-1 ${className || ''}`}
            onError={() => setHasError(true)}
        />
    );
};
