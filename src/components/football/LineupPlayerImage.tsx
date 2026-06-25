import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LineupPlayerImageProps {
    playerId: number | string;
    playerName: string;
    className?: string;
    fallbackInitials?: string;
    isFotmobId?: boolean;
}

// ─── In-memory cache so each player is only fetched once per session ────────
const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

const FORCE_ESPN_NAMES = ['gavi', 'pedri', 'rodri'];

const API_BASE = import.meta.env.PROD
  ? 'https://sportbuzz-backend.onrender.com'
  : (import.meta.env.PROD ? '' : 'http://localhost:5000');

// ─── Concurrency Limiter to prevent 429 Rate Limits from API ──────────────
const CONCURRENCY_LIMIT = 1;
let activeRequests = 0;
const requestQueue: (() => void)[] = [];

async function acquireToken() {
    if (activeRequests < CONCURRENCY_LIMIT) {
        activeRequests++;
        return;
    }
    return new Promise<void>(resolve => {
        requestQueue.push(resolve);
    });
}

function releaseToken() {
    // Add a small delay between tokens to strictly respect API rate limits (e.g. max 5 requests per second)
    setTimeout(() => {
        if (requestQueue.length > 0) {
            const next = requestQueue.shift()!;
            next();
        } else {
            activeRequests--;
        }
    }, 300);
}

// ─── LocalStorage Cache with 2-hour TTL ────────
const CACHE_PREFIX = 'fotmob_img_';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const CACHE_VERSION = 'v3'; // bump this to invalidate all cached images
const CACHE_VERSION_KEY = 'fotmob_img_cache_version';

// Auto-clear on version mismatch (runs once per session)
if (typeof window !== 'undefined') {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CACHE_VERSION) {
        Object.keys(localStorage)
            .filter(k => k.startsWith(CACHE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
        console.log('[LineupPlayerImage] Cache cleared for version', CACHE_VERSION);
    }
}


function getCachedImage(key: string): string | null {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;
        const parsed = JSON.parse(item);
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return parsed.data;
    } catch {
        return null;
    }
}

function setCachedImage(key: string, data: string) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (e) {
        console.warn('LocalStorage cache full or error', e);
    }
}

async function fetchPlayerImage(playerName: string, playerId: string | number, isFotmobIdExplicit?: boolean): Promise<string | null> {
    const key = playerId.toString() + '_' + playerName.toLowerCase().trim() + (isFotmobIdExplicit ? '_fotmob' : '');

    // 1. LocalStorage Cache (For Base64 Fotmob images)
    const localCached = getCachedImage(key);
    if (localCached) return localCached;

    // 2. Memory Cache (For traditional URLs)
    if (imageCache.has(key) && imageCache.get(key) !== null) {
        return imageCache.get(key)!;
    }

    if (pendingRequests.has(key)) return pendingRequests.get(key)!;

    const promise = (async () => {
        await acquireToken();
        try {
            const isFotmob = isFotmobIdExplicit !== undefined ? isFotmobIdExplicit : /^\d+$/.test(playerId.toString());
            const endpoint = isFotmob
                ? `${API_BASE}/api/football/v3/image/player?fotmobId=${playerId}`
                : `${API_BASE}/api/football/v3/image/player?name=${encodeURIComponent(playerName)}`;

            const res = await axios.get(endpoint, { timeout: 8000 });

            if (res.data && res.data.base64) {
                setCachedImage(key, res.data.base64);
                return res.data.base64;
            } else if (res.data && res.data.url) {
                imageCache.set(key, res.data.url);
                return res.data.url;
            }

            return null;
        } catch {
            return null;
        } finally {
            releaseToken();
            pendingRequests.delete(key);
        }
    })();

    pendingRequests.set(key, promise);
    return promise;
}

// ─── Component ──────────────────────────────────────────────────────────────
export const LineupPlayerImage = ({ playerId, playerName, className, fallbackInitials, isFotmobId }: LineupPlayerImageProps) => {
    const key = playerId.toString() + '_' + playerName.toLowerCase().trim() + (isFotmobId ? '_fotmob' : '');
    
    const [imgUrl, setImgUrl] = useState<string | null>(() => {
        const localCached = getCachedImage(key);
        if (localCached) return localCached;
        const memCached = imageCache.get(key);
        return memCached || null;
    });
    const [hasError, setHasError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const key = playerId.toString() + '_' + playerName.toLowerCase().trim();

        // 1. FotMob ID: Direct URL is highly reliable
        if (isFotmobId) {
            setImgUrl(`https://images.fotmob.com/image_resources/playerimages/${playerId}.png`);
            setLoading(false);
            return;
        }

        // 2. Force ESPN for known problematic names from TheSportsDB
        if (FORCE_ESPN_NAMES.includes(playerName.toLowerCase().trim())) {
            setImgUrl(`https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${playerId}.png`);
            setLoading(false);
            return;
        }

        // 3. Already cached successfully locally
        const localCached = getCachedImage(key);
        if (localCached) {
            setImgUrl(localCached);
            setLoading(false);
            return;
        }

        // 4. Already cached in memory
        if (imageCache.has(key) && imageCache.get(key) !== null) {
            const cached = imageCache.get(key);
            setImgUrl(cached!);
            setLoading(false);
            return;
        }

        // Reset error state on new fetch
        setHasError(false);
        setLoading(true);

        // Fetch with our built-in throttler
        fetchPlayerImage(playerName, playerId, isFotmobId).then(url => {
            if (!isMounted) return;
            if (url) {
                setImgUrl(url);
            } else {
                const fallback = `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${playerId}.png`;
                setImgUrl(fallback);
            }
            setLoading(false);
        }).catch(() => {
            if (!isMounted) return;
            const fallback = `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${playerId}.png`;
            setImgUrl(fallback);
            setLoading(false);
        });

        return () => { isMounted = false; };
    }, [playerName, playerId, isFotmobId]);

    // Render fallback initials if there's an error and fallbackInitials is provided
    if (hasError) {
        if (fallbackInitials) {
            return (
                <div className={`flex items-center justify-center font-black text-white/50 bg-[#111] w-full h-full ${className || ''}`}>
                    {fallbackInitials}
                </div>
            );
        }
        return null; // Return null if no fallback is configured, allowing parent backgrounds to show
    }

    if (!imgUrl) return null;

    return (
        <img 
            src={imgUrl} 
            alt={playerName}
            className={`w-full h-full object-cover object-top ${className || ''}`}
            onError={() => setHasError(true)}
        />
    );
};
